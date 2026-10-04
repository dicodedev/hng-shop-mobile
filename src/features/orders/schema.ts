import { z } from "zod";

import {
  emailStateSchema,
  fulfillmentStateSchema,
  moneySchema,
  orderNumberSchema,
  pageMetaSchema,
  paymentStateSchema,
} from "@/api/dto";

/** Delivery input sent to the backend. The server normalizes and revalidates it. */
export const deliveryAddressInputSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(1).max(24),
  addressLine1: z.string().min(3).max(160),
  addressLine2: z.string().max(160).nullable(),
  city: z.string().min(2).max(100),
  state: z.string().min(1),
  postalCode: z.string().regex(/^[0-9]{6}$/),
  country: z.literal("NG"),
});

export const createOrderRequestSchema = z.object({
  delivery: deliveryAddressInputSchema,
});

/**
 * Order creation response.
 *
 * Totals come from PostgreSQL, never from the device. `idempotencyReplayed`
 * tells the app whether this is the original order or a safe replay.
 */
export const createOrderResponseSchema = z.object({
  orderId: z.uuid(),
  orderNumber: orderNumberSchema,
  paymentStatus: paymentStateSchema,
  subtotal: moneySchema,
  shipping: moneySchema,
  total: moneySchema,
  idempotencyReplayed: z.boolean(),
  createdAt: z.string().min(1),
});

export const orderSummarySchema = z.object({
  orderId: z.uuid(),
  orderNumber: orderNumberSchema,
  paymentStatus: paymentStateSchema,
  fulfillmentStatus: fulfillmentStateSchema,
  total: moneySchema,
  createdAt: z.string().min(1),
  paidAt: z.string().nullable(),
});

export const orderPageSchema = z.object({
  data: z.array(orderSummarySchema),
  page: pageMetaSchema,
});

export const orderItemSchema = z.object({
  productName: z.string().min(1),
  productImageUrl: z.url(),
  quantity: z.number().int().min(1).max(99),
  unitPrice: moneySchema,
  lineTotal: moneySchema,
});

export const deliveryAddressSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().regex(/^\+234[7-9][0-9]{9}$/),
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().regex(/^[0-9]{6}$/),
  country: z.literal("NG"),
});

export const orderDetailSchema = z.object({
  orderId: z.uuid(),
  orderNumber: orderNumberSchema,
  paymentStatus: paymentStateSchema,
  fulfillmentStatus: fulfillmentStateSchema,
  subtotal: moneySchema,
  shipping: moneySchema,
  total: moneySchema,
  items: z.array(orderItemSchema),
  delivery: deliveryAddressSchema,
  emailStatus: emailStateSchema,
  createdAt: z.string().min(1),
  paidAt: z.string().nullable(),
});

export const paymentSessionSchema = z.object({
  orderNumber: orderNumberSchema,
  paymentStatus: paymentStateSchema,
  // Hosted checkout must be an absolute HTTPS provider URL. Card details are
  // entered on the provider's own surface, never inside this app.
  authorizationUrl: z.url().refine((value) => value.startsWith("https://"), {
    message: "Hosted payment must use an absolute HTTPS URL.",
  }),
  expiresAt: z.string().nullable(),
});

/** Small polling response used after the app returns from Paystack. */
export const paymentStatusSchema = z.object({
  orderNumber: orderNumberSchema,
  paymentStatus: paymentStateSchema,
  fulfillmentStatus: fulfillmentStateSchema,
  paidAt: z.string().nullable(),
  emailStatus: emailStateSchema,
});

export type DeliveryAddressInput = z.infer<typeof deliveryAddressInputSchema>;
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type OrderPage = z.infer<typeof orderPageSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type PaymentSession = z.infer<typeof paymentSessionSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/** Missing and non-owned orders are indistinguishable to the client. */
export class OrderNotFoundError extends Error {
  constructor() {
    super("That order could not be found.");
    this.name = "OrderNotFoundError";
  }
}
