/**
 * Nigerian delivery validation.
 *
 * Client validation exists for fast, accessible feedback. The backend repeats
 * every rule, and PostgreSQL remains authoritative.
 */
export const NIGERIAN_REGIONS = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type NigerianRegion = (typeof NIGERIAN_REGIONS)[number];

export type DeliveryField =
  | "name"
  | "phone"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "postalCode";

export type DeliveryDraft = Record<DeliveryField, string>;

export type DeliveryErrors = Partial<Record<DeliveryField, string>>;

export const emptyDeliveryDraft: DeliveryDraft = {
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};

const isRegion = (value: string): value is NigerianRegion =>
  (NIGERIAN_REGIONS as readonly string[]).includes(value);

/**
 * Normalizes common Nigerian mobile formats to E.164 `+234...`.
 *
 * Accepts `0803...`, `+234803...`, `234803...`, and spaced or hyphenated input.
 * Returns `null` when the number is not a valid Nigerian mobile number.
 */
export function normalizeNigerianPhone(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const digits = trimmed.replace(/[\s()-]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;

  let national = digits;
  if (national.startsWith("+234")) national = national.slice(4);
  else if (national.startsWith("234")) national = national.slice(3);
  else if (national.startsWith("0")) national = national.slice(1);

  // Nigerian mobile numbers are 10 digits starting 7, 8, or 9 once the
  // country code and leading zero are removed.
  if (!/^[789][0-9]{9}$/.test(national)) return null;
  return `+234${national}`;
}

function trimmed(value: string): string {
  return value.trim();
}

export function validateDeliveryField(
  field: DeliveryField,
  draft: DeliveryDraft,
): string | undefined {
  const value = trimmed(draft[field]);

  switch (field) {
    case "name":
      if (value.length === 0) return "Enter the name for this delivery.";
      if (value.length < 2) return "Enter at least 2 characters.";
      if (value.length > 120) return "Use 120 characters or fewer.";
      return undefined;

    case "phone": {
      if (value.length === 0) return "Enter a Nigerian phone number.";
      if (normalizeNigerianPhone(value) === null)
        return "Enter a valid Nigerian mobile number.";
      return undefined;
    }

    case "addressLine1":
      if (value.length === 0) return "Enter the first line of your address.";
      if (value.length < 3) return "Use at least 3 characters.";
      if (value.length > 160) return "Use 160 characters or fewer.";
      return undefined;

    case "addressLine2":
      // Optional, but must respect the documented maximum when supplied.
      if (value.length > 160) return "Use 160 characters or fewer.";
      return undefined;

    case "city":
      if (value.length === 0) return "Enter your city.";
      if (value.length < 2) return "Enter at least 2 characters.";
      if (value.length > 100) return "Use 100 characters or fewer.";
      return undefined;

    case "state":
      if (value.length === 0) return "Select your state.";
      if (!isRegion(value))
        return "Select a Nigerian state or the Federal Capital Territory.";
      return undefined;

    case "postalCode":
      if (value.length === 0) return "Enter your postal code.";
      if (!/^[0-9]{6}$/.test(value)) return "Enter the 6-digit postal code.";
      return undefined;

    default:
      return undefined;
  }
}

export function validateDelivery(draft: DeliveryDraft): DeliveryErrors {
  const errors: DeliveryErrors = {};
  for (const field of Object.keys(emptyDeliveryDraft) as DeliveryField[]) {
    const error = validateDeliveryField(field, draft);
    if (error) errors[field] = error;
  }
  return errors;
}

export function hasDeliveryErrors(errors: DeliveryErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Builds the API payload with the phone normalized to E.164. */
export function toDeliveryPayload(draft: DeliveryDraft) {
  const phone = normalizeNigerianPhone(draft.phone);
  if (!phone) throw new Error("A valid Nigerian phone number is required.");

  const line2 = trimmed(draft.addressLine2);
  return {
    name: trimmed(draft.name),
    phone,
    addressLine1: trimmed(draft.addressLine1),
    addressLine2: line2.length > 0 ? line2 : null,
    city: trimmed(draft.city),
    state: trimmed(draft.state),
    postalCode: trimmed(draft.postalCode),
    country: "NG" as const,
  };
}
