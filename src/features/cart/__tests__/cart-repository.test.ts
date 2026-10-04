import { ApiProblemError } from "@/api/errors";
import { httpCartRepository } from "@/features/cart/cart-repository";
import type { Cart } from "@/features/cart/schema";

const baseUrl = "https://hng-shop-task.vercel.app/api/v1";
const token = "test-access-token";

const cart: Cart = {
  items: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      slug: "adire-weekender",
      name: "Adire Weekender",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
      priceAmount: 2_850_000,
      currency: "NGN",
      quantity: 1,
      available: true,
      version: 1,
    },
  ],
  updatedAt: "2026-10-02T12:00:00Z",
  version: 8,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function lastCall(): [string, RequestInit] {
  const mock = jest.mocked(globalThis.fetch);
  const call = mock.mock.calls.at(-1);
  if (!call) throw new Error("fetch was not called.");
  return call as unknown as [string, RequestInit];
}

describe("httpCartRepository", () => {
  afterEach(() => jest.restoreAllMocks());

  it("sends the bearer token when reading the canonical cart", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(cart));

    await expect(httpCartRepository.getCart(token)).resolves.toEqual(cart);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = lastCall();
    expect(url).toBe(`${baseUrl}/cart`);
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${token}`,
    );
  });

  it("adds a product with the documented request body", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(cart));

    await httpCartRepository.addItem(
      token,
      "10000000-0000-4000-8000-000000000001",
      2,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = lastCall();
    expect(url).toBe(`${baseUrl}/cart/items`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      productId: "10000000-0000-4000-8000-000000000001",
      quantity: 2,
    });
  });

  it("omits quantity when adding a single unit", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(cart));
    await httpCartRepository.addItem(
      token,
      "10000000-0000-4000-8000-000000000001",
    );
    const [, init] = lastCall();
    expect(JSON.parse(String(init.body))).toEqual({
      productId: "10000000-0000-4000-8000-000000000001",
    });
  });

  it("sets an absolute quantity through PATCH", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(cart));
    await httpCartRepository.setItemQuantity(
      token,
      "10000000-0000-4000-8000-000000000001",
      5,
    );
    const [url, init] = lastCall();
    expect(url).toBe(
      `${baseUrl}/cart/items/10000000-0000-4000-8000-000000000001`,
    );
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ quantity: 5 });
  });

  it("clears the cart through DELETE without a body", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(cart));
    await httpCartRepository.clearCart(token);
    const [url, init] = lastCall();
    expect(url).toBe(`${baseUrl}/cart`);
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
  });

  it("normalizes the legacy cart error shape", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse(
          { code: "AUTH_REQUIRED", error: "Sign in to use your cart." },
          401,
        ),
      );

    await expect(httpCartRepository.getCart(token)).rejects.toMatchObject({
      name: "ApiProblemError",
      status: 401,
      code: "AUTH_REQUIRED",
    });
  });

  it("surfaces the stable validation code for limit breaches", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse(
          { code: "CART_VALIDATION_FAILED", error: "Limit reached." },
          422,
        ),
      );

    await expect(
      httpCartRepository.addItem(
        token,
        "10000000-0000-4000-8000-000000000001",
        99,
      ),
    ).rejects.toMatchObject({ code: "CART_VALIDATION_FAILED", status: 422 });
  });

  it("rejects a cart payload that breaks the contract", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ...cart, version: "eight" }));

    await expect(httpCartRepository.getCart(token)).rejects.toThrow(
      "The cart response did not match the contract.",
    );
  });

  it("treats an API problem error as a stable failure type", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse(
          { code: "CART_NOT_CONFIGURED", error: "Not configured." },
          503,
        ),
      );

    await expect(httpCartRepository.getCart(token)).rejects.toBeInstanceOf(
      ApiProblemError,
    );
  });
});
