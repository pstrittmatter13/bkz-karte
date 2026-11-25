/* BKZ-Karte: lädt data/karte.json + Gemeindegrenzen, färbt nach gewählter Ebene, Panel mit Beleg je Wert. */
(async function () {
  const fmt = (x, d = 2) => x == null ? "–" : x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = x => Math.round(x * 100) + " %";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const datum = s => s ? s.split("-").reverse().join(".") : "";

  const [K, GEM, LAN] = await Promise.all([
    d3.json("data/karte.json"), d3.json("data/gemeinden.geojson"), d3.json("data/laender.geojson")]);

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
  const NAME_EBENE = { HS: "Hochspannung", "HS/MS": "Umspannung HS/MS", MS: "Mittelspannung", "MS/NS": "Umspannung MS/NS" };

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
        r.art === "kein" ? "kein Wert veröffentlicht" : r.z ? "nicht erhoben" : "–"}`;
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
      kz(fmt(D.eog_anteil_prozent, 1) + " %", `Anteil dieser VNB an den Erlösobergrenzen 2026 aller ${D.vnb_gesamt_eog_liste} VNB`) +
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
         <span class="chip-grau"><i style="background:${GRAU_KEIN}"></i>gesucht, kein Wert veröffentlicht</span>
         <span class="chip-grau"><i style="background:${GRAU_NICHT}"></i>nicht erhoben / Netzbetreiber nicht eindeutig</span>
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
      return `<div class="reg${r === "bundesweit" ? " reg-alle" : ""}"><span>${r}</span><b>${fmt(d3.median(a), 1)}</b><small>€/kW · ${a.length} VNB</small></div>`;
    });
    document.getElementById("regionen-titel").textContent = `Median je Region – ${NAME_EBENE[ebene]} (${ebene})`;
    document.getElementById("regionen").innerHTML = kacheln.join("");
  }

  function belegLinks(d) {
    if (!d.url) return "";
    return `<div class="links"><a href="${esc(d.url)}" target="_blank" rel="noopener" title="Adresse beim Netzbetreiber, abgerufen 24.11.2026">Preisblatt beim Netzbetreiber ↗</a></div>`;
  }

  function block(titel, z, ebenen, aktiv, belegeOben) {
    const kopf = `<h3 class="${aktiv ? "netz-aktiv" : ""}">${titel}`;
    if (!z) return `${kopf}</h3><p class="meta">${titel.startsWith("MS")
      ? "Im MaStR ist in dieser Gemeinde kein Anschluss registriert (meist gemeindefreies Gebiet)."
      : `In dieser Gegend sind kaum Anlagen direkt am Hochspannungsnetz angeschlossen. Das HS-Netz gibt es hier, aber der Betreiber lässt sich aus dem Marktstammdatenregister nicht sicher ableiten (in der Gemeinde kein HS-Anschluss, im Kreis weniger als 10 oder keine klare Mehrheit). Den zuständigen Netzbetreiber je Adresse nennt <a href="https://www.vnbdigital.de" target="_blank" rel="noopener">VNBdigital</a>.`}</p>`;
    const [nr, anteil, n, basis, kand] = z, v = K.vnb[nr] || { name: nr, kenn: {}, docs: [], status: "nicht im Datensatz" };
    const herkunft = basis === "NS" ? `abgeleitet aus ${n} NS-Anschlüssen (kein MS-Anschluss registriert)` :
      basis === "Kreis" ? `${n} HS- und HS/MS-Anschlüssen im Kreis (keiner in der Gemeinde)` :
        `${n} Anschlüssen auf ${titel.startsWith("MS") ? "MS und MS/NS" : "HS und HS/MS"} in der Gemeinde`;
    const andere = kand.slice(1).map(([k, c]) => `${esc(K.vnb[k]?.name || "MaStR " + k)} (${c})`).join(", ");
    let h = `${kopf}: ${esc(v.name)}</h3>
      <p class="meta">MaStR ${esc(nr)}${v.ort ? " · " + esc(v.ort) : ""}<br>Zuordnung: ${pct(anteil)} von ${herkunft}${andere ? "<br>weitere: " + andere : ""}</p>`;
    if (!v.docs.length) return h + `<p class="meta"><span class="chip">${esc(v.status)}</span> Für diesen Netzbetreiber wurde noch kein Preisblatt erhoben.</p>`;
    const zeilen = [];
    for (const id of v.docs) {
      const d = K.docs[id];
      for (const x of d.werte) {
        if (!ebenen.includes(x.ebene)) continue;
        zeilen.push(`<tr><td>${esc(x.ebene)}</td><td class="z">${x.aus ? "<b>" + fmt(x.eur_kw) + "</b>" : fmt(x.eur_kw)}</td>
          <td>${fmt(x.netto)} ${esc(x.einheit)}${x.umrechnung ? `<br><span class="hinweis">kVA→kW: ${esc(x.umrechnung)}</span>` : ""}</td>
          <td>${x.aus ? "in Auswertung" : esc(x.grund || "nicht in Auswertung")}</td></tr>`);
      }
    }
    h += zeilen.length ? `<table><tr><th>Ebene</th><th class="z">€/kW</th><th>laut Preisblatt</th><th>Status</th></tr>${zeilen.join("")}</table>`
      : `<p class="meta"><span class="chip">${esc(v.status)}</span> kein Wert auf diesen Ebenen.</p>`;
    if (belegeOben) return h + `<p class="meta">Belege: siehe oben (derselbe Netzbetreiber).</p>`;
    for (const id of v.docs) {
      const d = K.docs[id];
      if (!d.url && !d.werte.length) continue;
      h += `<details><summary>${esc(d.titel || d.kategorie)}${d.jahr ? " (" + d.jahr + ")" : ""}</summary><div class="belege">
        ${d.methode ? `Methode: <b>${esc(d.methode)}</b>${d.faktor != null && d.faktor !== 1 ? ", Faktor " + fmt(d.faktor, 2) : ""} <span class="hinweis">(${esc(d.methode_beleg)})</span><br>` : ""}
        ${d.speicher && d.speicher !== "keine Angabe" ? `Speicher: ${esc(d.speicher)}${d.speicher_faktor != null ? " × " + fmt(d.speicher_faktor, 2) : ""}<br>` : ""}
        Gültig ab ${datum(d.gueltig_ab) || "–"}${d.gueltig_bis ? " bis " + datum(d.gueltig_bis) : ""}${d.stand ? " · Stand " + esc(d.stand) : ""} · am Stichtag: ${esc(d.gilt_stichtag || "–")}<br>
        ${d.fundort ? "Fundort: " + esc(d.fundort) + "<br>" : ""}
        Datensatz-ID ${esc(d.id)}${d.pdf ? ` · gesicherte Datei ${esc(d.pdf)}` : ""}${d.sha256 ? `<br>SHA-256: <code>${esc(d.sha256)}</code>` : ""}
        ${belegLinks(d)}
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
    const hs = b => block("HS-Netz", z.hs, ["HöS/HS", "HS", "HS/MS"], hsZuerst, b);
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

  // Tabelle aller VNB mit Wert
  const zeilen = Object.entries(K.vnb).filter(([, v]) => Object.keys(v.kenn).length).map(([nr, v]) => {
    const d0 = K.docs[Object.values(v.kenn)[0].id];
    return { nr, name: v.name, region: d0.region, land: d0.land, methode: d0.methode, url: d0.url,
      HS: v.kenn.HS?.w, "HS/MS": v.kenn["HS/MS"]?.w, MS: v.kenn.MS?.w, "MS/NS": v.kenn["MS/NS"]?.w };
  });
  let sortK = "name", sortAuf = true;
  function tabelle() {
    const q = document.getElementById("suche-vnb").value.toLowerCase();
    const r = zeilen.filter(z => !q || z.name.toLowerCase().includes(q) || (z.land || "").toLowerCase().includes(q))
      .sort((a, b) => { const x = a[sortK], y = b[sortK]; const c = x == null ? 1 : y == null ? -1 : typeof x === "number" ? x - y : String(x).localeCompare(y, "de"); return sortAuf ? c : -c; });
    document.querySelector("#tabelle tbody").innerHTML = r.map(z => `<tr><td>${esc(z.name)}</td><td>${esc(z.region)}</td><td>${esc(z.land)}</td>
      ${["HS", "HS/MS", "MS", "MS/NS"].map(e => `<td class="z">${fmt(z[e])}</td>`).join("")}<td>${esc(z.methode)}</td>
      <td class="nowrap">${z.url ? `<a href="${esc(z.url)}" target="_blank" rel="noopener">Original ↗</a>` : ""}</td></tr>`).join("");
    document.getElementById("tab-anzahl").textContent = `${r.length} von ${zeilen.length}`;
  }
  document.getElementById("suche-vnb").addEventListener("input", tabelle);
  document.querySelectorAll("#tabelle th[data-k]").forEach(th => th.addEventListener("click", () => {
    sortAuf = sortK === th.dataset.k ? !sortAuf : true; sortK = th.dataset.k; tabelle();
  }));

  // Zitat kopieren
  document.getElementById("zitat-kopieren").addEventListener("click", async ev => {
    try { await navigator.clipboard.writeText(document.getElementById("zitat").textContent.trim()); ev.target.textContent = "Kopiert ✓"; }
    catch { ev.target.textContent = "Bitte markieren und kopieren"; }
    setTimeout(() => ev.target.textContent = "Zitat kopieren", 2000);
  });

  const m = K.mastr;
  document.getElementById("quellenzeile").textContent =
    `Datenstand: BKZ-Datensatz, Stichtag ${datum(K.datensatz.stichtag)} (${K.datensatz.werte_in_auswertung} Werte) · ` +
    `MaStR-Export ${m.datei} (SHA-256 ${String(m.sha256).slice(0, 16)}…, ${m.gezaehlt?.toLocaleString("de-DE")} Anlagen in Betrieb) · Karte erzeugt am ${datum(K.erzeugt)}.`;

  faerben(); tabelle();
})();
