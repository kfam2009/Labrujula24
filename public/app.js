const state = {
  inputs: [],
  active: "",
  preview: "",
  master: {
    left: 0,
    right: 0,
    muted: false,
    volume: "100"
  },
  zocalos: {}
};

const monitorRefreshTimers = new Map();
const zocaloSearchTerms = {};
let isRefreshingState = false;
const PREVIEW_MONITOR_URL = "/monitor/preview.mjpg";
const PROGRAM_MONITOR_URL = "/monitor/program.mjpg";
const MULTIVIEW_INPUTS = ["12", "13", "14"];
const MULTIVIEW_BACKGROUND_LAYER = "1";
const MULTIVIEW_BACKGROUND_INPUT = "11";
const MULTIVIEW_LAYER_INDEXES = ["9", "8", "7", "6"];
const MULTIVIEW_CAMERA_INPUTS = ["1", "2", "3", "4", "5"];
const MULTIVIEW_STORAGE_KEY = "multiviewAssignmentsLayers9To6";
const DIRECT_CUTS = [
  { input: "92", label: "Camara 1 VIVO" },
  { input: "93", label: "Camara 2 VIVO" },
  { input: "94", label: "Camara 3 VIVO" },
  { input: "95", label: "Camara 4 VIVO" },
  { input: "96", label: "Camara 5 VIVO" },
  { input: "97", label: "Camara Control VIVO" },
  { input: "29", label: "2 Camaras" },
  { input: "32", label: "3 Camaras" },
  { input: "35", label: "4 Camaras" },
  { input: "12", label: "5 Camaras" },
  { input: "105", label: "Call en vivo" },
  { input: "59", label: "Video" },
  { input: "113", label: "Camara Plaza", overlays: "on" },
  { input: "117", label: "Noche Plaza", overlays: "on" },
  { input: "142", label: "Noche Alem", overlays: "on" },
  { input: "152", label: "Camara Monte Hermoso", overlays: "on" },
  { input: "21", label: "LB24 Radio Loop", overlays: "off" }
];
const DIRECT_OVERLAY_INPUTS = [
  { slot: "1", input: "124" },
  { slot: "2", input: "143" }
];
const UTC_OVERLAYS = [
  { input: "150", label: "BJ30", slot: "4" },
  { input: "161", label: "Campos Hermanos", slot: "4" },
  { input: "155", label: "DM Group", slot: "4" },
  { input: "164", label: "Gatiperry", slot: "4" },
  { input: "158", label: "Hipertehuelche", slot: "4" },
  { input: "154", label: "INCOB", slot: "4" },
  { input: "162", label: "Key Mex", slot: "4" },
  { input: "159", label: "La Portuaria", slot: "4" },
  { input: "156", label: "Libreria Mil Hojas", slot: "4" },
  { input: "170", label: "LEX", slot: "4" },
  { input: "160", label: "MGB", slot: "4" },
  { input: "163", label: "Pariz Clothes", slot: "4" },
  { input: "165", label: "Programa Puente BSAS", slot: "4" },
  { input: "157", label: "Pintureria Tricolor", slot: "4" },
  { input: "153", label: "Sonia Gamero", slot: "4" }
];
const ZOCALO_DEFAULTS_VERSION = "utc-2026-06-08-search";
const DEFAULT_ZOCALOS = {
  "143": {
    slot: "2",
    selected: 0,
    texts: [
      "EL PRONÓSTICO DEL TIEMPO",
      "FRANCO BAHL Y EQUIPO",
      "GERMÁN SASSO Y EQUIPO",
      "LA COLUMNA DEL ESPECTÁCULO",
      "📞LEO DE BENEDICTIS - METEORÓLOGO",
      "📞EMANUEL OLAYA - MÓVIL",
      "EMANUEL OLAYA Y EQUIPO",
      "GUILLE MACHADO Y WALTER GULLACI",
      "JORGE DRAGHI - MÉDICO",
      "EMA OLAYA Y JUAN TUCAT",
      "CON WALTER Y SILVINA",
      "FAUSTO RECCHI Y EQUIPO",
      "DESPIERTA BAHÍA",
      "BAHÍA HOY",
      "CONSULTORIO",
      "SUSCRIBITE Y ACTIVÁ LA CAMPANITA",
      "CON QUIQUE BORGARELLI",
      "AL AIRE POR LA 93.1",
      "SUSCRIBITE A NUESTRO CANAL EN YOUTUBE",
      "CON MARÍA Y RAÚL",
      "FERNANDA ROMÁN, ABOGADA",
      "MARTÍN NOIR Y ALEJANDRO ZAMORA",
      "CON CARLOS BODANZA",
      "LEO GRECCO - COLUMNISTA",
      "📞LAURA UBFAL - COLUMNISTA",
      "📞CARLOS BODANZA - COLUMNISTA",
      "📞 ANDRÉS DE LEO, DIPUTADO (SOMOS)",
      "HOMERO Y EQUIPO",
      "📞DIEGO SANTAROSSA - DUEÑO DE LA DISTRIBUIDORA​",
      "UN ALUMNO LE FRACTURÓ LA MANDÍBULA",
      "HABLA EL INTENDENTE FEDERICO SUSBIELLES",
      "📞AGOSTINA ROSSI SERRA - GREENPEACE ARGENTINA",
      "FERNANDA ROMÁN - ABOGADA"
    ]
  },
  "124": {
    slot: "1",
    selected: 0,
    texts: [
      "LA COLUMNA DEL ESPECTÁCULO",
      "YA VIENE GERMÁN SASSO Y EQUIPO",
      "LA COLUMNA DE NUESTRO MÉDICO DRAGHI",
      "EL PRONÓSTICO DEL TIEMPO",
      "TODA LA INFORMACIÓN DEL CAMPO",
      "NUESTRO ECONOMISTA MAURO TRELLINI",
      "INFORME AGROPECUARIO",
      "TODA LA INFORMACIÓN SOBRE AUTOMOVILISMO",
      "EL CLIMA EN LA REGIÓN",
      "BLOQUE ECONÓMICO",
      "TÍTULOS EN DESPIERTA BAHÍA",
      "CONSULTORIO PSICOLÓGICO",
      "LA BUENA NOTICIA DEL DÍA",
      "MESA DOMINGUERA",
      "LA ESPECIALISTA EN DERECHO PREVISIONAL",
      "#ESNOTICIA LA BRÚJULA 24 FM 93.1",
      "#LARADIOQUEVES LA BRÚJULA24 FM 93.1",
      "#LOQUEPASAENBAHIA FM 93.1",
      "twitch.tv/labrujula24",
      "YOUTUBE: LA BRÚJULA 24 RADIO",
      "DEBATE POR LA LEY DE GLACIARES",
      "MURIÓ EL HISTÓRICO GOLEADOR JOSÉ SANFILIPPO",
      "LA BANDA DE SONIDO DEL MUNDIAL 2026"
    ]
  }
};
const LOGO_INPUT = "141";
const LOGO_FIELD = "Image1.Source";
const LOGO_STORAGE_KEY = "selectedLogoPath";
const MODO_SABADO_LOGO_PATH = "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\modo_sabado_logo_logo.png";
const MODO_SABADO_LOGO_INPUT = "167";
const LOGO_LIST = [
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\amo viajar_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\bahia hoy_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\despierta_bahia_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\gente de palabra_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\hora de radio_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\hora_pico_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\la mesa dominguera_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\mañanas de campo_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\noche de locura_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\nunca es tarde_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\ingenierowhite_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\peña_de_homero_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\irresponsables_logo.png",
  MODO_SABADO_LOGO_PATH
];
const PHOTO_STORAGE_KEY = "insertPhotoList";
const PHOTO_SELECTED_KEY = "selectedInsertPhotoIndex";
const PHOTO_TEMPLATE_INPUTS = [
  { input: "39", field: "Image2.Source" },
  { input: "58", field: "Image2.Source" }
];
const PHOTO_MULTIVIEW_INPUT = "29";
const PHOTO_MULTIVIEW_LAYER = "4";
const PHOTO_MULTIVIEW_SOURCE = "39";
const PHOTO_OVERLAY_INPUT = "58";
const PHOTO_OVERLAY_SLOT = "4";
const RADIO_MV_LAYOUTS = [
  { input: "29", label: "2 Camaras", layers: ["3", "4"], positions: ["Posicion 1", "Posicion 2"], special: { "4": ["37", "41", "39", "59"] } },
  { input: "32", label: "3 Camaras", layers: ["3", "4", "5"], positions: ["Posicion 1", "Posicion 2", "Posicion 3"], special: { "5": ["37", "59"] } },
  { input: "35", label: "4 Camaras", layers: ["3", "4", "5", "6"], positions: ["Posicion 1", "Posicion 2", "Posicion 3", "Posicion 4"], special: { "6": ["37", "41", "59"] } },
  { input: "12", label: "5 Camaras", layers: ["2", "3", "4", "5", "6"], positions: ["Posicion 1", "Posicion 2", "Posicion 3", "Posicion 4", "Posicion 5"], special: {} }
];
const RADIO_MV_SOURCES = [
  { input: "15", label: "Camara 1" },
  { input: "16", label: "Camara 2" },
  { input: "17", label: "Camara 3" },
  { input: "18", label: "Camara 4" },
  { input: "19", label: "Camara 5" },
  { input: "20", label: "Plano general" }
];
const RADIO_MV_SPECIAL_SOURCES = {
  "37": "Call",
  "39": "Foto",
  "41": "Calle / RTSP",
  "59": "Video"
};
const RADIO_MV_SELECTED_KEY = "selectedRadioMultiviewLayout";
const DEFAULT_PHOTO_LIST = [
  "\\\\Desktop-al37edb\\fotos\\BAHÍA HOY\\FRANCOFOTO.jpg",
  "\\\\Desktop-al37edb\\fotos\\BAHÍA HOY\\MAUROFOTO.jpg",
  "\\\\Desktop-al37edb\\fotos\\BAHÍA HOY\\TRELLINIFOTO.jpg",
  "\\\\Desktop-al37edb\\fotos\\BAHÍA HOY\\OLAYAMOVIL.jpg",
  "\\\\Desktop-al37edb\\fotos\\HORA PICO\\LAURAUBFAL.jpg",
  "\\\\Desktop-al37edb\\fotos\\BAHÍA HOY\\LEO DE BENEDICTIS.jpg",
  "\\\\DESKTOP-AL37EDB\\fotos\\HORA PICO\\BODANZANUEVA.jpg",
  "\\\\DESKTOP-AL37EDB\\fotos\\GERARDO DI FAZIO.jpg",
  "\\\\Desktop-al37edb\\fotos\\BAHÍA HOY\\LUCIANOTROVATO.jpg",
  "\\\\DESKTOP-AL37EDB\\fotos\\DE LEO.jpg",
  "\\\\DESKTOP-AL37EDB\\fotos\\LEO GRECCO.jpg"
];
const DIRECT_THUMB_INPUTS = new Set([]);
const RADIO_LAYOUTS = [
];
const RADIO_BACKGROUND_LAYER = "1";
const RADIO_BACKGROUND_INPUT = "17";
const RADIO_LAYER_INDEXES = ["2", "3", "4", "5", "6"];
const RADIO_CAMERA_INPUTS = ["1", "2", "3", "4", "5"];
const RADIO_STORAGE_KEY = "radioMultiviewAssignments";
let lastExternal2Preview = "";
let selectedRadioLayout = "6";

