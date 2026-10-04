import {
  emptyDeliveryDraft,
  hasDeliveryErrors,
  NIGERIAN_REGIONS,
  normalizeNigerianPhone,
  toDeliveryPayload,
  validateDelivery,
  validateDeliveryField,
  type DeliveryDraft,
} from "@/features/checkout/delivery";

function draft(overrides: Partial<DeliveryDraft> = {}): DeliveryDraft {
  return { ...emptyDeliveryDraft, ...overrides };
}

const validDraft = (overrides: Partial<DeliveryDraft> = {}) =>
  draft({
    name: "Ada Nwosu",
    phone: "08012345678",
    addressLine1: "12 Allen Avenue",
    addressLine2: "",
    city: "Ikeja",
    state: "Lagos",
    postalCode: "100001",
    ...overrides,
  });

describe("Nigerian regions", () => {
  it("includes all 36 states plus the Federal Capital Territory", () => {
    expect(NIGERIAN_REGIONS).toHaveLength(37);
    expect(NIGERIAN_REGIONS).toContain("Federal Capital Territory");
    expect(NIGERIAN_REGIONS).toContain("Lagos");
    expect(NIGERIAN_REGIONS).toContain("Zamfara");
  });
});

describe("normalizeNigerianPhone", () => {
  it.each([
    ["08012345678", "+2348012345678"],
    ["+2348012345678", "+2348012345678"],
    ["2348012345678", "+2348012345678"],
    ["801 234 5678", "+2348012345678"],
    ["080-123-45678", "+2348012345678"],
    ["(080) 12345678", "+2348012345678"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeNigerianPhone(input)).toBe(expected);
  });

  it.each([
    ["0801234567", "too short"],
    ["080123456789", "too long"],
    ["02012345678", "invalid mobile prefix"],
    ["0812345abcd", "non numeric"],
    ["", "empty"],
    ["+1 202 555 0143", "non Nigerian"],
  ])("rejects %s (%s)", (input) => {
    expect(normalizeNigerianPhone(input)).toBeNull();
  });

  it("accepts every valid Nigerian mobile prefix", () => {
    expect(normalizeNigerianPhone("08012345678")).not.toBeNull();
    expect(normalizeNigerianPhone("08112345678")).not.toBeNull();
    expect(normalizeNigerianPhone("09012345678")).not.toBeNull();
  });
});

describe("validateDeliveryField", () => {
  it("accepts a complete valid draft", () => {
    expect(validateDelivery(validDraft())).toEqual({});
    expect(hasDeliveryErrors(validateDelivery(validDraft()))).toBe(false);
  });

  it("treats address line 2 as optional", () => {
    expect(validateDeliveryField("addressLine2", draft())).toBeUndefined();
  });

  it("enforces the postal code pattern", () => {
    expect(
      validateDeliveryField("postalCode", draft({ postalCode: "100001" })),
    ).toBeUndefined();
    expect(
      validateDeliveryField("postalCode", draft({ postalCode: "10001" })),
    ).toBeDefined();
    expect(
      validateDeliveryField("postalCode", draft({ postalCode: "1000012" })),
    ).toBeDefined();
    expect(
      validateDeliveryField("postalCode", draft({ postalCode: "ABCDEF" })),
    ).toBeDefined();
  });

  it("rejects a region that is not Nigerian", () => {
    expect(
      validateDeliveryField(
        "state",
        draft({ state: "Federal Capital Territory" }),
      ),
    ).toBeUndefined();
    expect(
      validateDeliveryField("state", draft({ state: "Lagos State" })),
    ).toBeDefined();
    expect(
      validateDeliveryField("state", draft({ state: "Ontario" })),
    ).toBeDefined();
  });

  it("trims surrounding whitespace before validating", () => {
    expect(
      validateDeliveryField("name", draft({ name: "  Ada  " })),
    ).toBeUndefined();
  });

  it("reports every missing required field", () => {
    const errors = validateDelivery(emptyDeliveryDraft);
    expect(Object.keys(errors).sort()).toEqual([
      "addressLine1",
      "city",
      "name",
      "phone",
      "postalCode",
      "state",
    ]);
  });

  it("enforces documented length limits", () => {
    expect(validateDeliveryField("name", draft({ name: "A" }))).toBeDefined();
    expect(
      validateDeliveryField("name", draft({ name: "x".repeat(121) })),
    ).toBeDefined();
    expect(
      validateDeliveryField("addressLine1", draft({ addressLine1: "ab" })),
    ).toBeDefined();
    expect(
      validateDeliveryField(
        "addressLine1",
        draft({ addressLine1: "x".repeat(161) }),
      ),
    ).toBeDefined();
    expect(
      validateDeliveryField(
        "addressLine2",
        draft({ addressLine2: "x".repeat(161) }),
      ),
    ).toBeDefined();
    expect(
      validateDeliveryField("city", draft({ city: "x".repeat(101) })),
    ).toBeDefined();
  });
});

describe("toDeliveryPayload", () => {
  it("normalizes the phone and defaults optional line 2 to null", () => {
    expect(toDeliveryPayload(validDraft())).toEqual({
      name: "Ada Nwosu",
      phone: "+2348012345678",
      addressLine1: "12 Allen Avenue",
      addressLine2: null,
      city: "Ikeja",
      state: "Lagos",
      postalCode: "100001",
      country: "NG",
    });
  });

  it("keeps a supplied landmark", () => {
    expect(
      toDeliveryPayload(validDraft({ addressLine2: "Near Ikeja City Mall" }))
        .addressLine2,
    ).toBe("Near Ikeja City Mall");
  });

  it("refuses to build a payload without a valid phone", () => {
    expect(() => toDeliveryPayload(draft({ phone: "12345" }))).toThrow();
  });

  it("always targets Nigeria", () => {
    expect(toDeliveryPayload(validDraft()).country).toBe("NG");
  });
});
