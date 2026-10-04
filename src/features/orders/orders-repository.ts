import { apiClient, buildApiPath, DEFAULT_PAGE_LIMIT } from "@/api/client";
import { ApiProblemError, InvalidApiResponseError } from "@/api/errors";
import {
  createOrderResponseSchema,
  orderDetailSchema,
  orderPageSchema,
  paymentSessionSchema,
  paymentStatusSchema,
  OrderNotFoundError,
  type CreateOrderResponse,
  type DeliveryAddressInput,
  type OrderDetail,
  type OrderPage,
  type PaymentSession,
  type PaymentStatus,
} from "@/features/orders/schema";

/**
 * Order and payment repository.
 *
 * The client never sends prices, totals, product copy, or product IDs. Order
 * creation sends delivery details plus an idempotency key, and PostgreSQL reads
 * the canonical account cart.
 */
export interface OrdersRepository {
  createOrder(
    token: string,
    delivery: DeliveryAddressInput,
    idempotencyKey: string,
  ): Promise<CreateOrderResponse>;
  listOrders(token: string, cursor?: string): Promise<OrderPage>;
  getOrder(token: string, orderNumber: string): Promise<OrderDetail>;
  createPaymentSession(
    token: string,
    orderNumber: string,
    idempotencyKey: string,
  ): Promise<PaymentSession>;
  getPaymentStatus(token: string, orderNumber: string): Promise<PaymentStatus>;
}

function parse<T>(
  result: { success: true; data: T } | { success: false; error: unknown },
): T {
  if (!result.success) {
    throw new InvalidApiResponseError(
      "The order response did not match the contract.",
      {
        cause: result.error,
      },
    );
  }
  return result.data;
}

function rethrowNotFound(error: unknown): never {
  if (error instanceof ApiProblemError && error.status === 404)
    throw new OrderNotFoundError();
  throw error;
}

const orderPath = (orderNumber: string) =>
  `/orders/${encodeURIComponent(orderNumber)}`;

export const httpOrdersRepository: OrdersRepository = {
  async createOrder(token, delivery, idempotencyKey) {
    const body = await apiClient.request("/orders", {
      method: "POST",
      token,
      body: { delivery },
      headers: { "Idempotency-Key": idempotencyKey },
    });
    return parse(createOrderResponseSchema.safeParse(body));
  },

  async listOrders(token, cursor) {
    const path = buildApiPath("/orders", { limit: DEFAULT_PAGE_LIMIT, cursor });
    const body = await apiClient.getJson(path, { token });
    return parse(orderPageSchema.safeParse(body));
  },

  async getOrder(token, orderNumber) {
    try {
      const body = await apiClient.getJson(orderPath(orderNumber), { token });
      return parse(orderDetailSchema.safeParse(body));
    } catch (error) {
      return rethrowNotFound(error);
    }
  },

  async createPaymentSession(token, orderNumber, idempotencyKey) {
    const body = await apiClient.request(
      `${orderPath(orderNumber)}/payment-sessions`,
      {
        method: "POST",
        token,
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
    return parse(paymentSessionSchema.safeParse(body));
  },

  async getPaymentStatus(token, orderNumber) {
    try {
      const body = await apiClient.getJson(
        `${orderPath(orderNumber)}/payment-status`,
        { token },
      );
      return parse(paymentStatusSchema.safeParse(body));
    } catch (error) {
      return rethrowNotFound(error);
    }
  },
};