const els = {
  programFeed: document.querySelector("#programFeed"),
  previewFeed: document.querySelector("#previewFeed"),
  programFallback: document.querySelector("#programFallback"),
  previewFallback: document.querySelector("#previewFallback"),
  status: document.querySelector("#connectionStatus"),
  logLine: document.querySelector("#logLine"),
  inputCards: [...document.querySelectorAll(".input-card")],
  zocaloBoxes: [...document.querySelectorAll(".zocalo-box")],
  directGrid: document.querySelector("#directCutGrid"),
  utcOverlayGrid: document.querySelector("#utcOverlayGrid"),
  logoList: document.querySelector("#logoList"),
  photoList: document.querySelector("#photoList"),
  photoPathInput: document.querySelector("#photoPathInput"),
  photoAddButton: document.querySelector("#photoAddButton"),
  radioMultiviewLayouts: document.querySelector("#radioMultiviewLayouts"),
  radioMultiviewGrid: document.querySelector("#radioMultiviewGrid"),
  radioMultiviewStatus: document.querySelector("#radioMultiviewStatus"),
  multiviewTarget: document.querySelector("#multiviewTarget"),
  masterMeterLeft: document.querySelector("#masterMeterLeft"),
  masterMeterRight: document.querySelector("#masterMeterRight"),
  masterMeterValue: document.querySelector("#masterMeterValue"),
  multiviewRows: [...document.querySelectorAll(".multiview-row")],
  tabButtons: [...document.querySelectorAll("[data-tab]")],
  tabPanels: [...document.querySelectorAll("[data-tab-panel]")],
  radioLayouts: document.querySelector("#radioLayouts"),
  radioRows: [...document.querySelectorAll(".radio-multiview-row")],
  radioStatus: document.querySelector("#radioTestStatus")
};

function setLog(message) {
  els.logLine.textContent = message;
}

function setStatus(isOnline, text) {
  els.status.textContent = text;
  els.status.classList.toggle("online", isOnline);
  els.status.classList.toggle("offline", !isOnline);
}

function inputLabel(input) {
  return input.getAttribute("title") || input.textContent.trim() || `Input ${input.getAttribute("number")}`;
}

function getInput(inputNumber) {
  return state.inputs.find((input) => input.number === String(inputNumber));
}

function getInputByTitle(title) {
  const normalizedTitle = title.toLowerCase();

  return state.inputs.find((input) => input.title.toLowerCase() === normalizedTitle);
}

function firstTextField(input) {
  return input?.textFields?.[0] || null;
}

function activeMultiviewInput() {
  return MULTIVIEW_INPUTS.includes(state.preview) ? state.preview : "";
}

function readMultiviewAssignments() {
  try {
    const assignments = JSON.parse(localStorage.getItem(MULTIVIEW_STORAGE_KEY) || "{}");
    return assignments && typeof assignments === "object" ? assignments : {};
  } catch {
    return {};
  }
}

function saveMultiviewAssignment(multiviewInput, positionIndex, cameraInput) {
  const assignments = readMultiviewAssignments();
  assignments[multiviewInput] = assignments[multiviewInput] || {};
  assignments[multiviewInput][String(positionIndex)] = String(cameraInput);
  localStorage.setItem(MULTIVIEW_STORAGE_KEY, JSON.stringify(assignments));
}

