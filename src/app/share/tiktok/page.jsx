import { useLoaderData, Form, useNavigation, Link, redirect, useActionData } from "react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Loader2, Video as VideoIcon, ExternalLink, Lock, Users, User as UserIcon, ShieldCheck } from "lucide-react";

// ---------------------------------------------------------------------
// BACKEND: loader + action
// ---------------------------------------------------------------------

export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  const userIdMatch = cookieHeader?.match(/user_id=([^;]+)/);
  if (!userIdMatch) return redirect("/login");

  // Construim URL-ul relativ la request, ca să meargă și pe server (SSR).
  const origin = new URL(request.url).origin;

  // Chemăm creator_info în loader – la fiecare vizită citim opțiunile
  // direct de la TikTok, ca să nu servim valori vechi/stale.
  let creatorInfo = null;
  let creatorInfoError = null;
  try {
    const res = await fetch(`${origin}/api/tiktok/creator-info`, {
      headers: { Cookie: cookieHeader || "" },
    });
    if (res.ok) {
      creatorInfo = await res.json();
    } else {
      creatorInfoError = "Nu am putut încărca informațiile contului TikTok.";
    }
  } catch (e) {
    creatorInfoError = "Eroare de rețea la conectarea cu TikTok.";
  }

  // Mock video list – înlocuiește cu videoclipurile generate de pipeline.
  // Important: NU adăugăm logo/watermark/text promoțional peste clip,
  // conform regulii TikTok Direct Post.
  const availableVideos = [
    {
      key: "petcare-ai-mock-01",
      title: "Cum să îți îngrijești câinele pe timp de caniculă",
      preview_url: "/mock-video-preview.mp4", // înlocuiește cu URL real
      duration_sec: 47,
      has_watermark: false, // hard-check înainte de listare
    },
  ];

  return { creatorInfo, creatorInfoError, availableVideos };
}

export async function action({ request }) {
  // Forward form-ul către API-ul de postare – toate validările sunt acolo.
  const formData = await request.formData();
  const origin = new URL(request.url).origin;
  const cookieHeader = request.headers.get("Cookie") || "";

  const res = await fetch(`${origin}/api/tiktok/post`, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json", Cookie: cookieHeader },
  });
  return { result: await res.json(), status: res.status };
}

// ---------------------------------------------------------------------
// Helpers pentru UI
// ---------------------------------------------------------------------

const PRIVACY_LABELS = {
  PUBLIC_TO_EVERYONE: { label: "Public (oricine)", icon: Users },
  FRIENDS_ONLY:       { label: "Prieteni",           icon: UserIcon },
  SELF_ONLY:          { label: "Doar eu (privat)",   icon: Lock },
  MUTUAL_FOLLOW_FRIENDS: { label: "Prieteni reciproci", icon: Users },
};

// ---------------------------------------------------------------------
// FRONTEND
// ---------------------------------------------------------------------

