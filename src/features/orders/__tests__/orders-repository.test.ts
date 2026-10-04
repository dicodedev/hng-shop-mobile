import { ApiProblemError, InvalidApiResponseError } from "@/api/errors";
import { httpOrdersRepository } from "@/features/orders/orders-repository";
import {
  OrderNotFoundError,
  type DeliveryAddressInput,
} from "@/features/orders/schema";

const baseUrl = "https://hng-shop-task.vercel.app/api/v1";
const token = "test-access-token";
const idempotencyKey = "11111111-2222-4333-8444-555555555555";

const delivery: DeliveryAddressInput = {
  name: "Ada Nwosu",
  phone: "+2348012345678",
  addressLine1: "12 Allen Avenue",
  addressLine2: null,
  city: "Ikeja",
  state: "Lagos",
  postalCode: "100001",
  country: "NG",
};

const createdOrder = {
  orderId: "30000000-0000-4000-8000-000000000001",
  orderNumber: "HNG-2026-ABCD1234",
  paymentStatus: "awaiting_payment",
  subtotal: { currency: "NGN", amountKobo: 2_850_000 },
  shipping: { currency: "NGN", amountKobo: 0 },
  total: { currency: "NGN", amountKobo: 2_850_000 },
  idempotencyReplayed: false,
  createdAt: "2026-10-03T10:00:00Z",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function problem(code: string, status: number, requestId = "req-1"): Response {
  return jsonResponse(
    {
      type: `https://hng.shop/problems/${code.toLowerCase()}`,
      title: "Request failed",
      status,
      code,
      detail: "Detail.",
      requestId,
    },
    status,
  );
}

function lastCall(): [string, RequestInit] {
  const call = jest.mocked(globalThis.fetch).mock.calls.at(-1);
  if (!call) throw new Error("fetch was not called.");
  return call as unknown as [string, RequestInit];
}

function headersOf(init: RequestInit): Record<string, string> {
  return init.headers as Record<string, string>;
}

describe("httpOrdersRepository.createOrder", () => {
  afterEach(() => jest.restoreAllMocks());

  it("sends only delivery details plus an idempotency header", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(createdOrder, 201));

    await expect(
      httpOrdersRepository.createOrder(token, delivery, idempotencyKey),
    ).resolves.toMatchObject({
      orderNumber: "HNG-2026-ABCD1234",
      idempotencyReplayed: false,
    });

    const [url, init] = lastCall();
    expect(url).toBe(`${baseUrl}/orders`);
    expect(init.method).toBe("POST");
    expect(headersOf(init)["Idempotency-Key"]).toBe(idempotencyKey);
    expect(headersOf(init).Authorization).toBe(`Bearer ${token}`);

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(["delivery"]);
    expect(body.delivery).toEqual(delivery);
  });

  it("never sends client prices, totals, product IDs, or quantities", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(createdOrder, 201));

    await httpOrdersRepository.createOrder(token, delivery, idempotencyKey);

    const serialized = JSON.stringify(JSON.parse(String(lastCall()[1].body)));
    for (const forbidden of [
      "price",
      "total",
      "subtotal",
      "productId",
      "items",
      "quantity",
      "email",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("reuses the same key across retries without changing the request shape", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(problem("ORDER_CREATION_FAILED", 500))
      .mockResolvedValue(
        jsonResponse({ ...createdOrder, idempotencyReplayed: true }, 200),
      );

    await expect(
      httpOrdersRepository.createOrder(token, delivery, idempotencyKey),
    ).rejects.toBeInstanceOf(ApiProblemError);

    await expect(
      httpOrdersRepository.createOrder(token, delivery, idempotencyKey),
    ).resolves.toMatchObject({ idempotencyReplayed: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls) {
      const init = call[1] as unknown as RequestInit;
      expect(headersOf(init)["Idempotency-Key"]).toBe(idempotencyKey);
    }
  });

  it("surfaces an unavailable product as a stable validation problem", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(problem("PRODUCT_UNAVAILABLE", 422));

    await expect(
      httpOrdersRepository.createOrder(token, delivery, idempotencyKey),
    ).rejects.toMatchObject({
      status: 422,
      code: "PRODUCT_UNAVAILABLE",
      requestId: "req-1",
    });
  });

  it("rejects a response that breaks the contract", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        ...createdOrder,
        total: { currency: "USD", amountKobo: 1 },
      }),
    );

    await expect(
      httpOrdersRepository.createOrder(token, delivery, idempotencyKey),
    ).rejects.toBeInstanceOf(InvalidApiResponseError);
  });

  it("rejects an order number that violates the documented pattern", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ ...createdOrder, orderNumber: "not-an-order" }),
      );

    await expect(
      httpOrdersRepository.createOrder(token, delivery, idempotencyKey),
    ).rejects.toBeInstanceOf(InvalidApiResponseError);
  });
});

