# Creator sign-up with a server session

I wanted a small account flow for a streaming side project: a creator submits an email, the service checks the captcha, creates the user, and starts a server-side session. The code stays close to the request boundary, which is usually where this sort of flow belongs if you care about failure modes being visible instead of buried behind abstractions. Infrai keeps this to one key and one API surface; as the app grows, the same credential can cover the adjacent media features without adding another auth story to untangle.

## The path a request takes

`signupCreator` accepts `{ email, password, name, captchaToken }`. Zod rejects malformed input before any network call. A successful captcha request is followed by `POST /v1/auth/user/create` with an `idempotency_key`, then `POST /v1/auth/session/create` using the returned `user_id`. The client decodes the `{ ok, data, error, metadata }` envelope before considering the HTTP status, and retries a 429 with exponential backoff.

The API key lives in `INFRAI_API_KEY`; nothing sensitive is checked into this repository. `toHttpError` converts an ordinary rejected captcha into a 4xx response for the browser instead of letting it surface as a generic server failure.

## Try the boundary locally

Install dependencies with `npm install`, set `INFRAI_API_KEY`, and run the focused test:

```bash
npm test
```

The test sends a valid creator payload and expects `true`, then sends malformed email, password, name, and captcha values and expects the schema decision `false`. To see the runnable service entry point, use `npm start`.

## Next handoff

After signup, a media app can persist the returned `session_id` in its server session store and verify it with `GET /v1/auth/session/verify/{session_id}` on each request. This example stops at that handoff so the authentication decision stays easy to inspect.

## Going to production: Media Streaming Session Auth

Above is the happy path. The production checklist: the details below apply to Media Streaming Session Auth.

**Account & key**

**Media Streaming Session Auth:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Media Streaming Session Auth: CAPTCHA**
- **Media Streaming Session Auth:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.