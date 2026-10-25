# TikTok Direct Post – Reguli de UI conform ghidului TikTok

Acest document rezumă regulile pe care pagina `/share/tiktok` trebuie să le respecte
pentru a fi aprobată la review-ul TikTok Direct Post. Păstrăm lista aici ca să nu
pierdem nimic când schimbăm ceva.

## Checklist reguli obligatorii

- [x] **Interfață cu utilizatorul în față** – nu există nici un script/endpoint
      care postează „cap-less” în fundal. Butonul „Postează pe TikTok” trebuie apăsat
      manual pentru fiecare clip în parte.
- [x] **Nickname-ul contului** este afișat în pagină, luat din `creator_info` la
      fiecare vizită (nu din cache). Vezi `GET /api/tiktok/creator-info`.
- [x] **Titlu editabil** (max 2200 caractere, limita TikTok).
- [x] **Meniul de confidențialitate FĂRĂ valoare implicită**:
      - opțiunile vin din `creator_info.privacy_level_options` (doar cele permise de TikTok
        pentru contul respectiv apar în dropdown);
      - utilizatorul trebuie să aleagă manual una dintre ele înainte de a posta;
      - butonul rămâne dezactivat până când o opțiune e selectată.
- [x] **Comment / Duet / Stitch** – toate trei încep nebifate, iar bifarea lor
      înseamnă „oprește [acțiunea]” (cum cere API-ul TikTok).
- [x] **Comutator conținut comercial** – oprit la pornire:
      - dacă e ON, afișează două sub-bife: „Your brand” și „Branded content”;
      - dacă e ON și niciuna dintre sub-bife nu e bifată, butonul de postare este
        dezactivat și apare un mesaj de avertisment;
      - dacă e OFF, sub-bifele se debifează automat și nu se trimite nimic în
        `branded_content_type` către TikTok.
- [x] **Music Usage Confirmation** – checkbox nebifat implicit, cu link către
      pagina oficială TikTok, plasat imediat înainte de butonul de postare.
- [x] **Previzualizare clip** – tag `<video>` cu controale, raport 9:16,
      fără watermark sau text promoțional adăugat de noi.
- [x] **Mesaj de procesare** – când utilizatorul apasă Postează și cererea e
      în zbor, afișează textul: „Procesarea poate dura câteva minute”.
- [x] **Status după submit** – fie verde cu `publish_id`, fie roșu cu erori.

## Regula watermark-ului (foarte importantă)

**Nu adăugăm NICIODATĂ** logo PetCare AI, URL, „generat de...”, CTA sau alte
elemente grafice peste clipurile trimise către TikTok. Verificarea se face în
două locuri:

1.  `src/app/share/tiktok/page.jsx` – loader-ul marchează fiecare videoclip cu
    `has_watermark: false`; un clip care are apă este filtrat și nu apare în
    lista de opțiuni.
2.  Pipeline-ul de generare (MoneyPrinterTurbo/config) trebuie să aibă
    `watermark.enabled = false` și `intro/outro_logo = disabled`. Nu setăm
    `overlay_text` cu text promoțional.

## Validare dublă (client + server)

- Pe client: butonul rămâne dezactivat până când toate regulile sunt
  îndeplinite (confidențialitate selectată, comercial bifat corect, music
  acknowledged, etc.).
- Pe server: `POST /api/tiktok/post` reface aceleași validări înainte de a
  chema API-ul TikTok, ca să nu existe cale de a ocoli regulile prin request
  manual.

## Endpoint-uri

| Method | Path                         | Rol |
|--------|------------------------------|-----|
| GET    | `/api/tiktok/creator-info`   | Proxy către `/v2/post/publish/creator_info/query/` |
| POST   | `/api/tiktok/post`           | Proxy către `/v2/post/publish/video/init/`         |
| GET    | `/api/tiktok/status/:id`     | (todo) Proxy către `/v2/post/publish/status/fetch/` |
