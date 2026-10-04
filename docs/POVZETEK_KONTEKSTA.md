# PODROBEN KONTEKST – spletna stran BLK Remodelling

Stanje: 2026-09-30. Namen: ko odpreš nov terminal (Claude Code), prilepi to datoteko ali reci
»preberi C:\Users\Kugler\Desktop\BLK_Remodelling_website\POVZETEK_KONTEKSTA.md«. Claude bo potem vedel vse,
kar sva do zdaj naredila, zakaj, kako je zgrajeno in kaj je odprto.
(Krajša angleška predaja je tudi v `CLAUDE.md` v isti mapi; ta se naloži sama, če terminal odpreš v mapi projekta.)

---

## 1. Podjetje, cilj strani, vizija

- **BLK Remodelling**, Ras Al Khaimah (RAK), Združeni arabski emirati. Družinsko podjetje (upravljanje stanovanj ter opremljanje in obnova).
- Stran prodaja **4 pakete**:
  1. **Pure Furnishing** – opremijo prazno stanovanje (stanovanja se kupijo popolnoma prazna).
  2. **Basic Airbnb** – pohištvo + gospodinjski aparati.
  3. **Complete Airbnb** – vse do jedilnega pribora, posteljnine, brisač, toaletnega papirja; lastnik lahko takoj oddaja.
  4. **Complete Renovation** – rušenje in preureditev (večja spalnica, nove/odstranjene stene, sprememba namena prostora).
     **Najbolj donosen paket – stran mora čim več strank usmeriti sem.**
- Glavni cilj strani: stranka takoj razume, kaj podjetje ponuja, in **rezervira termin** (CTA-ji so WhatsApp povezave;
  številka `971500000000` je **placeholder**, prava še manjka).
- **Izvirna vizija uporabnika (prvi prompt):** na hero strani scroll učinek – najprej popolnoma prazna soba, med scrollanjem
  se v ISTO sobo »odpre« pohištvo, ob strani se pokaže kratek opis in gumb za stran paketa; nato aparati (paket 2), nato
  paket 3 in 4. Slika naj bo **čez cel zaslon**, občutek **editorial / premium**. Studio stanovanje, spremembe med paketi morajo biti vidne.
- `BRIEF.md` v mapi je IZVIRNI brief iz prejšnjega sessiona (2026-09-24). Takrat ni bilo videov, zato je stran imela 4 ločene
  prizore (2 pravi fotografiji + seznam ikon + SVG tloris). **Ta dokument ga nadomesti, kjer se razlikujeta.**

---

## 2. Kronologija (kaj se je zgodilo, po vrsti)

### Prejšnji session (2026-09-24, kontekst je bil izgubljen)
- Zgrajena prva verzija s skillom `nateherk-design:scroll-craft`: 4 pinned akti (paket 1 prazna soba – prava fotka,
  paket 2 opremljena soba – prava fotka drugega stanovanja, paket 3 brez fotke – seznam ikon, paket 4 SVG tloris, ki se
  sam nariše in premakne steno), sekcija About (portret ženske na stolu, rjava podlaga), noga s socialnimi ikonami.
- Mapa `lab/` je polna posnetkov zaslona iz takratnih testov.

### Ta session (2026-09-26 do 2026-09-30)
1. **Rekonstrukcija konteksta** iz datotek (ni bilo spomina). Uporabnik je prilepil svoj prvi prompt; primerjala sva vizijo
   (ena soba, ki se spreminja) s takratnim stanjem (4 ločeni prizori – kompromis, ker sta bili fotki iz dveh različnih stanovanj).
2. **Ideja z videi:** uporabnik je pokazal `C:\Users\Kugler\Desktop\apartment.mp4` (posnetek zaslona AI videa, 584×434, z UI gumbi).
   Priporočil sem: izvozi originale (ne posnetke zaslona), vsaj 1920×1080, zadnja sličica klipa = prva sličica naslednjega,
   najprej naredi statične slike stanj in nato video med njimi (start/end frame), kamera pri miru; na strani video pretvorim
   v zaporedje sličic na canvasu (ne `<video>`, ker iskanje po videu med scrollom zatika).
