# BKZ-Datensatz Deutschland 2026 (Strom, oberhalb Niederspannung)

Stichtag: **24.11.2026** · Bearbeitung: Paul Schneider-Strittmatter (HTWG Konstanz), Erhebung mit KI-Unterstützung (Abschnitt 7) · Fassung nach zweiter Prüfung und Nachsuche vom 24.11.2026, TEN aufgenommen am 25.11.2026.

**English summary.** Published grid-connection capacity charges (Baukostenzuschuss, BKZ) of German electricity distribution system operators above low voltage, valid on 24 Nov 2026: 332 values from 125 operators (77.3 % of the 2026 revenue caps of all 808 DSOs), each checked against the original price sheet, with coding of the calculation method, operator discounts and storage rules. Main result (median, €/kW): HV 109.8 · HV/MV 111.7 · MV 125.4 · MV/LV 122.0. Scripts reproduce all figures (`auswertung.py`) and check consistency (`pruefung.py`).

## 1 Worum es geht

Netzbetreiber erheben beim Anschluss oberhalb der Niederspannung einen **Baukostenzuschuss (BKZ)** je bestellter Leistung. Oberhalb der Niederspannung besteht keine unmittelbare gesetzliche Pflicht, einen BKZ zu **erheben**; erhebt ein Netzbetreiber ihn, hält die BNetzA einen transparenten Ausweis, kalenderjährlich im Voraus, für erforderlich (Positionspapier BK8 vom 20.11.2024, S. 6–7). Als Bemessung beschreibt das Papier das Leistungspreismodell: arithmetisches Mittel der Leistungspreise (> 2.500 h/a) der Anschlussnetzebene aus dem Jahr des Vertragsschlusses und den vier Vorjahren, mal bestellte Leistung (S. 8). Der BGH hat mit Beschluss vom 15.07.2025 (EnVR 1/24) den BKZ nach dem Leistungspreismodell auch für Batteriespeicher für zulässig erklärt.

Der Datensatz sammelt die **veröffentlichten BKZ-Preisblätter**, die am Stichtag gelten, und hält je Wert fest, auf welcher Netzebene er gilt, wie der Netzbetreiber ihn berechnet und wo er im Original steht.

**Hauptergebnis** (Werte mit `in_auswertung = ja`, €/kW, wie veröffentlicht; Quantile linear interpoliert, siehe 3.7):

| Netzebene | n | P10 | Median | P90 |
|---|---|---|---|---|
| HS | 47 | 51,7 | 109,8 | 161,2 |
| HS/MS | 69 | 54,4 | 111,7 | 153,4 |
| MS | 122 | 66,1 | 125,4 | 166,7 |
| MS/NS | 90 | 50,0 | 122,0 | 177,5 |
| HöS/HS | 4 | – | 103,8 | – |

332 Werte von 125 VNB, alle am Original geprüft. MS nach Region (Median, n): Nord 117,1 (14) · Ost 107,2 (16) · West 129,5 (54) · Süd 126,9 (38); beschreibend, ohne Test.

**Sensitivität** (Median €/kW): zeigt, wie stark Regelentscheidungen das Ergebnis verschieben.

| Netzebene | Hauptergebnis | nur Blätter mit ausdrücklicher Gültigkeit 2026 | nur Werte ohne Abschlag (Faktor 1) | nur Blätter in €/kW |
|---|---|---|---|---|
| HS | 109,8 (47) | 110,0 (44) | 112,7 (43) | 109,8 (41) |
| HS/MS | 111,7 (69) | 115,7 (64) | 115,7 (62) | 111,7 (59) |
| MS | 125,4 (122) | 129,5 (106) | 126,0 (114) | 126,0 (108) |
| MS/NS | 122,0 (90) | 132,0 (82) | 126,9 (82) | 126,0 (76) |

## 2 Dateien (Veröffentlichungspaket)

