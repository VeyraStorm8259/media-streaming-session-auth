import assert from "node:assert/strict";
import { signupSchema } from "../src/media_service.js";

const valid = signupSchema.safeParse({ email: "creator@example.com", password: "eight123", name: "Mina", widgetRecordId: "widget-record", captchaToken: "captcha-token" });
assert.equal(valid.success, true);
const rejected = signupSchema.safeParse({ email: "bad", password: "short", name: "", widgetRecordId: "", captchaToken: "" });
assert.equal(rejected.success, false);
console.log("signup boundary test passed");
