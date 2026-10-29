# GitHub-Anleitung – Galerie

## Die wichtigsten Links

- **Live-Seite:** https://tizigd.github.io/galerie/
- **GitHub-Repository:** https://github.com/tizigd/galerie
- **Lokaler Projektordner:** `/Users/schule/Documents/GitHub/galerie`

---

## 1. Was ist was?

| Ort | Bedeutung |
|---|---|
| **Lokaler Ordner** | Die Dateien auf deinem Mac |
| **GitHub-Repository** | Die Online-Kopie auf github.com |
| **GitHub Pages** | Die öffentliche Webseite, die aus dem Repository gebaut wird |

Wenn du etwas änderst, musst du es **vom lokalen Ordner zu GitHub** bringen. Erst dann ändert sich die Live-Seite.

---

## 2. Änderungen veröffentlichen (einfachster Weg)

Du brauchst dafür **GitHub Desktop**.

1. Neue ZIP entpacken (Doppelklick).
2. **GitHub Desktop** öffnen.
3. Das Repository **`galerie`** auswählen.
4. Im Finder die neuen Dateien in den lokalen Ordner kopieren:
   `/Users/schule/Documents/GitHub/galerie`
   - `index.html`
   - `galerie.css`
   - `galerie.js`
   - `galerie.json`
   - Ordner `media/`
5. GitHub Desktop zeigt die Änderungen an.
6. Unten links eine Beschreibung eingeben, z. B. **„Galerie aktualisiert“**.
7. Auf **„Commit to main“** klicken.
8. Oben rechts auf **„Push origin“** klicken.
9. 1–2 Minuten warten.
10. Live-Seite öffnen und **⌘⇧R** drücken.

Fertig – die Änderungen sind live.

---

## 3. Kleine Textänderungen direkt auf GitHub

Für kleine Korrekturen (z. B. einen Titel):

1. https://github.com/tizigd/galerie öffnen.
2. Die Datei anklicken (z. B. `galerie.json`).
3. Oben rechts auf den **Stift** (Edit) klicken.
4. Änderung machen.
5. Unten auf **„Commit changes“** klicken.
6. Kurz warten, dann die Live-Seite neu laden.

---

## 4. Neue Bilder oder Videos hinzufügen

Am einfachsten über den Editor:

1. Live-Seite öffnen: https://tizigd.github.io/galerie/
2. Auf **„Bearbeiten“** klicken.
3. Bilder/Videos hinzufügen, Reihenfolge ändern, Loop setzen.
4. Auf **„Als ZIP exportieren“** klicken.
5. Die ZIP wie in Punkt 2 veröffentlichen.

**Wichtig:** Änderungen im Editor sind zuerst nur lokal im Browser. Sie werden erst durch Export + Push für alle sichtbar.

---

## 5. GitHub Pages prüfen oder neu einschalten

1. Repository öffnen.
2. **Settings** → **Pages**.
3. Unter **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. **Save** klicken.
5. Nach 1–2 Minuten ist die Seite unter  
   https://tizigd.github.io/galerie/ erreichbar.

---

## 6. Ein Freund möchte seine eigene Version

**Variante A – ZIP schicken (einfach):**
1. Deine ZIP weitergeben.
2. Der Freund entpackt sie und lädt den Ordner bei  
   https://app.netlify.com/drop hoch.
3. Er bekommt eine eigene URL.

**Variante B – eigene GitHub-Pages-Seite:**
1. GitHub-Konto erstellen.
2. Dein Repository **forken**:  
   https://github.com/tizigd/galerie → **Fork**
3. Im eigenen Fork die Dateien ersetzen.
4. **Settings → Pages → main / root** einschalten.
5. Eigene URL: `https://SEIN-NAME.github.io/galerie/`

**Variante C – gemeinsam am gleichen Repository:**
- Du kannst ihn unter **Settings → Collaborators** hinzufügen.
- Dann kann er direkt pushen.
- Oder er stellt einen **Pull Request**.

---

## 7. Häufige Probleme

### Änderungen sind nicht sichtbar
- 1–2 Minuten warten.
- **⌘⇧R** drücken.
- Prüfen: **Settings → Pages**, ob der Build erfolgreich war.
- Bei alten lokalen Daten: **Bearbeiten → Zurücksetzen**.

### GitHub Desktop kann nicht pushen
- Oben rechts prüfen, ob du bei GitHub angemeldet bist.
- Internetverbindung prüfen.
- Bei „Pull“ zuerst die neuesten Änderungen holen.

### Datei ist zu gross
- GitHub erlaubt maximal **100 MB pro Datei**.
- Videos komprimieren oder kürzen.
- Das Repository sollte möglichst unter **1 GB** bleiben.

### „Seite zeigt noch die alte Version“
- Browser-Cache: **⌘⇧R**
- Oder privates Fenster öffnen.
- Oder auf der Seite **Bearbeiten → Zurücksetzen**.

### ZIP-Export im Browser funktioniert nicht
- Bei sehr grossen Galerien (über ca. 150 MB) kann Safari den Export blockieren.
- Dann die ZIP direkt aus dem Projektordner erstellen lassen oder Chrome verwenden.
- Die aktuelle ZIP liegt auf dem Schreibtisch und in Downloads.

### `index.html` direkt öffnen funktioniert nicht
- Nicht doppelklicken.
- Im Terminal:
  ```bash
  cd /Users/schule/Documents/GitHub/galerie
  python3 -m http.server 8000
  ```
- Dann `http://localhost:8000/` öffnen.

---

## 8. Terminal-Alternative (für Fortgeschrittene)

```bash
cd /Users/schule/Documents/GitHub/galerie
git add .
git commit -m "Galerie aktualisiert"
git push
```

Wenn `git push` nach Zugangsdaten fragt:

```bash
gh auth login
```

Oder GitHub Desktop verwenden.

---

## 9. Wichtig für die Live-Seite

- Die Live-Seite ist **öffentlich**. Jeder mit dem Link kann sie anschauen.
- Der Editor auf der Live-Seite speichert Änderungen **nur im eigenen Browser**.
- Für alle sichtbar werden Änderungen erst nach **Export + Push**.
- Die 21 Medien sind aktuell fest veröffentlicht.