| Datei | Inhalt |
|---|---|
| `bkz_werte_lang.csv` | **Hauptdatensatz:** ein Wert je Zeile (Dokument × Netzebene). Codebuch 4.1 |
| `bkz_quellen.csv` | ein Dokument je Zeile (auch ohne Wert): URL, Fundort, Gültigkeit, Kategorie, Methode. Codebuch 4.2 |
| `BKZ_Datensatz_2026.xlsx` | dieselben Daten zum Lesen (Hauptformat sind die CSV) |
| `auswertung.py` | erzeugt alle Zahlen dieses README aus den CSV-Dateien |
| `pruefung.py` | prüft die Regeln (Abschnitt 3.4) und die Verweise auf Dateien und Prüfsummen |
| `download_log.csv` | je Dokument: gesicherte Datei, Abrufweg, Größe, **SHA-256**, URL – Nachweis, welches Original gelesen wurde |
| `download.sh` | lädt die Originale erneut (1 Abruf/s, eigener User-Agent), schreibt `download_log_neu.csv`; abweichende SHA-256 = Dokument seither geändert |
| `groesse_eog_2026.csv` | VNB mit Erlösobergrenze (EOG) 2026, Anteil und kumuliertem Anteil (BNetzA-Veröffentlichung nach § 23b EnWG) |
| `eog_zuordnung.csv` | Zuordnung der VNB der Auswertung zur EOG-Liste (Abschnitt 3.1) |
| `grundgesamtheit_mastr.csv` | 828 aktive öffentliche Stromnetzbetreiber laut Marktstammdatenregister (Export 23.11.2026) mit Erhebungsstatus |
| `suchprotokoll_2026-11-24.jsonl` | Protokoll des zweiten Suchdurchgangs (3.2) |
| `Stichprobe_Pruefung_2026-11-24.xlsx` | Prüfliste der Stichprobe mit Ergebnis (3.5) |
| `uenb_regionalfaktoren.csv` | 414 Umspannanlagen der ÜNB mit Regionalisierungsfaktor (20–100 %) und BKZ 2026 |
| `lp_proxy_2026.csv` | Leistungspreise ≥ 2.500 h/a aus Netzentgelt-Preisblättern 2026 – Näherung, **kein** BKZ |

Nicht im Paket: die Originaldokumente (Urheberrecht der Netzbetreiber; nachprüfbar über URL und SHA-256 in `download_log.csv`) und die Arbeitsdateien der Erhebung (Stammdaten, Erfassungsskripte; auf Anfrage).

## 3 Methodik

### 3.1 Grundgesamtheit, Geltungsbereich, Abdeckung
Grundgesamtheit sind die aktiven öffentlichen Stromnetzbetreiber laut MaStR (828). Durchsucht wurden die VNB nach absteigender Erlösobergrenze 2026 bis 90 % der kumulierten EOG aller VNB (234 VNB), dazu VNB, die aus früheren Arbeitsständen schon erfasst waren. Begründung: Die EOG ist ein frei verfügbares Größenmaß; kleine VNB veröffentlichen nach der Erfahrung der Suche selten ein BKZ-Preisblatt oberhalb NS. Eine Zufallsstichprobe kleiner VNB wurde nicht gezogen. Der Datensatz ist daher **keine repräsentative Stichprobe aller VNB**.

**Abdeckung:** Die 125 VNB der Auswertung stehen für **77,3 % der Erlösobergrenzen 2026** aller 808 VNB der BNetzA-Liste; 116 davon gehören zu den 234 VNB bis 90 % EOG, 9 wurden zusätzlich erfasst. Die übrigen durchsuchten VNB haben keinen prüfbaren Wert oberhalb NS veröffentlicht (Kategorien 4.3) – das misst auch, wer transparent ist. Zuordnung über Namensabgleich, fünf Umfirmierungen bzw. Schreibweisen von Hand (`eog_zuordnung.csv`, Spalte `zuordnung`; Hamburger Energienetze ↔ Stromnetz Hamburg und RheinNetz ↔ Rheinische NETZGesellschaft als Umfirmierung angenommen). Die EOG misst die Größe über alle Netzebenen, nicht die Zahl der MS-Anschlüsse.