function setActiveTab(tabName) {
  els.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });

  els.tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.tabPanel !== tabName;
  });
}

function readRadioAssignments() {
  try {
    const assignments = JSON.parse(localStorage.getItem(RADIO_STORAGE_KEY) || "{}");
    return assignments && typeof assignments === "object" ? assignments : {};
  } catch {
    return {};
  }
}

function saveRadioAssignment(layoutInput, positionIndex, cameraInput) {
  const assignments = readRadioAssignments();
  assignments[layoutInput] = assignments[layoutInput] || {};
  assignments[layoutInput][String(positionIndex)] = String(cameraInput);
  localStorage.setItem(RADIO_STORAGE_KEY, JSON.stringify(assignments));
}

async function callVmix(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/vmix?${query.toString()}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.text();
}

async function runFunction(functionName, input) {
  const params = { Function: functionName };
  let resolvedInput = input;

  if (functionName === "OverlayInput3In" && input === LOGO_INPUT && selectedLogoPath() === MODO_SABADO_LOGO_PATH) {
    resolvedInput = MODO_SABADO_LOGO_INPUT;
  }

  if (resolvedInput) {
    params.Input = resolvedInput;
  }

  await callVmix(params);
  setLog(`${functionName}${resolvedInput ? ` input ${resolvedInput}` : ""}`);
  await refreshState();
}

function parseInputs(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const vmix = xml.querySelector("vmix");

  if (!vmix) {
    throw new Error("Respuesta invalida de vMix.");
  }

  state.active = vmix.querySelector("active")?.textContent.trim() || "";
  state.preview = vmix.querySelector("preview")?.textContent.trim() || "";
  parseMasterMeter(vmix);
  state.inputs = [...xml.querySelectorAll("inputs > input")].map((input) => ({
    key: input.getAttribute("key"),
    number: input.getAttribute("number"),
    type: input.getAttribute("type"),
    title: inputLabel(input),
    textFields: [...input.querySelectorAll("text")].map((text) => ({
      index: text.getAttribute("index"),
      name: text.getAttribute("name"),
      value: text.textContent || ""
    })),
    overlays: [...input.querySelectorAll("overlay")].map((overlay) => ({
      index: overlay.getAttribute("index"),
      key: overlay.getAttribute("key")
    }))
  }));
}

function parseMasterMeter(vmix) {
  const master = vmix.querySelector("audio > master");

  state.master = {
    left: Number(master?.getAttribute("meterF1") || 0),
    right: Number(master?.getAttribute("meterF2") || 0),
    muted: master?.getAttribute("muted") === "True",
    volume: master?.getAttribute("volume") || "100"
  };
}

function meterPercent(value) {
  const linearValue = Math.max(0, Math.min(Number(value) || 0, 1));
  return Math.round(Math.sqrt(linearValue) * 100);
}

function meterDb(value) {
  const linearValue = Math.max(Number(value) || 0, 0.000001);
  return Math.max(-60, Math.round(20 * Math.log10(linearValue)));
}

function renderMasterMeter() {
  if (!els.masterMeterLeft || !els.masterMeterRight || !els.masterMeterValue) {
    return;
  }

  const leftPercent = meterPercent(state.master.left);
  const rightPercent = meterPercent(state.master.right);
  const peak = Math.max(state.master.left, state.master.right);
  const peakDb = meterDb(peak);

  els.masterMeterLeft.style.width = `${leftPercent}%`;
  els.masterMeterRight.style.width = `${rightPercent}%`;
  els.masterMeterLeft.classList.toggle("is-hot", leftPercent >= 86);
  els.masterMeterRight.classList.toggle("is-hot", rightPercent >= 86);
  els.masterMeterLeft.classList.toggle("is-clip", leftPercent >= 97);
  els.masterMeterRight.classList.toggle("is-clip", rightPercent >= 97);
  els.masterMeterValue.textContent = state.master.muted ? "MUTE" : `${peakDb} dB`;
}

function loadMonitorConfig() {
  localStorage.setItem("previewMonitorUrl", PREVIEW_MONITOR_URL);
  state.zocalos = readZocalos();
  renderMonitorConfig();
}

function renderMonitorConfig() {
  if (!els.previewFeed || !els.programFeed) {
    return;
  }

  renderMonitorFeed("preview", PREVIEW_MONITOR_URL);
  renderMonitorFeed("program", PROGRAM_MONITOR_URL);
}

function renderMonitorFeed(kind, url) {
  const feed = kind === "preview" ? els.previewFeed : els.programFeed;
  const fallback = kind === "preview" ? els.previewFallback : els.programFallback;
  const previousTimer = monitorRefreshTimers.get(kind);

  if (!feed || !fallback) {
    return;
  }

  if (previousTimer) {
    clearTimeout(previousTimer);
    monitorRefreshTimers.delete(kind);
  }

  feed.innerHTML = "";
  feed.classList.toggle("is-live", Boolean(url));
  fallback.hidden = Boolean(url);

  if (!url) {
    return;
  }

  if (/\.(mjpg|jpg|jpeg|png)($|\?)/i.test(url)) {
    const image = document.createElement("img");
    image.alt = kind === "preview" ? "Monitor Preview" : "Monitor Program";
    let refreshTimeout = null;
    const refreshImage = () => {
      image.src = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    };

    image.addEventListener("load", () => {
      if (!/\.mjpg($|\?)/i.test(url)) {
        refreshTimeout = setTimeout(refreshImage, 650);
        monitorRefreshTimers.set(kind, refreshTimeout);
      }
    });
    image.addEventListener("error", () => {
      if (!/\.mjpg($|\?)/i.test(url)) {
        refreshTimeout = setTimeout(refreshImage, 1200);
        monitorRefreshTimers.set(kind, refreshTimeout);
      }
    });

    refreshImage();
    feed.appendChild(image);
  } else {
    const frame = document.createElement("iframe");
    frame.title = kind === "preview" ? "Monitor Preview" : "Monitor Program";
    frame.src = url;
    frame.allow = "autoplay; fullscreen";
    frame.referrerPolicy = "no-referrer";
    feed.appendChild(frame);
  }
}

function renderInputButtons() {
  els.inputCards.forEach((card) => {
    const inputNumber = card.dataset.inputCard;
    const input = getInput(inputNumber);
    const label = card.querySelector("strong");
    const buttons = [...card.querySelectorAll("button")];

    card.classList.toggle("is-preview", inputNumber === state.preview);
    card.classList.toggle("is-active", inputNumber === state.active);
    card.title = input?.title || `Input ${inputNumber}`;

    if (label) {
      label.textContent = input?.title || `Input ${inputNumber}`;
    }

    buttons.forEach((button) => {
      button.disabled = !input;
      button.classList.toggle("is-selected", button.dataset.function === "PreviewInput" && inputNumber === state.preview);
      button.classList.toggle("is-live", button.dataset.function === "ActiveInput" && inputNumber === state.active);
    });
  });
}

