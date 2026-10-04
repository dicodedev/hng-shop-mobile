import {
  extractAuthorizationCode,
  isAuthIntent,
  resolveIntentPath,
} from "@/auth/redirect-state";

describe("resolveIntentPath", () => {
  it("resolves only allowlisted internal destinations", () => {
    expect(resolveIntentPath("cart")).toBe("/cart");
    expect(resolveIntentPath("orders")).toBe("/orders");
    expect(resolveIntentPath("account")).toBe("/account");
    expect(resolveIntentPath("product", { slug: "adire-weekender" })).toEqual({
      pathname: "/product/[slug]",
      params: { slug: "adire-weekender" },
    });
  });

  it("rejects arbitrary or external destinations", () => {
    expect(resolveIntentPath("https://evil.example.com")).toBeNull();
    expect(resolveIntentPath("//evil.example.com")).toBeNull();
    expect(resolveIntentPath("/admin/products")).toBeNull();
    expect(resolveIntentPath("../../etc/passwd")).toBeNull();
    expect(resolveIntentPath(undefined)).toBeNull();
    expect(resolveIntentPath({ toString: () => "cart" })).toBeNull();
  });

  it("rejects a product intent without a safe slug", () => {
    expect(resolveIntentPath("product")).toBeNull();
    expect(resolveIntentPath("product", { slug: "../admin" })).toBeNull();
    expect(resolveIntentPath("product", { slug: "a b" })).toBeNull();
  });

  it("recognizes only known intents", () => {
    expect(isAuthIntent("cart")).toBe(true);
    expect(isAuthIntent("checkout")).toBe(false);
  });
});

describe("extractAuthorizationCode", () => {
  it("reads the OAuth code from the provider redirect", () => {
    expect(
      extractAuthorizationCode("hngshop-dev://auth/callback?code=abc123"),
    ).toBe("abc123");
    expect(
      extractAuthorizationCode("https://shop.example.com/cb?state=x&code=xyz"),
    ).toBe("xyz");
  });

  it("ignores redirects without a code", () => {
    expect(
      extractAuthorizationCode(
        "hngshop-dev://auth/callback?error=access_denied",
      ),
    ).toBeNull();
    expect(extractAuthorizationCode("hngshop-dev://auth/callback")).toBeNull();
    expect(extractAuthorizationCode(null)).toBeNull();
    expect(extractAuthorizationCode(undefined)).toBeNull();
  });
});
