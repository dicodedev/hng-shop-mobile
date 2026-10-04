import { fixtureCatalogueRepository } from "@/features/catalogue/repositories/fixture-catalogue-repository";
import { CatalogueNotFoundError } from "@/features/catalogue/repositories/catalogue-repository";

describe("fixtureCatalogueRepository", () => {
  it("lists the captured deployed web catalogue", async () => {
    const page = await fixtureCatalogueRepository.listProducts();
    expect(page.data).toHaveLength(7);
    expect(page.data.map((product) => product.slug)).toEqual([
      "product-1",
      "adire-weekender",
      "terracotta-table-lamp",
      "woven-market-basket",
      "everyday-stoneware-set",
      "linen-throw",
      "brass-desk-tray",
    ]);
  });

  it("returns an exhausted page for any cursor", async () => {
    await expect(
      fixtureCatalogueRepository.listProducts("cursor"),
    ).resolves.toEqual({
      data: [],
      page: { nextCursor: null, hasMore: false },
    });
  });

  it("returns detail by slug", async () => {
    await expect(
      fixtureCatalogueRepository.getProduct("adire-weekender"),
    ).resolves.toMatchObject({
      name: "Adire Weekender",
      price: { currency: "NGN", amountKobo: 2_850_000 },
    });
  });

  it("uses a stable not-found error for an absent or archived product", async () => {
    await expect(
      fixtureCatalogueRepository.getProduct("archived-piece"),
    ).rejects.toBeInstanceOf(CatalogueNotFoundError);
  });
});