function renderDirectCuts() {
  if (!els.directGrid) {
    return;
  }

  const expectedInputs = new Set(DIRECT_CUTS.map((direct) => direct.input));

  [...els.directGrid.querySelectorAll("[data-direct-cut]")].forEach((button) => {
    if (!expectedInputs.has(button.dataset.directCut)) {
      button.remove();
    }
  });

  DIRECT_CUTS.forEach((direct) => {
    const input = getInput(direct.input);
    let button = els.directGrid.querySelector(`[data-direct-cut="${direct.input}"]`);
    const hasThumb = DIRECT_THUMB_INPUTS.has(direct.input);

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "direct-button";
      button.dataset.directCut = direct.input;
      els.directGrid.appendChild(button);
    }

    const title = direct.label || input?.title?.replace(/^Offline - /, "") || `Input ${direct.input}`;

    button.classList.toggle("has-thumb", hasThumb);
    button.classList.toggle("is-live", state.active === direct.input);
    button.disabled = !input;
    button.title = title;

    if (hasThumb) {
      if (!button.querySelector(".direct-thumb")) {
        button.innerHTML = "";
        const image = document.createElement("img");
        image.className = "direct-thumb";
        image.alt = "";
        image.loading = "eager";
        button.append(image);
      }
    } else {
      button.innerHTML = "";
      button.textContent = title;
    }
  });
}

function renderUtcOverlays() {
  if (!els.utcOverlayGrid) {
    return;
  }

  els.utcOverlayGrid.innerHTML = "";

  UTC_OVERLAYS.forEach((overlay) => {
    const input = getInput(overlay.input);
    const button = document.createElement("button");
    const title = input?.title?.replace(/^Offline - /, "") || overlay.label;

    button.type = "button";
    button.className = "sponsor-button";
    button.dataset.utcOverlay = overlay.input;
    button.dataset.utcSlot = overlay.slot;
    button.disabled = !input;
    button.title = title;
    button.textContent = title;
    els.utcOverlayGrid.appendChild(button);
  });
}

function logoLabel(path) {
  return path
    .split("\\")
    .pop()
    .replace(/(?:_logo)+\.png$/i, "")
    .replace(/\.png$/i, "")
    .replace(/_/g, " ");
}

function selectedLogoPath() {
  return localStorage.getItem(LOGO_STORAGE_KEY) || LOGO_LIST[0];
}

function renderLogoList() {
  if (!els.logoList) {
    return;
  }

  const selected = selectedLogoPath();
  els.logoList.innerHTML = "";

  LOGO_LIST.forEach((logoPath) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "logo-list-item";
    item.classList.toggle("is-selected", logoPath === selected);
    item.dataset.logoPath = logoPath;
    item.textContent = logoLabel(logoPath);
    item.title = logoPath;
    els.logoList.appendChild(item);
  });
}

function cleanFilePath(path) {
  return path.replace(/[\u202a-\u202e]/g, "").trim();
}

function photoLabel(path) {
  return cleanFilePath(path).split("\\").pop() || path;
}

function readPhotoList() {
  try {
    const saved = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) {
      return saved.map(cleanFilePath).filter(Boolean);
    }
  } catch {
  }

  return DEFAULT_PHOTO_LIST;
}

function savePhotoList(list) {
  localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(list));
}

function selectedPhotoIndex(list = readPhotoList()) {
  return Math.max(0, Math.min(Number(localStorage.getItem(PHOTO_SELECTED_KEY) || 0), Math.max(list.length - 1, 0)));
}

function selectedPhotoPath() {
  const list = readPhotoList();
  return list[selectedPhotoIndex(list)] || "";
}

function renderPhotoList() {
  if (!els.photoList) {
    return;
  }

  const list = readPhotoList();
  const selected = selectedPhotoIndex(list);
  els.photoList.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "zocalo-empty";
    empty.textContent = "Sin fotos cargadas.";
    els.photoList.appendChild(empty);
    return;
  }

  list.forEach((path, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "photo-list-item";
    item.classList.toggle("is-selected", index === selected);
    item.dataset.photoIndex = String(index);
    item.textContent = photoLabel(path);
    item.title = path;
    els.photoList.appendChild(item);
  });
}

function selectedRadioMultiviewLayout() {
  const saved = localStorage.getItem(RADIO_MV_SELECTED_KEY);
  return RADIO_MV_LAYOUTS.find((layout) => layout.input === saved) || RADIO_MV_LAYOUTS[0];
}

function radioMultiviewSourcesForLayer(layout, layer) {
  const specialInputs = layout.special[layer] || [];
  const sources = [...RADIO_MV_SOURCES];

  specialInputs.forEach((inputNumber) => {
    sources.push({
      input: inputNumber,
      label: RADIO_MV_SPECIAL_SOURCES[inputNumber] || `Input ${inputNumber}`
    });
  });

  return sources;
}

function multiviewOverlayForLayer(input, layer) {
  const xmlIndex = String(Math.max(Number(layer) - 1, 0));
  return input?.overlays.find((overlay) => overlay.index === xmlIndex)
    || input?.overlays.find((overlay) => overlay.index === String(layer));
}

function renderRadioMultiview() {
  if (!els.radioMultiviewLayouts || !els.radioMultiviewGrid) {
    return;
  }

  if (document.activeElement?.matches("[data-radio-mv-layer]")) {
    return;
  }

  const selectedLayout = selectedRadioMultiviewLayout();
  const target = getInput(selectedLayout.input);

  els.radioMultiviewLayouts.innerHTML = "";
  RADIO_MV_LAYOUTS.forEach((layout) => {
    const input = getInput(layout.input);
    const control = document.createElement("div");
    const name = document.createElement("div");
    const actions = document.createElement("div");
    const previewButton = document.createElement("button");
    const cutButton = document.createElement("button");
    const title = input?.title && input.title.toLowerCase() !== "blank" ? input.title : layout.label;

    control.className = "mv-layout-control";
    control.classList.toggle("is-selected", layout.input === selectedLayout.input);
    control.classList.toggle("is-preview", state.preview === layout.input);
    control.classList.toggle("is-live", state.active === layout.input);

    name.className = "mv-layout-name";
    name.textContent = title;

    actions.className = "mv-layout-actions";

    previewButton.type = "button";
    previewButton.className = "mv-layout-button mv-preview-button";
    previewButton.dataset.radioMvPreview = layout.input;
    previewButton.disabled = !input;
    previewButton.textContent = "Previo";

    cutButton.type = "button";
    cutButton.className = "mv-layout-button mv-cut-button";
    cutButton.dataset.radioMvCut = layout.input;
    cutButton.disabled = !input;
    cutButton.textContent = "Al aire";

    actions.append(previewButton, cutButton);
    control.append(name, actions);
    els.radioMultiviewLayouts.appendChild(control);
  });

  if (els.radioMultiviewStatus) {
    els.radioMultiviewStatus.textContent = target
      ? `Editando: ${target.title}${state.preview === selectedLayout.input ? " (en Preview)" : ""}`
      : "No encuentro ese multiview";
  }

  els.radioMultiviewGrid.innerHTML = "";

  selectedLayout.layers.forEach((layer, index) => {
    const row = document.createElement("div");
    const label = document.createElement("div");
    const select = document.createElement("select");
    const current = document.createElement("small");
    const assignedKey = multiviewOverlayForLayer(target, layer)?.key;
    const assignedInput = state.inputs.find((input) => input.key === assignedKey);

    row.className = "mv-row";
    label.className = "mv-position-label";
    label.textContent = selectedLayout.positions?.[index] || `Posicion ${index + 1}`;
    label.title = `Layer ${layer}`;
    select.dataset.radioMvLayer = layer;
    select.disabled = !target;

    const sources = radioMultiviewSourcesForLayer(selectedLayout, layer);

    if (assignedInput && !sources.some((source) => source.input === assignedInput.number)) {
      sources.push({
        input: assignedInput.number,
        label: `${assignedInput.title} (actual)`
      });
    }

    sources.forEach((source) => {
      const input = getInput(source.input);
      const option = document.createElement("option");
      option.value = source.input;
      option.textContent = input?.title || source.label;
      option.disabled = !input;
      select.appendChild(option);
    });

    select.value = assignedInput?.number || "";
    current.textContent = assignedInput ? `Actual: ${assignedInput.title}` : "Sin asignar";

    row.append(label, select, current);
    els.radioMultiviewGrid.appendChild(row);
  });
}

