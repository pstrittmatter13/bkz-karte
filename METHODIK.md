# Methodik der BKZ-Karte

Die Karte zeigt zwei Dinge, die getrennt belegt sind:

1. **die Baukostenzuschüsse (BKZ)** der Netzbetreiber – aus dem BKZ-Datensatz (Ordner `datensatz/`, dort `README.md`): jeder Wert aus dem veröffentlichten Preisblatt, mit Fundstelle, Archivdatei und SHA-256-Prüfsumme;
2. **welcher Netzbetreiber in einer Gemeinde zuständig ist** – abgeleitet aus dem Marktstammdatenregister (MaStR) der Bundesnetzagentur.

Keine Werte werden geschätzt. Wo ein Netzbetreiber keinen BKZ veröffentlicht hat oder sein Preisblatt nicht gesucht wurde, bleibt die Gemeinde grau.

## 1 BKZ-Werte

Übernommen werden die Werte, die im Datensatz in die Auswertung gehen (`in_auswertung = ja`): am Stichtag gültig, Ebene oberhalb der Niederspannung, Wert am Original geprüft, keine Sonderformel oder abgeleiteten Werte. Regeln, Ausschlussgründe und Prüfung: `datensatz/README.md`. Einheit €/kW netto; €/kVA mit dem Faktor laut Preisblatt umgerechnet, ohne Angabe mit 1,0 (cos φ = 1, Annahme des Datensatzes).

Hat ein Netzbetreiber mehrere am Stichtag gültige Werte für eine Ebene, gilt der erste in Dokumentreihenfolge des Datensatzes; nach den Regeln des Datensatzes kommt das nicht vor.

## 2 Zuständiger Netzbetreiber je Gemeinde

Grenzen von Netzgebieten werden in Deutschland nicht amtlich veröffentlicht. Die Karte nähert sie auf Gemeindeebene aus dem MaStR:

**Datengrundlage:** MaStR-Gesamtdatenexport (Datei, Größe und SHA-256 in `data/mastr_stand.json`). Aus `Netzanschlusspunkte_*.xml` stammt je Lokation der Netzbetreiber (`NetzbetreiberMaStRNummer`) und die Spannungsebene (Katalog 15: 348 HöS, 349 HöS/HS, 350 HS, 351 HS/MS, 352 MS, 353 MS/NS, 354 NS); aus den Einheitendateien (Solar, Wind, Biomasse, Wasser, Verbrennung, Speicher, Verbraucher u. a.) je Einheit Gemeindeschlüssel, Lokation und Betriebsstatus. Gezählt werden nur Einheiten **in Betrieb** (Status 35). Ergebnis: `data/mastr_zaehlung.csv` (Gemeinde × Ebene × Netzbetreiber × Anzahl).

**Regel (Festlegung dieses Pakets):**

| Netz | gilt für die BKZ-Ebenen | zuständig ist … | wenn keine Anschlüsse dieser Ebene |
|---|---|---|---|
| MS-Netz | MS, MS/NS | der Netzbetreiber mit den meisten Anschlüssen auf MS oder MS/NS in der Gemeinde | Mehrheit der NS-Anschlüsse in der Gemeinde (gekennzeichnet „abgeleitet aus NS“) |
| HS-Netz | HS, HS/MS, HöS/HS | der Netzbetreiber mit den meisten Anschlüssen auf HS oder HS/MS in der Gemeinde | Mehrheit im Kreis, wenn dort mindestens 10 solche Anschlüsse liegen und ein Netzbetreiber mindestens 60 % hat; sonst VNBdigital (Abschnitt 2a); sonst **keine Zuordnung** („nicht eindeutig“, grau) |

Kreisfreie Städte stehen im MaStR teils mit fünfstelligem Schlüssel; sie werden um „000“ ergänzt. Gemeindeschlüssel ohne Gegenstück in den Gemeindegrenzen (Gemeindefusionen nach dem 31.12.2025) bleiben unberücksichtigt; das betrifft rund 6.200 von 8,2 Mio. Zuordnungen (`data/mastr_stand.json`, Prüfung in `src/baue_karte.py`). Gemeinden ohne jeden Anschluss sind fast ausschließlich gemeindefreie Gebiete (Forste, Seen).

**Umfang (Export 24.11.2026):** 9,84 Mio. Einheiten gelesen; 8,21 Mio. in Betrieb mit Gemeinde und Netzanschlusspunkt gezählt; 1,38 Mio. Einheiten in Betrieb ohne Netzanschlusspunkt im Register (überwiegend Kleinstanlagen) gehen nicht ein.

Bei Gleichstand gewinnt die kleinere MaStR-Nummer, damit das Ergebnis reproduzierbar ist. Das Panel zeigt zu jeder Gemeinde den Anteil des gewählten Netzbetreibers, die Zahl der Anschlüsse und die weiteren Netzbetreiber.

**Warum getrennt nach Netz:** An einem Ort betreiben oft verschiedene Unternehmen verschiedene Ebenen (z. B. ein Stadtwerk das MS-Netz, ein Regionalversorger das HS-Netz). Eine einzige Fläche je Ort wäre für eine der Ebenen falsch.

