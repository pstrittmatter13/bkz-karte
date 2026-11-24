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

  const svg = d3.select("#karte"), W = 780, H = 1000;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const proj = d3.geoIdentity().reflectY(true).fitExtent([[10, 10], [W - 10, H - 10]], LAN);
  const path = d3.geoPath(proj);
  const g = svg.append("g");
  const tip = document.getElementById("tooltip");
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
    .on("click", (ev, f) => waehle(f));
  g.append("g").selectAll("path").data(LAN.features).join("path").attr("class", "land").attr("d", path);

  svg.call(d3.zoom().scaleExtent([1, 40]).on("zoom", ev => g.attr("transform", ev.transform)));

  function faerben() { gem.attr("fill", f => farbe(f.properties.ags)); legende(); regionen(); kennzahlen(); }

  function kennzahlen() {
    const D = K.datensatz, A = K.abdeckung[ebene];
    const kz = (wert, text) => `<div class="kz"><b>${wert}</b><span>${text}</span></div>`;
    document.getElementById("kennzahlen").innerHTML =
      kz(D.vnb_mit_wert, `Netzbetreiber mit Wert (${D.werte_in_auswertung} Werte)`) +
      kz(fmt(D.eog_anteil_prozent, 1) + " %", `Anteil dieser VNB an den Erlösobergrenzen 2026 aller ${D.vnb_gesamt_eog_liste} VNB`) +
      kz(pct(A.ew_mit_wert_anteil), `der Einwohner mit ${ebene}-Wert (${A.gem_mit_wert.toLocaleString("de-DE")} Gemeinden)`) +
      kz(A.vnb_mit_wert, `Netzbetreiber mit ${ebene}-Wert`);
    document.getElementById("g-vnb").textContent = D.vnb_mit_wert;
    document.getElementById("g-eog").textContent = fmt(D.eog_anteil_prozent, 1);
  }

  function legende() {
    const t = [`<span class="k"><i style="background:${FARBEN[0]}"></i>&lt; ${GRENZEN[0]}</span>`];
    for (let i = 1; i < FARBEN.length - 1; i++)
      t.push(`<span class="k"><i style="background:${FARBEN[i]}"></i>${GRENZEN[i - 1]}–${GRENZEN[i]}</span>`);
    t.push(`<span class="k"><i style="background:${FARBEN.at(-1)}"></i>≥ ${GRENZEN.at(-1)} €/kW</span>`);
    t.push(`<span class="k"><i style="background:${GRAU_KEIN}"></i>gesucht, kein Wert veröffentlicht</span>`);
    t.push(`<span class="k"><i style="background:${GRAU_NICHT};outline:1px solid var(--linie)"></i>noch nicht erhoben oder Netzbetreiber nicht eindeutig</span>`);
    document.getElementById("legende").innerHTML = t.join("");
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
    const zeilen = ["Nord", "Ost", "West", "Süd", "bundesweit"].filter(r => reg[r] || r === "bundesweit").map(r => {
      const a = r === "bundesweit" ? alle : reg[r];
      return `<tr><td>${r}</td><td class="z">${a.length}</td><td class="z">${fmt(d3.median(a))}</td></tr>`;
    });
    const el = document.getElementById("regionen");
    if (el) el.innerHTML = `<h3>${ebene}: Median je Region</h3><table class="regtab"><tr><th>Region</th><th class="z">VNB</th><th class="z">€/kW</th></tr>${zeilen.join("")}</table>
      <p class="hinweis">Median über die Netzbetreiber mit Wert, nicht über Fläche oder Anschlüsse.</p>`;
  }

  function block(titel, z, ebenen, belegeOben) {
    if (!z) return `<h3>${titel}</h3><p class="meta">${titel.startsWith("MS")
      ? "Im MaStR ist in dieser Gemeinde kein Anschluss registriert (meist gemeindefreies Gebiet)."
      : `Nicht eindeutig: kein HS-Anschluss in der Gemeinde, und im Kreis weniger als ${10} HS-Anschlüsse oder kein Netzbetreiber mit mindestens 60 %.`}</p>`;
    const [nr, anteil, n, basis, kand] = z, v = K.vnb[nr] || { name: nr, kenn: {}, docs: [], status: "nicht im Datensatz" };
    const herkunft = basis === "NS" ? `abgeleitet aus ${n} NS-Anschlüssen (kein MS-Anschluss registriert)` :
      basis === "Kreis" ? `${n} HS- und HS/MS-Anschlüssen im Kreis (keiner in der Gemeinde)` :
        `${n} Anschlüsse auf ${titel.startsWith("MS") ? "MS und MS/NS" : "HS und HS/MS"} in der Gemeinde`;
    const andere = kand.slice(1).map(([k, c]) => `${esc(K.vnb[k]?.name || "MaStR " + k)} (${c})`).join(", ");
    let h = `<h3>${titel}: ${esc(v.name)}</h3>
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
    if (belegeOben) return h + `<p class="meta">Belege: siehe MS-Netz (derselbe Netzbetreiber).</p>`;
    for (const id of v.docs) {
      const d = K.docs[id];
      if (!d.url && !d.werte.length) continue;
      h += `<details${d.werte.length ? " open" : ""}><summary>${esc(d.id)} · ${esc(d.titel || d.kategorie)} ${d.jahr ? "(" + d.jahr + ")" : ""}</summary><div class="belege">
        ${d.methode ? `Methode: <b>${esc(d.methode)}</b>${d.faktor != null && d.faktor !== 1 ? ", Faktor " + fmt(d.faktor, 2) : ""} <span class="hinweis">(${esc(d.methode_beleg)})</span><br>` : ""}
        ${d.speicher && d.speicher !== "keine Angabe" ? `Speicher: ${esc(d.speicher)}${d.speicher_faktor != null ? " × " + fmt(d.speicher_faktor, 2) : ""}<br>` : ""}
        Gültig ab ${datum(d.gueltig_ab) || "–"}${d.gueltig_bis ? " bis " + datum(d.gueltig_bis) : ""}${d.stand ? " · Stand " + esc(d.stand) : ""} · am Stichtag: ${esc(d.gilt_stichtag || "–")}<br>
        ${d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener">Preisblatt öffnen</a>` : ""}${d.fundort ? " · Fundort: " + esc(d.fundort) : ""}<br>
        ${d.pdf ? `Archivdatei: ${esc(d.pdf)}${d.sha256 ? `<br>SHA-256: <code>${esc(d.sha256)}</code>` : ""}` : ""}
      </div></details>`;
    }
    return h;
  }

  function waehle(f) {
    gewaehlt = f.properties.ags;
    gem.classed("sel", d => d.properties.ags === gewaehlt);
    const p = f.properties, z = K.gem[p.ags] || {};
    document.getElementById("panel").innerHTML =
      `<h2>${esc(p.name)}</h2><p class="meta">AGS ${esc(p.ags)} · ${p.ew.toLocaleString("de-DE")} Einwohner</p>` +
      block("MS-Netz", z.ms, ["MS", "MS/NS", "NS"]) +
      block("HS-Netz", z.hs, ["HöS/HS", "HS", "HS/MS"], z.ms && z.hs && z.ms[0] === z.hs[0]) +
      `<div id="regionen"></div>`;
    regionen();
  }

  // Gemeindesuche
  const nachName = new Map(GEM.features.map(f => [`${f.properties.name} (${f.properties.ags.slice(0, 5)})`, f]));
  document.getElementById("gem-liste").innerHTML = [...nachName.keys()].sort().map(n => `<option value="${esc(n)}">`).join("");
  document.getElementById("suche-gem").addEventListener("change", e => {
    const f = nachName.get(e.target.value) || [...nachName.entries()].find(([k]) => k.toLowerCase().startsWith(e.target.value.toLowerCase()))?.[1];
    if (f) waehle(f);
  });
  document.getElementById("ebene").addEventListener("change", e => { ebene = e.target.value; faerben(); });

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
      <td>${z.url ? `<a href="${esc(z.url)}" target="_blank" rel="noopener">PDF</a>` : ""}</td></tr>`).join("");
    document.getElementById("tab-anzahl").textContent = `${r.length} von ${zeilen.length} Netzbetreibern`;
  }
  document.getElementById("suche-vnb").addEventListener("input", tabelle);
  document.querySelectorAll("#tabelle th[data-k]").forEach(th => th.addEventListener("click", () => {
    sortAuf = sortK === th.dataset.k ? !sortAuf : true; sortK = th.dataset.k; tabelle();
  }));

  const m = K.mastr;
  document.getElementById("quellenzeile").textContent =
    `Stand der Daten: BKZ-Datensatz, Stichtag ${datum(K.datensatz.stichtag)} (${K.datensatz.werte_in_auswertung} Werte in der Auswertung) · ` +
    `MaStR-Gesamtdatenexport ${m.datei} (SHA-256 ${String(m.sha256).slice(0, 16)}…, ${m.gezaehlt?.toLocaleString("de-DE")} Einheiten in Betrieb zugeordnet) · Karte erzeugt am ${datum(K.erzeugt)}.`;

  faerben(); tabelle();
})();
