import { redirect } from "react-router";

/**
 * Rută DEMO doar pentru înregistrarea ecranului la auditul TikTok.
 * Setează un cookie de sesiune fals, fără bază de date, ca să poți accesa
 * /share/tiktok fără să te loghezi. Nu o folosi în producție!
 */
export async function loader({ request }) {
  return redirect("/share/tiktok", {
    headers: {
      "Set-Cookie": `user_id=demo-user-001; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`,
    },
  });
}
