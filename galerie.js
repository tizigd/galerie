(() => {
  "use strict";

  /* ------------------------------------------------------------
     DOM
     ------------------------------------------------------------ */

  const buehne = document.getElementById("buehne");
  const buehneBereich = document.getElementById("buehne-bereich");
  const vollbildBtn = document.getElementById("vollbild");
  const vollbildTitel = document.getElementById("vollbild-titel");
  const aktuellEl = document.getElementById("aktuell");
  const gesamtEl = document.getElementById("gesamt");
  const balken = document.getElementById("fortschritt-balken");
  const statusEl = document.getElementById("status");
  const weiterBtn = document.getElementById("weiter");
  const weiterText = weiterBtn.querySelector(".weiter-text");
  const zurueckBtn = document.getElementById("zurueck");
  const steuerung = document.querySelector(".steuerung");
  const teilenBtn = document.getElementById("teilen");
  const bearbeitenBtn = document.getElementById("bearbeiten");

  const editor = document.getElementById("editor");
  const editorSchliessen = document.getElementById("editor-schliessen");
  const editorListe = document.getElementById("editor-liste");
  const editorStatus = document.getElementById("editor-status");
  const dateienHinzufuegen = document.getElementById("dateien-hinzufuegen");
  const dateiInput = document.getElementById("datei-input");
  const zuruecksetzen = document.getElementById("zuruecksetzen");
  const exportierenBtn = document.getElementById("exportieren");
  const jsonExportierenBtn = document.getElementById("json-exportieren");
  const dropOverlay = document.getElementById("drop-overlay");

  /* ------------------------------------------------------------
     Konstanten und Zustand
     ------------------------------------------------------------ */

  const STORAGE_KEY = "galerie-state-v1";
  const DB_NAME = "galerie-db";
  const DB_VERSION = 1;
  const STORE = "media";

  let stateItems = [];
  let runtimeItems = [];
  let index = 0;
  let editorOpen = false;
  let pseudoVollbild = false;
  let dragItem = null;
  let dragTiefe = 0;
  let swipeStart = null;
  const hoverFaehig = window.matchMedia("(hover: hover)").matches;

  const objectUrls = new Set();
  let dbPromise = null;

  const zahl = (n) => String(n).padStart(2, "0");
  const setStatus = (text) => { statusEl.textContent = text; };
  const setEditorStatus = (text) => { editorStatus.textContent = text; };

  /* ------------------------------------------------------------
     IndexedDB
     ------------------------------------------------------------ */

  function openDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return dbPromise;
  }

  async function idbPut(key, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbGet(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function idbDelete(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbClear() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /* ------------------------------------------------------------
     Daten laden und speichern
     ------------------------------------------------------------ */

  async function loadDefaultItems() {
    const response = await fetch("galerie.json", { cache: "no-store" });
    if (!response.ok) throw new Error("galerie.json konnte nicht geladen werden.");
    return response.json();
  }

  async function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        /* ungültig – Standarddaten laden */
      }
    }
    return loadDefaultItems();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateItems));
    } catch (error) {
      setEditorStatus("Speichern fehlgeschlagen. Ist der Browser-Speicher voll?");
    }
  }

  async function requestPersistence() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }
    } catch (error) {
      /* nicht unterstützt */
    }
  }

  async function resolveItems(items) {
    const result = [];

    for (const item of items) {
      const copy = { ...item };

      if (item.blobKey) {
        const blob = await idbGet(item.blobKey).catch(() => null);
        if (blob) {
          copy.src = URL.createObjectURL(blob);
          objectUrls.add(copy.src);
        } else {
          copy.src = "";
          copy.missing = true;
        }
      }

      if (item.posterKey) {
        const poster = await idbGet(item.posterKey).catch(() => null);
        if (poster) {
          copy.poster = URL.createObjectURL(poster);
          objectUrls.add(copy.poster);
        }
      }

      result.push(copy);
    }

    return result;
  }

  function revokeObjectUrls() {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls.clear();
  }

  /* ------------------------------------------------------------
     Galerie rendern
     ------------------------------------------------------------ */

  function renderSlides() {
    buehne.innerHTML = "";

    runtimeItems.forEach((item, i) => {
      const figure = document.createElement("figure");
      figure.className = "slide" + (i === index ? " ist-aktiv" : "");
      figure.dataset.typ = item.typ;
      figure.dataset.id = item.id;
      figure.setAttribute("aria-hidden", String(i !== index));
      figure.inert = i !== index;

      const medium = document.createElement("div");
      medium.className = "medium";

      if (!item.src) {
        const fehlt = document.createElement("div");
        fehlt.className = "medium-fehlt";
        fehlt.textContent = "Medium nicht gefunden";
        medium.appendChild(fehlt);
      } else if (item.typ === "video") {
        const video = document.createElement("video");
        video.src = item.src;
        if (item.poster) video.poster = item.poster;
        video.controls = true;
        video.playsInline = true;
        video.loop = Boolean(item.loop);
        video.preload = "metadata";
        video.setAttribute("aria-label", item.alt || item.titel || "Video");
        medium.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.src = item.src;
        img.alt = item.alt || item.titel || "Bild";
        if (i > 0) {
          img.loading = "lazy";
          img.decoding = "async";
        }
        medium.appendChild(img);
      }

      const caption = document.createElement("figcaption");
      const nummer = document.createElement("span");
      nummer.className = "nummer";
      nummer.textContent = zahl(i + 1);

      const titel = document.createElement("span");
      titel.className = "titel";
      titel.textContent = item.titel || "Ohne Titel";

      const art = document.createElement("span");
      art.className = "art";
      const artText = item.art || (item.typ === "video" ? "Video" : "Bild");
      art.textContent =
        item.typ === "video" && item.loop ? `${artText} · Loop` : artText;

      caption.append(nummer, titel, art);
      figure.append(medium, caption);
      buehne.appendChild(figure);
    });
  }

  function renderEditor() {
    editorListe.innerHTML = "";

    stateItems.forEach((item, i) => {
      const runtime = runtimeItems[i];

      const li = document.createElement("li");
      li.className = "editor-item";
      li.dataset.id = item.id;

      const griff = document.createElement("button");
      griff.type = "button";
      griff.className = "griff";
      griff.setAttribute("aria-label", "Verschieben: " + (item.titel || "Medium"));
      griff.textContent = "⋮⋮";

      const thumb = document.createElement("div");
      thumb.className = "editor-thumb";

      if (runtime && runtime.src) {
        if (item.typ === "video") {
          const video = document.createElement("video");
          video.src = runtime.src;
          if (runtime.poster) video.poster = runtime.poster;
          video.muted = true;
          video.playsInline = true;
          video.preload = "metadata";
          thumb.appendChild(video);
        } else {
          const img = document.createElement("img");
          img.src = runtime.src;
          img.alt = "";
          thumb.appendChild(img);
        }
      } else {
        thumb.textContent = "?";
      }

      const info = document.createElement("div");
      info.className = "editor-info";

      const strong = document.createElement("strong");
      strong.textContent = item.titel || "Ohne Titel";

      const small = document.createElement("span");
      small.textContent =
        (item.typ === "video" ? "Video" : "Bild") +
        (item.fileName ? " · " + item.fileName : "");

      info.append(strong, small);

      if (item.typ === "video") {
        const loopLabel = document.createElement("label");
        loopLabel.className = "loop-schalter";

        const loopCheckbox = document.createElement("input");
        loopCheckbox.type = "checkbox";
        loopCheckbox.checked = Boolean(item.loop);

        loopCheckbox.addEventListener("change", () => {
          item.loop = loopCheckbox.checked;
          saveState();

          const slide = buehne.querySelector(
            `.slide[data-id="${CSS.escape(item.id)}"]`
          );
          const video = slide?.querySelector("video");
          if (video) video.loop = loopCheckbox.checked;

          setEditorStatus(
            loopCheckbox.checked ? "Loop aktiviert." : "Loop deaktiviert."
          );
        });

        const loopText = document.createElement("span");
        loopText.textContent = "Loop";

        loopLabel.append(loopCheckbox, loopText);
        info.append(loopLabel);
      }

      const loeschen = document.createElement("button");
      loeschen.type = "button";
      loeschen.className = "editor-loeschen";
      loeschen.setAttribute("aria-label", "Löschen: " + (item.titel || "Medium"));
      loeschen.textContent = "×";

      li.append(griff, thumb, info, loeschen);
      editorListe.appendChild(li);
    });
  }

  /* ------------------------------------------------------------
     Slideshow
     ------------------------------------------------------------ */

  function setzeSlide(neu, { updateHash = true } = {}) {
    if (!runtimeItems.length) {
      index = 0;
      aktuellEl.textContent = "00";
      gesamtEl.textContent = "00";
      balken.style.width = "0%";
      weiterText.textContent = "Weiter";
      if (vollbildTitel) vollbildTitel.textContent = "";
      return;
    }

    index = (neu + runtimeItems.length) % runtimeItems.length;

    const slides = [...buehne.querySelectorAll(".slide")];

    slides.forEach((slide, i) => {
      const aktiv = i === index;
      slide.classList.toggle("ist-aktiv", aktiv);
      slide.setAttribute("aria-hidden", String(!aktiv));
      slide.inert = !aktiv;

      if (!aktiv) {
        const video = slide.querySelector("video");
        if (video) {
          try {
            video.pause();
            video.currentTime = 0;
          } catch (error) {
            /* noch nicht geladen */
          }
        }
      }
    });

    const aktiveSlide = slides[index];
    const video = aktiveSlide?.querySelector("video");
    if (video) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }

    aktuellEl.textContent = zahl(index + 1);
    gesamtEl.textContent = zahl(runtimeItems.length);
    balken.style.width = `${((index + 1) / runtimeItems.length) * 100}%`;
    weiterText.textContent = index === runtimeItems.length - 1 ? "Von vorne" : "Weiter";

    const item = runtimeItems[index];
    const art = item.typ === "video" ? "Video" : "Bild";
    setStatus(`${item.titel || art}, Medium ${index + 1} von ${runtimeItems.length}`);

    if (vollbildTitel) {
      vollbildTitel.textContent = item.titel || art;
    }

    if (updateHash) {
      try {
        history.replaceState(null, "", `#${index + 1}`);
      } catch (error) {
        window.location.hash = String(index + 1);
      }
    }

    if (vollbildAktiv()) {
      buehneBereich.focus({ preventScroll: true });
      bedienungVerstecken();
    }
  }

  const weiter = () => setzeSlide(index + 1);
  const zurueck = () => setzeSlide(index - 1);

  /* ------------------------------------------------------------
     Vollbild
     ------------------------------------------------------------ */

  function vollbildElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function vollbildAktiv() {
    return vollbildElement() === buehneBereich || pseudoVollbild;
  }

  function updateVollbildZustand() {
    if (vollbildElement() === buehneBereich) {
      pseudoVollbild = false;
    }

    const aktiv = vollbildAktiv();

    buehneBereich.classList.toggle("ist-vollbild", aktiv);
    document.body.classList.toggle("vollbild-offen", pseudoVollbild);
    vollbildBtn.setAttribute("aria-label", aktiv ? "Vollbild verlassen" : "Vollbild");
    vollbildBtn.title = aktiv ? "Vollbild verlassen (Esc)" : "Vollbild (F)";

    if (aktiv) {
      buehneBereich.focus({ preventScroll: true });

      if (hoverFaehig) {
        setzeVideoControls(false);
      }

      setStatus("Vollbild aktiv");
    } else {
      bedienungVerstecken();
      setzeVideoControls(true);
      vollbildBtn.focus({ preventScroll: true });
      setStatus("Vollbild beendet");
    }
  }

  async function vollbildUmschalten() {
    if (vollbildElement() === buehneBereich) {
      const beenden = document.exitFullscreen || document.webkitExitFullscreen;
      if (beenden) {
        try {
          await beenden.call(document);
        } catch (error) {
          /* ignorieren */
        }
      }
      return;
    }

    if (pseudoVollbild) {
      pseudoVollbild = false;
      updateVollbildZustand();
      return;
    }

    const starten =
      buehneBereich.requestFullscreen || buehneBereich.webkitRequestFullscreen;

    if (starten) {
      try {
        const ergebnis = starten.call(buehneBereich);
        if (ergebnis && typeof ergebnis.catch === "function") {
          ergebnis.catch(() => {});
        }
      } catch (error) {
        /* Fallback: CSS-Vollbild */
      }

      await new Promise((resolve) => setTimeout(resolve, 250));

      if (vollbildElement() === buehneBereich) {
        return;
      }
    }

    pseudoVollbild = true;
    updateVollbildZustand();
  }

  function bedienungZeigen() {
    if (!vollbildAktiv()) return;

    buehneBereich.classList.add("bedienung-sichtbar");

    if (hoverFaehig) {
      setzeVideoControls(true);
    }
  }

  function bedienungVerstecken() {
    buehneBereich.classList.remove("bedienung-sichtbar");

    if (vollbildAktiv() && hoverFaehig) {
      setzeVideoControls(false);
    }
  }

  function setzeVideoControls(sichtbar) {
    document.querySelectorAll(".slide video").forEach((video) => {
      video.controls = sichtbar;
    });
  }

  async function refresh() {
    const aktiveId = runtimeItems[index]?.id;

    revokeObjectUrls();
    runtimeItems = await resolveItems(stateItems);

    if (aktiveId) {
      const neu = runtimeItems.findIndex((item) => item.id === aktiveId);
      index = neu >= 0 ? neu : Math.min(index, Math.max(0, runtimeItems.length - 1));
    } else {
      index = Math.min(index, Math.max(0, runtimeItems.length - 1));
    }

    if (!runtimeItems.length) index = 0;

    renderSlides();
    renderEditor();
    setzeSlide(index, { updateHash: false });

    if (!runtimeItems.length) {
      buehne.innerHTML =
        '<p class="leer">Noch keine Medien. Klicke auf „Bearbeiten“, um Bilder oder Videos hinzuzufügen.</p>';
    }
  }

  /* ------------------------------------------------------------
     Editor öffnen / schließen
     ------------------------------------------------------------ */

  function openEditor() {
    editorOpen = true;
    editor.hidden = false;
    document.body.classList.add("editor-offen");
    renderEditor();
    editorSchliessen.focus();
    requestPersistence();
  }

  function closeEditor() {
    editorOpen = false;
    editor.hidden = true;
    document.body.classList.remove("editor-offen");
    saveState();
    refresh();
    bearbeitenBtn.focus();
  }

  /* ------------------------------------------------------------
     Dateien hinzufügen
     ------------------------------------------------------------ */

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function videoPoster(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      let erledigt = false;
      const fertig = (blob) => {
        if (erledigt) return;
        erledigt = true;
        URL.revokeObjectURL(url);
        video.remove();
        resolve(blob);
      };

      video.addEventListener("loadeddata", () => {
        try {
          video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
        } catch (error) {
          fertig(null);
        }
      });

      video.addEventListener("seeked", () => {
        try {
          const breite = Math.min(640, video.videoWidth || 640);
          const hoehe = Math.round((video.videoHeight / video.videoWidth) * breite) || 360;
          const canvas = document.createElement("canvas");
          canvas.width = breite;
          canvas.height = hoehe;
          canvas.getContext("2d").drawImage(video, 0, 0, breite, hoehe);
          canvas.toBlob((blob) => fertig(blob), "image/jpeg", 0.8);
        } catch (error) {
          fertig(null);
        }
      });

      video.addEventListener("error", () => fertig(null));
      setTimeout(() => fertig(null), 6000);
    });
  }

  async function handleFiles(files) {
    const liste = [...files].filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (!liste.length) {
      setEditorStatus("Bitte nur Bilder oder Videos auswählen.");
      return;
    }

    if (editor.hidden) openEditor();
    setEditorStatus(`${liste.length} Datei(en) werden verarbeitet …`);

    for (const file of liste) {
      const id = uuid();
      const istVideo = file.type.startsWith("video/");
      const blobKey = id;
      let posterKey = "";

      try {
        await idbPut(blobKey, file);
      } catch (error) {
        setEditorStatus("Speichern fehlgeschlagen. Browser-Speicher voll?");
        continue;
      }

      if (istVideo) {
        const poster = await videoPoster(file);
        if (poster) {
          posterKey = id + "-poster";
          try {
            await idbPut(posterKey, poster);
          } catch (error) {
            posterKey = "";
          }
        }
      }

      const titel =
        file.name.replace(/\.[^.]+$/, "") || (istVideo ? "Video" : "Bild");

      stateItems.push({
        id,
        typ: istVideo ? "video" : "bild",
        blobKey,
        posterKey,
        fileName: file.name,
        titel,
        art: istVideo ? "Video" : "Bild",
        alt: file.name,
        loop: false
      });
    }

    saveState();
    await refresh();
    setEditorStatus("Gespeichert. Die Änderungen bleiben in diesem Browser.");
  }

  async function deleteItem(id) {
    const idx = stateItems.findIndex((item) => item.id === id);
    if (idx < 0) return;

    const item = stateItems[idx];

    // Sofort aus der Liste entfernen, damit das X sichtbar reagiert.
    stateItems.splice(idx, 1);
    saveState();
    renderEditor();
    setEditorStatus("Medium gelöscht.");

    try {
      await refresh();
    } catch (error) {
      setEditorStatus("Medium gelöscht, Ansicht konnte nicht aktualisiert werden.");
    }

    // Grosse Videos/Blobs erst danach im Hintergrund aufräumen.
    if (item.blobKey) {
      try {
        await idbDelete(item.blobKey);
      } catch (error) {
        /* ignorieren */
      }
    }

    if (item.posterKey) {
      try {
        await idbDelete(item.posterKey);
      } catch (error) {
        /* ignorieren */
      }
    }
  }

  async function resetAll() {
    if (!confirm("Alle lokalen Änderungen löschen und die veröffentlichte Galerie wiederherstellen?")) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);

    try {
      await idbClear();
    } catch (error) {
      /* ignorieren */
    }

    try {
      stateItems = await loadDefaultItems();
    } catch (error) {
      stateItems = [];
    }

    index = 0;
    await refresh();
    setEditorStatus("Zurückgesetzt.");
  }

  /* ------------------------------------------------------------
     Export
     ------------------------------------------------------------ */

  function dateiSauber(name) {
    const sauber = (name || "medium")
      .replace(/[^\w.\-]+/g, "_")
      .replace(/^_+/, "");
    return sauber || "medium";
  }

  function eindeutigerName(name, verwendet) {
    if (!verwendet.has(name)) {
      verwendet.add(name);
      return name;
    }

    const punkt = name.lastIndexOf(".");
    const basis = punkt > 0 ? name.slice(0, punkt) : name;
    const endung = punkt > 0 ? name.slice(punkt) : "";
    let nummer = 2;
    let kandidat = `${basis}-${nummer}${endung}`;

    while (verwendet.has(kandidat)) {
      nummer++;
      kandidat = `${basis}-${nummer}${endung}`;
    }

    verwendet.add(kandidat);
    return kandidat;
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);

    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }

    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function dosZeit(datum) {
    const zeit =
      ((datum.getHours() & 0x1f) << 11) |
      ((datum.getMinutes() & 0x3f) << 5) |
      (Math.floor(datum.getSeconds() / 2) & 0x1f);
    const tag =
      ((datum.getFullYear() - 1980) << 9) |
      ((datum.getMonth() + 1) << 5) |
      datum.getDate();
    return { zeit, tag };
  }

  async function createZip(files) {
    const encoder = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const { zeit, tag } = dosZeit(new Date());

    for (const file of files) {
      const nameBytes = encoder.encode(file.name);
      const data = new Uint8Array(await file.blob.arrayBuffer());
      const crc = crc32(data);

      const local = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, zeit, true);
      localView.setUint16(12, tag, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      local.set(nameBytes, 30);

      chunks.push(local, data);

      const cd = new Uint8Array(46 + nameBytes.length);
      const cdView = new DataView(cd.buffer);
      cdView.setUint32(0, 0x02014b50, true);
      cdView.setUint16(4, 20, true);
      cdView.setUint16(6, 20, true);
      cdView.setUint16(8, 0x0800, true);
      cdView.setUint16(10, 0, true);
      cdView.setUint16(12, zeit, true);
      cdView.setUint16(14, tag, true);
      cdView.setUint32(16, crc, true);
      cdView.setUint32(20, data.length, true);
      cdView.setUint32(24, data.length, true);
      cdView.setUint16(28, nameBytes.length, true);
      cdView.setUint16(30, 0, true);
      cdView.setUint16(32, 0, true);
      cdView.setUint16(34, 0, true);
      cdView.setUint16(36, 0, true);
      cdView.setUint32(38, 0, true);
      cdView.setUint32(42, offset, true);
      cd.set(nameBytes, 46);

      central.push(cd);
      offset += local.length + data.length;
    }

    const centralSize = central.reduce((summe, eintrag) => summe + eintrag.length, 0);
    const ende = new Uint8Array(22);
    const endView = new DataView(ende.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    return new Blob([...chunks, ...central, ende], { type: "application/zip" });
  }

  async function buildExport({ inklusiveDateien = true } = {}) {
    const verwendet = new Set();

    for (const item of stateItems) {
      if (item.src?.startsWith("media/")) verwendet.add(item.src.slice(6));
      if (item.poster?.startsWith("media/")) verwendet.add(item.poster.slice(6));
    }

    const items = [];
    const files = [];

    for (const item of stateItems) {
      const exportiert = {
        id: item.id,
        typ: item.typ,
        src: item.src || "",
        poster: item.poster || "",
        titel: item.titel || "",
        art: item.art || "",
        alt: item.alt || ""
      };

      if (item.typ === "video") {
        exportiert.loop = Boolean(item.loop);
      }

      if (item.blobKey) {
        const name = eindeutigerName(
          dateiSauber(
            item.fileName ||
              `${item.titel || "medium"}.${item.typ === "video" ? "mp4" : "jpg"}`
          ),
          verwendet
        );
        exportiert.src = `media/${name}`;

        if (inklusiveDateien) {
          const blob = await idbGet(item.blobKey).catch(() => null);
          if (blob) {
            files.push({ name: exportiert.src, blob });
          } else {
            exportiert.src = "";
          }
        }
      }

      if (item.posterKey) {
        const basis = (exportiert.src || "medium")
          .replace(/^media\//, "")
          .replace(/\.[^.]+$/, "");
        const name = eindeutigerName(`${basis}-poster.jpg`, verwendet);
        exportiert.poster = `media/${name}`;

        if (inklusiveDateien) {
          const poster = await idbGet(item.posterKey).catch(() => null);
          if (poster) {
            files.push({ name: exportiert.poster, blob: poster });
          } else {
            exportiert.poster = "";
          }
        }
      }

      items.push(exportiert);
    }

    if (inklusiveDateien) {
      const vorhanden = new Set();

      for (const item of items) {
        for (const key of ["src", "poster"]) {
          const pfad = item[key];
          if (!pfad || !pfad.startsWith("media/")) continue;
          if (files.some((datei) => datei.name === pfad)) continue;
          if (vorhanden.has(pfad)) continue;
          vorhanden.add(pfad);

          try {
            const response = await fetch(pfad, { cache: "no-store" });
            if (response.ok) {
              files.push({ name: pfad, blob: await response.blob() });
            }
          } catch (error) {
            /* Datei fehlt – überspringen */
          }
        }
      }

      for (const name of ["index.html", "galerie.css", "galerie.js", "README.md"]) {
        try {
          const response = await fetch(name, { cache: "no-store" });
          if (response.ok) {
            files.push({ name, blob: await response.blob() });
          }
        } catch (error) {
          /* überspringen */
        }
      }

      files.push({ name: ".nojekyll", blob: new Blob([""]) });
    }

    return { items, files };
  }

  async function exportZip() {
    setEditorStatus("ZIP wird erstellt …");

    try {
      const { items, files } = await buildExport({ inklusiveDateien: true });
      files.push({
        name: "galerie.json",
        blob: new Blob([JSON.stringify(items, null, 2)], { type: "application/json" })
      });

      const zip = await createZip(files);
      downloadBlob(zip, "galerie.zip");
      setEditorStatus("ZIP exportiert. Entpacken und die Dateien veröffentlichen.");
    } catch (error) {
      setEditorStatus("Export fehlgeschlagen: " + error.message);
    }
  }

  async function exportJson() {
    setEditorStatus("galerie.json wird erstellt …");

    try {
      const { items } = await buildExport({ inklusiveDateien: false });
      downloadBlob(
        new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }),
        "galerie.json"
      );
      setEditorStatus(
        "galerie.json exportiert. Hinweis: Neu hinzugefügte Medien sind nur im ZIP enthalten."
      );
    } catch (error) {
      setEditorStatus("Export fehlgeschlagen: " + error.message);
    }
  }

  /* ------------------------------------------------------------
     Reihenfolge per Ziehen (Maus und Touch)
     ------------------------------------------------------------ */

  function itemAusPunkt(x, y) {
    const element = document.elementFromPoint(x, y);
    return element?.closest?.(".editor-item") || null;
  }

  function pointerMove(event) {
    if (!dragItem) return;

    const ziel = itemAusPunkt(event.clientX, event.clientY);
    if (!ziel || ziel === dragItem) return;

    const rect = ziel.getBoundingClientRect();
    const davor = event.clientY < rect.top + rect.height / 2;
    editorListe.insertBefore(dragItem, davor ? ziel : ziel.nextSibling);
  }

  async function pointerUp() {
    if (!dragItem) return;

    dragItem.classList.remove("wird-gezogen");
    dragItem = null;

    window.removeEventListener("pointermove", pointerMove);

    const ids = [...editorListe.querySelectorAll(".editor-item")].map(
      (element) => element.dataset.id
    );
    const map = new Map(stateItems.map((item) => [item.id, item]));
    stateItems = ids.map((id) => map.get(id)).filter(Boolean);

    saveState();
    await refresh();
    setEditorStatus("Reihenfolge gespeichert.");
  }

  editorListe.addEventListener("pointerdown", (event) => {
    const griff = event.target.closest(".griff");
    if (!griff) return;

    event.preventDefault();
    dragItem = griff.closest(".editor-item");
    if (!dragItem) return;

    dragItem.classList.add("wird-gezogen");
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp, { once: true });
  });

  /* ------------------------------------------------------------
     Event-Listener
     ------------------------------------------------------------ */

  bearbeitenBtn.addEventListener("click", openEditor);
  editorSchliessen.addEventListener("click", closeEditor);
  weiterBtn.addEventListener("click", () => weiter());
  zurueckBtn.addEventListener("click", () => zurueck());
  vollbildBtn.addEventListener("click", vollbildUmschalten);
  document.addEventListener("fullscreenchange", updateVollbildZustand);
  document.addEventListener("webkitfullscreenchange", updateVollbildZustand);

  editor.addEventListener("click", (event) => {
    if (event.target === editor) closeEditor();
  });

  dateienHinzufuegen.addEventListener("click", () => dateiInput.click());

  dateiInput.addEventListener("change", async () => {
    if (dateiInput.files?.length) {
      await handleFiles(dateiInput.files);
      dateiInput.value = "";
    }
  });

  zuruecksetzen.addEventListener("click", resetAll);
  exportierenBtn.addEventListener("click", exportZip);
  jsonExportierenBtn.addEventListener("click", exportJson);

  editorListe.addEventListener("click", (event) => {
    const loeschen = event.target.closest(".editor-loeschen");
    if (!loeschen) return;

    const item = loeschen.closest(".editor-item");
    if (item) deleteItem(item.dataset.id);
  });

  /* Dateien per Drag & Drop auf die Seite ziehen */

  function hatDateien(event) {
    return Array.from(event.dataTransfer?.types || []).includes("Files");
  }

  window.addEventListener("dragenter", (event) => {
    if (!hatDateien(event)) return;
    event.preventDefault();
    dragTiefe++;
    dropOverlay.hidden = false;
  });

  window.addEventListener("dragover", (event) => {
    if (!hatDateien(event)) return;
    event.preventDefault();
    dropOverlay.hidden = false;
  });

  window.addEventListener("dragleave", (event) => {
    if (!hatDateien(event)) return;
    dragTiefe = Math.max(0, dragTiefe - 1);
    if (dragTiefe === 0) dropOverlay.hidden = true;
  });

  window.addEventListener("drop", async (event) => {
    if (!hatDateien(event)) return;
    event.preventDefault();
    dragTiefe = 0;
    dropOverlay.hidden = true;

    if (event.dataTransfer.files?.length) {
      await handleFiles(event.dataTransfer.files);
    }
  });

  /* Wischen (Touch/Stift) */

  buehne.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;

    const ziel = event.target;
    if (!(ziel instanceof Element) || ziel.closest("video, button, a")) return;

    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };

    try {
      buehne.setPointerCapture(event.pointerId);
    } catch (error) {
      /* ignorieren */
    }
  });

  buehne.addEventListener("pointerup", (event) => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;

    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        weiter({ hideControls: true });
      } else {
        zurueck({ hideControls: true });
      }
    }
  });

  buehne.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  /* Steuerleisten im Vollbild nur am unteren Rand zeigen */
  buehneBereich.addEventListener("mousemove", (event) => {
    if (!vollbildAktiv()) return;

    const rect = buehneBereich.getBoundingClientRect();
    const naheUnten = event.clientY > rect.bottom - 140;

    if (naheUnten) {
      bedienungZeigen();
    } else {
      bedienungVerstecken();
    }
  });

  buehneBereich.addEventListener("mouseleave", () => {
    bedienungVerstecken();
  });

  steuerung.addEventListener("mouseenter", () => {
    bedienungZeigen();
  });

  steuerung.addEventListener("mouseleave", () => {
    if (!vollbildAktiv()) return;
    bedienungVerstecken();
  });

  /* Klick aufs Video: Play/Pause, wenn die native Leiste ausgeblendet ist */
  buehne.addEventListener("click", (event) => {
    if (!vollbildAktiv() || !hoverFaehig) return;

    const video = event.target.closest("video");
    if (!video || video.controls) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  });

  /* Tastatur */

  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    if (pseudoVollbild && event.key === "Escape") {
      event.preventDefault();
      pseudoVollbild = false;
      updateVollbildZustand();
      return;
    }

    if (editorOpen) {
      if (event.key === "Escape") closeEditor();
      return;
    }

    const ziel = event.target;
    const istEingabe =
      ziel instanceof Element &&
      ziel.closest("input, textarea, select") !== null;

    if (!istEingabe && (event.key === "f" || event.key === "F")) {
      event.preventDefault();
      vollbildUmschalten();
      return;
    }

    const istBedienelement =
      ziel instanceof Element &&
      ziel.closest("button, a, input, textarea, select") !== null;
    const istVideo = ziel instanceof Element && ziel.closest("video") !== null;

    if (event.key === "Enter" && !istBedienelement) {
      event.preventDefault();
      weiter({ hideControls: true });
    } else if (event.key === "ArrowRight" && !istVideo) {
      event.preventDefault();
      weiter({ hideControls: true });
    } else if (event.key === "ArrowLeft" && !istVideo) {
      event.preventDefault();
      zurueck({ hideControls: true });
    }
  });

  /* Link teilen */

  async function kopiere(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        /* Fallback unten */
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const ok = document.execCommand("copy");
    textarea.remove();

    if (!ok) throw new Error("Kopieren fehlgeschlagen");
  }

  teilenBtn.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.hash = String(index + 1);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Galerie – Bilder und Videos",
          text: "Schau dir meine Galerie an – mit Enter geht es weiter.",
          url: url.toString()
        });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }

    try {
      await kopiere(url.toString());
      setStatus("Link kopiert.");
    } catch (error) {
      window.prompt("Link kopieren:", url.toString());
    }
  });

  window.addEventListener("hashchange", () => {
    if (editorOpen) return;

    const nr = Number.parseInt(window.location.hash.replace("#", ""), 10);
    if (Number.isInteger(nr) && nr >= 1 && nr <= runtimeItems.length) {
      setzeSlide(nr - 1, { updateHash: false });
    }
  });

  /* ------------------------------------------------------------
     Start
     ------------------------------------------------------------ */

  bearbeitenBtn.disabled = true;
  buehne.innerHTML = '<p class="leer">Galerie wird geladen …</p>';

  (async () => {
    try {
      stateItems = await loadState();
    } catch (error) {
      stateItems = [];
      setStatus(
        "galerie.json konnte nicht geladen werden. Bitte die Seite über einen Server öffnen."
      );
    }

    await refresh();
    bearbeitenBtn.disabled = false;

    const nr = Number.parseInt(window.location.hash.replace("#", ""), 10);
    if (runtimeItems.length && Number.isInteger(nr) && nr >= 1 && nr <= runtimeItems.length) {
      setzeSlide(nr - 1, { updateHash: false });
    }
  })();
})();
