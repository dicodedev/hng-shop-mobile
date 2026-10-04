import { cartItemCount, type Cart } from "@/features/cart/schema";

/**
 * Cart unit count is the single number shown in the tab badge and the
 * stack-screen cart control, so it must be computed once and consistently.
 */
const cart: Cart = {
  items: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      slug: "adire-weekender",
      name: "Adire Weekender",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
      priceAmount: 2_850_000,
      currency: "NGN",
      quantity: 3,
      available: true,
      version: 1,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      slug: "brass-desk-tray",
      name: "Brass Desk Tray",
      imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85",
      priceAmount: 1_250_000,
      currency: "NGN",
      quantity: 2,
      available: true,
      version: 1,
    },
  ],
  updatedAt: "2026-10-03T10:00:00Z",
  version: 4,
};

describe("cartItemCount", () => {
  it("sums quantities rather than counting lines", () => {
    expect(cartItemCount(cart)).toBe(5);
  });

  it("reports zero when there is no cart yet", () => {
    expect(cartItemCount(null)).toBe(0);
    expect(cartItemCount(undefined)).toBe(0);
    expect(cartItemCount({ ...cart, items: [] })).toBe(0);
  });
});
