export default async function globalSetup() {
  if (process.env.E2E_BASE_URL) return;
  const port = Number(process.env.E2E_PORT || 3000);
  const baseURL = `http://localhost:${port}`;
  // Cold Turbopack compiles make the login page's parallel /api/auth/* calls
  // race each other (each can set a divergent next-auth.csrf-token cookie,
  // so the credentials POST body no longer matches the cookie). Sequentially
  // hitting the auth routes here compiles them and establishes a stable
  // CSRF cookie before any browser touches them.
  const paths = ["/api/auth/session", "/api/auth/providers", "/api/auth/csrf", "/api/auth/session"];
  for (const p of paths) {
    const res = await fetch(`${baseURL}${p}`);
    await res.text();
  }
}
