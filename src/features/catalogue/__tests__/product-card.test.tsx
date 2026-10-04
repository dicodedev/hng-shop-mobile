import { fireEvent, render, screen } from "@testing-library/react-native";

import { ProductCard } from "@/features/catalogue/components/product-card";
import { fixtureProductPage } from "@/features/catalogue/data/products";

function productBySlug(slug: string) {
  const product = fixtureProductPage.data.find((item) => item.slug === slug);
  if (!product) throw new Error(`Fixture product ${slug} is missing.`);
  return product;
}

describe("ProductCard", () => {
  it("renders one accessible action naming the product and formatted price", () => {
    render(
      <ProductCard
        compact={false}
        index={1}
        product={productBySlug("adire-weekender")}
      />,
    );

    const action = screen.getByRole("button", {
      name: "Adire Weekender, ₦28,500",
    });
    expect(action).toBeOnTheScreen();
    expect(action.props.accessibilityHint).toBe("Opens product details");
    expect(screen.getByText("₦28,500")).toBeOnTheScreen();
  });

  it("exposes a press handler for navigation", () => {
    render(
      <ProductCard
        compact={false}
        index={0}
        product={productBySlug("adire-weekender")}
      />,
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Adire Weekender, ₦28,500" }),
    );
  });

  it("formats large kobo amounts without floating-point drift", () => {
    render(
      <ProductCard
        compact
        index={0}
        product={productBySlug("terracotta-table-lamp")}
      />,
    );
    expect(screen.getByText("₦42,000")).toBeOnTheScreen();
  });
});
