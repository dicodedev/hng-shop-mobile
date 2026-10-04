import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { ScreenHeader } from "@/components/screen-header";
import { useCartItemCount } from "@/features/cart/queries";

jest.mock("@/features/cart/queries", () => ({
  useCartItemCount: jest.fn(() => 0),
}));

const canGoBack = router.canGoBack as unknown as jest.Mock;
const dismissTo = router.dismissTo as unknown as jest.Mock;
const replace = router.replace as unknown as jest.Mock;
const push = router.push as unknown as jest.Mock;
const mockedCount = useCartItemCount as jest.MockedFunction<
  typeof useCartItemCount
>;

describe("ScreenHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    canGoBack.mockReturnValue(true);
    mockedCount.mockReturnValue(0);
  });

  it("renders the wordmark as plain text rather than a heading", () => {
    render(<ScreenHeader />);

    expect(screen.getByText("HNG Shop")).toBeOnTheScreen();
    // The screen keeps exactly one logical heading; the wordmark is not it.
    expect(screen.queryByRole("header")).toBeNull();
  });

  it("keeps the visible back label to a single word", () => {
    render(
      <ScreenHeader
        back={{
          label: "Back",
          accessibilityLabel: "Back to collection",
          href: "/",
        }}
      />,
    );

    expect(screen.getByText("Back")).toBeOnTheScreen();
  });

  it("falls back to the visible label when no accessibility label is given", () => {
    render(<ScreenHeader back={{ label: "Back", href: "/" }} />);

    expect(screen.getByRole("button", { name: "Back" })).toBeOnTheScreen();
  });

  it("dismisses to the declared destination when history exists", () => {
    canGoBack.mockReturnValue(true);
    render(
      <ScreenHeader
        back={{
          label: "Back",
          accessibilityLabel: "Back to collection",
          href: "/",
        }}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Back to collection" }));

    expect(dismissTo).toHaveBeenCalledWith("/");
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates to the declared destination when there is no history", () => {
    canGoBack.mockReturnValue(false);
    render(
      <ScreenHeader
        back={{
          label: "Back",
          accessibilityLabel: "Back to orders",
          href: "/orders",
        }}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Back to orders" }));

    expect(replace).toHaveBeenCalledWith("/orders");
    expect(dismissTo).not.toHaveBeenCalled();
  });

  it("uses a caller-supplied handler when one is provided", () => {
    const onPress = jest.fn();
    render(
      <ScreenHeader
        back={{
          label: "Back",
          accessibilityLabel: "Back to cart",
          href: "/cart",
          onPress,
        }}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Back to cart" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(dismissTo).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("hides the cart control by default", () => {
    render(<ScreenHeader back={{ label: "Back", href: "/" }} />);

    expect(screen.queryByRole("button", { name: /Cart/ })).toBeNull();
  });

  it("exposes an accessible cart label that includes the count", () => {
    mockedCount.mockReturnValue(2);
    render(<ScreenHeader showCart />);

    expect(
      screen.getByRole("button", { name: "Cart, 2 items" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("2")).toBeOnTheScreen();
  });

  it("reports an empty cart without implying a zero-item count", () => {
    render(<ScreenHeader showCart />);

    expect(
      screen.getByRole("button", { name: "Cart, empty" }),
    ).toBeOnTheScreen();
  });

  it("navigates to the cart when the cart control is pressed", () => {
    render(<ScreenHeader showCart />);

    fireEvent.press(screen.getByRole("button", { name: "Cart, empty" }));

    expect(push).toHaveBeenCalledWith("/cart");
  });
});
