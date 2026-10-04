import type { CatalogueRepository } from "@/features/catalogue/repositories/catalogue-repository";
import { fixtureCatalogueRepository } from "@/features/catalogue/repositories/fixture-catalogue-repository";
import { httpCatalogueRepository } from "@/features/catalogue/repositories/http-catalogue-repository";

type CatalogueSource = "fixtures" | "api";

export function getCatalogueSource(): CatalogueSource {
  const configured = process.env.EXPO_PUBLIC_CATALOGUE_SOURCE;
  if (configured === "fixtures" || configured === "api") return configured;
  return __DEV__ ? "fixtures" : "api";
}

export const catalogueRepository: CatalogueRepository =
  getCatalogueSource() === "fixtures"
    ? fixtureCatalogueRepository
    : httpCatalogueRepository;
