import { apiClient, buildApiPath, DEFAULT_PAGE_LIMIT } from "@/api/client";
import { ApiProblemError, InvalidApiResponseError } from "@/api/errors";
import {
  CatalogueNotFoundError,
  type CatalogueRepository,
} from "@/features/catalogue/repositories/catalogue-repository";
import { productPageSchema, productSchema } from "@/features/catalogue/schema";

function parseOrThrow<T>(
  result: { success: true; data: T } | { success: false; error: unknown },
): T {
  if (!result.success)
    throw new InvalidApiResponseError(
      "The product payload did not match the contract.",
      { cause: result.error },
    );
  return result.data;
}

function rethrowNotFound(error: unknown): never {
  if (error instanceof ApiProblemError && error.status === 404)
    throw new CatalogueNotFoundError();
  throw error;
}

export const httpCatalogueRepository: CatalogueRepository = {
  async listProducts(cursor) {
    const path = buildApiPath("/products", {
      limit: DEFAULT_PAGE_LIMIT,
      cursor,
    });
    const body = await apiClient.getJson(path);
    return parseOrThrow(productPageSchema.safeParse(body));
  },

  async getProduct(slug) {
    const path = buildApiPath(`/products/${encodeURIComponent(slug)}`);
    try {
      const body = await apiClient.getJson(path);
      return parseOrThrow(productSchema.safeParse(body));
    } catch (error) {
      return rethrowNotFound(error);
    }
  },
};