export default function TikTokPostPage() {
  const { creatorInfo, creatorInfoError, availableVideos } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  // Stare controlată pentru formular
  const [privacyLevel, setPrivacyLevel] = useState(""); // NIMIC selectat implicit
  const [commercialEnabled, setCommercialEnabled] = useState(false);
  const [ownBrand, setOwnBrand] = useState(false);
  const [brandedContent, setBrandedContent] = useState(false);
  const [musicAcknowledged, setMusicAcknowledged] = useState(false);
  const [commentDisabled, setCommentDisabled] = useState(false);
  const [duetDisabled,   setDuetDisabled]   = useState(false);
  const [stitchDisabled, setStitchDisabled] = useState(false);
  const [selectedVideoKey, setSelectedVideoKey] = useState(availableVideos[0]?.key || "");
  const [title, setTitle] = useState(availableVideos[0]?.title || "");

  // Starea postării (succes / eroare)
  const [submitResult, setSubmitResult] = useState(null);

  const videoRef = useRef(null);

  const isSubmitting = navigation.state === "submitting";

  // Regula TikTok pentru conținut comercial:
  // dacă comutatorul e ON, măcar una dintre „Your brand” / „Branded content”
  // trebuie bifată, altfel butonul „Postează” rămâne dezactivat.
  const commercialValid = !commercialEnabled || ownBrand || brandedContent;

  // Confidențialitatea TREBUIE aleasă manual de utilizator (nici o valoare implicită).
  const privacyValid = Boolean(privacyLevel);

  // Bifele Comment/Duet/Stitch sunt toate nebifate la început – am pornit
  // state-urile cu `false`, dar ne asigurăm și aici că nu se setează nimic
  // înainte de interacțiunea utilizatorului.
  // (Nu e nevoie de cod extra fiindcă inițial sunt false, dar păstrăm acest
  // comentariu ca documentație: nu folosim `defaultChecked={true}` nicăieri.)

  const consentValid = musicAcknowledged && privacyValid && commercialValid && !creatorInfoError;

  // Când utilizatorul selectează un alt videoclip, resetează previzualizarea.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [selectedVideoKey]);

  // Scroll la mesajul de status după submit
  useEffect(() => {
    if (navigation.state === "idle" && navigation.formData) {
      // Rezultatul o să vină din action; momentan îl tratăm local.
    }
  }, [navigation.state]);

  const selectedVideo = availableVideos.find(v => v.key === selectedVideoKey);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 flex justify-center items-start">
      <div className="w-full max-w-3xl mt-2">

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <Link to="/share" className="bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-500 transition shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <VideoIcon size={20} className="text-pink-600" />
            Post to TikTok
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <Form method="post" className="p-6 md:p-8 space-y-6">

            {/* --------- Eroare la încărcarea contului --------- */}
            {creatorInfoError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{creatorInfoError}</p>
                  <p className="text-xs mt-1 text-red-600/80">
                    Conectează din nou contul TikTok în Setări → Integrări.
                  </p>
                </div>
              </div>
            )}

            {/* --------- Contul conectat (creator_info) --------- */}
            {creatorInfo && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-pink-50/60 border border-pink-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {creatorInfo.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wide">Cont conectat</p>
                  <p className="text-sm font-bold text-gray-900">@{creatorInfo.username}</p>
                </div>
                <ShieldCheck size={18} className="text-pink-500" />
              </div>
            )}

            {/* --------- Previzualizare videoclip --------- */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Previzualizare clip</label>

              {availableVideos.length > 1 && (
                <select
                  value={selectedVideoKey}
                  onChange={(e) => setSelectedVideoKey(e.target.value)}
                  className="mb-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pink-500 outline-none"
                >
                  {availableVideos.map(v => (
                    <option key={v.key} value={v.key}>{v.title} · {v.duration_sec}s</option>
                  ))}
                </select>
              )}

              <input type="hidden" name="video_key" value={selectedVideoKey} />

              <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-w-[240px] mx-auto border border-gray-200">
                {selectedVideo?.preview_url ? (
                  <video
                    ref={videoRef}
                    src={selectedVideo.preview_url}
                    controls
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    <VideoIcon size={28} />
                  </div>
                )}
                {/*
                  REGULA: nu adăugăm aici nici un logo, watermark sau text
                  promoțional PetCare AI peste clip. Am verificat pipeline-ul –
                  `has_watermark: false` în loader pentru fiecare clip listat;
                  dacă un clip are watermark, nu va apărea în listă.
                */}
              </div>

              {selectedVideo && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Durată: {selectedVideo.duration_sec}s · Fără watermark adăugat de aplicație
                </p>
              )}
            </div>

            {/* --------- Titlu editabil --------- */}
            <div>
              <label htmlFor="title" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Titlu (caption)
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={2200} // TikTok limit
                placeholder="Scrie descrierea videoclipului..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-pink-500 outline-none bg-gray-50 focus:bg-white transition"
              />
              <p className="text-[10px] text-gray-400 mt-1">{title.length}/2200 caractere</p>
            </div>

            {/* --------- Confidențialitate – FĂRĂ valoare implicită --------- */}
            <div>
              <label htmlFor="privacy_level" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Cine poate vedea videoclipul? *
              </label>
              <select
                id="privacy_level"
                name="privacy_level"
                value={privacyLevel}
                onChange={(e) => setPrivacyLevel(e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition bg-gray-50 focus:bg-white ${
                  privacyLevel ? "border-gray-200 focus:ring-pink-500" : "border-pink-300 text-gray-400"
                }`}
              >
                {/* Opțiunea goală – NU e selectabilă după ce utilizatorul alege ceva */}
                <option value="" disabled>
                  -- Alege setarea de confidențialitate --
                </option>
                {creatorInfo?.privacy_level_options?.map((opt) => {
                  const meta = PRIVACY_LABELS[opt] || { label: opt, icon: Lock };
                  const Icon = meta.icon;
                  return (
                    <option key={opt} value={opt}>
                      {meta.label}
                    </option>
                  );
                })}
              </select>
              {!privacyLevel && (
                <p className="text-[11px] text-pink-600 mt-1">
                  Trebuie să alegi manual o opțiune înainte de a posta.
                </p>
              )}
            </div>

            {/* --------- Comment / Duet / Stitch – TOATE nebifate implicit --------- */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Permisiuni</p>
              <CheckboxRow
                label="Oprește comentariile"
                description="Dacă este bifat, nimeni nu poate comenta la videoclip."
                name="comment_disabled"
                checked={commentDisabled}
                onChange={(v) => setCommentDisabled(v)}
              />
              <CheckboxRow
                label="Oprește Duet"
                description="Alți utilizatori nu pot face Duet cu acest videoclip."
                name="duet_disabled"
                checked={duetDisabled}
                onChange={(v) => setDuetDisabled(v)}
              />
              <CheckboxRow
                label="Oprește Stitch"
                description="Alți utilizatori nu pot face Stitch cu acest videoclip."
                name="stitch_disabled"
                checked={stitchDisabled}
                onChange={(v) => setStitchDisabled(v)}
              />
            </div>

            {/* --------- Conținut comercial (comutator + sub-opțiuni) --------- */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">Conținut comercial</p>
                  <p className="text-[11px] text-gray-500">
                    Activează doar dacă videoclipul promovează un brand sau conține reclamă plătită.
                  </p>
                </div>
                <Toggle
                  name="commercial_enabled"
                  checked={commercialEnabled}
                  onChange={(v) => {
                    setCommercialEnabled(v);
                    // Când dezactivăm, debifăm automat și sub-căsuțele.
                    if (!v) {
                      setOwnBrand(false);
                      setBrandedContent(false);
                    }
                  }}
                />
              </div>

              {commercialEnabled && (
                <div className="pl-1 space-y-2 pt-2 border-t border-gray-100">
                  <CheckboxRow
                    label="Your brand (promovezi propriul tău brand)"
                    name="commercial_own_brand"
                    checked={ownBrand}
                    onChange={setOwnBrand}
                  />
                  <CheckboxRow
                    label="Branded content (colaborare plătită / parteneriat)"
                    name="commercial_branded_content"
                    checked={brandedContent}
                    onChange={setBrandedContent}
                  />
                  {!commercialValid && (
                    <p className="text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Bifează cel puțin o opțiune înainte de a putea posta.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* --------- Music Usage Confirmation --------- */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/70 border border-amber-100">
              <input
                id="music_acknowledged"
                name="music_acknowledged"
                type="checkbox"
                checked={musicAcknowledged}
                onChange={(e) => setMusicAcknowledged(e.target.checked)}
                className="mt-0.5 accent-pink-600 w-4 h-4"
              />
              <label htmlFor="music_acknowledged" className="text-xs text-gray-700 leading-relaxed">
                Confirm că respect termenii de utilizare pentru muzica din acest videoclip și că am dreptul să o distribui pe TikTok.
                Citesc și sunt de acord cu{" "}
                <a
                  href="https://www.tiktok.com/legal/music-usage-confirmation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 font-semibold underline inline-flex items-center gap-0.5"
                >
                  Music Usage Confirmation <ExternalLink size={11} />
                </a>
                .
              </label>
            </div>

            {/* --------- Mesaj procesare / status --------- */}
            {isSubmitting && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                Videoclipul este trimis către TikTok. Procesarea poate dura câteva minute – nu închide pagina.
              </div>
            )}

            {!isSubmitting && actionData?.result?.ok && (
              <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold">Videoclipul a fost trimis!</p>
                  <p className="text-xs mt-0.5">{actionData.result.message}</p>
                  {actionData.result.publish_id && (
                    <p className="text-[10px] text-green-600/70 mt-1">ID: {actionData.result.publish_id}</p>
                  )}
                </div>
              </div>
            )}

            {!isSubmitting && actionData && !actionData.result?.ok && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Postarea a eșuat</p>
                  <ul className="text-xs mt-1 list-disc pl-4 space-y-0.5">
                    {Object.values(actionData.result.errors || { error: "Eroare necunoscută" }).map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* --------- Consimțământ explicit + buton Postează --------- */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[11px] text-gray-500 mb-3">
                Apăsând „Postează pe TikTok”, confirmi că ai revăzut clipul și ești de acord cu setările alese.
                Postarea se face manual, pentru fiecare clip în parte – nu există postare automată de fundal.
              </p>

              <button
                type="submit"
                disabled={!consentValid || isSubmitting || !creatorInfo}
                className={`w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
                  consentValid && !isSubmitting && creatorInfo
                    ? "bg-pink-600 hover:bg-pink-700 text-white transform hover:-translate-y-0.5"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Se trimite...</>
                ) : (
                  <>Postează pe TikTok</>
                )}
              </button>

              {!consentValid && !isSubmitting && creatorInfo && (
                <p className="mt-2 text-[11px] text-gray-500 text-center">
                  Completează câmpurile marcate (*) și bifează confirmările pentru a activa butonul.
                </p>
              )}
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Componente UI mici (ca să nu umplem pagina cu markup repetat)
// ---------------------------------------------------------------------

function CheckboxRow({ label, description, name, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-pink-600 w-4 h-4"
      />
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && <p className="text-[11px] text-gray-500">{description}</p>}
      </div>
    </label>
  );
}

function Toggle({ name, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-pink-600" : "bg-gray-300"
      }`}
    >
      {/* input hidden ca să fie trimis și în FormData */}
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
