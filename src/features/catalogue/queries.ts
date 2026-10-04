import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { catalogueRepository } from "@/features/catalogue/repositories";

export const catalogueKeys = {
  all: ["catalogue"] as const,
  list: () => [...catalogueKeys.all, "list"] as const,
  detail: (slug: string) => [...catalogueKeys.all, "detail", slug] as const,
};

/**
 * Public catalogue reads are the only queries persisted to device storage.
 * Cached content may render offline; it is never treated as authoritative.
 */
export const productsQuery = infiniteQueryOptions({
  queryKey: catalogueKeys.list(),
  queryFn: ({ pageParam }) => catalogueRepository.listProducts(pageParam),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) =>
    lastPage.page.hasMore ? (lastPage.page.nextCursor ?? undefined) : undefined,
  staleTime: 5 * 60 * 1000,
  meta: { persist: true },
});

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: catalogueKeys.detail(slug),
    queryFn: () => catalogueRepository.getProduct(slug),
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  });
}
