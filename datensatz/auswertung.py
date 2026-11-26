"""Erzeugt alle Zahlen des README (Abschnitte 1, 3, 4.3) aus den veröffentlichten Dateien dieses Ordners.
Aufruf: python auswertung.py   (benötigt pandas; für die Stichprobe zusätzlich openpyxl und scipy)
Quantile: lineare Interpolation (pandas-Standard = Excel QUANTIL.INKL / R type 7)."""
import os
import pandas as pd

D = os.path.dirname(os.path.abspath(__file__))
w = pd.read_csv(os.path.join(D, "bkz_werte_lang.csv"), sep=";", encoding="utf-8-sig")
q = pd.read_csv(os.path.join(D, "bkz_quellen.csv"), sep=";", encoding="utf-8-sig")
a = w[w.in_auswertung == "ja"].copy()
a["wert_eur_kw"] = a.wert_eur_kw.astype(float)
EB = ["HöS/HS", "HS", "HS/MS", "MS", "MS/NS"]


def tabelle(d, titel):
    print(f"\n{titel}")
    print("Netzebene;n;P10;Median;P90")
    for e in EB:
        x = d[d.netzebene == e].wert_eur_kw
        if len(x):
            print(f"{e};{len(x)};{x.quantile(.1):.2f};{x.median():.2f};{x.quantile(.9):.2f}")


print(f"Werte in der Auswertung: {len(a)} · VNB (Dokumente): {a.id.nunique()} · "
      f"alle am Original geprüft: {a.wert_status.str.startswith('PDF geprüft').all()}")
tabelle(a, "1 Hauptergebnis (€/kW, wie veröffentlicht, am Stichtag gültig)")
print("\nMS nach Region (n; Median):")
for r, x in a[a.netzebene == "MS"].groupby("region").wert_eur_kw:
    print(f"  {r}: {len(x)}; {x.median():.2f}")

print("\n3.3 Einheiten und Umrechnung:", a.einheit.value_counts().to_dict())
print("   Umrechnung €/kVA:", a.umrechnung_kva_kw.dropna().value_counts().to_dict())
print("\n3.4 Ausschlussgründe (Zeilen):")
for g, n in w.ausschlussgrund.dropna().value_counts().items():
    print(f"  {n:4d}  {g}")

v = q[q.id.isin(a.id.unique())]
print("\n3.6 Methode je Dokument der Auswertung (n = %d):" % len(v))
print("  methode_kat:", v.methode_kat.value_counts().to_dict())
print("  methode_beleg:", v.methode_beleg.value_counts().to_dict())
print("  speicher_sonderregel:", v.speicher_sonderregel.value_counts().to_dict())
fk = a[a.faktor_num.astype(float) < 1]
print(f"  Werte mit Faktor < 1: {len(fk)} von {fk.id.nunique()} Dokumenten")

print("\n4.3 Kategorie veroeffentlichung (Dokumente):", q.veroeffentlichung.fillna("(leer)").value_counts().to_dict())

print("\nSensitivität (Mediane €/kW):")
s1 = a[a.gilt_2026.fillna("").str.startswith("ja")]
s2 = a[~(a.faktor_num.astype(float) < 1)]
s3 = a[a.einheit == "€/kW"]
print("Netzebene;Haupt;nur ausdrücklich 2026;nur Faktor 1;nur €/kW-Blätter")
for e in EB[1:]:
    m = [d[d.netzebene == e].wert_eur_kw for d in (a, s1, s2, s3)]
    print(e + ";" + ";".join(f"{x.median():.2f} (n={len(x)})" for x in m))

# Abdeckung (Erlösobergrenze 2026)
eog = pd.read_csv(os.path.join(D, "groesse_eog_2026.csv"), sep=";", encoding="utf-8-sig")
z = pd.read_csv(os.path.join(D, "eog_zuordnung.csv"), sep=";", encoding="utf-8-sig")
top = eog[eog["kum_anteil_%"] <= 90.0001]
anteil = 100 * eog[eog.Unternehmen.isin(z.eog_unternehmen)].eog_2026_eur.sum() / eog.eog_2026_eur.sum()
print(f"\n3.1 Abdeckung: {len(top)} VNB bis 90 % EOG · VNB der Auswertung: {len(z)} = {anteil:.1f} % der EOG "
      f"aller {len(eog)} VNB · davon unter den 90-%-VNB: {z.eog_unternehmen.isin(top.Unternehmen).sum()}")

# Stichprobe (Paul, 24.11.2026): Clopper-Pearson über die Binomialverteilung (Bisektion, ohne scipy)
from math import comb
def cdf(k, n, p): return sum(comb(n, i) * p**i * (1 - p)**(n - i) for i in range(k + 1))
def bis(f, lo=0.0, hi=1.0):
    for _ in range(100):
        m = (lo + hi) / 2
        lo, hi = (m, hi) if f(m) > 0 else (lo, m)
    return (lo + hi) / 2
try:
    s = pd.read_excel(os.path.join(D, "Stichprobe_Pruefung_2026-11-24.xlsx"), sheet_name="Prüfliste")
    n = len(s); k = int(((s["Wert stimmt? (ja/nein)"] != "ja") | (s["Methode stimmt? (ja/nein)"] != "ja")).sum())
    hi = bis(lambda p: cdf(k, n, p) - 0.025)
    lo = 0.0 if k == 0 else bis(lambda p: 0.975 - cdf(k - 1, n, p))
    print(f"\n3.5 Stichprobe: {k} Fehler in {n} Werten · 95-%-KI (Clopper-Pearson) {100*lo:.1f}–{100*hi:.1f} %")
except Exception as ex:  # noqa: BLE001
    print("\n3.5 Stichprobe nicht ausgewertet:", ex)
