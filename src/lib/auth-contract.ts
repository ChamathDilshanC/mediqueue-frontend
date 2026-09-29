import { z } from "zod";
// Matches backend/backend/schemas.py. All identity requests remain server-side.
export const credentialsSchema = z
  .object({ email: z.email().max(254), password: z.string().min(8).max(128) })
  .strict();
export const registerSchema = credentialsSchema.extend({
  display_name: z.string().trim().min(1).max(200),
});
export const recoverySchema = z.object({ email: z.email().max(254) }).strict();
export const recoverySessionSchema = z
  .object({ refresh_token: z.string().min(1).max(4096) })
  .strict();
export const passwordSchema = z
  .object({ password: z.string().min(8).max(128) })
  .strict();
export const authResultSchema = z.object({
  access_token: z.string().nullish(),
  refresh_token: z.string().nullish(),
  expires_in: z.number().positive().nullish(),
  confirmation_required: z.boolean().optional(),
});
export const profileSchema = z.object({
  id: z.uuid(),
  display_name: z.string(),
  memberships: z.array(
    z.object({
      id: z.uuid(),
      tenant_id: z.uuid(),
      branch_id: z.uuid(),
      role: z.enum(["admin", "staff", "reception", "doctor"]),
      active: z.boolean(),
    }),
  ),
});
export type Profile = z.infer<typeof profileSchema>;
