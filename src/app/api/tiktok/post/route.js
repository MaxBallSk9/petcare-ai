import { json } from "react-router";

/**
 * POST /api/tiktok/post
 *
 * Primește datele din formularul „Post to TikTok” și le înaintează către
 * TikTok Direct Post API. Răspunsul este un publish_id pe care UI-ul îl
 * va poll-ui pentru status.
 *
 * Toate regulile din UI (selectare manuală confidențialitate, comercial
 * bifat corect, declarația muzicii bifată) sunt validate și aici, ca să
 * nu existe cale de a posta fără ele chiar dacă cineva ocolește butonul.
 */
export async function action({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  const userIdMatch = cookieHeader?.match(/user_id=([^;]+)/);
  const userId = userIdMatch ? userIdMatch[1] : null;

  if (!userId) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();

  const title = (formData.get("title") || "").toString().trim();
  const privacyLevel = (formData.get("privacy_level") || "").toString();
  const commentDisabled = formData.get("comment_disabled") === "on";
  const duetDisabled = formData.get("duet_disabled") === "on";
  const stitchDisabled = formData.get("stitch_disabled") === "on";
  const commercialEnabled = formData.get("commercial_enabled") === "on";
  const commercialOwnBrand = formData.get("commercial_own_brand") === "on";
  const commercialBrandedContent = formData.get("commercial_branded_content") === "on";
  const musicAcknowledged = formData.get("music_acknowledged") === "on";
  const videoKey = (formData.get("video_key") || "").toString();

  // ----------- Validări server-side (regulile TikTok nu sunt glume) -----------
  const errors = {};

  if (!privacyLevel) {
    errors.privacy_level = "Selectează o opțiune de confidențialitate înainte de a posta.";
  }
  if (!title) {
    errors.title = "Titlul este obligatoriu.";
  }
  if (!videoKey) {
    errors.video = "Niciun videoclip selectat pentru postare.";
  }
  if (!musicAcknowledged) {
    errors.music = "Trebuie să confirmi Music Usage Confirmation.";
  }
  if (commercialEnabled && !commercialOwnBrand && !commercialBrandedContent) {
    errors.commercial = "Dacă ai activat conținut comercial, bifează cel puțin o opțiune (Your brand sau Branded content).";
  }

  if (Object.keys(errors).length > 0) {
    return json({ ok: false, errors }, { status: 400 });
  }

  // -----------------------------------------------------------------
  // AICI: apel real către TikTok Direct Post API
  //   POST https://open.tiktokapis.com/v2/post/publish/video/init/
  // body: { post_info: { title, privacy_level, comment_disabled,
  //         duet_disabled, stitch_disabled,
  //         branded_content_type: commercialEnabled ? (commercialOwnBrand ? "YOUR_BRAND" : "BRANDED_CONTENT") : undefined },
  //         source_info: { source: "FILE_UPLOAD", video_size, chunk_size, ... } }
  // -----------------------------------------------------------------

  // Mock publish_id – înlocuiește cu răspunsul real al API-ului.
  const publishId = "mock-publish-" + Date.now();

  return json({
    ok: true,
    publish_id: publishId,
    message:
      "Videoclipul a fost trimis către TikTok. Procesarea și publicarea pot dura câteva minute. Vei vedea statusul aici.",
  });
}
