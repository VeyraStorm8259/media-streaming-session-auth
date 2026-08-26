import { z } from "zod";
import { infraiRequest, InfraiError } from "./infrai_client.js";
const capabilityName = "captcha.verify";

export const signupSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1), widgetRecordId: z.string().min(1), captchaToken: z.string().min(1) });
type SignupInput = z.infer<typeof signupSchema>;

export async function signupCreator(input: SignupInput) {
  const parsed = signupSchema.parse(input);
  await infraiRequest("/v1/captcha/verify", "POST", { widget_record_id: parsed.widgetRecordId, token: parsed.captchaToken, action: "signup" });
  const user = await infraiRequest<{ id: string }>("/v1/auth/user/create", "POST", { email: parsed.email, password: parsed.password, name: parsed.name, metadata: { role: "creator" }, vendor: "media-stream", mode: "signup", idempotency_key: `signup:${parsed.email}` });
  return infraiRequest<{ session_id: string; refresh_token?: string }>("/v1/auth/session/create", "POST", { user_id: user.id, method: "password", require_mfa: false });
}

export function toHttpError(error: unknown) { if (error instanceof InfraiError) return { status: error.status >= 400 && error.status < 500 ? error.status : 502, body: { error: error.code } }; return { status: 500, body: { error: "INTERNAL_ERROR" } }; }

if (process.argv[1]?.endsWith("media_service.ts")) console.log("POST /signup accepts email, password, name, and captchaToken");
