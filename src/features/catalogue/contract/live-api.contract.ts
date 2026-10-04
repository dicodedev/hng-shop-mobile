/**
 * Live contract probe against the deployed BFF. Excluded from `pnpm test`
 * because it requires network access. Run it with:
 *
 *   pnpm test:contract
 */
import { ApiProblemError } from "@/api/errors";
import { apiClient, getApiBaseUrl } from "@/api/client";
import { fixtureProductPage } from "@/features/catalogue/data/products";
import { CatalogueNotFoundError } from "@/features/catalogue/repositories/catalogue-repository";
import { httpCatalogueRepository } from "@/features/catalogue/repositories/http-catalogue-repository";
import { productSchema } from "@/features/catalogue/schema";
import { httpOrdersRepository } from "@/features/orders/orders-repository";

jest.setTimeout(30_000);

const unauthenticated = { token: "not-a-real-supabase-access-token" } as const;

describe("deployed BFF contract", () => {
  it("serves a contract-valid catalogue", async () => {
    console.log(`Probing ${getApiBaseUrl()}`);
    const page = await httpCatalogueRepository.listProducts();
    expect(page.data.length).toBeGreaterThan(0);
    expect(productSchema.safeParse(page.data[0]).success).toBe(true);
  });

  it("serves a contract-valid product detail", async () => {
    const product = await httpCatalogueRepository.getProduct("adire-weekender");
    expect(product.price.currency).toBe("NGN");
  });

  it("returns 404 for a missing product", async () => {
    await expect(
      httpCatalogueRepository.getProduct("hng-shop-missing-piece"),
    ).rejects.toBeInstanceOf(CatalogueNotFoundError);
  });

  it("keeps fixtures aligned with deployed catalogue slugs", async () => {
    const page = await httpCatalogueRepository.listProducts();
    const deployed = page.data.map((item) => item.slug).sort();
    const fixtures = fixtureProductPage.data.map((item) => item.slug).sort();
    console.log("deployed:", deployed.join(", "));
    expect(deployed).toEqual(fixtures);
  });
});

describe("deployed order and payment routes", () => {
  it("protects the order list with a stable problem response", async () => {
    const error = await apiClient
      .getJson("/orders", unauthenticated)
      .catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiProblemError);
    expect(error).toMatchObject({ status: 401, code: "AUTH_REQUIRED" });
    expect((error as ApiProblemError).requestId).toBeTruthy();
  });

  it("protects order detail with a stable problem response", async () => {
    const error = await apiClient
      .getJson("/orders/HNG-2026-ABCD1234", unauthenticated)
      .catch((caught) => caught);
    expect(error).toMatchObject({ status: 401, code: "AUTH_REQUIRED" });
  });

  it("protects payment status with a stable problem response", async () => {
    const error = await apiClient
      .getJson("/orders/HNG-2026-ABCD1234/payment-status", unauthenticated)
      .catch((caught) => caught);
    expect(error).toMatchObject({ status: 401, code: "AUTH_REQUIRED" });
  });

  it("protects order creation and requires an idempotency key", async () => {
    const error = await httpOrdersRepository
      .createOrder(
        "not-a-real-supabase-access-token",
        {
          name: "Ada Nwosu",
          phone: "+2348012345678",
          addressLine1: "12 Allen Avenue",
          addressLine2: null,
          city: "Ikeja",
          state: "Lagos",
          postalCode: "100001",
          country: "NG",
        },
        "11111111-2222-4333-8444-555555555555",
      )
      .catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiProblemError);
    expect(error).toMatchObject({ status: 401 });
  });

  it("protects hosted payment session creation", async () => {
    const error = await httpOrdersRepository
      .createPaymentSession(
        "not-a-real-supabase-access-token",
        "HNG-2026-ABCD1234",
        "11111111-2222-4333-8444-555555555555",
      )
      .catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiProblemError);
    expect(error).toMatchObject({ status: 401 });
  });

  it("validates the reference format on the public Paystack return bridge", async () => {
    const response = await fetch(
      "https://hng-shop-task.vercel.app/payments/paystack/return?reference=not-a-reference",
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("json");
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_PAYMENT_REFERENCE",
    });
  });
});
