"""Konsistenzprüfung des BKZ-Datensatzes (nach der externen Prüfung vom 24.11.2026).
Aufruf: python pruefung.py   – gibt jeden Regelverstoß aus; ohne Befund: „0 Befunde“."""
import os
import pandas as pd

D = os.path.dirname(os.path.abspath(__file__))
w = pd.read_csv(os.path.join(D, "bkz_werte_lang.csv"), sep=";", encoding="utf-8-sig", dtype=str)
q = pd.read_csv(os.path.join(D, "bkz_quellen.csv"), sep=";", encoding="utf-8-sig", dtype=str)
log = pd.read_csv(os.path.join(D, "download_log.csv"), sep=";", dtype=str)
STICHTAG = "2026-11-24"
befunde = []
def b(id_, text): befunde.append(f"{id_}: {text}")

a = w[w.in_auswertung == "ja"]
for _, r in a.iterrows():
    if not str(r.wert_status).startswith("PDF geprüft"): b(r.id, "in der Auswertung, aber nicht am Original geprüft")
    if r.netzebene in ("NS", "HöS"): b(r.id, f"Ebene {r.netzebene} in der Auswertung")
    if pd.notna(r.gueltig_bis) and r.gueltig_bis < STICHTAG: b(r.id, "am Stichtag abgelaufen, aber in der Auswertung")
    if pd.notna(r.gueltig_ab) and r.gueltig_ab > STICHTAG: b(r.id, "erst nach dem Stichtag gültig, aber in der Auswertung")
    if pd.isna(r.wert_eur_kw): b(r.id, f"{r.netzebene}: kein Wert in €/kW")
    if r.einheit == "€/kVA" and pd.isna(r.umrechnung_kva_kw): b(r.id, f"{r.netzebene}: €/kVA ohne Umrechnungsangabe")
    for k in ("methode_kat", "methode_beleg", "faktor_num", "speicher_sonderregel"):
        if pd.isna(r[k]): b(r.id, f"{r.netzebene}: {k} leer")
for _, r in w[w.in_auswertung == "nein"].iterrows():
    if pd.isna(r.ausschlussgrund): b(r.id, f"{r.netzebene}: ausgeschlossen ohne Grund")

ids = set(a.id)
for _, r in q.iterrows():
    if r.id in ids and not str(r.veroeffentlichung).startswith("Wert veröffentlicht"):
        b(r.id, f"Wert in der Auswertung, aber Kategorie „{r.veroeffentlichung}“")
    if r.id not in ids and str(r.veroeffentlichung).startswith("Wert veröffentlicht") and r.anzahl_werte != "0":
        g = w[(w.id == r.id) & (w.netzebene != "NS")].ausschlussgrund.dropna()
        if g.str.contains("nicht am Original").any():
            b(r.id, "Kategorie „Wert veröffentlicht“, Wert aber nicht am Original geprüft")

m = log.merge(q[["id", "doc_url", "pdf_datei"]], on="id", how="left")
for _, r in m.iterrows():
    if r.url != r.doc_url: b(r.id, "URL im Download-Log ≠ doc_url")
    if pd.notna(r.datei) and r.datei != r.pdf_datei: b(r.id, "Datei im Download-Log ≠ pdf_datei")
for i in ids - set(log[log.sha256 != "FEHLT"].id):
    b(i, "Dokument der Auswertung ohne Prüfsumme im Download-Log")

print(f"{len(befunde)} Befunde")
for x in befunde: print(" -", x)
