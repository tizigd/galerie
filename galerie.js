(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const gesamt = slides.length;

  const aktuellEl = document.getElementById("aktuell");
  const gesamtEl = document.getElementById("gesamt");
  const balken = document.getElementById("fortschritt-balken");
  const statusEl = document.getElementById("status");
  const weiterBtn = document.getElementById("weiter");
  const weiterText = weiterBtn.querySelector(".weiter-text");
  const zurueckBtn = document.getElementById("zurueck");
  const teilenBtn = document.getElementById("teilen");

  let index = 0;

  const zahl = (n) => String(n).padStart(2, "0");

  function indexAusHash() {
    const nr = Number.parseInt(window.location.hash.replace("#", ""), 10);
    if (Number.isInteger(nr) && nr >= 1 && nr <= gesamt) return nr - 1;
    return 0;
  }

  function setzeSlide(neu) {
    index = (neu + gesamt) % gesamt;

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
            /* Video ist noch nicht geladen – kein Problem. */
          }
        }
      }
    });

    const aktivSlide = slides[index];
    const video = aktivSlide.querySelector("video");

    if (video) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          /* Autoplay wurde blockiert – der Poster und die Controls bleiben sichtbar. */
        });
      }
    }

    aktuellEl.textContent = zahl(index + 1);
    balken.style.width = `${((index + 1) / gesamt) * 100}%`;
    weiterText.textContent = index === gesamt - 1 ? "Von vorne" : "Weiter";

    const art = aktivSlide.dataset.typ === "video" ? "Video" : "Bild";
    const titel = aktivSlide.querySelector(".titel")?.textContent || art;
    statusEl.textContent = `${titel}, Medium ${index + 1} von ${gesamt}`;

    try {
      history.replaceState(null, "", `#${index + 1}`);
    } catch (error) {
      window.location.hash = String(index + 1);
    }
  }

  const weiter = () => setzeSlide(index + 1);
  const zurueck = () => setzeSlide(index - 1);

  weiterBtn.addEventListener("click", weiter);
  zurueckBtn.addEventListener("click", zurueck);

  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    const ziel = event.target;
    const istBedienelement =
      ziel instanceof Element &&
      ziel.closest("button, a, input, textarea, select") !== null;
    const istVideo = ziel instanceof Element && ziel.closest("video") !== null;

    if (event.key === "Enter" && !istBedienelement) {
      event.preventDefault();
      weiter();
    } else if (event.key === "ArrowRight" && !istVideo) {
      event.preventDefault();
      weiter();
    } else if (event.key === "ArrowLeft" && !istVideo) {
      event.preventDefault();
      zurueck();
    }
  });

  window.addEventListener("hashchange", () => {
    const neu = indexAusHash();
    if (neu !== index) setzeSlide(neu);
  });

  async function kopiere(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        /* Clipboard API blockiert – unten mit execCommand weiterversuchen. */
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const erfolgreich = document.execCommand("copy");
    textarea.remove();

    if (!erfolgreich) {
      throw new Error("Kopieren fehlgeschlagen");
    }
  }

  teilenBtn.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.hash = String(index + 1);

    if (window.location.protocol === "file:") {
      statusEl.textContent =
        "Lokal geöffnet: Der Link funktioniert erst, wenn die Galerie online ist.";
    }

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
      statusEl.textContent = "Link kopiert.";
    } catch (error) {
      window.prompt("Link kopieren:", url.toString());
    }
  });

  gesamtEl.textContent = zahl(gesamt);
  setzeSlide(indexAusHash());
})();
