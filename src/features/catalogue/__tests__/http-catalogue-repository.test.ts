import { ApiProblemError, InvalidApiResponseError } from "@/api/errors";
import { fixtureProductPage } from "@/features/catalogue/data/products";
import { CatalogueNotFoundError } from "@/features/catalogue/repositories/catalogue-repository";
import { httpCatalogueRepository } from "@/features/catalogue/repositories/http-catalogue-repository";

const apiUrl = "https://hng-shop-task.vercel.app/api/v1";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("httpCatalogueRepository", () => {
  afterEach(() => jest.restoreAllMocks());

  it("requests the documented catalogue path and returns the validated page", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(fixtureProductPage));

    await expect(httpCatalogueRepository.listProducts()).resolves.toEqual(
      fixtureProductPage,
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${apiUrl}/products?limit=50`);
  });

  it("passes an opaque cursor back to the API without parsing it", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ data: [], page: { nextCursor: null, hasMore: false } }),
      );

    await httpCatalogueRepository.listProducts("opaque-cursor/with+symbols");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${apiUrl}/products?limit=50&cursor=opaque-cursor%2Fwith%2Bsymbols`,
    );
  });

  it("validates payloads before they enter query state", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ products: [] }));
    await expect(httpCatalogueRepository.listProducts()).rejects.toBeInstanceOf(
      InvalidApiResponseError,
    );
  });

  it("rejects an HTML body served by an undeployed route", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<!DOCTYPE html><html></html>", {
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(httpCatalogueRepository.listProducts()).rejects.toBeInstanceOf(
      InvalidApiResponseError,
    );
  });

  it("normalizes the verified PRODUCT_NOT_FOUND response", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          type: "https://hng.shop/problems/product-not-found",
          title: "Product not found",
          status: 404,
          code: "PRODUCT_NOT_FOUND",
          detail: "The requested product was not found.",
          requestId: "369b53d7-19e0-4d7b-ba90-b71b3541633d",
        },
        404,
      ),
    );

    await expect(
      httpCatalogueRepository.getProduct("does-not-exist"),
    ).rejects.toBeInstanceOf(CatalogueNotFoundError);
  });

  it("preserves stable error code and request id for support correlation", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          type: "https://hng.shop/problems/invalid-product-query",
          title: "Invalid product query",
          status: 400,
          code: "INVALID_PRODUCT_QUERY",
          detail:
            "Limit must be an integer from 1 to 50 and cursor must be valid.",
          requestId: "2a724bad-4eec-47d0-a83b-5c6e481f742f",
        },
        400,
      ),
    );

    await expect(httpCatalogueRepository.listProducts()).rejects.toMatchObject({
      name: "ApiProblemError",
      status: 400,
      code: "INVALID_PRODUCT_QUERY",
      requestId: "2a724bad-4eec-47d0-a83b-5c6e481f742f",
    });
  });

  it("does not downgrade a server failure to a not-found state", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ code: "SERVER_ERROR" }, 503));
    await expect(
      httpCatalogueRepository.getProduct("adire-weekender"),
    ).rejects.toBeInstanceOf(ApiProblemError);
  });

  it("URL-encodes the requested slug", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(fixtureProductPage.data[0], 200));
    const product = fixtureProductPage.data[0];
    if (!product) throw new Error("Fixture product is missing.");

    await httpCatalogueRepository.getProduct("a b/c");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${apiUrl}/products/a%20b%2Fc`);
  });
});
