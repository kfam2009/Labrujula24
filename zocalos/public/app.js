const state = {
  inputs: [],
  overlays: {},
  zocalos: {}
};

const openPanels = {};
const ZOCALO_DEFAULTS_VERSION = "solo-zocalos-list-2026-07-20";
const DEFAULT_ZOCALOS = {
  "143": {
    slot: "2",
    selected: 0,
    texts: [
      "EL PRONOSTICO DEL TIEMPO",
      "FRANCO BAHL Y EQUIPO",
      "GERMAN SASSO Y EQUIPO",
      "LA COLUMNA DEL ESPECTACULO",
      "LEO DE BENEDICTIS - METEOROLOGO",
      "EMANUEL OLAYA - MOVIL",
      "EMANUEL OLAYA Y EQUIPO",
      "GUILLE MACHADO Y WALTER GULLACI",
      "JORGE DRAGHI - MEDICO",
      "EMA OLAYA Y JUAN TUCAT",
      "CON WALTER Y SILVINA",
      "FAUSTO RECCHI Y EQUIPO",
      "DESPIERTA BAHIA",
      "BAHIA HOY",
      "CONSULTORIO",
      "SUSCRIBITE Y ACTIVA LA CAMPANITA",
      "CON QUIQUE BORGARELLI",
      "AL AIRE POR LA 93.1",
      "SUSCRIBITE A NUESTRO CANAL EN YOUTUBE",
      "CON MARIA Y RAUL",
      "FERNANDA ROMAN, ABOGADA",
      "MARTIN NOIR Y ALEJANDRO ZAMORA",
      "AGOSTINA ROSSI SERRA - GREENPEACE ARGENTINA"
    ]
  },
  "124": {
    slot: "1",
    selected: 0,
    texts: [
      "LA COLUMNA DEL ESPECTACULO",
      "YA VIENE GERMAN SASSO Y EQUIPO",
      "LA COLUMNA DE NUESTRO MEDICO DRAGHI",
      "EL PRONOSTICO DEL TIEMPO",
      "TODA LA INFORMACION DEL CAMPO",
      "NUESTRO ECONOMISTA MAURO TRELLINI",
      "INFORME AGROPECUARIO",
      "TODA LA INFORMACION SOBRE AUTOMOVILISMO",
      "EL CLIMA EN LA REGION",
      "BLOQUE ECONOMICO",
      "TITULOS EN DESPIERTA BAHIA",
      "CONSULTORIO PSICOLOGICO",
      "LA BUENA NOTICIA DEL DIA",
      "MESA DOMINGUERA",
      "LA ESPECIALISTA EN DERECHO PREVISIONAL",
      "#ESNOTICIA LA BRUJULA 24 FM 93.1",
      "#LARADIOQUEVES LA BRUJULA24 FM 93.1",
      "#LOQUEPASAENBAHIA FM 93.1",
      "twitch.tv/labrujula24",
      "YOUTUBE: LA BRUJULA 24 RADIO",
      "DEBATE POR LA LEY DE GLACIARES",
      "MURIO EL HISTORICO GOLEADOR JOSE SANFILIPPO",
      "LA BANDA DE SONIDO DEL MUNDIAL 2026"
    ]
  }
};

const els = {
  logLine: document.querySelector("#logLine"),
  connectionDot: document.querySelector("#connectionDot"),
  connectionText: document.querySelector("#connectionText"),
  zocaloBoxes: [...document.querySelectorAll(".zocalo-box")]
};

function setLog(message) {
  if (els.logLine) {
    els.logLine.textContent = message;
  }
}

function setConnection(online, text) {
  els.connectionDot.classList.toggle("is-online", online);
  els.connectionDot.classList.toggle("is-offline", !online);
  els.connectionText.textContent = text;
}

async function callVmix(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/vmix?${query.toString()}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `vMix respondio ${response.status}`);
  }

  return response.text();
}

