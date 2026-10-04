import type { Product, ProductPage } from "@/features/catalogue/schema";

export class CatalogueNotFoundError extends Error {
  constructor() {
    super("The requested product is not part of the collection.");
    this.name = "CatalogueNotFoundError";
  }
}

export interface CatalogueRepository {
  /** Returns one cursor page. Omit `cursor` for the first page. */
  listProducts(cursor?: string): Promise<ProductPage>;
  getProduct(slug: string): Promise<Product>;
}
