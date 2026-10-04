import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/api/client";
import { InvalidApiResponseError } from "@/api/errors";
import { useAuth } from "@/auth/session-provider";

/** `GET /api/v1/me`. Informational only; mobile version 1 has no role mutation. */
export const profileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  avatarUrl: z.url().nullable(),
  role: z.enum(["customer", "admin"]),
});

export type Profile = z.infer<typeof profileSchema>;

export const profileKeys = {
  detail: (userId: string) => ["me", userId] as const,
};

export function useProfileQuery() {
  const { accessToken, userId, status } = useAuth();

  return useQuery({
    queryKey: profileKeys.detail(userId ?? "anonymous"),
    queryFn: async () => {
      if (!accessToken) throw new Error("Sign in to view your account.");
      const body = await apiClient.getJson("/me", { token: accessToken });
      const parsed = profileSchema.safeParse(body);
      if (!parsed.success) {
        throw new InvalidApiResponseError(
          "The profile response did not match the contract.",
          {
            cause: parsed.error,
          },
        );
      }
      return parsed.data;
    },
    enabled: status === "authenticated" && Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
}