async function refreshState() {
  try {
    const xmlText = await callVmix();
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");

    state.inputs = [...doc.querySelectorAll("inputs > input")].map((input) => ({
      number: input.getAttribute("number"),
      title: input.getAttribute("title") || input.getAttribute("shortTitle") || `Input ${input.getAttribute("number")}`,
      texts: [...input.querySelectorAll("text")].map((text) => ({
        name: text.getAttribute("name"),
        value: text.textContent || ""
      }))
    }));

    state.overlays = {};
    doc.querySelectorAll("overlays > overlay").forEach((overlay) => {
      state.overlays[overlay.getAttribute("number")] = overlay.textContent || "";
    });

    setConnection(true, "vMix conectado");
    if (!isEditingRow()) {
      renderZocalos();
    }
  } catch (error) {
    setConnection(false, "Sin conexion vMix");
    setLog(error.message);
    if (!isEditingRow()) {
      renderZocalos();
    }
  }
}

function getInput(inputNumber) {
  return state.inputs.find((input) => input.number === String(inputNumber));
}

function firstTextField(input) {
  return input?.texts?.[0] || null;
}

function isEditingRow() {
  return Boolean(document.activeElement?.closest("[data-zocalo-row]"));
}

function readZocalos() {
  try {
    const zocalos = JSON.parse(localStorage.getItem("zocaloTextLists") || "{}");
    const savedVersion = localStorage.getItem("zocaloDefaultsVersion");
    const current = zocalos && typeof zocalos === "object" ? zocalos : {};
    const seeded = mergeZocaloDefaults(current);

    if (savedVersion !== ZOCALO_DEFAULTS_VERSION || seeded.changed) {
      localStorage.setItem("zocaloTextLists", JSON.stringify(seeded));
      localStorage.setItem("zocaloDefaultsVersion", ZOCALO_DEFAULTS_VERSION);
    }

    return seeded;
  } catch {
    return cloneZocaloDefaults();
  }
}

function cloneZocaloDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_ZOCALOS));
}