### 3.2 Suche
1. Erster Durchgang: Website des Netzbetreibers (Netzanschluss, Preise, Downloads) und Websuche nach Preisblatt und Dateinamen; ergebnisbezogen in `bkz_quellen.csv` (`fundort`, `anmerkung`) dokumentiert, nicht als eigenes Protokoll.
2. Zweiter Durchgang (24.11.2026) für alle VNB ohne Wert: Websuche „Baukostenzuschuss Mittelspannung 2026“ mit Domainfilter auf die Website des Netzbetreibers; jeder Treffer am Original geprüft (`suchprotokoll_2026-11-24.jsonl`).
3. Server, die automatische Abrufe sperren (HTTP 403, JavaScript), wurden im Browser von Hand geladen. Webseiten als Original sind als HTML gesichert; lädt eine Seite ihren Inhalt per JavaScript, als Textauszug des angezeigten Inhalts mit Abrufzeit (N-ERGIE).
4. Nachsuche (24.11.2026) nach der zweiten Prüfung (3.5): der Autor hat die größten VNB ohne Wert nach EOG im Browser durchsucht. Neu: Avacon, N-ERGIE, Stadtwerke Tuttlingen; bei SWM, MVV und Ulm Netze bestätigt, dass oberhalb NS kein Wert veröffentlicht ist. TEN (bisher als „Sonderformel“ ausgeschlossen) zählt seit 25.11.2026: Das Merkblatt nennt S. 2 die Werte ausdrücklich als „Baukostenzuschuss in € pro kW (netto)“; die Formel auf S. 1 (Faktor × Leistungspreis) ergibt mit dem Leistungspreis 2026 nicht diese Werte; mit dem Zwölffachen passen HS und HS/MS (12 × 0,0076 × 112,06 = 10,22 bzw. 12 × 0,0076 × 126,53 = 11,54 €/kW), MS nicht (13,28 statt 11,94). Maßgeblich ist der veröffentlichte Wert. Die Werte (HS 10,26 · HS/MS 11,63 · MS 11,94 €/kW) sind auffällig niedrig.

„Keine Angabe gefunden“ heißt: nach den Suchdurchgängen nicht gefunden – nicht „nicht veröffentlicht“.

### 3.3 Erfassung
- Werte **netto** in der Einheit des Dokuments (`bkz_netto`, `einheit`); Netzebene vereinheitlicht (`netzebene`), Originalbezeichnung in `netzebene_original`.
- `wert_eur_kw`: €/kVA mit dem Faktor laut Dokument umgerechnet (0,9 bei 6 Werten; „kW = kVA“ laut Dokument bei 9); ohne Angabe Annahme 1,0 (cos φ = 1; 30 Werte, davon 4 bei NRM, deren Faktor 0,9 im Blatt nur für NS gilt). 287 Werte stehen schon in €/kW.
- Methode je Dokument aus dem Originaltext: `methode_kat`, `methode_beleg`, `faktor_num` (pauschaler Abschlag des Netzbetreibers; 1,0 = kein Abschlag genannt), Sonderregeln für Speicher (`speicher_sonderregel`, `speicher_faktor`) und Flexibilität (`flex_regel`). Gelten Faktoren je Ebene verschieden (z. B. 0,5 für NS-Anschlüsse an der Umspannung MS/NS), stehen sie in der Wertzeile.
- **Pauschale Abschläge** (Faktor < 1, 27 Werte von 10 Dokumenten) sind in den Werten **enthalten** – die Werte sind die veröffentlichten Preise, die ein Anschlussnehmer zahlt. **Speicher- und Flexrabatte sind nicht enthalten.**

### 3.4 Was in die Auswertung kommt
Ein Wert zählt (`in_auswertung = ja`), wenn
1. sein Dokument **am Stichtag 24.11.2026 gilt** (kein abgelaufenes „gültig bis“, kein „gültig ab“ nach dem Stichtag) und kein neueres Blatt desselben VNB gefunden wurde (`gilt_stichtag`);
2. er im Original nachgelesen ist (`wert_status` beginnt mit „PDF geprüft“; Webseiten als gesichertes HTML);
3. er einer VNB-Netzebene oberhalb NS eindeutig zugeordnet ist.

Ältere, weiter veröffentlichte Blätter ohne Nachfolger zählen also mit; die frühere Regel „nur ausdrücklich 2026“ steht als Sensitivität in Abschnitt 1 (Spalte `gilt_2026`). Ausgeschlossen (Grund in `ausschlussgrund`):

