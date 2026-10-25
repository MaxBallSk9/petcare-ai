import { json } from "react-router";

/**
 * GET /api/tiktok/creator-info
 *
 * Întoarce informațiile despre contul TikTok conectat și opțiunile
 * permise pentru confidențialitate (comment/duet/stitch/disabled).
 *
 * TODO: înlocuiește mock-ul cu un apel real către TikTok Direct Post API:
 *   GET https://open.tiktokapis.com/v2/post/publish/creator_info/query/
 * și parsează `privacy_level_options`, `comment_disabled`, etc. din răspuns.
 */
export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  const userIdMatch = cookieHeader?.match(/user_id=([^;]+)/);
  const userId = userIdMatch ? userIdMatch[1] : null;

  if (!userId) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  // ---------------------------------------------------------------------
  // MOCK: valorile astea vin în realitate din TikTok /v2/post/publish/creator_info/query/
  // Le lăsăm într-un singur loc ca să fie ușor de înlocuit cu API-ul real.
  // ---------------------------------------------------------------------
  const creatorInfo = {
    open_id: "mock-open-id",
    username: "petcare_ai",          // nickname-ul afișat în UI
    avatar_url: null,
    privacy_level_options: [
      "PUBLIC_TO_EVERYONE",
      "FRIENDS_ONLY",
      "SELF_ONLY",
      // "MUTUAL_FOLLOW_FRIENDS"      // lăsat comentat intenționat ca exemplu:
                                       // un cont nu are toate opțiunile disponibile;
                                       // doar valorile permise de TikTok apar în meniu.
    ],
    comment_disabled: false,
    duet_disabled: false,
    stitch_disabled: false,
    max_video_duration_sec: 600,
  };

  return json(creatorInfo);
}