describe("httpOrdersRepository reads", () => {
  afterEach(() => jest.restoreAllMocks());

  it("requests the cursor-paginated order list", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ data: [], page: { nextCursor: null, hasMore: false } }),
      );

    await httpOrdersRepository.listOrders(token);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${baseUrl}/orders?limit=50`);
    expect(headersOf(lastCall()[1]).Authorization).toBe(`Bearer ${token}`);
  });

  it("passes an opaque cursor without parsing it", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ data: [], page: { nextCursor: null, hasMore: false } }),
      );

    await httpOrdersRepository.listOrders(token, "cursor/with+chars");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${baseUrl}/orders?limit=50&cursor=cursor%2Fwith%2Bchars`,
    );
  });

  it("treats a missing order and a non-owned order identically", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(problem("ORDER_NOT_FOUND", 404));

    await expect(
      httpOrdersRepository.getOrder(token, "HNG-2026-ABCD1234"),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
    await expect(
      httpOrdersRepository.getPaymentStatus(token, "HNG-2026-ABCD1234"),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it("does not downgrade a payment-status server failure to not-found", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(problem("SERVICE_UNAVAILABLE", 503));

    await expect(
      httpOrdersRepository.getPaymentStatus(token, "HNG-2026-ABCD1234"),
    ).rejects.toMatchObject({
      status: 503,
    });
    await expect(
      httpOrdersRepository.getPaymentStatus(token, "HNG-2026-ABCD1234"),
    ).rejects.not.toBeInstanceOf(OrderNotFoundError);
  });
});

describe("httpOrdersRepository.createPaymentSession", () => {
  afterEach(() => jest.restoreAllMocks());

  it("requests a hosted session with the idempotency key", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        orderNumber: "HNG-2026-ABCD1234",
        paymentStatus: "awaiting_payment",
        authorizationUrl: "https://checkout.paystack.com/abc",
        expiresAt: null,
      }),
    );

    await httpOrdersRepository.createPaymentSession(
      token,
      "HNG-2026-ABCD1234",
      idempotencyKey,
    );

    const [url, init] = lastCall();
    expect(url).toBe(`${baseUrl}/orders/HNG-2026-ABCD1234/payment-sessions`);
    expect(headersOf(init)["Idempotency-Key"]).toBe(idempotencyKey);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-HTTPS authorization URL", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        orderNumber: "HNG-2026-ABCD1234",
        paymentStatus: "awaiting_payment",
        authorizationUrl: "http://insecure.example.com/abc",
        expiresAt: null,
      }),
    );

    await expect(
      httpOrdersRepository.createPaymentSession(
        token,
        "HNG-2026-ABCD1234",
        idempotencyKey,
      ),
    ).rejects.toBeInstanceOf(InvalidApiResponseError);
  });

  it("keeps a provider failure distinguishable from a missing order", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(problem("PROVIDER_UNAVAILABLE", 502));

    await expect(
      httpOrdersRepository.createPaymentSession(
        token,
        "HNG-2026-ABCD1234",
        idempotencyKey,
      ),
    ).rejects.toMatchObject({ status: 502, code: "PROVIDER_UNAVAILABLE" });
  });
});