| Grund | Zeilen |
|---|---|
| NS (außerhalb des Geltungsbereichs; NS-BKZ nach NAV bzw. eigener NS-Regel) | 74 |
| erst nach dem Stichtag gültig (Blätter 2027) | 14 |
| ÜNB bzw. Wert des vorgelagerten ÜNB | 7 |
| durch neueres Blatt ersetzt | 5 |
| Sekundärquelle · Ebenenzuordnung unsicher | je 3 |
| nicht am Original geprüft (Original nicht abrufbar) | 1 |
| abgeleitet aus Netzentgelt | 1 |

HöS/HS (n = 4) sind Werte der VNB selbst; ob sie einen ÜNB-Wert weitergeben, ist nicht immer erkennbar (bei Bayernwerk ausdrücklich, dort ausgeschlossen).

### 3.5 Prüfung
- Jeder Wert der Auswertung wurde von Claude im Original nachgelesen.
- **Stichprobe (Autor):** 40 der damals 284 Werte zufällig auf Wertebene gezogen (pandas `sample`, `random_state = 2026`), vom Autor am Original auf Wert und Methode geprüft (`Stichprobe_Pruefung_2026-11-24.xlsx`): 0 Fehler, 95-%-Konfidenzintervall der Fehlerquote 0–8,8 % (Clopper-Pearson). Grenzen: nicht verblindet, Ziehung auf Wert- statt Dokumentebene, Gültigkeit, Faktor und Ausschluss nicht geprüft.
- **Externe Prüfung (24.11.2026):** 20 weitere zufällige Dokumente (69 Werte, nicht Teil der Stichprobe) von einem unabhängigen KI-Prüfer gegen das Original: **0 Fehler bei Wert, Einheit und Netzebene**; Fehler bei Methode oder Gültigkeit in 5 der 20 Dokumente, dazu Unstimmigkeiten in Regeln, Dateinamen und Dokumentation. Alle Befunde wurden am Original nachgesehen und korrigiert; daraus entstanden die Stichtagsregel, die Sensitivitätstabelle, `pruefung.py` und `auswertung.py`. Ein Wert (Vereinigte Stadtwerke Netz) war als geprüft geführt, obwohl nur ein Suchtreffer vorlag; er ist ausgeschlossen, die Regel „nur am Original geprüft“ wird jetzt von `pruefung.py` kontrolliert.
- **Zweite Prüfung (24.11.2026):** 40 Dokumente, über Dokumente gezogen und geschichtet (30 mit Wert in der Auswertung, 5 mit Wert außerhalb, 5 ohne Wert; Seed 20261124), alle kodierten Felder, Fehlerarten vorab festgelegt (Prüfbogen); dazu eigene Suche bei 5 zufälligen VNB ohne Wert. Prüfer war wieder ein KI-Modell (ChatGPT), keine Person. Ergebnis: **0 Fehler bei Wert, Einheit, Netzebene und Ein-/Ausschluss in 109 Wertzeilen**; 1 fehlender Wert (Hertener „Umspannung“, vorher wegen unklarer Ebene weggelassen); Metadaten falsch in 4 von 40 Dokumenten (Methode, Gültigkeit, Kategorie, Dateibezug); bei 1 von 5 VNB ohne Wert war doch ein Blatt veröffentlicht (Ansbach). Alle Befunde wurden vom Autor bzw. von Claude am Original nachgesehen und korrigiert. Folgerung: Die Suche ist die größere Fehlerquelle als die Erfassung; deshalb die Nachsuche (3.2, Punkt 4).
- Offen: eine Prüfung durch eine Person.