function refreshDirectSnapshots() {
  if (!els.directGrid) {
    return;
  }

  const availableDirects = DIRECT_CUTS.filter((direct) => DIRECT_THUMB_INPUTS.has(direct.input) && getInput(direct.input));

  if (!availableDirects.length) {
    return;
  }

  availableDirects.forEach((direct) => {
    const button = els.directGrid.querySelector(`[data-direct-cut="${direct.input}"]`);
    const image = button?.querySelector(".direct-thumb");

    if (image) {
      image.src = `/snapshot/input/${direct.input}.jpg?t=${Date.now()}`;
    }
  });
}

function renderMultiviewControls() {
  if (!els.multiviewTarget || !els.multiviewRows.length) {
    return;
  }

  const targetNumber = activeMultiviewInput();
  const target = getInput(targetNumber);
  const saved = readMultiviewAssignments()[targetNumber] || {};

  els.multiviewTarget.textContent = target ? `Preview: ${target.title}` : "Preview: no es multiview";

  els.multiviewRows.forEach((row, positionIndex) => {
    const select = row.querySelector("select");
    const current = row.querySelector("small");
    const layerIndex = MULTIVIEW_LAYER_INDEXES[positionIndex];
    const assignedKey = target?.overlays.find((overlay) => overlay.index === layerIndex)?.key;
    const assignedInput = state.inputs.find((input) => input.key === assignedKey);
    const savedInput = getInput(saved[String(positionIndex)]);
    const selectedInput = savedInput || assignedInput;

    select.innerHTML = "";

    MULTIVIEW_CAMERA_INPUTS.forEach((inputNumber) => {
      const input = getInput(inputNumber);
      const option = document.createElement("option");
      option.value = inputNumber;
      option.textContent = input?.title || `Camara ${inputNumber}`;
      option.disabled = !input;
      select.appendChild(option);
    });

    select.disabled = !target;
    select.value = selectedInput?.number || "";
    current.textContent = selectedInput ? `Actual: ${selectedInput.title}` : "Sin asignar";
  });
}

function renderRadioLayouts() {
  if (!els.radioLayouts) {
    return;
  }

  els.radioLayouts.innerHTML = "";

  RADIO_LAYOUTS.forEach((layout) => {
    const input = radioLayoutInput(layout);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "radio-layout-button";
    button.classList.toggle("is-selected", selectedRadioLayout === layout.input);
    button.classList.toggle("is-preview", state.preview === input?.number);
    button.dataset.radioLayout = layout.input;
    button.textContent = input?.title || layout.label;
    button.disabled = !input;
    els.radioLayouts.appendChild(button);
  });
}

function radioLayoutInput(layout) {
  return getInput(layout.input) || getInputByTitle(layout.title);
}

function selectedRadioLayoutConfig() {
  return RADIO_LAYOUTS.find((item) => item.input === selectedRadioLayout) || RADIO_LAYOUTS[0];
}

function renderRadioTest() {
  if (!RADIO_LAYOUTS.length || !els.radioLayouts) {
    return;
  }

  const layout = selectedRadioLayoutConfig();
  const target = radioLayoutInput(layout);
  const layoutStorageKey = target?.number || layout.input;
  const saved = readRadioAssignments()[layoutStorageKey] || {};

  renderRadioLayouts();

  if (els.radioStatus) {
    els.radioStatus.textContent = target
      ? `Editando: ${target.title}${state.preview === layout.input ? " (en Preview)" : ""}`
      : "No encuentro ese multiview en vMix";
  }

  els.radioRows.forEach((row, positionIndex) => {
    const select = row.querySelector("select");
    const current = row.querySelector("small");
    const layerIndex = RADIO_LAYER_INDEXES[positionIndex];
    const isAvailable = Boolean(target) && positionIndex < layout.positions;
    const assignedKey = target?.overlays.find((overlay) => overlay.index === layerIndex)?.key;
    const assignedInput = state.inputs.find((input) => input.key === assignedKey);
    const savedInput = getInput(saved[String(positionIndex)]);
    const selectedInput = savedInput || assignedInput;

    select.innerHTML = "";

    RADIO_CAMERA_INPUTS.forEach((inputNumber) => {
      const input = getInput(inputNumber);
      const option = document.createElement("option");
      option.value = inputNumber;
      option.textContent = input?.title || `Camara ${inputNumber}`;
      option.disabled = !input;
      select.appendChild(option);
    });

    row.classList.toggle("is-disabled", !isAvailable);
    select.disabled = !isAvailable;
    select.value = selectedInput?.number || "";
    current.textContent = isAvailable
      ? selectedInput ? `Actual: ${selectedInput.title}` : "Sin asignar"
      : "No usado en este multiview";
  });
}

async function selectRadioLayout(layoutInput) {
  if (!RADIO_LAYOUTS.length) {
    return;
  }

  selectedRadioLayout = layoutInput;
  const layout = selectedRadioLayoutConfig();
  const target = radioLayoutInput(layout);

  renderRadioTest();

  if (!target) {
    setLog(`No encuentro ${layout.label}.`);
    return;
  }

  await ensureRadioBackground(target.number);
  await runFunction("PreviewInput", target.number);
}

async function ensureRadioBackground(layoutInput) {
  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: layoutInput,
    Value: `${RADIO_BACKGROUND_LAYER},${RADIO_BACKGROUND_INPUT}`
  });
}

async function updateRadioMultiviewPosition(positionIndex, cameraInput) {
  if (!RADIO_LAYOUTS.length) {
    return;
  }

  const layout = selectedRadioLayoutConfig();
  const target = radioLayoutInput(layout);
  const layerIndex = RADIO_LAYER_INDEXES[positionIndex];

  if (!target || !layerIndex || positionIndex >= layout.positions || !cameraInput) {
    setLog("Elegí un multiview de la prueba.");
    return;
  }

  await ensureRadioBackground(target.number);

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: target.number,
    Value: `${layerIndex},${cameraInput}`
  });

  saveRadioAssignment(target.number, positionIndex, cameraInput);
  setLog(`${target.title} posicion ${positionIndex + 1}: input ${cameraInput}`);
  await refreshState();
}

async function runDirectCut(inputNumber) {
  const direct = DIRECT_CUTS.find((item) => item.input === String(inputNumber));
  const layout = RADIO_LAYOUTS.find((item) => {
    const input = radioLayoutInput(item);
    return input?.number === inputNumber;
  });

  if (direct?.overlays === "off") {
    await setDirectOverlays(false);
  }

  if (layout) {
    await ensureRadioBackground(inputNumber);
  }

  await callVmix({
    Function: "CutDirect",
    Input: inputNumber
  });

  if (direct?.overlays === "on") {
    await setDirectOverlays(true);
  }

  setLog(`Directo: ${direct?.label || getInput(inputNumber)?.title || `Input ${inputNumber}`}`);
  await refreshState();
}