3. **Dnevna soba vs. kuhinja/kopalnica na heroju:** priporočil sem, da hero ostane ena soba (neprekinjenost je glavni učinek),
   kuhinja in kopalnica pa kot majhni predogledi; celotne galerije na podstraneh paketov.
4. **Paket 1 – nova slika in predogledi** (slike iz `C:\Users\Kugler\Desktop\FURNISHING\`):
   - hero: `ChatGPT Image 25. sep. 2026, 09_44_16.png` (spalnica, postelja + fotelj, pogled na morje),
   - drugi kot / jedilnica: `09_44_32.png`, kuhinja: `10_31_57.png`, kopalnica: `10_28_16.png` (kuhinja in kopalnica sta prave telefonske fotke,
     pokončne, kopalnica izgleda poceni – opozoril sem).
   - Iteracije: sličice v kartici → spodaj desno navpično → klik zamenja hero sliko → **dokončno: klik samo odpre sliko v lightboxu**
     (`<dialog>`, zapre se s klikom, gumbom »Close ×« ali Esc). Sličica »Bedroom« je bila odstranjena.
   - »Bolj oddaljeno«: slika se začne pod navigacijsko vrstico (top 4.75rem) namesto za njo; parallax odstranjen. Bolj oddaljeno
     od tega ne gre brez širše slike.
5. **Besedilna kartica (več iteracij):** neprozornost 90 % → 55 % → 28 % → 10 % → 25 % → okvir odstranjen (tekst direktno na sliki,
   paket 2 je postal neberljiv) → mehak okrogel »glow« → **končno: pravokoten, večji, mehko obrobljen frosted glow**.
   Tekst manjši (naslov, opis, oznaka, gumb). Sličice manjše in bolj »luksuzne« (5.75rem, rahlo prozorne, hover polno).
6. **Prvi Kling video** (`Downloads\empty_room_furnishing_transfor_52805_Kling_25_Turbo_Pro.mp4`, prazna soba → postelja + fotelj):
   - uporabnik je prilepil podroben spec za scroll sekcijo (400vh, sticky canvas, glajenje 0.14, auto-complete po 140 ms,
     easeInOutCubic, 2200 ms/sekcijo, napisi »Empty shell / Furnishing / Move-in ready«, progress bar, lazy loading, decode(),
     DPR max 2, reduced motion) → zgrajeno kot ločena sekcija pred paketom 1 (datoteki `scroll-sequence.css/.js`).
   - Nato: **»zamenjaj prvo hero sliko s tem videom in naj se začne ob nalaganju strani«** → autoplay način; ločena sekcija odstranjena.
   - »Naj se začne hitreje«: zamik 500 → 150 ms, začne se, ko je naloženih prvih 40 sličic (ne vseh).
7. **Telefon:** posnetki zaslona v `lab/phone-preview/`; LAN naslov za telefon. Ugotovitev: širok video se na telefonu obreže na sredino
   (okno in morje izgineta) → potrebne bodo **navpične 9:16 verzije**.
8. **Vprašanja o generiranju (Kling):**
   - 1080p je dovolj za PC in telefon; 4K je na strani pretežak (sličice ~4× večje) in pogosto le upscale.
   - **Kling O3 vs 3.0 Turbo** (spletno iskanje): O3 za finalne (boljša doslednost referenc), Turbo za poceni teste; oba podpirata start/end frame.
   - Krediti: 4K = 2.500 kreditov/video, uporabnik ima 16.500; 8 × 4K = 20.000 → ne gre; priporočilo: vse v 1080p, rezerva za ponovitve.
   - Razmerje za PC: **16:9**, 1920×1080; pomembne stvari ne čisto na zgornji/spodnji rob (različni zasloni obrežejo drugače).
9. **Drugi video – prehod paket 1 → 2** (`Downloads\empty_room_furnishing_transfor_52934_Kling_O3.mp4`: posteljnina, blazine, zavese,
   nočne lučke, stoječa luč, slika na steni). Zgrajena **veriga klipov na enem sticky canvasu** za paketoma 1 in 2 (glej §4).
   Paket 1 skrajšan s 2.6 na 2 zaslona. Stara fotka paketa 2 (drugo stanovanje) ni več v uporabi.
10. **Kakovost (prvič):** »zamegljeno«. Popravki: canvas `imageSmoothingQuality = 'high'`, izvorna ločljivost brez upscala,
    WebP q78 → q82 + rahlo ostrenje (unsharp). Velikost klipa 1: 6.2 → 8.5 MB, klipa 2: 7.4 → 10.2 MB.
11. **Tretji video – prehod paket 2 → 3** (`Desktop\bedroom_makeover_transformatio_02847_Kling_O3.mp4`: zelena stena, lesen pod,
    usnjen fotelj, zelena odeja, brisače, vzorčaste blazine, slike rastlin). Paket 3 premaknjen v isto sobo (odstranjen bež gradient + mreža),
    dobil frosted glow. Paket 2 skrajšan s 2.6 na 2 zaslona. Klip 3 = 12.3 MB.
12. **Scroll assist (»assisted scroll«):**
    - v1: po ustavitvi scrolla (140 ms) samodejno dokonča do naslednjega paketa → uporabnik: 1–2 s zamika.
      Vzrok: trackpad/telefon še 1–2 s pošilja inercijo, ki je resetirala časovnik in prekinjala drsenje.
    - v2 (trenutno): **sproži se ob PRVEM premiku** (kolesce/swipe) med paketi, inercijo ignorira; reakcija 16–40 ms.
    - Trajanje drsenja: 0.85 s → 2 s → **3 s** (uporabnik je hotel, da se spremembe v sobi res vidijo). Krivulja `easeGlide`.
13. **Kakovost (drugič):** »na strani izgleda slabše kot .mp4«. Meritve: sličice ≈ izvirnik (SSIM 0.971, barve ±1/255),
    zaslon uporabnika 1920×1080 pri 125 % → prikaz ~1:1, ni raztezanja. Verjetni vzrok: gonilnik Intel / predvajalnik izboljšuje
    video (ostrina, kontrast), slik na strani pa ne; mirujoča sličica vs. gibanje; glow čez del slike.
    Narejena primerjalna stran `lab/compare.html`. Testiran **AVIF**: boljša kakovost IN manjše datoteke (glej §8).
14. Zapisana predaja `CLAUDE.md` (angleško), spominska opomba za Claude, in ta dokument.

---

## 3. Datoteke v projektu (`C:\Users\Kugler\Desktop\BLK_Remodelling_website\`)

| Pot | Vsebina / namen |
|---|---|
| `index.html` | Cela stran. Inline `<style>` (vsa CSS specifika strani), na dnu inline skripte: označevanje paketa v navigaciji (IntersectionObserver na `main section[id]`) in lightbox za sličice sob. |
| `scrollcraft.css`, `scrollcraft.js` | Scroll engine iz skilla. Pinned akt: `<section data-sc-act="pin" data-sc-span="N">` postane N×100vh visok, prvi `[data-sc-stage]` je sticky. Ureja še `data-sc-in` (pojavljanje), `data-sc-drift` (barva strani). Ne spreminjaj brez potrebe. **Pozor:** `scrollcraft.css` nastavi `html { scroll-behavior: smooth }` → programski scroll mora uporabljati `behavior: 'instant'`. |
| `scroll-sequence.css` | Stili za predvajalnik (`.seq`, `.seq__canvas`, napis, progress bar). Na strani se trenutno uporablja samo `.seq__canvas`. |
| `scroll-sequence.js` | **Naš predvajalnik zaporedij slik** (brez knjižnic). Trije načini: `data-seq` (ločena scroll sekcija z auto-complete, napisi, progress barom – trenutno ne v uporabi, a deluje), `data-seq-mode="autoplay"` (ne v uporabi), **`data-seq-chain`** (v uporabi) + scroll assist. |
| `assets/frames/room/0001–0122.webp` | Klip 1 (8.47 MB). Prazna soba → postelja + fotelj. Predvaja se ob nalaganju. |
| `assets/frames/room2/0001–0121.webp` | Klip 2 (10.16 MB). Paket 1 → 2. |
| `assets/frames/room3/0001–0121.webp` | Klip 3 (12.29 MB). Paket 2 → 3. |
| `assets/01-furnishing-dining.webp`, `-kitchen`, `-bathroom` (+ `-thumb.webp`) | Sličice sob paketa 1 (thumb 360 px širine) in velike verzije za lightbox. |
| `assets/05-about.webp` | Portret v sekciji About (verjetno placeholder). |
| `assets/01-furnishing-bed.webp`, `01-empty.webp`, `02-furnished.webp` | **Ne uporablja se več.** Uporabnik jih je želel obdržati; lahko se zbrišejo. |
| `lab/` | Posnetki testov (mnogo map), `lab/compare.html` + `lab/compare-room3.mp4` (A/B primerjava), `lab/phone-preview/`, `lab/chain1`, `lab/chain3` … Ni del strani. |
| `BRIEF.md` | Stari brief (glej §1). |
| `CLAUDE.md` | Angleška predaja (samodejno se naloži v Claude Code v tej mapi). |
| `POVZETEK_KONTEKSTA.md` | Ta dokument. |
| `package.json`, `node_modules/` | Samo `playwright-core` (za avtomatske teste in posnetke zaslona). |
| `serve.log`, `serve.err.log` | Izpis lokalnega strežnika. |

**Izvorni videi (zunaj projekta):**
- Klip 1: `C:\Users\Kugler\Downloads\empty_room_furnishing_transfor_52805_Kling_25_Turbo_Pro.mp4` – 1904×1088, 24 fps, 122 sličic, ~21 Mbit/s.
- Klip 2: `C:\Users\Kugler\Downloads\empty_room_furnishing_transfor_52934_Kling_O3.mp4` – 1900×1088, 24 fps, 121 sličic, ~12 Mbit/s (ima tudi zvok, ki ga ne uporabljamo).
- Klip 3: `C:\Users\Kugler\Desktop\bedroom_makeover_transformatio_02847_Kling_O3.mp4` – 1904×1088, 24 fps, 121 sličic, ~15 Mbit/s.
- Stari testni: `C:\Users\Kugler\Desktop\apartment.mp4` (posnetek zaslona, ni uporaben).
- Slike paketa 1: `C:\Users\Kugler\Desktop\FURNISHING\`.

---

## 4. Kako stran deluje (arhitektura)

### Struktura strani (od zgoraj navzdol)
1. `header.site-bar` (fiksen, ~4.75rem visok, prosojen z blurom): logo »BLK·REMODELLING«, navigacija paketov (`.pf-rail`,
   pike Furnishing / Basic Airbnb / Complete Airbnb / Renovation, aktivna se obarva), gumb »Book a Visit« (WhatsApp).
2. `<main id="top">`
   - `<div class="pf-room-track">` – **ena soba za paketi 1–3**:
     - `.pf-room-layer` (sticky, 100svh, `margin-bottom: -100svh`, z-index 0, `pointer-events: none`) z `data-seq-chain`,
       v njem `img.pf-room-layer__poster` (sličica 0001 kot rezerva) in `canvas.seq__canvas`. Canvas in poster se začneta pod navigacijo (top 4.75rem).
     - `section#pkg-1` (span **2**): prozoren oder, sličice sob `.pf-rooms` (spodaj desno), kartica `.pf-photo-card` levo:
       »Package 01 · Pure Furnishing« / **EVERY RENOVATION STARTS EMPTY.** / »Buy the shell. We furnish it end to end…« / gumb »Ask about Furnishing«.
     - `section#pkg-2` (span **2**): kartica desno (`sc-copy--trail`): **FURNISHED. FITTED. FUNCTIONING.**, ikone Fridge/Washer/TV/AC, »Ask about Basic Airbnb«.
     - `section#pkg-3` (span **2.6**): kartica levo: **MOVE-IN IS DAY ONE OF BOOKINGS.**, ikone Linens/Kitchenware/Toiletries/Turnkey, »Ask about Complete Airbnb«.
   - `section#pkg-4` (span **4**, še stara zasnova): **WE DON'T DECORATE. WE REBUILD.**, SVG tloris, ki se nariše in premakne steno,
     kartica »A studio, mid-renovation · site photo coming soon«, gumb »Book the renovation consult«, spodaj »BLK Remodelling · Ras Al Khaimah, UAE« in WhatsApp (placeholder).
   - `section.pf-about#about`: portret čez cel zaslon, rjav prehod.
3. `footer.pf-site-foot`: logo, socialne ikone, © 2026.

### Barve in pisave
`--sc-canvas #DCD5C6`, `--sc-surface #D0C8B8`, `--sc-ink #27231D`, `--sc-ink-soft #6E6555`, `--sc-accent #63512F`,
`--pf-floor #462C24` (About/noga). Pisavi: **Archivo** (naslovi, 800, velike črke) in **Geist** (besedilo), Google Fonts.

### Veriga klipov (`data-seq-chain` v `index.html`)
```json
[
  {"path":"assets/frames/room/",  "count":122, "play":"load",   "fps":24, "delay":150, "buffer":40},
  {"path":"assets/frames/room2/", "count":121, "play":"scroll", "from":"#pkg-1", "to":"#pkg-2", "blend":8},
  {"path":"assets/frames/room3/", "count":121, "play":"scroll", "from":"#pkg-2", "to":"#pkg-3", "blend":8}
]
```
- `play:"load"`: predvaja enkrat ob nalaganju pri 24 fps, po 150 ms, ko je dekodiranih prvih 40 sličic (najdlje čaka 4 s).
  Pri reduced motion takoj pokaže zadnjo sličico.
- `play:"scroll"`: napredek 0, ko je vrh `from` na vrhu zaslona, 1, ko je vrh `to`. Prikazan je zadnji scroll klip, ki je začel (p > 0), sicer klip 1.
- `blend:8`: prvih 8 sličic se prelije čez zadnjo sličico prejšnjega klipa (skrije majhen zamik med AI klipi).
- Nalaganje: najprej klip 1, šele ko je ves naložen (ali po 4 s), klipa 2 in 3. Vse sličice gredo skozi `img.decode()`.
- Risanje: »cover«, DPR max 2, `imageSmoothingQuality = 'high'`, riše le ob spremembi (ključ klip:sličica:alfa); če sličica še ni naložena, ostane prejšnja.
- Glajenje: pri kolescu 0.14 na frame; med samodejnim drsenjem ali vlečenjem s prstom 0.5 (soba ne zaostaja).

### Scroll assist (v `scroll-sequence.js`, razdelek »scroll assist«)
- **Cona:** od vrha paketa 1 do vrha paketa 3 (sidra = vrhovi paketov iz verige). Zunaj cone (paket 4 in naprej) je navaden scroll.
- **Kolesce / trackpad:** `wheel` poslušalec z `passive:false`. Prvi dogodek v coni → `preventDefault` + drsenje na naslednje (dol) ali prejšnje (gor) sidro.
  Med drsenjem se kolesce požira; po pristanku `wheelLock` požira inercijo, dokler ne pride nova gesta
  (220 ms tišine ALI `lastMag < 30 && mag > lastMag*1.6 + 4`). Ena gesta = en paket, nikoli dva. Ctrl+kolesce (zoom) se ne dotika.
- **Na paketu 3 navzdol** → zapusti cono, navaden scroll. **Iz paketa 4 navzgor** → navaden scroll, dokler ne prideš v cono.
- **Dotik:** ob prvem premiku se odloči (iOS zahteva preventDefault že na prvem touchmove): v coni prst vleče stran 1:1 (animacija sledi),
  ob spustu drsenje v smeri swipa za en paket; premik < 24 px → vrne nazaj. Zunaj cone ali z dvema prstoma → naravno.
- **Tipkovnica / drsnik:** po 140 ms mirovanja med dvema paketoma dokonča v zadnji smeri. `keydown` in `mousedown` prekineta drsenje.
- **Trajanje:** `ASSIST_MS_PER_SECTION = 3000`, `ASSIST_MIN_MS = 800`, `ASSIST_MAX_MS = 3000` (poln prehod = 3 s).
- **Krivulja `easeGlide`:** 35 % easeOutQuad + 65 % easeInOutSine (takoj se premakne, enakomerna sredina, mehak pristanek).
- Izklopljeno pri `prefers-reduced-motion`; izklop tudi z `data-seq-assist="off"` na `.pf-room-layer`.
- Programski scroll: `window.scrollTo({top, behavior:'instant'})` (zaradi `scroll-behavior: smooth`).

### Frosted glow za besedilom (CSS v `index.html`)
- `.pf-photo-card`: `max-width: 23rem`, `isolation: isolate`.
- `.pf-photo-card::before`: `inset: -3.5rem -4.5rem`, ozadje 82 % `--sc-canvas`, `backdrop-filter: blur(24px) saturate(1.05)`,
  maska: dva linearna prehoda (`--feather: 2.75rem`) s `mask-composite: intersect` → pravokotnik z mehkimi robovi.
- Tekst: naslov `clamp(1.5rem, 0.9rem + 1.6vw, 2.25rem)`, opis `--sc-t-sm` (line-height 1.5), oznaka 0.68rem, gumb 0.7rem.

### Sličice sob (paket 1)
- `.pf-rooms` absolutno spodaj desno (desktop), zgoraj desno pod navigacijo (telefon ≤700 px). Gumbi 5.75rem (telefon 4rem), 3:2, opacity 0.72 → 1 na hover.
- Klik odpre `<dialog class="pf-lightbox">` z veliko sliko in napisom.

---

## 5. Proces: nov Kling video → stran

**Generiranje (uporabnik v Klingu):**
1. Začetna sličica = končno stanje prejšnjega klipa (ista soba, isti kot kamere). Končna = stanje naslednjega paketa.
2. Kamera pri miru. 16:9, 1080p (za PC). Za telefon kasneje 9:16, 1080×1920, spodnjih ~40 % mirnih (tam je tekst).
3. **Kling O3** za finalne, **Kling 3.0 Turbo** za poceni testiranje promptov. Prenesi originalni .mp4 v najvišji kakovosti.

**Vgradnja (Claude):**
```powershell
$d = "C:\Users\Kugler\Desktop\BLK_Remodelling_website\assets\frames\roomN"
New-Item -ItemType Directory -Force $d
ffmpeg -i "<klip>.mp4" -an -vf "unsharp=5:5:0.55:5:5:0" -c:v libwebp -quality 82 -compression_level 6 "$d\%04d.webp"
```
1. Preveri šiv: zadnja sličica prejšnjega klipa vs. prva novega (ffmpeg `-sseof -0.05` + `hstack`).
2. Dodaj klip v `data-seq-chain` (`"play":"scroll","from":"#pkg-N","to":"#pkg-N+1","blend":8`).
3. Premakni naslednji `<section>` v `.pf-room-track` (pred `</div><!-- /.pf-room-track -->`), odstrani njegov poster/ozadje,
   kartici dodaj `pf-photo-card` in notranji `<div data-sc-in>`, dodaj `aria-label` z opisom sobe, nastavi `data-sc-span` (2 za enak tempo).
4. Posodobi komentar nad verigo in to dokumentacijo.
5. Test: prehod naprej/nazaj, scroll assist, telefon, brez napak v konzoli.

---

## 6. Zagon in testiranje

- **Strežnik** (iz mape projekta):
  `node "C:\Users\Kugler\.claude\plugins\cache\nateherk\nateherk-design\0.3.0\skills\scroll-craft\scripts\serve.mjs" .`
  → http://localhost:4500 · telefon v istem Wi-Fi: **http://192.168.68.69:4500** (če ne dela: Windows požarni zid – dovoli Node.js v zasebnih omrežjih).
  Alternativi: `npx serve .` ali `python -m http.server 8000`.
- **Posnetki zaslona:** `shoot.mjs` v isti mapi skripte (`--url http://localhost:4500 --out lab/x --steps 3 --width 390 --height 844`).
- **Playwright testi:** `require("C:/Users/Kugler/Desktop/BLK_Remodelling_website/node_modules/playwright-core")`,
  Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe` (ali Edge). Stanje verige: `document.querySelector("[data-seq-chain]").__seq`
  (`.clips[i].p`, `.activeIndex()`, `.auto`, `.lastKey`). Dotik: CDP `Input.dispatchTouchEvent` (`synthesizeScrollGesture` v headless ne scrolla).
  Testne skripte so bile v začasni mapi (scratchpad) in jih ni več – po potrebi jih napiši znova.
- **Reduced motion v Chromu:** DevTools → Rendering → »Emulate CSS prefers-reduced-motion«.
- **Zaslon uporabnika:** 1920×1080, Windows skaliranje 125 % (CSS viewport 1536×864, DPR 1.25), grafika Intel Iris Xe.

---

## 7. Odločitve (potrjene s strani uporabnika)

- Soba je en neprekinjen prostor iz Kling videov (ne več ločene fotografije).
- Hero paketa 1: animacija se začne sama ob nalaganju; prehodi med paketi se odvijejo s scrollom.
- Kuhinja/jedilnica/kopalnica samo kot majhne sličice spodaj desno, klik jih odpre (ne zamenja hero slike).
- Tekst brez okvirja, s pravokotnim mehkim frosted glowom.
- Scroll assist: sproži se takoj ob prvem premiku, drsenje traja 3 s.
- Za finalne videe Kling O3; vsi videi v 1080p (4K preveč kreditov in pretežko).

## 7b. Gladkost in kakovost – popravki 2026-09-30

- **Zatikanje:** vzrok je bil, da je Chrome vsako WebP sličico dekodiral šele ob risanju, na glavni niti (~20 ms/sličico,
  zamrznitve 50–100 ms, ~26 sl/s, 2 od 3 sličic preskočene). Zdaj: sličice se prenesejo stisnjene, dekodira se samo okno
  okrog trenutne pozicije (30 naprej v smeri drsenja), in sicer na **grafični kartici** (vsaka sličica je samostojen H.264
  ključni okvir, `.h264`, WebCodecs). Brskalniki brez tega dobijo stare `.webp` sličice. Rezultat: brez zamrznitev, ~42–45 sl/s.
- **Ostrina:** sličica se zdaj nariše 1:1 (prej raztegnjena za 0,8 % → mehka), odstranjena plast šuma `sc-grain`.
  Stran zdaj prikaže izvirni video skoraj piksel za pikslom (SSIM 0.985, barve kot v predvajalniku, BT.709).
  Preostala mehkoba je v samem Kling videu → naslednja ideja: AI povečava izvornih videov 2×.
- AVIF preizkušen in opuščen (ne pomaga, ker ozko grlo ni format). Ukazi za nove klipe so v `CLAUDE.md` §4.

## 8. Odprto in naslednji koraki

1. **Kakovost slike (v teku).**
   - Uporabnik naj odpre **http://localhost:4500/lab/compare.html** (presledek preklaplja A = original .mp4, B = sličica kot na strani; drsnik izbere sličico) in pove razliko.
   - **Predlog (še ni odločeno): prehod na AVIF.** Test na sličici 100 klipa 3:
     WebP q82 = 115 KB, SSIM 0.971 · AVIF crf18 = 77 KB, 0.974 · AVIF crf14 = 95 KB, 0.976 · (WebP q95 = 364 KB, 0.980).
     Ukaz: `ffmpeg -i klip.mp4 -an -vf "unsharp=5:5:0.55:5:5:0,format=yuv420p" -c:v libaom-av1 -still-picture 1 -crf 14 -cpu-used 4 roomN\%04d.avif`
     (za zaporedje: namesto `-still-picture` izvoz po sličicah ali preveri, da ffmpeg zapiše posamezne .avif), nato v verigi `"ext":"avif"`.
     AVIF podpirajo vsi sodobni brskalniki; dekodiranje je malo počasnejše (decode() vnaprej to skrije).
   - Druge možnosti: AI upscale izvornih videov na 1440p (Topaz Video AI ali Kling upscale) → večje sličice; rahel »player look« (kontrast/ostrina).
     Odsvetovano: manjši prikaz od celega zaslona (na tem zaslonu je že 1:1, dobiček majhen, izgubi se premium učinek); `<video>` element (zatikanje, ni vzvratnega predvajanja).
2. **Video za prehod paket 3 → 4** (obnova). Nato odločitev, kako se SVG tloris paketa 4 poveže z videom (morda video prenove + tloris kot dodatek).
3. **Navpični 9:16 videi za telefon** (1080×1920) za vse klipe; na strani ločen nabor sličic za ozke zaslone, po možnosti manjše (mobilni podatki).
4. **Besedilo paketa 2 ne ustreza videu:** piše Fridge/Washer/TV/AC, video pa kaže posteljnino, zavese, luči, sliko. Ali spremeniti besedilo ali bo kasnejši video pokazal aparate.
5. **Teža strani:** ~31 MB sličic (8.5 + 10.2 + 12.3 MB). Start blokira samo prvih 40 sličic klipa 1. Za mobilne podatke zmanjšati (AVIF, manjše sličice za telefon).
6. **Artefakt v klipu 3:** sredi prehoda se okrogla »preproga« razlije v lesen pod – vidno le, če se ustaviš (scroll assist to prepreči).
7. **Placeholderji:** WhatsApp številka, portret v About, podstrani paketov (gumbi zdaj vodijo na WhatsApp, ne na podstrani).
8. **Neuporabljene datoteke** za brisanje (ko uporabnik potrdi): `assets/01-furnishing-bed.webp`, `01-empty.webp`, `02-furnished.webp`; morda stare mape v `lab/`.

## 9. Kako delati s tem uporabnikom

- Dela iterativno in vizualno, s kratkimi zahtevami (»bolj prozorno«, »malo večje«, »daljše«). Naredi spremembo, preveri s posnetki/testi,
  kratko poročaj in povej, katero vrednost se da še prilagoditi.
- Želi premium, gladek občutek. Kompromise (velikost datotek, krediti) razloži preprosto in s številkami.
- Piše hitro in neformalno, včasih slovensko, včasih angleško – odgovarjaj v jeziku, v katerem piše.
- Ko je delo končano, posodobi `CLAUDE.md` in ta dokument.

---

# Zapis za BLK dnevnik (prilepi pod `## Dnevnik` v BLK_log.md)

```
### 2026-09-30 · Scroll animacija sobe na spletni strani

**Faza:** ni podatka v logu (delo spada v 03 Temelj – spletna stran)

**Kaj sva naredila**
- Hero paketa 1 zamenjala z animacijo prazne sobe, ki se opremi ob nalaganju strani.
- Dodala dva Kling videa kot prehoda paket 1 -> 2 in 2 -> 3; soba ostane ista, besedilo drsi čeznjo.
- Dodala samodejno drsenje do naslednjega paketa (3 s na prehod), deluje na miški, trackpadu in telefonu.
- Besedilo postavila neposredno na sliko z mehkim »frosted« ozadjem namesto okvirja.
- Paketu 1 dodala sličice kuhinje, jedilnice in kopalnice, ki se odprejo ob kliku.
- Izboljšala ostrino sličic (boljše skaliranje, višja kakovost, rahlo ostrenje).
- Zapisala predajo projekta v CLAUDE.md in POVZETEK_KONTEKSTA.md v mapi spletne strani.

**Spoznanja in odločitve**
- Odločitev: sobo prikazujeva kot en neprekinjen prostor s Kling videi, ne več kot ločene fotografije.
- Odločitev: za finalne videe uporabljava Kling O3.
- Spoznanje: 4K videi niso smiselni (2.500 kreditov na video, pretežki za splet); 1080p zadostuje.
- Spoznanje: sličice na strani so skoraj enake izvirnemu .mp4; razlika je verjetno v prikazu (predvajalnik izboljša video).

**Kaj je nastalo:** index.html, scroll-sequence.js/.css, assets/frames/room, room2, room3, lab/compare.html, CLAUDE.md, POVZETEK_KONTEKSTA.md

**Odprto:** kakovost slike (primerjava na compare.html), predlog prehoda na AVIF, video za paket 4, navpični videi za telefon, besedilo paketa 2 ne ustreza videu.

**Naslednji korak:** odpreti lab/compare.html, oceniti razliko in se odločiti za prehod na AVIF.
```

V ostalih sekcijah dnevnika:
- Dnevnik odločitev:
  - 2026-09-30 · Soba kot en neprekinjen prostor iz Kling videov · Premium učinek, stranka vidi razliko med paketi · Aljaž
  - 2026-09-30 · Kling O3 za finalne videe · Boljša doslednost sobe · Aljaž
- Odprte naloge: video za paket 3 -> 4, navpični videi za telefon, uskladitev besedila paketa 2, odločitev o AVIF.