### 3.6 Befund zur Methode (125 Dokumente der Auswertung)
- Rechenweg ausdrücklich im Dokument: 60; nur Verweis auf das Positionspapier 2024: 23, auf 2009: 5, ohne Jahr: 6; keine Angabe: 31.
- Methode: Fünfjahresmittel 44 · Leistungspreis eines Jahres 8 · Mittel ohne Zeitraumangabe 4 · Festpreis/Pauschale 8 · Faktor × Leistungspreis (TEN) 1 · nicht angegeben 60.
- Pauschaler Abschlag (Faktor 0,3–0,8; bei NS-Anschlüssen an MS/NS 0,5): 27 Werte aus 10 Dokumenten. Speicher-Sonderregel bei 9 Dokumenten (meist × 0,3–0,5); 4 schließen einen Speicherabschlag ausdrücklich aus (z. B. Bayernwerk ab 01.10.2026 mit Verweis auf BGH EnVR 1/24).

### 3.7 Rechnung
Quantile mit linearer Interpolation (pandas-Standard = Excel QUANTIL.INKL = R type 7); andere Verfahren ergeben bei kleinen n abweichende P10/P90. Jeder VNB zählt gleich (keine Gewichtung nach Größe). Alle Zahlen: `python auswertung.py`; Regelprüfung: `python pruefung.py` (Stand: 0 Befunde).

## 4 Codebuch

### 4.1 `bkz_werte_lang.csv` (Semikolon, UTF-8 mit BOM)

| Spalte | Inhalt |
|---|---|
| `id` | Dokument-ID `BKZnnn`, gleich in allen Dateien und im Dateinamen des Originals |
| `netzbetreiber`, `bezugsjahr`, `typ`, `region`, `bundesland` | Name laut Dokument · Jahr, für das das Dokument in der Erhebung steht (2026 = Auswertung zum Stichtag; 2025 = Vorjahresblatt, 2027 = Folgejahresblatt, beide nur Historie; genaues Datum in `gueltig_ab`) · eigene Einordnung (Flächennetzbetreiber, Regionalversorger, Stadtwerk …) · Nord/Ost/West/Süd nach Hauptnetzgebiet · Kürzel |
| `netzebene` | HöS/HS · HS · HS/MS · MS · MS/NS · NS |
| `netzebene_original` | Bezeichnung im Dokument |
| `bkz_netto`, `einheit` | Wert netto in der Einheit des Dokuments (€/kW oder €/kVA) |
| `wert_status` | `PDF geprüft` (ggf. mit Zusatz zur Webseite) · `Websuche-Snippet` · `Sekundärquelle` · `ABGELEITET …` · `SONDERFORMEL` · `offen` |
| `in_auswertung`, `ausschlussgrund` | ja/nein nach 3.4, Grund bei „nein“ |
| `gueltig_ab`, `gueltig_bis` | Gültigkeit laut Dokument (leer = nicht angegeben) |
| `methode`, `faktor`, `speicher_regel`, `flex_regel`, `anmerkung` | Freitext aus dem Dokument bzw. Bearbeitungsverlauf |
| `doc_url`, `pdf_datei` | Quelle und Dateiname des gesicherten Originals |
| `methode_kat` | 5J-Mittel · Einzeljahr-LP · LP-Mittel ohne Zeitraumangabe · Festpreis/Pauschale · Sonderformel · nicht angegeben |
| `methode_beleg` | ausdrücklich im Dokument · nur Verweis Positionspapier 2024 / 2009 / Jahr nicht genannt · keine Angabe |
| `faktor_num` | pauschaler Abschlag als Zahl (1,0 = keiner genannt), je Ebene |
| `speicher_sonderregel`, `speicher_faktor` | ja · nein (ausdrücklich ohne Abschlag) · keine Angabe; Faktor für Speicher |
| `wert_eur_kw`, `umrechnung_kva_kw` | Wert in €/kW (3.3); Faktor und Herkunft der Umrechnung |
| `gilt_2026` | ausdrückliche Gültigkeit für 2026 laut Dokument (nur für die Sensitivität) |
| `gilt_stichtag` | ja / nein mit Grund (Regel 3.4) |