function mergeZocaloDefaults(current) {
  const seeded = { ...current };
  const defaults = cloneZocaloDefaults();
  let changed = false;

  Object.entries(defaults).forEach(([inputNumber, fallback]) => {
    const existing = seeded[inputNumber] || {};
    const texts = Array.isArray(existing.texts) ? [...existing.texts] : [];
    const normalizedTexts = new Set(texts.map(normalizeText));

    fallback.texts.forEach((text) => {
      if (!normalizedTexts.has(normalizeText(text))) {
        texts.push(text);
        changed = true;
      }
    });

    seeded[inputNumber] = {
      slot: existing.slot || fallback.slot,
      selected: Math.min(Number(existing.selected || fallback.selected || 0), Math.max(texts.length - 1, 0)),
      texts
    };
  });

  Object.defineProperty(seeded, "changed", {
    value: changed,
    enumerable: false
  });

  return seeded;
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function saveZocalos() {
  localStorage.setItem("zocaloTextLists", JSON.stringify(state.zocalos));
}

function defaultZocaloSlot(inputNumber) {
  return String(inputNumber) === "143" ? "2" : "1";
}

function zocaloState(inputNumber) {
  const input = getInput(inputNumber);
  const defaultText = firstTextField(input)?.value || "";
  const current = state.zocalos[inputNumber] || {};
  const texts = Array.isArray(current.texts) ? current.texts : [];

  if (!texts.length && defaultText) {
    texts.push(defaultText);
  }

  state.zocalos[inputNumber] = {
    slot: current.slot || defaultZocaloSlot(inputNumber),
    selected: Math.min(Number(current.selected || 0), Math.max(texts.length - 1, 0)),
    texts
  };

  return state.zocalos[inputNumber];
}

function renderZocaloSlots(inputNumber, selectedSlot) {
  const select = document.querySelector(`[data-zocalo-slot="${inputNumber}"]`);

  if (!select) {
    return;
  }

  if (!select.children.length) {
    for (let slot = 1; slot <= 8; slot += 1) {
      const option = document.createElement("option");
      option.value = String(slot);
      option.textContent = `Overlay ${slot}`;
      select.appendChild(option);
    }
  }

  select.value = selectedSlot;
}

function renderZocaloList(inputNumber, current) {
  const panel = document.querySelector(`[data-zocalo-panel="${inputNumber}"]`);
  const list = document.querySelector(`[data-zocalo-list="${inputNumber}"]`);

  if (!panel || !list) {
    return;
  }

  panel.hidden = !openPanels[inputNumber];
  list.innerHTML = "";

  if (!current.texts.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Sin textos guardados.";
    list.appendChild(empty);
    return;
  }

  current.texts.forEach((text, index) => {
    const row = document.createElement("input");
    row.type = "text";
    row.className = "row-input";
    row.classList.toggle("is-selected", index === current.selected);
    row.value = text;
    row.dataset.zocaloRow = inputNumber;
    row.dataset.zocaloTextIndex = String(index);
    list.appendChild(row);
  });
}

function isZocaloLive(inputNumber, slot) {
  return state.overlays[String(slot)] === String(inputNumber);
}

function renderZocalos() {
  els.zocaloBoxes.forEach((box) => {
    const inputNumber = box.dataset.zocaloInput;
    const input = getInput(inputNumber);
    const title = box.querySelector("h2");
    const current = zocaloState(inputNumber);
    const selectedText = current.texts[current.selected] ?? "Seleccionar titulo";
    const currentLabel = document.querySelector(`[data-zocalo-current="${inputNumber}"]`);
    const airButton = document.querySelector(`[data-zocalo-air="${inputNumber}"]`);

    box.classList.toggle("is-missing", !input);
    box.title = input?.title || `Input ${inputNumber}`;

    if (title && input) {
      title.textContent = input.title.replace(/^Offline - /, "");
    }

    if (currentLabel) {
      currentLabel.textContent = selectedText;
    }

    if (airButton) {
      const live = isZocaloLive(inputNumber, current.slot);
      airButton.classList.toggle("is-live", live);
      airButton.textContent = live ? "OFF" : "ON";
    }

    renderZocaloSlots(inputNumber, current.slot);
    renderZocaloList(inputNumber, current);
  });
}

function selectZocaloRow(inputNumber, index) {
  const current = zocaloState(inputNumber);
  current.selected = Math.max(0, Math.min(Number(index), current.texts.length - 1));
  saveZocalos();

  document.querySelectorAll(`[data-zocalo-row="${inputNumber}"]`).forEach((row) => {
    row.classList.toggle("is-selected", row.dataset.zocaloTextIndex === String(current.selected));
  });

  const currentLabel = document.querySelector(`[data-zocalo-current="${inputNumber}"]`);
  if (currentLabel) {
    currentLabel.textContent = current.texts[current.selected] || "Seleccionar titulo";
  }
}

function saveZocaloRow(inputNumber, index, value) {
  const current = zocaloState(inputNumber);
  const text = String(value || "").trim();
  const rowIndex = Number(index);

  current.texts[rowIndex] = text;
  current.selected = rowIndex;

  saveZocalos();
  renderZocalos();
  setLog("Texto guardado.");
}

function saveZocaloRowQuietly(inputNumber, index, value) {
  const current = zocaloState(inputNumber);
  const rowIndex = Number(index);

  current.texts[rowIndex] = String(value || "").trim();
  current.selected = rowIndex;
  saveZocalos();
}

function addZocaloRow(inputNumber) {
  const current = zocaloState(inputNumber);
  const insertIndex = Math.min(Math.max(Number(current.selected || 0) + 1, 0), current.texts.length);

  current.texts.splice(insertIndex, 0, "");
  current.selected = insertIndex;
  openPanels[inputNumber] = true;
  saveZocalos();
  renderZocalos();

  requestAnimationFrame(() => {
    const row = document.querySelector(`[data-zocalo-row="${inputNumber}"][data-zocalo-text-index="${current.selected}"]`);
    row?.focus();
  });
}

async function runZocaloAir(inputNumber) {
  const current = zocaloState(inputNumber);
  const input = getInput(inputNumber);
  const textField = firstTextField(input);
  const text = current.texts[current.selected]?.trim();

  if (!input || !current.slot) {
    setLog(`No encontre el input ${inputNumber} en vMix.`);
    return;
  }

  if (isZocaloLive(inputNumber, current.slot)) {
    await callVmix({ Function: `OverlayInput${current.slot}Out` });
    setLog(`Overlay ${current.slot}: OFF`);
    await refreshState();
    return;
  }

  if (text) {
    await callVmix({
      Function: "SetText",
      Input: inputNumber,
      SelectedName: textField?.name || "TextBlock1.Text",
      Value: text
    });
  } else if (textField) {
    await callVmix({
      Function: "SetText",
      Input: inputNumber,
      SelectedName: textField.name || "TextBlock1.Text",
      Value: ""
    });
  }

  await callVmix({ Function: `OverlayInput${current.slot}In`, Input: inputNumber });
  setLog(`Overlay ${current.slot}: ${text || input.title}`);
  await refreshState();
}

document.addEventListener("click", async (event) => {
  const toggle = event.target.closest("[data-zocalo-toggle]");

  if (toggle) {
    const inputNumber = toggle.dataset.zocaloToggle;
    openPanels[inputNumber] = !openPanels[inputNumber];
    renderZocalos();
    return;
  }

  const addButton = event.target.closest("[data-zocalo-add]");

  if (addButton) {
    addZocaloRow(addButton.dataset.zocaloAdd);
    return;
  }

  const airButton = event.target.closest("[data-zocalo-air]");

  if (airButton) {
    airButton.disabled = true;

    try {
      await runZocaloAir(airButton.dataset.zocaloAir);
    } catch (error) {
      setLog(error.message);
    } finally {
      airButton.disabled = false;
    }
  }
});

document.addEventListener("focusin", (event) => {
  const row = event.target.closest("[data-zocalo-row]");

  if (row) {
    selectZocaloRow(row.dataset.zocaloRow, row.dataset.zocaloTextIndex);
  }
});

document.addEventListener("focusout", (event) => {
  const row = event.target.closest("[data-zocalo-row]");

  if (row) {
    if (row.dataset.skipBlur === "1") {
      delete row.dataset.skipBlur;
      return;
    }

    saveZocaloRow(row.dataset.zocaloRow, row.dataset.zocaloTextIndex, row.value);
  }
});

document.addEventListener("keydown", (event) => {
  const row = event.target.closest("[data-zocalo-row]");

  if (!row) {
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();

    const inputNumber = row.dataset.zocaloRow;
    const currentIndex = Number(row.dataset.zocaloTextIndex);
    const nextIndex = event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
    const nextRow = document.querySelector(`[data-zocalo-row="${inputNumber}"][data-zocalo-text-index="${nextIndex}"]`);

    if (!nextRow) {
      return;
    }

    row.dataset.skipBlur = "1";
    saveZocaloRowQuietly(inputNumber, currentIndex, row.value);
    nextRow.focus();
    nextRow.select();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    row.blur();
  }
});

document.addEventListener("change", (event) => {
  const zocaloSlot = event.target.closest("[data-zocalo-slot]");

  if (zocaloSlot) {
    const current = zocaloState(zocaloSlot.dataset.zocaloSlot);
    current.slot = zocaloSlot.value;
    saveZocalos();
    renderZocalos();
  }
});

state.zocalos = readZocalos();
renderZocalos();
refreshState();
setInterval(refreshState, 5000);
