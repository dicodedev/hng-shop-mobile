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
        singleColumn
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
        singleColumn
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
        singleColumn
      />,
    );
    expect(screen.getByText("₦42,000")).toBeOnTheScreen();
  });

  it("keeps every card the same height in a multi-column grid", () => {
    // Index 1 is the rhythm variant, normally rendered as a landscape crop.
    // Inside a two-column grid that short card would leave a void beside a
    // taller neighbour, so the rhythm is suppressed.
    render(
      <ProductCard
        compact={false}
        index={1}
        product={productBySlug("adire-weekender")}
        singleColumn={false}
      />,
    );

    const image = screen.getByLabelText("Adire Weekender");
    // aspectRatio 4/5 is the portrait style; 5/4 would be the landscape one.
    expect(image.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ aspectRatio: 4 / 5 })]),
    );
  });

  it("keeps the landscape rhythm crop in a single-column layout", () => {
    render(
      <ProductCard
        compact={false}
        index={1}
        product={productBySlug("adire-weekender")}
        singleColumn
      />,
    );

    const image = screen.getByLabelText("Adire Weekender");
    expect(image.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ aspectRatio: 5 / 4 })]),
    );
  });
});