### 4.2 `bkz_quellen.csv`
Je Dokument: `id`, `netzbetreiber`, `bezugsjahr`, `typ`, `region`, `bundesland`, `dokument` (Titel), `doc_url`, `pdf_datei`, `gueltig_ab`, `gueltig_bis`, `stand`, `einheit`, `anzahl_werte`, `wert_status`, `methode`, `faktor`, `speicher_regel`, `mastr_name` (Name im MaStR), `flex_regel`, `fundort` (Menüpfad), `suchhinweis_folgejahr` (Dateinamensmuster), `anmerkung`, `abrufdatum` (Stichtag), `veroeffentlichung` (4.3), `suche_2_beleg` (Ergebnis des zweiten Durchgangs), `gilt_2026`, `gilt_stichtag`, `methode_kat`, `methode_beleg`, `faktor_num`, `speicher_sonderregel`, `speicher_faktor`, `methode_notiz`. Bedeutung wie 4.1.

### 4.3 Kategorie `veroeffentlichung` (254 Dokumente)

| Kategorie | Anzahl |
|---|---|
| Wert veröffentlicht | 129 |
| keine Angabe gefunden | 83 |
| nur Rechenregel, kein Wert | 12 |
| Industrienetz, keine Angabe | 9 |
| auf Anfrage / individuell | 6 |
| Folgejahr (gilt ab 2027) bzw. Vorjahr (ersetzt) | 6 |
| Altfassung nur im Suchindex, nicht am Original geprüft | 2 |
| nicht prüfbar (gesperrt, Original nicht abrufbar, nur Sekundärquelle) | 4 |
| Wert nur im Vertrag · MS bei anderer Gesellschaft · Dublette | je 1 |

„Wert veröffentlicht“ umfasst auch Dokumente, deren Wert aus anderem Grund nicht in die Auswertung kommt (unsichere Ebene, ÜNB).

### 4.4 `grundgesamtheit_mastr.csv`
`erhebungsstatus`: Wert in der Auswertung · Dokument ohne Wert in der Auswertung · gesucht, nichts gefunden · nicht im Datensatz (nicht gesucht oder Name nicht dem MaStR zugeordnet). Die Zuordnung zum MaStR ist ein Namensabgleich; maßgeblich für die Abdeckung ist 3.1.

## 5 Grenzen
- Erhebung der größeren VNB, keine Zufallsstichprobe; jeder VNB gleich gewichtet.
- Stichtag 24.11.2026; Netzbetreiber ändern Preisblätter auch unterjährig, Blätter 2027 erscheinen ab Dezember.
- Ältere, weiter veröffentlichte Blätter zählen (Regel 3.4); mit der Regel „nur ausdrücklich 2026“ läge der MS-Median um 5 €/kW höher (Sensitivität).
- €/kVA ohne Angabe mit cos φ = 1 umgerechnet (Annahme).
- Speicher- und Flexrabatte nicht in den Werten; für Speicher kann der tatsächliche BKZ deutlich niedriger sein.
- Regionen sind eine grobe eigene Einteilung.

## 6 Aktualisierung (jährlich)
1. `bkz_quellen.csv`: `fundort` und `suchhinweis_folgejahr` (Dateinamensmuster mit `<Jahr>`) nutzen; bei CDN-Links mit Hash über den Fundort gehen.
2. Neue Zeilen mit neuem `bezugsjahr` anhängen; alte bleiben als Historie (Regel „durch neueres Blatt ersetzt“).
3. ÜNB: vorläufiges Preisblatt Anfang Oktober, endgültiges Anfang Dezember auf netztransparenz.de; Regionalfaktoren mindestens alle zwei Jahre neu.

## 7 KI-Einsatz
Suche, Erfassung, Methodenkodierung, Skripte und dieses README entstanden mit Claude (Anthropic) unter Anleitung des Autors. Claude ist kein Autor. Festlegungen (Geltungsbereich, Stichtagsregel, Umgang mit Abschlägen, Ausschlüsse) traf der Autor. Prüfung: 3.5.

## 8 Veröffentlichung (geplant)
Zenodo, Lizenz CC BY 4.0 (Daten) mit DOI und Concept-DOI für jährliche Fassungen. Vor dem Upload ergänzen: `CITATION.cff`, Lizenzhinweis in den Dateien, Metadaten (Autoren mit ORCID und Hochschule, Stichtag, Raum DE, Schlagwörter, Verweis auf Bachelorarbeit und Artikel), maschinenlesbares Schema (`datapackage.json`), Wayback-Snapshots aller URLs.
