import {
  cartItemCount,
  cartSubtotalKobo,
  cartSchema,
  hasUnavailableItems,
  MAX_CART_LINES,
  MAX_ITEM_QUANTITY,
  type Cart,
} from "@/features/cart/schema";

const validCart: Cart = {
  items: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      slug: "adire-weekender",
      name: "Adire Weekender",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
      priceAmount: 2_850_000,
      currency: "NGN",
      quantity: 2,
      available: true,
      version: 3,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      slug: "brass-desk-tray",
      name: "Brass Desk Tray",
      imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85",
      priceAmount: 1_250_000,
      currency: "NGN",
      quantity: 1,
      available: false,
      version: 1,
    },
  ],
  updatedAt: "2026-10-02T12:00:00Z",
  version: 8,
};

describe("cartSchema", () => {
  it("accepts the documented cart payload", () => {
    expect(cartSchema.parse(validCart)).toEqual(validCart);
  });

  it("ignores unknown fields so additive changes do not break the client", () => {
    const parsed = cartSchema.parse({
      ...validCart,
      checkoutPreview: { total: 1 },
    });
    expect(parsed).toEqual(validCart);
    expect(parsed).not.toHaveProperty("checkoutPreview");
  });

  it.each([
    ["non-NGN currency", { currency: "USD" }],
    ["quantity above 99", { quantity: 100 }],
    ["quantity below 1", { quantity: 0 }],
    ["fractional kobo", { priceAmount: 100.5 }],
    ["non-positive price", { priceAmount: 0 }],
  ])("rejects %s", (_label, override) => {
    const item = validCart.items[0];
    if (!item) throw new Error("Fixture cart item is missing.");
    expect(
      cartSchema.safeParse({ ...validCart, items: [{ ...item, ...override }] })
        .success,
    ).toBe(false);
  });

  it("rejects more than the documented line limit", () => {
    const item = validCart.items[0];
    if (!item) throw new Error("Fixture cart item is missing.");
    const items = Array.from({ length: MAX_CART_LINES + 1 }, () => item);
    expect(cartSchema.safeParse({ ...validCart, items }).success).toBe(false);
  });

  it("rejects a negative header version", () => {
    expect(cartSchema.safeParse({ ...validCart, version: -1 }).success).toBe(
      false,
    );
  });
});

describe("cart helpers", () => {
  it("counts units for the tab badge", () => {
    expect(cartItemCount(validCart)).toBe(3);
    expect(cartItemCount(null)).toBe(0);
  });

  it("computes an integer-kobo subtotal without floating point", () => {
    expect(cartSubtotalKobo(validCart)).toBe(2_850_000 * 2 + 1_250_000);
    expect(Number.isSafeInteger(cartSubtotalKobo(validCart))).toBe(true);
  });

  it("flags unavailable lines so checkout can explain the problem", () => {
    expect(hasUnavailableItems(validCart)).toBe(true);
    expect(
      hasUnavailableItems({
        ...validCart,
        items: [{ ...validCart.items[0]!, available: true }],
      }),
    ).toBe(false);
  });

  it("exposes documented server limits", () => {
    expect(MAX_CART_LINES).toBe(50);
    expect(MAX_ITEM_QUANTITY).toBe(99);
  });
});
