import { fixtureProductPage } from "@/features/catalogue/data/products";
import {
  CatalogueNotFoundError,
  type CatalogueRepository,
} from "@/features/catalogue/repositories/catalogue-repository";
import type { ProductPage } from "@/features/catalogue/schema";

const emptyPage: ProductPage = {
  data: [],
  page: { nextCursor: null, hasMore: false },
};

export const fixtureCatalogueRepository: CatalogueRepository = {
  async listProducts(cursor) {
    return cursor ? emptyPage : fixtureProductPage;
  },

  async getProduct(slug) {
    const product = fixtureProductPage.data.find((item) => item.slug === slug);
    if (!product) throw new CatalogueNotFoundError();
    return product;
  },
};
