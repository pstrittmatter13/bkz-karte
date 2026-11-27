/* BKZ-Karte: lädt data/karte.json + Gemeindegrenzen, färbt nach gewählter Ebene, Panel mit Beleg je Wert. */
(async function () {
  const fmt = (x, d = 2) => x == null ? "–" : x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = x => Math.round(x * 100) + " %";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const datum = s => s ? s.split("-").reverse().join(".") : "";

  const [K, GEM, LAN] = await Promise.all([
    d3.json("data/karte.json?v=" + (document.currentScript?.src.split("v=")[1] || "")), d3.json("data/gemeinden.geojson"), d3.json("data/laender.geojson")]);

  // Feste Klassen (€/kW) – unabhängig von Ebene und Datenstand, damit Karten vergleichbar bleiben
  const GRENZEN = [60, 90, 120, 150, 180];
  // hell: niedrig = hell, hoch = dunkel; dunkel: umgekehrt, damit hohe Werte nicht im Hintergrund verschwinden
  const DUNKEL = matchMedia("(prefers-color-scheme: dark)").matches;
  const FARBEN = DUNKEL ? ["#184f95", "#1c5cab", "#2a78d6", "#5598e7", "#9ec5f4", "#cde2fb"]
    : ["#cde2fb", "#9ec5f4", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"];
  const klasse = d3.scaleThreshold().domain(GRENZEN).range(FARBEN);
  const css = getComputedStyle(document.documentElement);
  const GRAU_KEIN = css.getPropertyValue("--kein-wert").trim();
  const GRAU_NICHT = css.getPropertyValue("--nicht-erhoben").trim();
  // verständliche Kurztexte für Status (je Netzbetreiber) und Ausschlussgründe (je Wert); sonst Text des Datensatzes
  // Begriffe: „gesucht“ = Preisblatt dieses Netzbetreibers wurde gesucht; „zählt“ = Wert geht in Farbe und Median ein.
  const STATUS = {
    "nicht im Datensatz": "nicht gesucht (kleinerer Netzbetreiber)",
    "keine Angabe gefunden": "gesucht, keinen veröffentlichten Wert gefunden",
    "nur Rechenregel, kein Wert": "gesucht, nur eine Rechenregel veröffentlicht, keine Zahl",
    "Industrienetz, keine Angabe": "Industrienetz, kein Wert veröffentlicht",
    "auf Anfrage / individuell": "gesucht, Wert nur auf Anfrage",
    "Altfassung nur im Suchindex, nicht am Original geprüft": "nur eine alte Fassung gefunden, nicht am Original prüfbar",
    "nicht prüfbar (nur Sekundärquelle)": "Wert nur in einer Drittquelle, nicht am Original prüfbar",
    "nicht prüfbar (Original nicht abrufbar)": "Preisblatt nicht abrufbar",
    "nicht prüfbar (Zugriff gesperrt)": "Seite gesperrt, nicht prüfbar",
    "Wert nur im Vertrag": "Wert steht nur im Anschlussvertrag, nicht veröffentlicht",
    "MS bei anderer Gesellschaft": "Mittelspannung betreibt eine andere Gesellschaft" };
  const GRUND = {
    "NS (außerhalb des Geltungsbereichs; NS-BKZ nach NAV bzw. eigener NS-Regel)": "Niederspannung, nicht Teil der Karte",
    "Sonderformel, nicht vergleichbar": "eigene Rechenformel, nicht vergleichbar",
    "ÜNB (bundeseinheitlich)": "Übertragungsnetz, nicht Teil der Karte",
    "erst nach dem Stichtag gültig": "gilt erst nach dem Stichtag",
    "durch neueres Blatt ersetzt": "durch ein neueres Preisblatt ersetzt",
    "Sekundärquelle": "nur aus einer Drittquelle, nicht am Original geprüft",
    "Ebenenzuordnung unsicher": "Netzebene im Preisblatt nicht eindeutig",
    "abgeleitet, kein BKZ-Preisblatt-Wert": "abgeleitet, kein Wert aus dem Preisblatt",
    "nicht am Original geprüft (Original nicht abrufbar)": "Original nicht abrufbar",
    "Wert des vorgelagerten ÜNB": "Wert des Übertragungsnetzbetreibers" };
  const METHODE = { "5J-Mittel": "Leistungspreis, Mittel aus 5 Jahren", "Einzeljahr-LP": "Leistungspreis eines Jahres",
    "LP-Mittel ohne Zeitraumangabe": "Leistungspreis, Mittel (Zeitraum nicht genannt)", "Festpreis/Pauschale": "Festpreis",
    "Sonderformel": "eigene Formel", "nicht angegeben": "im Blatt nicht angegeben" };
  // Kurzbeschreibung, warum ein gesuchter Netzbetreiber keinen Wert in der Karte hat
  function ohneWertText(v) {
    const w = v.docs.flatMap(id => K.docs[id].werte);
    const oben = w.filter(x => x.ebene !== "NS");
    if (oben.length) return "Wert veröffentlicht, zählt aber nicht – " + (GRUND[oben[0].grund] || oben[0].grund);
    if (w.length) return "nur ein Niederspannungs-Wert veröffentlicht";
    return STATUS[v.status] || v.status;
  }
  const NAME_EBENE ={ HS: "Hochspannung", "HS/MS": "Umspannung HS/MS", MS: "Mittelspannung", "MS/NS": "Umspannung MS/NS" };

  const svg = d3.select("#karte"), W = 780, H = 1000;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const proj = d3.geoIdentity().reflectY(true).fitExtent([[10, 10], [W - 10, H - 10]], LAN);
  const path = d3.geoPath(proj);
  const g = svg.append("g");
  const tip = document.getElementById("tooltip");
  const knopfReset = document.getElementById("zuruecksetzen");
  let ebene = "MS", gewaehlt = null;

  const gruppe = e => K.gruppe[e];                       // "ms" oder "hs"
  function zust(ags, e) {                                // [MaStR-Nr, Anteil, n, Basis, Kandidaten]
    const z = K.gem[ags]; return z ? z[gruppe(e)] : null;
  }
  function wert(ags, e) {
    const z = zust(ags, e); if (!z) return { art: "nicht" };
    const v = K.vnb[z[0]];
    if (!v || v.status === "nicht im Datensatz") return { art: "nicht", z, v };
    const k = v.kenn[e];
    return k ? { art: "wert", w: k.w, z, v } : { art: "kein", z, v };
  }
  function farbe(ags) {
    const r = wert(ags, ebene);
    return r.art === "wert" ? klasse(r.w) : r.art === "kein" ? GRAU_KEIN : GRAU_NICHT;
  }

  const gem = g.append("g").selectAll("path").data(GEM.features).join("path")
    .attr("class", "g").attr("d", path)
    .on("mousemove", (ev, f) => {
      const r = wert(f.properties.ags, ebene);
      const nb = r.z ? (K.vnb[r.z[0]]?.name ?? r.z[0]) : "Netzbetreiber nicht eindeutig zuzuordnen";
      tip.innerHTML = `<b>${esc(f.properties.name)}</b>${esc(nb)}<br>${ebene}: ${r.art === "wert" ? fmt(r.w) + " €/kW" :
        r.art === "kein" ? "gesucht, kein Wert, der zählt" : r.z ? "nicht gesucht" : "–"}`;
      const b = svg.node().parentNode.getBoundingClientRect();
      tip.style.left = Math.min(ev.clientX - b.left + 14, b.width - 260) + "px";
      tip.style.top = (ev.clientY - b.top + 14) + "px"; tip.hidden = false;
    })
    .on("mouseleave", () => tip.hidden = true)
    .on("click", (ev, f) => waehle(f, false));
  g.append("g").selectAll("path").data(LAN.features).join("path").attr("class", "land").attr("d", path);
  const auswahl = g.append("path").attr("class", "g sel").attr("fill", "none").style("pointer-events", "none");

  const zoom = d3.zoom().scaleExtent([1, 60]).on("zoom", ev => {
    g.attr("transform", ev.transform);
    knopfReset.hidden = ev.transform.k < 1.05;
  });
  svg.call(zoom);
  knopfReset.addEventListener("click", () => svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity));
  function zoomeAuf(f) {
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    const k = Math.min(7, 0.2 / Math.max((x1 - x0) / W, (y1 - y0) / H));
    const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    svg.transition().duration(750).call(zoom.transform, t);
  }

  function faerben() { gem.attr("fill", f => farbe(f.properties.ags)); legende(); regionen(); kennzahlen(); }

  function kennzahlen() {
    const D = K.datensatz, A = K.abdeckung[ebene];
    const kz = (wert, text) => `<div class="kz"><b>${wert}</b><span>${text}</span></div>`;
    document.getElementById("kennzahlen").innerHTML =
      kz(D.vnb_mit_wert, `Netzbetreiber mit veröffentlichtem Wert (${D.werte_in_auswertung} Werte)`) +
      kz(fmt(D.eog_anteil_prozent, 1) + " %", `Anteil dieser Netzbetreiber an den Erlösobergrenzen 2026 aller ${D.vnb_gesamt_eog_liste} Netzbetreiber (Maß für die Größe)`) +
      kz(pct(A.ew_mit_wert_anteil), `der Einwohner wohnen in einer Gemeinde, für die ein ${ebene}-Wert vorliegt (${A.gem_mit_wert.toLocaleString("de-DE")} Gemeinden)`) +
      kz(A.vnb_mit_wert, `Netzbetreiber mit Wert auf der Ebene ${ebene}`);
    document.getElementById("g-vnb").textContent = D.vnb_mit_wert;
    document.getElementById("g-eog").textContent = fmt(D.eog_anteil_prozent, 1);
  }

  function legende() {
    const balken = FARBEN.map((f, i) => `<i style="background:${f}" title="${i === 0 ? "< " + GRENZEN[0] : i === FARBEN.length - 1 ? "≥ " + GRENZEN.at(-1) : GRENZEN[i - 1] + "–" + GRENZEN[i]} €/kW"></i>`).join("");
    const ticks = ["", ...GRENZEN].map(g => `<span>${g}</span>`).join("");
    document.getElementById("legende").innerHTML =
      `<div class="skala-wrap"><div class="skala">${balken}</div><div class="skala-ticks">${ticks}</div></div>
       <div class="graus">
         <span class="chip-grau"><i style="background:${GRAU_KEIN}"></i>gesucht, aber kein Wert, der zählt</span>
         <span class="chip-grau"><i style="background:${GRAU_NICHT}"></i>nicht gesucht oder Netzbetreiber unklar</span>
       </div>`;
  }

  // Mediane je Region (über Netzbetreiber, nicht über Fläche)
  function regionen() {
    const reg = {};
    for (const v of Object.values(K.vnb)) {
      const k = v.kenn[ebene]; if (!k) continue;
      const r = K.docs[k.id]?.region; if (!r) continue;
      (reg[r] ??= []).push(k.w);
    }
    const alle = Object.values(reg).flat();
    const kacheln = ["Nord", "Ost", "West", "Süd", "bundesweit"].filter(r => reg[r] || r === "bundesweit").map(r => {
      const a = r === "bundesweit" ? alle : reg[r];
      return `<div class="reg${r === "bundesweit" ? " reg-alle" : ""}"><span>${r}</span><b>${fmt(d3.median(a), 1)}</b><small>€/kW · ${a.length} Netzbetreiber</small></div>`;
    });
    document.getElementById("regionen-titel").textContent = `Median je Region – ${NAME_EBENE[ebene]} (${ebene})`;
    document.getElementById("regionen").innerHTML = kacheln.join("");
  }

  function belegLinks(d) {
    if (!d.url) return "";
    return `<div class="links"><a href="${esc(d.url)}" target="_blank" rel="noopener" title="Adresse beim Netzbetreiber, abgerufen 24.11.2026">Preisblatt beim Netzbetreiber ↗</a></div>`;
  }

  function block(titel, z, ebenen, aktiv, belegeOben, ags) {
    const kopf = `<h3 class="${aktiv ? "netz-aktiv" : ""}">${titel}`;
    const vd = ags && titel.startsWith("HS") ? (K.vnbdigital || {})[ags] : null;
    const vdLink = vd ? `<a href="${esc(vd.url)}" target="_blank" rel="noopener">VNBdigital ↗</a> (Abruf ${datum(vd.abruf)})` : "";
    if (!z && vd && vd.namen.length > 1) return `${kopf}</h3><p class="meta">Laut ${vdLink} betreiben hier mehrere Netzbetreiber ein Hochspannungsnetz: <b>${vd.namen.map(esc).join(", ")}</b>. Welcher zuständig ist, hängt vom Standort ab.</p>`;
    if (!z) return `${kopf}</h3><p class="meta">${titel.startsWith("MS")
      ? "Im Marktstammdatenregister ist in dieser Gemeinde keine Anlage registriert (meist gemeindefreies Gebiet)."
      : `Ein Hochspannungsnetz gibt es auch hier – auf der Karte fehlt nur sein Betreiber. Die Karte liest ihn aus dem Marktstammdatenregister ab: wer die Anlagen anschließt, die direkt an der Hochspannung hängen. Hier hängen zu wenige daran (in der Gemeinde keine, im Kreis weniger als 10 oder keine klare Mehrheit). Den zuständigen Netzbetreiber je Adresse nennt <a href="https://www.vnbdigital.de" target="_blank" rel="noopener">VNBdigital</a>.`}</p>`;
    const [nr, anteil, n, basis, kand] = z, v = K.vnb[nr] || { name: nr, kenn: {}, docs: [], status: "nicht im Datensatz" };
    if (basis === "VNBdigital") {
      const v = K.vnb[nr] || { name: nr, kenn: {}, docs: [], status: "nicht im Datensatz" };
      return blockWerte(`${kopf}: ${esc(v.name)}</h3><p class="meta">${v.ort ? "Sitz " + esc(v.ort) + "<br>" : ""}Zuordnung laut ${vdLink}</p>`, v, ebenen, belegeOben);
    }
    const naeherung = basis === "NS" ? "<br>zugeordnet über die Niederspannung" : basis === "Kreis" ? "<br>zugeordnet über den Kreis" : "";
    let h = `${kopf}: ${esc(v.name)}</h3>
      <p class="meta">${v.ort ? "Sitz " + esc(v.ort) + "<br>" : ""}Marktstammdatenregister-Nr. ${esc(nr)}${naeherung}</p>`;
    return blockWerte(h, v, ebenen, belegeOben);
  }
  function blockWerte(h, v, ebenen, belegeOben) {
    if (!v.docs.length) return h + `<p class="meta"><span class="chip">nicht gesucht</span> Gesucht wurden die Preisblätter der größeren Netzbetreiber; dieser gehört nicht dazu. Seinen BKZ nennt der Netzbetreiber selbst.</p>`;
    const zaehlt = [], nicht = [];
    for (const id of v.docs) {
      const d = K.docs[id];
      for (const x of d.werte) {
        if (!ebenen.includes(x.ebene)) continue;
        // Umrechnung (z. B. €/kVA → €/kW) steht im Beleg, nicht in der Tabelle
        if (x.aus) zaehlt.push(`<tr><td>${esc(x.ebene)}</td><td class="z"><b>${fmt(x.eur_kw)}</b></td></tr>`);
        else nicht.push(`<tr><td>${esc(x.ebene)}</td><td class="z">${fmt(x.eur_kw)}</td><td>${x.grund === "erst nach dem Stichtag gültig" && d.gueltig_ab ? `gilt erst ab ${datum(d.gueltig_ab)} (Stichtag der Karte: ${datum(K.datensatz.stichtag)})` : esc(GRUND[x.grund] || x.grund || "nicht nach den Regeln")}</td></tr>`);
      }
    }
    h += zaehlt.length ? `<table><tr><th>Ebene</th><th class="z">BKZ in €/kW netto</th></tr>${zaehlt.join("")}</table>`
      : `<p class="meta"><span class="chip">kein Wert, der zählt</span><br>Grund: ${esc(ohneWertText(v))}</p>`;
    if (nicht.length) h += `<details><summary>Weitere Werte im Preisblatt, die nicht zählen (${nicht.length})</summary>
      <table><tr><th>Ebene</th><th class="z">€/kW</th><th>warum nicht</th></tr>${nicht.join("")}</table></details>`;
    if (belegeOben) return h + `<p class="meta">Belege: siehe oben (derselbe Netzbetreiber).</p>`;
    for (const id of v.docs) {
      const d = K.docs[id];
      if (!d.url && !d.werte.length) continue;
      const rechenweg = d.methode && d.methode !== "nicht angegeben" ? `Rechenweg: ${esc(METHODE[d.methode] || d.methode)}${d.faktor != null && d.faktor !== 1 ? ", Faktor " + fmt(d.faktor, 2) : ""}<br>` : "";
      const speicher = d.speicher && d.speicher !== "keine Angabe" ? `Für Speicher: ${esc(d.speicher)}${d.speicher_faktor != null ? " × " + fmt(d.speicher_faktor, 2) : ""}<br>` : "";
      const u = d.werte.find(x => x.einheit !== "€/kW");
      const umrechnung = u ? `Im Blatt in ${esc(u.einheit)}, auf €/kW umgerechnet${u.umrechnung ? ": " + esc(u.umrechnung.replace(/^[\d.,]+\s*\((.*)\)$/, "$1")) : ""}<br>` : "";
      h += `<details><summary>Beleg: ${esc(d.titel || d.kategorie)}</summary><div class="belege">
        Gültig ab ${datum(d.gueltig_ab) || "–"}${d.gueltig_bis ? " bis " + datum(d.gueltig_bis) : ""}<br>${rechenweg}${umrechnung}${speicher}
        ${belegLinks(d)}
        <details class="technik"><summary>Angaben zur Prüfung</summary>
          ${d.fundort ? "Fundort: " + esc(d.fundort) + "<br>" : ""}${d.methode_beleg && d.methode_beleg !== "keine Angabe" ? "Rechenweg: " + esc(d.methode_beleg) + "<br>" : ""}${d.stand ? "Stand des Blatts: " + esc(d.stand) + "<br>" : ""}
          Datensatz-ID ${esc(d.id)}${d.pdf ? ` · gesicherte Datei ${esc(d.pdf)}` : ""}${d.sha256 ? `<br>Prüfsumme (SHA-256): <code>${esc(d.sha256)}</code>` : ""}
        </details>
      </div></details>`;
    }
    return h;
  }

  function panel() {
    if (!gewaehlt) return;
    const f = GEM.features.find(x => x.properties.ags === gewaehlt);
    const p = f.properties, z = K.gem[p.ags] || {};
    const hsZuerst = gruppe(ebene) === "hs";
    const gleich = z.ms && z.hs && z.ms[0] === z.hs[0];
    const ms = b => block("MS-Netz", z.ms, ["MS", "MS/NS", "NS"], !hsZuerst, b);
    const hs = b => block("HS-Netz", z.hs, ["HöS/HS", "HS", "HS/MS"], hsZuerst, b, p.ags);
    document.getElementById("panel").innerHTML =
      `<button type="button" class="zurueck">← Zurück zur Karte</button><h2>${esc(p.name)}</h2><p class="meta">AGS ${esc(p.ags)} · ${p.ew.toLocaleString("de-DE")} Einwohner</p>` +
      (hsZuerst ? hs(false) + ms(gleich) : ms(false) + hs(gleich));
  }

  function waehle(f, mitZoom) {
    gewaehlt = f.properties.ags;
    auswahl.attr("d", path(f)).raise();
    if (mitZoom) zoomeAuf(f);
    panel();
    oeffneHandyAnsicht();
  }

  // Handy: Gemeinde als eigene Ansicht über der Karte; „Zurück“ (Knopf oder Zurück-Taste) schließt sie
  const handy = matchMedia("(max-width: 700px)");
  const panelEl = document.getElementById("panel");
  function oeffneHandyAnsicht() {
    if (!handy.matches) return;
    if (!panelEl.classList.contains("offen")) history.pushState({ gemeinde: 1 }, "");
    panelEl.classList.add("offen"); panelEl.scrollTop = 0;
    document.body.style.overflow = "hidden";
  }
  function schliesseHandyAnsicht() { panelEl.classList.remove("offen"); document.body.style.overflow = ""; }
  panelEl.addEventListener("click", ev => {
    if (ev.target.closest(".zurueck")) { history.state?.gemeinde ? history.back() : schliesseHandyAnsicht(); }
  });
  addEventListener("popstate", schliesseHandyAnsicht);
  handy.addEventListener("change", () => { if (!handy.matches) schliesseHandyAnsicht(); });

  // Gemeindesuche mit eigener Vorschlagsliste
  const eingabe = document.getElementById("suche-gem"), liste = document.getElementById("vorschlaege");
  const gemSortiert = GEM.features.map(f => ({ f, n: f.properties.name, k: f.properties.name.toLowerCase(), ew: f.properties.ew }));
  let treffer = [], aktiv = -1;
  function zeigeVorschlaege() {
    const q = eingabe.value.trim().toLowerCase();
    if (!q) { liste.hidden = true; eingabe.setAttribute("aria-expanded", "false"); return; }
    treffer = gemSortiert.filter(x => x.k.startsWith(q)).sort((a, b) => b.ew - a.ew)
      .concat(gemSortiert.filter(x => !x.k.startsWith(q) && x.k.includes(q)).sort((a, b) => b.ew - a.ew)).slice(0, 8);
    aktiv = treffer.length ? 0 : -1;
    liste.innerHTML = treffer.length ? treffer.map((x, i) => `<li role="option" data-i="${i}" aria-selected="${i === aktiv}">${esc(x.n)}<small>${x.ew.toLocaleString("de-DE")} Einwohner</small></li>`).join("")
      : `<li aria-disabled="true"><small>keine Gemeinde gefunden</small></li>`;
    liste.hidden = false; eingabe.setAttribute("aria-expanded", "true");
  }
  function nimm(i) {
    const x = treffer[i]; if (!x) return;
    eingabe.value = x.n; liste.hidden = true; eingabe.setAttribute("aria-expanded", "false");
    waehle(x.f, true);
  }
  eingabe.addEventListener("input", zeigeVorschlaege);
  eingabe.addEventListener("keydown", ev => {
    if (liste.hidden) return;
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      aktiv = (aktiv + (ev.key === "ArrowDown" ? 1 : -1) + treffer.length) % treffer.length;
      liste.querySelectorAll("li").forEach((li, i) => li.setAttribute("aria-selected", String(i === aktiv)));
      ev.preventDefault();
    } else if (ev.key === "Enter") { nimm(aktiv); ev.preventDefault(); }
    else if (ev.key === "Escape") { liste.hidden = true; }
  });
  liste.addEventListener("mousedown", ev => { const li = ev.target.closest("li[data-i]"); if (li) { nimm(+li.dataset.i); ev.preventDefault(); } });
  eingabe.addEventListener("blur", () => setTimeout(() => liste.hidden = true, 120));

  // Ebenen-Umschalter
  const knoepfe = [...document.querySelectorAll("#ebene button")];
  function setzeEbene(e) {
    ebene = e;
    knoepfe.forEach(b => b.setAttribute("aria-checked", String(b.dataset.e === e)));
    faerben(); panel();
  }
  knoepfe.forEach(b => b.addEventListener("click", () => setzeEbene(b.dataset.e)));
  document.getElementById("ebene").addEventListener("keydown", ev => {     // Pfeiltasten wie bei Optionsfeldern
    const i = knoepfe.findIndex(b => b.dataset.e === ebene);
    const j = ev.key === "ArrowRight" ? i + 1 : ev.key === "ArrowLeft" ? i - 1 : null;
    if (j === null) return;
    const b = knoepfe[(j + knoepfe.length) % knoepfe.length]; b.focus(); setzeEbene(b.dataset.e); ev.preventDefault();
  });
  knoepfe.forEach(b => b.setAttribute("aria-checked", String(b.dataset.e === ebene)));

  // Tabelle: mit Wert (Standard), gesucht ohne Wert, nicht gesucht, Standard: nach Größe (Erlösobergrenze 2026)
  const zeilen = Object.entries(K.vnb).map(([nr, v]) => {
    if (!v.docs.length) return { nr, name: v.name, region: "", land: v.ort ? "Sitz " + v.ort : "", methode: null, url: null,
      mitWert: false, gesucht: false, status: "nicht gesucht", groesse: v.eog_mio ?? null };
    const mitWert = Object.keys(v.kenn).length > 0;
    const d0 = K.docs[mitWert ? Object.values(v.kenn)[0].id : v.docs[0]];
    const art = /\.pdf$/i.test(d0.pdf || "") ? "PDF" : "Webseite";
    return { nr, name: v.name, region: d0.region, land: d0.land, methode: mitWert ? d0.methode : null,
      url: mitWert ? d0.url : null, art, mitWert, gesucht: true, status: mitWert ? "" : ohneWertText(v), groesse: v.eog_mio ?? null,
      HS: v.kenn.HS?.w, "HS/MS": v.kenn["HS/MS"]?.w, MS: v.kenn.MS?.w, "MS/NS": v.kenn["MS/NS"]?.w };
  });
  let sortK = "groesse", sortAuf = false;
  const auswahlSort = document.getElementById("sort-vnb"), auswahlZeige = document.getElementById("zeige-vnb");
  function tabelle() {
    const q = document.getElementById("suche-vnb").value.toLowerCase(), zeige = auswahlZeige.value;
    const r = zeilen.filter(z => (zeige === "mit" ? z.mitWert : zeige === "ohne" ? z.gesucht && !z.mitWert : zeige === "nicht" ? !z.gesucht : z.gesucht) &&
        (!q || z.name.toLowerCase().includes(q) || (z.land || "").toLowerCase().includes(q)))
      .sort((a, b) => { const x = a[sortK], y = b[sortK]; const c = x == null ? 1 : y == null ? -1 : typeof x === "number" ? x - y : String(x).localeCompare(y, "de"); return x == null || y == null ? c : sortAuf ? c : -c; });
    document.querySelector("#tabelle tbody").innerHTML = r.map(z => `<tr class="${z.mitWert ? "" : "ohne"}"><td>${esc(z.name)}${z.mitWert ? "" : `<br><span class="hinweis">${esc(z.status)}</span>`}</td>
      <td>${esc(z.region)}</td><td>${esc(z.land)}</td>
      ${["HS", "HS/MS", "MS", "MS/NS"].map(e => `<td class="z">${fmt(z[e])}</td>`).join("")}<td>${z.methode ? esc(METHODE[z.methode] || z.methode) : "–"}</td>
      <td class="nowrap">${z.url ? `<a href="${esc(z.url)}" target="_blank" rel="noopener" title="Adresse beim Netzbetreiber, abgerufen 24.11.2026">${z.art} ↗</a>` : "–"}</td></tr>`).join("");
    document.getElementById("tab-anzahl").textContent = `${r.length} Netzbetreiber`;
  }
  document.getElementById("suche-vnb").addEventListener("input", tabelle);
  auswahlZeige.addEventListener("change", tabelle);
  auswahlSort.addEventListener("change", () => { sortK = auswahlSort.value || "groesse"; sortAuf = sortK === "name"; tabelle(); });
  // Zitat kopieren
  document.getElementById("zitat-kopieren").addEventListener("click", async ev => {
    try { await navigator.clipboard.writeText(document.getElementById("zitat").textContent.trim()); ev.target.textContent = "Kopiert ✓"; }
    catch { ev.target.textContent = "Bitte markieren und kopieren"; }
    setTimeout(() => ev.target.textContent = "Zitat kopieren", 2000);
  });

  const m = K.mastr;
  document.getElementById("quellenzeile").textContent =
    `Datenstand: BKZ-Datensatz, Stichtag ${datum(K.datensatz.stichtag)} (${K.datensatz.werte_in_auswertung} Werte) · ` +
    `Marktstammdatenregister, Export ${m.datei} (SHA-256 ${String(m.sha256).slice(0, 16)}…, ${m.gezaehlt?.toLocaleString("de-DE")} Anlagen in Betrieb) · Karte erzeugt am ${datum(K.erzeugt)}.`;

  faerben(); tabelle();
})();
