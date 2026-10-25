import { useEffect, useState } from "react";
import { Link, redirect } from "react-router";
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

/**
 * Pagina de callback OAuth – TikTok redirecționează aici cu `code` și `state`
 * după ce utilizatorul aprobă aplicația. Schimbă codul pe access_token și
 * marchează contul ca conectat. (Pentru demo avem varianta mock care reușește.)
 */
export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  const userIdMatch = cookieHeader?.match(/user_id=([^;]+)/);
  if (!userIdMatch) return redirect("/login");
  return {};
}

export default function TikTokCallbackPage() {
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    // Simulăm schimbarea codului pe token (demo)
    const timer = setTimeout(() => setStatus("success"), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 flex justify-center items-start">
      <div className="w-full max-w-2xl mt-8">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/settings" className="bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-500 transition shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Conectare cont TikTok</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {status === "loading" && (
            <div className="space-y-3">
              <Loader2 size={40} className="animate-spin text-pink-600 mx-auto" />
              <p className="text-gray-600">Finalizăm conectarea contului...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle2 size={56} className="text-green-500 mx-auto" />
              <h2 className="text-lg font-bold text-gray-900">Cont @baloo.gsd conectat cu succes!</h2>
              <p className="text-sm text-gray-600">Acum poți posta videoclipuri pe contul tău.</p>
              <Link
                to="/share/tiktok"
                className="inline-block mt-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md text-sm transition"
              >
                Mergi la pagina de postare
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <AlertCircle size={56} className="text-red-500 mx-auto" />
              <h2 className="text-lg font-bold text-red-700">Conectarea a eșuat</h2>
              <p className="text-sm text-gray-600">Încearcă din nou.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
