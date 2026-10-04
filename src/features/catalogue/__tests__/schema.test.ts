import { fixtureProductPage } from "@/features/catalogue/data/products";
import { productPageSchema, productSchema } from "@/features/catalogue/schema";

describe("catalogue schemas", () => {
  it("accepts the captured live catalogue page", () => {
    expect(productPageSchema.parse(fixtureProductPage)).toEqual(
      fixtureProductPage,
    );
  });

  it("accepts an empty collection", () => {
    expect(
      productPageSchema.parse({
        data: [],
        page: { nextCursor: null, hasMore: false },
      }),
    ).toEqual({
      data: [],
      page: { nextCursor: null, hasMore: false },
    });
  });

  it("ignores unknown response fields so additive changes do not break clients", () => {
    const product = fixtureProductPage.data[0];
    if (!product) throw new Error("Fixture product is missing.");

    const parsed = productSchema.parse({
      ...product,
      stockCount: 2,
      badges: ["new"],
    });
    expect(parsed).toEqual(product);
    expect(parsed).not.toHaveProperty("stockCount");
  });

  it.each([
    ["non-NGN currency", { currency: "USD", amountKobo: 100 }],
    ["fractional kobo", { currency: "NGN", amountKobo: 100.5 }],
    ["negative kobo", { currency: "NGN", amountKobo: -1 }],
  ])("rejects %s", (_label, price) => {
    const product = fixtureProductPage.data[0];
    if (!product) throw new Error("Fixture product is missing.");
    expect(productSchema.safeParse({ ...product, price }).success).toBe(false);
  });

  it.each([
    ["non-UUID id", { id: "not-a-uuid" }],
    ["relative image", { imageUrl: "/products/adire-weekender.png" }],
    ["empty name", { name: "" }],
  ])("rejects %s", (_label, override) => {
    const product = fixtureProductPage.data[0];
    if (!product) throw new Error("Fixture product is missing.");
    expect(productSchema.safeParse({ ...product, ...override }).success).toBe(
      false,
    );
  });
});
