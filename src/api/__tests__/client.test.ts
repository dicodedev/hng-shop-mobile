import { apiClient, buildApiPath, getApiBaseUrl } from "@/api/client";
import { ApiProblemError } from "@/api/errors";

describe("getApiBaseUrl", () => {
  it("defaults to the deployed BFF origin without a trailing slash", () => {
    process.env.EXPO_PUBLIC_API_URL =
      "https://hng-shop-task.vercel.app/api/v1/";
    expect(getApiBaseUrl()).toBe("https://hng-shop-task.vercel.app/api/v1");
  });

  it("falls back to the deployed origin when unset", () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe("https://hng-shop-task.vercel.app/api/v1");
  });
});

describe("buildApiPath", () => {
  it("omits undefined and empty query values", () => {
    expect(buildApiPath("/products", { limit: 50, cursor: undefined })).toBe(
      "/products?limit=50",
    );
    expect(buildApiPath("/products", { cursor: "" })).toBe("/products");
  });

  it("encodes query values without parsing opaque cursors", () => {
    expect(buildApiPath("/products", { cursor: "a b&c=d" })).toBe(
      "/products?cursor=a+b%26c%3Dd",
    );
  });
});

describe("problem normalization", () => {
  afterEach(() => jest.restoreAllMocks());

  it("normalizes the legacy shared-cart error shape into a stable problem", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "AUTH_REQUIRED",
          error: "Sign in to use your cart.",
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await expect(apiClient.getJson("/cart")).rejects.toMatchObject({
      name: "ApiProblemError",
      status: 401,
      code: "AUTH_REQUIRED",
      message: "Sign in to use your cart.",
    });
  });

  it("keeps field errors for form-level reporting", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "https://hng.shop/problems/product-unavailable",
          title: "Product unavailable",
          status: 422,
          code: "PRODUCT_UNAVAILABLE",
          detail: "One or more products are unavailable.",
          requestId: "0f7c9a1e-1111-4222-8333-444444444444",
          errors: [{ field: "items[0].productId", code: "INACTIVE_PRODUCT" }],
        }),
        {
          status: 422,
          headers: { "content-type": "application/problem+json" },
        },
      ),
    );

    try {
      await apiClient.getJson("/orders");
      throw new Error("Expected the request to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiProblemError);
      const problem = error as ApiProblemError;
      expect(problem.fieldErrors).toEqual([
        { field: "items[0].productId", code: "INACTIVE_PRODUCT" },
      ]);
    }
  });
});