async function setDirectOverlays(isOn) {
  for (const overlay of DIRECT_OVERLAY_INPUTS) {
    await callVmix({
      Function: isOn ? `OverlayInput${overlay.slot}In` : `OverlayInput${overlay.slot}Out`,
      ...(isOn ? { Input: overlay.input } : {})
    });
  }
}

async function updateMultiviewPosition(positionIndex, cameraInput) {
  const targetNumber = activeMultiviewInput();
  const layerIndex = MULTIVIEW_LAYER_INDEXES[positionIndex];

  if (!targetNumber || !layerIndex || !cameraInput) {
    setLog("Pone Dos Camaras, Tres Camaras o 4 Camaras en Preview.");
    return;
  }

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: targetNumber,
    Value: `${MULTIVIEW_BACKGROUND_LAYER},${MULTIVIEW_BACKGROUND_INPUT}`
  });

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: targetNumber,
    Value: `${layerIndex},${cameraInput}`
  });
  saveMultiviewAssignment(targetNumber, positionIndex, cameraInput);
  setLog(`${getInput(targetNumber)?.title || `Input ${targetNumber}`} posicion ${positionIndex + 1}: input ${cameraInput}`);
  await refreshState();
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
    const normalizedTexts = new Set(texts.map(normalizeSearchText));

    fallback.texts.forEach((text) => {
      const key = normalizeSearchText(text);

      if (!normalizedTexts.has(key)) {
        texts.push(text);
        normalizedTexts.add(key);
        changed = true;
      }
    });

    if (!seeded[inputNumber] || !Array.isArray(existing.texts) || !existing.texts.length) {
      changed = true;
    }

    seeded[inputNumber] = {
      slot: existing.slot || fallback.slot,
      selected: Number.isFinite(Number(existing.selected)) ? Number(existing.selected) : fallback.selected,
      texts
    };
  });

  Object.defineProperty(seeded, "changed", {
    value: changed,
    enumerable: false
  });

  return seeded;
}

function saveZocalos() {
  localStorage.setItem("zocaloTextLists", JSON.stringify(state.zocalos));
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

function defaultZocaloSlot(inputNumber) {
  if (String(inputNumber) === "143") {
    return "2";
  }

  return "1";
}

function renderZocaloSlots(inputNumber, selectedSlot) {
  const select = document.querySelector(`[data-zocalo-slot="${inputNumber}"]`);

  if (!select) {
    return;
  }

  select.innerHTML = "";

  for (let slot = 1; slot <= 8; slot += 1) {
    const option = document.createElement("option");
    option.value = String(slot);
    option.textContent = `Overlay ${slot}`;
    select.appendChild(option);
  }

  select.value = selectedSlot;
}

function renderZocaloList(inputNumber, current) {
  const list = document.querySelector(`[data-zocalo-list="${inputNumber}"]`);
  const search = document.querySelector(`[data-zocalo-search="${inputNumber}"]`);
  const status = document.querySelector(`[data-zocalo-search-status="${inputNumber}"]`);
  const edit = document.querySelector(`[data-zocalo-edit="${inputNumber}"]`);

  if (!list) {
    return;
  }

  list.innerHTML = "";
  const rawQuery = zocaloSearchTerms[inputNumber] ?? search?.value ?? "";
  const query = normalizeSearchText(rawQuery);

  if (search && search.value !== rawQuery) {
    search.value = rawQuery;
  }

  if (!current.texts.length) {
    if (status) {
      status.textContent = "No hay textos guardados en este zocalo.";
    }

    const empty = document.createElement("p");
    empty.className = "zocalo-empty";
    empty.textContent = "Sin textos guardados.";
    list.appendChild(empty);
    return;
  }

  const matches = current.texts
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => !query || zocaloTextMatches(text, query));

  if (status) {
    status.textContent = query
      ? `${matches.length} de ${current.texts.length} textos encontrados`
      : `${current.texts.length} textos armados en este listado`;
  }

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "zocalo-empty";
    empty.textContent = "Sin coincidencias. Proba con menos letras.";
    list.appendChild(empty);
  }

  matches.forEach(({ text, index }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "zocalo-text-item";
    item.classList.toggle("is-selected", index === current.selected);
    item.dataset.zocaloSelect = inputNumber;
    item.dataset.zocaloTextIndex = String(index);
    item.textContent = text;
    list.appendChild(item);
  });

  if (edit && document.activeElement !== edit) {
    edit.value = current.texts[current.selected] || "";
  }
}

function normalizeSearchText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function zocaloTextMatches(text, query) {
  const normalized = normalizeSearchText(text).replace(/\s+/g, " ");
  const compactText = normalized.replace(/\s+/g, " ");
  const compactQuery = query.replace(/\s+/g, " ");

  if (compactText.startsWith(compactQuery) || compactText.includes(compactQuery)) {
    return true;
  }

  const queryWords = compactQuery.split(" ").filter(Boolean);

  return queryWords.every((queryWord) =>
    normalized
      .split(/[\s,.;:()/-]+/)
      .some((word) => word.startsWith(queryWord) || word.includes(queryWord))
  );
}

function renderOverlays() {
  els.zocaloBoxes.forEach((box) => {
    const inputNumber = box.dataset.zocaloInput;
    const input = getInput(inputNumber);
    const title = box.querySelector("h3");
    const current = zocaloState(inputNumber);

    box.classList.toggle("is-missing", !input);
    box.title = input?.title || `Input ${inputNumber}`;

    if (title) {
      title.textContent = input?.title?.replace(/^Offline - /, "") || title.textContent;
    }

    renderZocaloSlots(inputNumber, current.slot);
    renderZocaloList(inputNumber, current);
  });
}

function addZocaloText(inputNumber) {
  const input = document.querySelector(`[data-zocalo-new="${inputNumber}"]`);
  const text = input?.value.trim();

  if (!text) {
    return;
  }

  const current = zocaloState(inputNumber);
  current.texts.push(text);
  current.selected = current.texts.length - 1;
  saveZocalos();

  if (input) {
    input.value = "";
  }

  renderOverlays();
}

function removeSelectedZocaloText(inputNumber) {
  const current = zocaloState(inputNumber);

  if (!current.texts.length) {
    return;
  }

  current.texts.splice(current.selected, 1);
  current.selected = Math.max(0, Math.min(current.selected, current.texts.length - 1));
  saveZocalos();
  renderOverlays();
}

async function saveEditedZocaloText(inputNumber) {
  const edit = document.querySelector(`[data-zocalo-edit="${inputNumber}"]`);
  const text = edit?.value.trim();
  const current = zocaloState(inputNumber);
  const input = getInput(inputNumber);
  const textField = firstTextField(input);

  if (!text || !current.texts.length) {
    return;
  }

  current.texts[current.selected] = text;
  saveZocalos();

  if (input) {
    await callVmix({
      Function: "SetText",
      Input: inputNumber,
      SelectedName: textField?.name || "TextBlock1.Text",
      Value: text
    });
    setLog(`Texto corregido: ${text}`);
  }

  renderOverlays();
}

