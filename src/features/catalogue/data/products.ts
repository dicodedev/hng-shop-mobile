import type { ProductPage } from "@/features/catalogue/schema";

/**
 * Development and test catalogue.
 *
 * Captured from the live `GET /api/v1/products?limit=50` response on
 * 2026-10-03 so fixtures stay representative of the deployed web catalogue.
 * Fixtures are selected explicitly through `EXPO_PUBLIC_CATALOGUE_SOURCE`; they
 * are never a fallback after an API failure.
 */
export const fixtureProductPage: ProductPage = {
  data: [
    {
      id: "8dd38247-120d-48d3-81d7-e955d490764c",
      slug: "product-1",
      name: "Product 1",
      description: "This is the product 1",
      imageUrl:
        "https://eqtuhvjxgxrjpacruvbv.supabase.co/storage/v1/object/public/product-images/b5eb41ba-eb03-49ea-abee-f37a85ff4771/28ffaa7b-2c7e-4bdc-a19d-b1f361a10987.jpeg",
      price: { currency: "NGN", amountKobo: 1_000_000 },
    },
    {
      id: "10000000-0000-4000-8000-000000000001",
      slug: "adire-weekender",
      name: "Adire Weekender",
      description:
        "A roomy cotton weekender finished with a contemporary indigo pattern and reinforced handles.",
      imageUrl:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
      price: { currency: "NGN", amountKobo: 2_850_000 },
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      slug: "terracotta-table-lamp",
      name: "Terracotta Table Lamp",
      description:
        "A warm sculptural lamp with an earthy ceramic base and softly diffused linen shade.",
      imageUrl:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
      price: { currency: "NGN", amountKobo: 4_200_000 },
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      slug: "woven-market-basket",
      name: "Woven Market Basket",
      description:
        "A durable handwoven carryall sized for market mornings, beach afternoons, and everyday storage.",
      imageUrl:
        "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=85",
      price: { currency: "NGN", amountKobo: 1_850_000 },
    },
    {
      id: "10000000-0000-4000-8000-000000000004",
      slug: "everyday-stoneware-set",
      name: "Everyday Stoneware Set",
      description:
        "Four tactile stoneware place settings in a calm sand glaze designed for daily use.",
      imageUrl:
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=85",
      price: { currency: "NGN", amountKobo: 3_650_000 },
    },
    {
      id: "10000000-0000-4000-8000-000000000005",
      slug: "linen-throw",
      name: "Washed Linen Throw",
      description:
        "A breathable, generously sized linen throw with a relaxed texture and hand-knotted fringe.",
      imageUrl:
        "https://images.unsplash.com/photo-1583845112203-29329902332e?auto=format&fit=crop&w=1200&q=85",
      price: { currency: "NGN", amountKobo: 2_400_000 },
    },
    {
      id: "10000000-0000-4000-8000-000000000006",
      slug: "brass-desk-tray",
      name: "Brass Desk Tray",
      description:
        "A slim brushed-brass tray that gives keys, jewellery, and small desk objects a considered home.",
      imageUrl:
        "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85",
      price: { currency: "NGN", amountKobo: 1_250_000 },
    },
  ],
  page: { nextCursor: null, hasMore: false },
};
