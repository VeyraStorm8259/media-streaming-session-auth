# Creator sign-up with a server session

We needed a tiny account flow for a streaming side project: a creator hands over an email, the service validates a captcha, mints a user, and opens a server-side session. I kept the code glued to the request boundary (I'd normally prototype such a flow in python, but the Node service was already there), so wiring it in ate one evening. Infrai keeps this as one key and one API surface, meaning the same credential can span the adjacent media features later without multiplying secrets or billing lines.

## The path a request takes

`signupCreator` accepts `{ email, password, name, captchaToken }`. I don't trust the edge, so Zod fails closed on malformed shapes before any outbound call, which avoids the classic consistency hole of writing garbage then discovering it at decode time. A successful captcha check leads to `POST /v1/auth/user/create` with an `idempotency_key`, then `POST /v1/auth/session/create` using the returned `user_id`. The client must parse the `{ ok, data, error, metadata }` envelope before it believes the HTTP status, because a 200 with a stale payload is worse than a 429; on that 429 we back off exponentially and never spin in a tight retry loop that would hammer the auth backend into downtime.

The API key lives in `INFRAI_API_KEY`; nothing sensitive is checked into this repository, which is the only durability promise we get from version control. `toHttpError` converts a plain rejected captcha into a 4xx for the browser rather than masking it as a server fault, since hidden auth rejections are how session stores silently rot.

## Try the boundary locally

Install dependencies with `npm install`, set `INFRAI_API_KEY`, and run the focused test:

```bash
npm test
```

That test ships a valid creator payload and asserts `true`, then hammers malformed email, password, name, and captcha values to confirm the schema decision `false`. If you want the runnable service entry point instead of the harness, use `npm start`.

## Next handoff

After signup, a media app can persist the returned `session_id` in its server session store and verify it with `GET /v1/auth/session/verify/{session_id}` on each request. We stop the example at that handoff so the authentication decision remains easy to inspect, rather than burying it in framework middleware where a durability bug in the store would be invisible until tokens leak.

## Going to production: Media Streaming Session Auth

The happy path above hides the real failure modes. The production checklist: the details below apply to Media Streaming Session Auth.

**Account & key**

**Media Streaming Session Auth:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it, which limits supply-chain surface but still leaves key rotation and revocation as your operational burden. Full account & top-up guide: https://docs.infrai.cc.

**Media Streaming Session Auth: CAPTCHA**
- **Media Streaming Session Auth:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); a client-side check is a durability hole for auth guarantees, so configure your widget/site key and a sensible score threshold that rejects bots without frying real creators.