async function runZocalo(inputNumber, action) {
  const current = zocaloState(inputNumber);
  const input = getInput(inputNumber);
  const textField = firstTextField(input);
  const text = current.texts[current.selected]?.trim();

  if (!input || !current.slot) {
    return;
  }

  if (action === "off") {
    await runFunction(`OverlayInput${current.slot}Out`);
    return;
  }

  if (text) {
    await callVmix({
      Function: "SetText",
      Input: inputNumber,
      SelectedName: textField?.name || "TextBlock1.Text",
      Value: text
    });
  }

  await runFunction(`OverlayInput${current.slot}In`, inputNumber);
}

async function runUtcOverlay(inputNumber, slot) {
  await callVmix({
    Function: `OverlayInput${slot}`,
    Input: inputNumber
  });

  setLog(`Overlay ${slot}: ${getInput(inputNumber)?.title || `Input ${inputNumber}`}`);
  await refreshState();
}

async function turnOffUtcOverlay(slot) {
  await callVmix({
    Function: `OverlayInput${slot}Out`
  });

  setLog(`Overlay ${slot}: OFF`);
  await refreshState();
}

async function selectLogo(logoPath) {
  localStorage.setItem(LOGO_STORAGE_KEY, logoPath);
  renderLogoList();

  if (logoPath === MODO_SABADO_LOGO_PATH) {
    setLog(`Logo seleccionado: ${logoLabel(logoPath)}`);
    await refreshState();
    return;
  }

  await callVmix({
    Function: "SetImage",
    Input: LOGO_INPUT,
    SelectedName: LOGO_FIELD,
    Value: logoPath
  });

  setLog(`Logo seleccionado: ${logoLabel(logoPath)}`);
  await refreshState();
}

async function applySelectedPhoto() {
  const photoPath = selectedPhotoPath();

  if (!photoPath) {
    setLog("No hay foto seleccionada.");
    return;
  }

  for (const target of PHOTO_TEMPLATE_INPUTS) {
    await callVmix({
      Function: "SetImage",
      Input: target.input,
      SelectedName: target.field,
      Value: photoPath
    });
  }

  setLog(`Foto aplicada: ${photoLabel(photoPath)}`);
  await refreshState();
}

async function showPhotoInMultiview() {
  await applySelectedPhoto();
  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: PHOTO_MULTIVIEW_INPUT,
    Value: `${PHOTO_MULTIVIEW_LAYER},${PHOTO_MULTIVIEW_SOURCE}`
  });
  setLog(`Foto en ${getInput(PHOTO_MULTIVIEW_INPUT)?.title || `Input ${PHOTO_MULTIVIEW_INPUT}`}`);
  await refreshState();
}

async function togglePhotoOverlay() {
  await applySelectedPhoto();
  await runUtcOverlay(PHOTO_OVERLAY_INPUT, PHOTO_OVERLAY_SLOT);
}

async function updateRadioMultiviewLayer(layer, sourceInput) {
  const layout = selectedRadioMultiviewLayout();
  const target = getInput(layout.input);

  if (!target || !layer || !sourceInput) {
    setLog("Selecciona un multiview y una fuente.");
    return;
  }

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: target.number,
    Value: `${layer},${sourceInput}`
  });

  setLog(`${target.title} layer ${layer}: ${getInput(sourceInput)?.title || `Input ${sourceInput}`}`);
  await refreshState();
}

async function previewRadioMultiviewLayout(layoutInput) {
  const layout = RADIO_MV_LAYOUTS.find((item) => item.input === layoutInput);
  const target = layout ? getInput(layout.input) : null;

  if (!target) {
    setLog("No encuentro ese multiview en vMix.");
    renderRadioMultiview();
    return;
  }

  localStorage.setItem(RADIO_MV_SELECTED_KEY, target.number);
  renderRadioMultiview();

  await callVmix({
    Function: "PreviewInput",
    Input: target.number
  });

  setLog(`Preview: ${target.title}`);
  await refreshState();
}

async function cutRadioMultiviewLayout(layoutInput) {
  const layout = RADIO_MV_LAYOUTS.find((item) => item.input === layoutInput);
  const target = layout ? getInput(layout.input) : null;

  if (!target) {
    setLog("No encuentro ese multiview en vMix.");
    renderRadioMultiview();
    return;
  }

  localStorage.setItem(RADIO_MV_SELECTED_KEY, target.number);
  renderRadioMultiview();

  await callVmix({
    Function: "CutDirect",
    Input: target.number
  });

  setLog(`Al aire: ${target.title}`);
  await refreshState();
}

function addPhotoPath() {
  const path = cleanFilePath(els.photoPathInput?.value || "");

  if (!path) {
    return;
  }

  const list = readPhotoList();
  list.push(path);
  savePhotoList(list);
  localStorage.setItem(PHOTO_SELECTED_KEY, String(list.length - 1));

  if (els.photoPathInput) {
    els.photoPathInput.value = "";
  }

  renderPhotoList();
}

function removeSelectedPhoto() {
  const list = readPhotoList();
  const index = selectedPhotoIndex(list);

  if (!list.length) {
    return;
  }

  list.splice(index, 1);
  savePhotoList(list);
  localStorage.setItem(PHOTO_SELECTED_KEY, String(Math.max(0, index - 1)));
  renderPhotoList();
}

async function refreshState() {
  if (isRefreshingState) {
    return;
  }

  isRefreshingState = true;

  try {
    const xmlText = await callVmix();
    parseInputs(xmlText);
    await syncPreviewExternal2();
    renderMasterMeter();
    renderDirectCuts();
    renderInputButtons();
    renderMultiviewControls();
    renderRadioTest();
    renderOverlays();
    renderUtcOverlays();
    renderLogoList();
    renderPhotoList();
    renderRadioMultiview();
    setStatus(true, "vMix conectado");
  } catch (error) {
    setStatus(false, "vMix desconectado");
    setLog(error.message);
  } finally {
    isRefreshingState = false;
  }
}

async function refreshMasterMeter() {
  try {
    const xmlText = await callVmix();
    const xml = new DOMParser().parseFromString(xmlText, "text/xml");
    const vmix = xml.querySelector("vmix");

    if (!vmix) {
      return;
    }

    parseMasterMeter(vmix);
    renderMasterMeter();
  } catch {
    state.master = { left: 0, right: 0, muted: false, volume: "100" };
    renderMasterMeter();
  }
}

async function syncPreviewExternal2() {
  if (!state.preview || state.preview === lastExternal2Preview) {
    return;
  }

  const previewToRoute = state.preview;
  lastExternal2Preview = previewToRoute;

  try {
    await callVmix({
      Function: "SetOutputExternal2",
      Input: previewToRoute,
      Value: "Input"
    });
    setLog("Preview fluido: External 2 sincronizado.");
  } catch (error) {
    lastExternal2Preview = "";
    setLog(error.message);
  }
}

