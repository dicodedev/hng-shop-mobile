/**
 * Live contract probe against the deployed BFF. Excluded from `pnpm test`
 * because it requires network access. Run it with:
 *
 *   pnpm test:contract
 */
import { getApiBaseUrl } from "@/api/client";
import { fixtureProductPage } from "@/features/catalogue/data/products";
import { CatalogueNotFoundError } from "@/features/catalogue/repositories/catalogue-repository";
import { httpCatalogueRepository } from "@/features/catalogue/repositories/http-catalogue-repository";
import { productSchema } from "@/features/catalogue/schema";

jest.setTimeout(30_000);

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
