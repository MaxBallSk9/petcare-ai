import { json } from "react-router";

/**
 * GET /api/tiktok
 *
 * TikTok OAuth redirect callback.
 *
 * At the very top we handle the special `local_*` state prefix used by local
 * development: we return a plain HTML page that shows the full URL the
 * browser was redirected to, so the developer can copy `code`+`state` back
 * into the local app without exchanging the code for a token here.
 *
 * Any other state (normal production flow) is handled by the existing
 * production callback logic below.
 */
export async function loader({ request }) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";

  // ---------------- local-dev shortcut branch ----------------
  if (state.startsWith("local_")) {
    const fullUrl = request.url;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TikTok callback - local</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 48px auto; padding: 0 20px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 8px; }
  p  { color: #555; line-height: 1.5; }
  pre { background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; word-break: break-all; white-space: pre-wrap; font-size: 13px; }
</style>
</head>
<body>
  <h1>TikTok callback received</h1>
  <p>Copy the full address from your browser's address bar and paste it into your local app.</p>
  <pre id="url">${escapeHtml(fullUrl)}</pre>
</body>
</html>`;
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // ---------------- production flow ----------------
  // Existing behavior: exchange the `code` for an access token, fetch the
  // user's info, create the session, redirect back to the app.
  // NOTE: this route is currently a placeholder until the real OAuth
  // exchange is wired up; the local_ branch above runs BEFORE any token
  // exchange so the production path below remains unchanged.
  return json(
    { error: "Production TikTok OAuth callback not yet implemented." },
    { status: 501 },
  );
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