**Warum NS als Ersatz für MS:** Der Betreiber des NS-Netzes betreibt in der Regel auch das MS-Netz vor Ort; ohne MS-Anschluss in einer Gemeinde ist er die beste verfügbare Angabe aus derselben Quelle. Die Kennzeichnung macht die Ableitung sichtbar.

**Grenzen der Näherung:**
- Teilen sich mehrere Netzbetreiber eine Gemeinde, erscheint nur der überwiegende (Anteil wird angezeigt).
- Gezählt werden Anlagen, nicht Kunden oder Leitungslängen; in Gemeinden mit wenigen Anlagen ist die Zuordnung unsicherer (Anzahl wird angezeigt).
- Fehler im MaStR (falscher Netzbetreiber, veraltete Zuordnung nach Netzübernahme) gehen ein; maßgeblich ist der Stand des Exports.
- Gemeindegrenzen: Gebietsstand 31.12.2025 (BKG). Gemeindeschlüssel, die sich seitdem geändert haben, werden nicht zugeordnet.

## 2a Zweite Quelle für die HS-Lücke: VNBdigital

**Warum:** Den HS-Betreiber kennt das MaStR nur über Erzeugungs- und Speicheranlagen, die direkt an HS oder HS/MS hängen. In vielen Gegenden gibt es davon keine oder nur wenige (z. B. Zollernalbkreis 0, Kreis Tuttlingen 3). Die Umspannwerke, über die Stadtwerke versorgt werden, stehen nicht im MaStR.

**Quelle:** [VNBdigital](https://www.vnbdigital.de), die gemeinsame Internetplattform der Verteilnetzbetreiber nach § 14e EnWG, betrieben vom BDEW. Die Netzbetreiber tragen ihre Gebiete und Spannungsbereiche selbst ein; der BDEW prüft sie nach seinen Nutzungsbedingungen nicht.

**Vorgehen:** Abgefragt werden nur Gemeinden, denen nach der MaStR-Regel kein HS-Betreiber zugeordnet ist, mit dem Filter Spannungsbereich „Hochspannung“. Zwei Wege mit gleichem Ergebnisformat:
- *Suche nach Gemeinde* (Pilot, 129 Gemeinden): normale Suche „Ort/Gemeinde“ auf vnbdigital.de, Kreis im Suchtreffer geprüft; Link mit der Gemeindekennung von VNBdigital (`src/vnbdigital_csv.py`).
- *Abfrage an einem Punkt* (übrige Gemeinden): ein Punkt sicher innerhalb der Gemeindefläche (shapely `point_on_surface`, UTM32 → WGS84), dieselbe Abfrage, die die Kartensuche der Seite nutzt, höchstens eine je Sekunde; Rohantworten werden gespeichert (`src/vnbdigital_abfrage.py`, Spalte `punkt`). Ein Punkt steht für die ganze Gemeinde – grenzen dort zwei HS-Netze aneinander, kann der Punkt im anderen liegen.

Gespeichert werden je Gemeinde die angezeigten Netzbetreiber mit Hochspannung, das Abrufdatum und ein Link, der mit demselben Filter wieder zur Ergebnisseite führt (`zuordnung_vnbdigital.csv`); der Stand kann sich seit dem Abruf geändert haben.

**Regel:** Nennt VNBdigital genau einen Netzbetreiber mit Hochspannung, gilt er für die Gemeinde (Panel: „laut VNBdigital“, mit Link und Abrufdatum). Nennt es mehrere, bleibt die Gemeinde grau und das Panel nennt alle. Die MaStR-Nummer kommt über den Namen aus `data/mastr_netzbetreiber.csv`.

**Stand 25.11.2026:** 132 Gemeinden (Pilot: Kreise Freudenstadt, Rottweil, Schwarzwald-Baar, Tuttlingen, Tübingen, Zollernalb; Test: Lübeck, Neumünster, Ahrensburg); 130 mit einem HS-Betreiber, 2 mit mehreren (Schramberg, Mönchweiler). Die übrigen rund 2.900 Lücken-Gemeinden folgen.

## 3 Verknüpfung Datensatz ↔ MaStR

Jeder Netzbetreiber im Datensatz trägt seinen Namen laut MaStR (`mastr_name`); darüber wird die MaStR-Nummer aus `datensatz/grundgesamtheit_mastr.csv` gefunden. Ausnahmen mit Begründung: `zuordnung_hand.csv`. Meldet `src/baue_karte.py` einen Wert ohne MaStR-Nummer, fehlt dort ein Eintrag.

## 4 Kennzahlen auf der Seite

Mediane je Region werden über die Netzbetreiber mit Wert gebildet (ein Wert je Netzbetreiber und Ebene), nicht über Fläche, Einwohner oder Anschlüsse. Regionen wie im Datensatz (Nord, Ost, West, Süd).

## 5 Farbskala

Feste Klassen in €/kW (< 60, 60–90, 90–120, 120–150, 150–180, ≥ 180), für alle Ebenen gleich, damit Karten verschiedener Ebenen und Datenstände vergleichbar bleiben. Einfarbige Skala (hell = niedrig, dunkel = hoch). Zwei Grautöne: „gesucht, aber kein Wert, der zählt“ (Netzbetreiber im Datensatz, ohne Wert auf dieser Ebene) und „nicht gesucht oder Netzbetreiber unklar“.
