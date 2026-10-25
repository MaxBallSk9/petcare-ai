import { useLoaderData, Form, useNavigation, Link, redirect } from "react-router";
import { ArrowLeft, User, Mail, Bell, LogOut, Save, Shield } from "lucide-react";
import sql from "../api/utils/sql";

// --- BACKEND ---
export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  const userIdMatch = cookieHeader?.match(/user_id=([^;]+)/);
  const userId = userIdMatch ? userIdMatch[1] : null;

  if (!userId) return redirect("/login");

  const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
  if (users.length === 0) return redirect("/login");

  return { user: users[0] };
}

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    return redirect("/login", {
      headers: { "Set-Cookie": "user_id=; Path=/; HttpOnly; Max-Age=0" },
    });
  }

  if (intent === "update_profile") {
    const name = formData.get("name");
    const email = formData.get("email");
    const cookieHeader = request.headers.get("Cookie");
    const userId = cookieHeader?.match(/user_id=([^;]+)/)[1];

    await sql`UPDATE users SET name = ${name}, email = ${email} WHERE id = ${userId}`;
    return null;
  }
}

// --- FRONTEND COMPACT ---
export default function SettingsPage() {
  const { user } = useLoaderData();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting" && navigation.formData?.get("intent") === "update_profile";

  return (
    <div className="min-h-screen bg-green-50/50 p-4 font-sans text-gray-800 flex justify-center items-start">
      <div className="w-full max-w-3xl mt-2">
        
        {/* Header Compact */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-500 transition shadow-sm">
                <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
          
          <Form method="post">
             <input type="hidden" name="intent" value="logout" />
             <button className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-bold text-xs border border-transparent hover:border-red-100">
                <LogOut size={14} /> Log Out
             </button>
          </Form>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
                
                {/* STÂNGA: Sidebar Info (Compact) */}
                <div className="bg-green-50/50 p-6 md:border-r border-green-100 text-center md:text-left">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto md:mx-0 mb-3 flex items-center justify-center text-green-600 border border-green-200 shadow-sm">
                        <User size={28} />
                    </div>
                    <h2 className="font-bold text-gray-900">{user.name}</h2>
                    <p className="text-xs text-gray-500 mb-4 truncate">{user.email}</p>
                    
                    <div className="inline-block bg-white px-3 py-1 rounded-full border border-green-200 shadow-sm">
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                            {user.plan || "Free Plan"}
                        </p>
                    </div>

                    <div className="mt-6 space-y-2 hidden md:block">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Quick Links</p>
                        <Link to="/privacy" className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-green-600 transition">
                            <Shield size={12} /> Privacy Policy
                        </Link>
                        <Link to="/settings/tiktok-connect" className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-pink-600 transition">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
                            Conectare TikTok
                        </Link>
                    </div>
                </div>

                {/* DREAPTA: Formular Editare (Compact) */}
                <div className="col-span-2 p-6 md:p-8">
                    <Form method="post" className="space-y-4">
                        <input type="hidden" name="intent" value="update_profile" />
                        
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                defaultValue={user.name} 
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email</label>
                            <input 
                                type="email" 
                                name="email" 
                                defaultValue={user.email} 
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition"
                            />
                        </div>

                        {/* Notifications Toggles (Visual) */}
                        <div className="pt-2">
                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Notifications</label>
                             <div className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg mb-2">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold text-gray-700">Email Alerts</span>
                                </div>
                                <input type="checkbox" className="accent-green-600 w-4 h-4" defaultChecked />
                             </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow-md text-xs flex items-center gap-2 transition transform hover:-translate-y-0.5"
                            >
                                {isSaving ? "Saving..." : <><Save size={14} /> Save Changes</>}
                            </button>
                        </div>
                    </Form>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}