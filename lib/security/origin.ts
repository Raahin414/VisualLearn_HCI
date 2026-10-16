// Use the configured public origin: Next.js may use localhost internally even
// when the browser is visiting 127.0.0.1 or a reverse proxy's public hostname.
export function sameOrigin(request: Request) {
  const configured =
    process.env.APP_BASE_URL ||
    (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:3000" : null);
  if (!configured) return false;
  try {
    return request.headers.get("origin") === new URL(configured).origin;
  } catch {
    return false;
  }
}
