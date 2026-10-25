import { Link, redirect } from "react-router";
import { ArrowLeft, ExternalLink, CheckCircle2, Video, Lock } from "lucide-react";

/**
 * Pasul 1 din demo: Pagina de conectare cont TikTok
 * (Click pe buton duce la TikTok OAuth authorization page)
 */
export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  const userIdMatch = cookieHeader?.match(/user_id=([^;]+)/);
  if (!userIdMatch) return redirect("/login");
  return {};
}

// Înlocuiește astea cu valorile reale din TikTok Developer Portal
const TIKTOK_CLIENT_KEY = "7677896574508419092"; // App ID din pasul 2
const TIKTOK_REDIRECT_URI = typeof window !== "undefined"
  ? `${window.location.origin}/settings/tiktok-callback`
  : "/settings/tiktok-callback";
const TIKTOK_SCOPES = [
  "video.upload",
  "video.publish",
  "user.info.basic",
].join(",");

function getAuthUrl() {
  const state = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);
  sessionStorage.setItem("tiktok_oauth_state", state);
  return `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&scope=${encodeURIComponent(TIKTOK_SCOPES)}&response_type=code&redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}&state=${state}`;
}

export default function TikTokConnectPage() {
  const handleConnect = () => {
    window.location.href = getAuthUrl();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 flex justify-center items-start">
      <div className="w-full max-w-3xl mt-2">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/settings" className="bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-500 transition shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Video size={20} className="text-pink-600" />
            Conectare cont TikTok
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">

          <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-100">
            <h2 className="font-bold text-gray-900 mb-1">Conectează contul tău oficial de brand</h2>
            <p className="text-sm text-gray-600">
              Această integrare postează DOAR pe contul @baloo.gsd deținut și operat de PetAssistant.
              Nu postăm în numele unor terțe părți. Toate acțiunile necesită aprobarea ta explicită în pagină.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Ce permisiuni acordăm aplicației:</h3>
            <div className="space-y-2">
              <PermissionRow text="Vizualizează informațiile de bază ale contului (nickname, ID cont)" />
              <PermissionRow text="Încarcă și publică videoclipuri pe contul tău, DOAR după ce apeși manual „Postează”" />
              <PermissionRow text="Verifică statusul postării" />
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <Lock size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">
              Conectarea se face prin OAuth 2.0 standard pe serverele TikTok – noi nu primim și nu stocăm parola contului tău.
              Accesul poate fi revocat oricând din setările contului TikTok.
            </p>
          </div>

          <button
            onClick={handleConnect}
            className="w-full py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition transform hover:-translate-y-0.5"
          >
            Conectează cont @baloo.gsd pe TikTok
            <ExternalLink size={14} />
          </button>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Câmpuri pe care le salvăm în baza noastră de date:</h4>
            <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
              <li><code>access_token</code> / <code>refresh_token</code> – pentru autentificare API (criptate)</li>
              <li><code>open_id</code> – identificatorul unic al contului conectat</li>
              <li><code>username</code> / <code>avatar_url</code> – pentru afișarea contului în UI</li>
              <li><code>privacy_level_options</code> – opțiunile de confidențialitate permise pentru cont</li>
              <li><code>publish_id</code> – ID-ul fiecărei postări pentru verificarea statusului</li>
              <li>Metadate locale: titlul introdus, setările de confidențialitate alese de tine pentru fiecare clip</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

function PermissionRow({ text }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-700">
      <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