document.addEventListener("click", async (event) => {
  const directCut = event.target.closest("[data-direct-cut]");

  if (directCut) {
    directCut.disabled = true;

    try {
      await runDirectCut(directCut.dataset.directCut);
    } catch (error) {
      setLog(error.message);
    } finally {
      directCut.disabled = false;
    }

    return;
  }

  const tabButton = event.target.closest("[data-tab]");

  if (tabButton) {
    setActiveTab(tabButton.dataset.tab);
    return;
  }

  const radioLayout = event.target.closest("[data-radio-layout]");

  if (radioLayout) {
    radioLayout.disabled = true;

    try {
      await selectRadioLayout(radioLayout.dataset.radioLayout);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioLayout.disabled = false;
    }

    return;
  }

  const zocaloSelect = event.target.closest("[data-zocalo-select]");

  if (zocaloSelect) {
    const current = zocaloState(zocaloSelect.dataset.zocaloSelect);
    current.selected = Number(zocaloSelect.dataset.zocaloTextIndex);
    saveZocalos();
    renderOverlays();
    return;
  }

  const zocaloAdd = event.target.closest("[data-zocalo-add]");

  if (zocaloAdd) {
    addZocaloText(zocaloAdd.dataset.zocaloAdd);
    return;
  }

  const zocaloRemove = event.target.closest("[data-zocalo-remove]");

  if (zocaloRemove) {
    removeSelectedZocaloText(zocaloRemove.dataset.zocaloRemove);
    return;
  }

  const zocaloSave = event.target.closest("[data-zocalo-save]");

  if (zocaloSave) {
    zocaloSave.disabled = true;

    try {
      await saveEditedZocaloText(zocaloSave.dataset.zocaloSave);
    } catch (error) {
      setLog(error.message);
    } finally {
      zocaloSave.disabled = false;
    }

    return;
  }

  const zocaloAction = event.target.closest("[data-zocalo-action]");

  if (zocaloAction) {
    zocaloAction.disabled = true;

    try {
      await runZocalo(zocaloAction.dataset.zocaloInput, zocaloAction.dataset.zocaloAction);
    } catch (error) {
      setLog(error.message);
    } finally {
      zocaloAction.disabled = false;
    }

    return;
  }

  const utcOverlay = event.target.closest("[data-utc-overlay]");

  if (utcOverlay) {
    utcOverlay.disabled = true;

    try {
      await runUtcOverlay(utcOverlay.dataset.utcOverlay, utcOverlay.dataset.utcSlot);
    } catch (error) {
      setLog(error.message);
    } finally {
      utcOverlay.disabled = false;
    }

    return;
  }

  const logoItem = event.target.closest("[data-logo-path]");

  if (logoItem) {
    logoItem.disabled = true;

    try {
      await selectLogo(logoItem.dataset.logoPath);
    } catch (error) {
      setLog(error.message);
    } finally {
      logoItem.disabled = false;
    }

    return;
  }

  const photoItem = event.target.closest("[data-photo-index]");

  if (photoItem) {
    localStorage.setItem(PHOTO_SELECTED_KEY, photoItem.dataset.photoIndex);
    renderPhotoList();
    return;
  }

  if (event.target.closest("#photoAddButton")) {
    addPhotoPath();
    return;
  }

  const photoAction = event.target.closest("[data-photo-action]");

  if (photoAction) {
    photoAction.disabled = true;

    try {
      const action = photoAction.dataset.photoAction;

      if (action === "apply") {
        await applySelectedPhoto();
      } else if (action === "multiview") {
        await showPhotoInMultiview();
      } else if (action === "overlay") {
        await togglePhotoOverlay();
      } else if (action === "remove") {
        removeSelectedPhoto();
      }
    } catch (error) {
      setLog(error.message);
    } finally {
      photoAction.disabled = false;
    }

    return;
  }

  const radioMvPreview = event.target.closest("[data-radio-mv-preview]");

  if (radioMvPreview) {
    radioMvPreview.disabled = true;

    try {
      await previewRadioMultiviewLayout(radioMvPreview.dataset.radioMvPreview);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioMvPreview.disabled = false;
    }

    return;
  }

  const radioMvCut = event.target.closest("[data-radio-mv-cut]");

  if (radioMvCut) {
    radioMvCut.disabled = true;

    try {
      await cutRadioMultiviewLayout(radioMvCut.dataset.radioMvCut);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioMvCut.disabled = false;
    }

    return;
  }

  const utcOverlayOff = event.target.closest("[data-utc-overlay-off]");

  if (utcOverlayOff) {
    utcOverlayOff.disabled = true;

    try {
      await turnOffUtcOverlay(utcOverlayOff.dataset.utcOverlayOff);
    } catch (error) {
      setLog(error.message);
    } finally {
      utcOverlayOff.disabled = false;
    }

    return;
  }

  const button = event.target.closest("[data-function]");

  if (!button) {
    return;
  }

  button.disabled = true;

  try {
    await runFunction(button.dataset.function, button.dataset.input);
  } catch (error) {
    setLog(error.message);
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("input", (event) => {
  const zocaloSearch = event.target.closest("[data-zocalo-search]");

  if (zocaloSearch) {
    const inputNumber = zocaloSearch.dataset.zocaloSearch;
    const current = zocaloState(inputNumber);
    zocaloSearchTerms[inputNumber] = zocaloSearch.value;
    renderZocaloList(inputNumber, current);
    return;
  }

  const zocaloNew = event.target.closest("[data-zocalo-new]");

  if (zocaloNew && event.inputType === "insertLineBreak") {
    addZocaloText(zocaloNew.dataset.zocaloNew);
  }
});

document.addEventListener("keydown", async (event) => {
  const zocaloEdit = event.target.closest("[data-zocalo-edit]");

  if (zocaloEdit && event.key === "Enter") {
    event.preventDefault();
    try {
      await saveEditedZocaloText(zocaloEdit.dataset.zocaloEdit);
      zocaloEdit.blur();
    } catch (error) {
      setLog(error.message);
    }
    return;
  }

  const photoInput = event.target.closest("#photoPathInput");

  if (photoInput && event.key === "Enter") {
    event.preventDefault();
    addPhotoPath();
    return;
  }

  const zocaloNew = event.target.closest("[data-zocalo-new]");

  if (!zocaloNew || event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  addZocaloText(zocaloNew.dataset.zocaloNew);
});

document.addEventListener("change", async (event) => {
  const zocaloSlot = event.target.closest("[data-zocalo-slot]");

  if (zocaloSlot) {
    const current = zocaloState(zocaloSlot.dataset.zocaloSlot);
    current.slot = zocaloSlot.value;
    saveZocalos();
    return;
  }

  const radioMvLayer = event.target.closest("[data-radio-mv-layer]");

  if (radioMvLayer) {
    radioMvLayer.disabled = true;

    try {
      await updateRadioMultiviewLayer(radioMvLayer.dataset.radioMvLayer, radioMvLayer.value);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioMvLayer.disabled = false;
      radioMvLayer.blur();
      renderRadioMultiview();
    }

    return;
  }

  const multiviewSelect = event.target.closest("[data-multiview-position]");

  if (multiviewSelect) {
    multiviewSelect.disabled = true;

    try {
      await updateMultiviewPosition(Number(multiviewSelect.dataset.multiviewPosition), multiviewSelect.value);
    } catch (error) {
      setLog(error.message);
    } finally {
      multiviewSelect.disabled = false;
    }

    return;
  }

  const radioMultiviewSelect = event.target.closest("[data-radio-position]");

  if (!radioMultiviewSelect) {
    return;
  }

  radioMultiviewSelect.disabled = true;

  try {
    await updateRadioMultiviewPosition(Number(radioMultiviewSelect.dataset.radioPosition), radioMultiviewSelect.value);
  } catch (error) {
    setLog(error.message);
  } finally {
    radioMultiviewSelect.disabled = false;
  }
});

loadMonitorConfig();
refreshState();
setInterval(refreshState, 500);
setInterval(refreshDirectSnapshots, 1000);
