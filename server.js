const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const VMIX_HOST = process.env.VMIX_HOST || "127.0.0.1";
const VMIX_PORT = Number(process.env.VMIX_PORT || 8088);
const IS_REMOTE_VMIX = !["127.0.0.1", "localhost", "::1"].includes(VMIX_HOST.toLowerCase());
const PUBLIC_DIR = path.join(__dirname, "public");
const FFMPEG_PATH = resolveFfmpegPath();
const PREVIEW_SNAPSHOT_PATH = path.join(__dirname, "preview-live.jpg");
const PROGRAM_SNAPSHOT_PATH = path.join(__dirname, "program-live.jpg");
const PROGRAM_OUTPUT_SNAPSHOT_PATH = path.join(__dirname, "program-output-live.jpg");
const INPUT_SNAPSHOT_DIR = path.join(__dirname, "input-snapshots");
const AMO_VIAJAR_MEDIA_DIR = path.join(__dirname, "amo-viajar-media");
const MAX_AMO_VIAJAR_FILE_SIZE = 20 * 1024 * 1024 * 1024;
const MONITOR_DEVICES = {
  program: process.env.VMIX_PROGRAM_DEVICE || "vMix Video",
  preview: process.env.VMIX_PREVIEW_DEVICE || "vMix Video External 2"
};
const monitorStreams = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolveFfmpegPath() {
  const candidates = [
    process.env.FFMPEG_PATH,
    path.join(__dirname, "runtime", "ffmpeg.exe"),
    path.join(__dirname, "tools", "ffmpeg.exe"),
    path.join(__dirname, "tools", "ffmpeg", "ffmpeg.exe"),
    "C:\\Program Files\\DownloadHelper CoApp\\ffmpeg.exe",
    "ffmpeg.exe"
  ].filter(Boolean);

  return candidates.find((candidate) => {
    if (candidate === "ffmpeg.exe") {
      return true;
    }

    return fs.existsSync(candidate);
  }) || "ffmpeg.exe";
}

function send(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function serveStatic(req, res) {
  const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath);
    send(res, 200, data, MIME_TYPES[ext] || "application/octet-stream");
  });
}

function proxyVmix(req, res) {
  const incomingUrl = new URL(req.url, `http://${req.headers.host}`);
  const vmixPath = `/api/${incomingUrl.search}`;
  let didRespond = false;

  const sendOnce = (statusCode, body, contentType) => {
    if (didRespond || res.headersSent || res.writableEnded) {
      return;
    }

    didRespond = true;
    send(res, statusCode, body, contentType);
  };

  const proxyReq = http.request(
    {
      host: VMIX_HOST,
      port: VMIX_PORT,
      method: "GET",
      path: vmixPath,
      timeout: 5000
    },
    (proxyRes) => {
      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        if (didRespond || res.headersSent || res.writableEnded) {
          return;
        }

        didRespond = true;
        const body = Buffer.concat(chunks);
        res.writeHead(proxyRes.statusCode || 200, {
          "Content-Type": proxyRes.headers["content-type"] || "text/xml; charset=utf-8",
          "Cache-Control": "no-store"
        });
        res.end(body);
      });
    }
  );

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    sendOnce(504, "vMix API timeout");
  });

  proxyReq.on("error", () => {
    sendOnce(
      502,
      JSON.stringify({
        error: "No pude conectar con vMix.",
        host: VMIX_HOST,
        port: VMIX_PORT,
        hint: "Verifica que vMix este abierto y que Web Controller / API este activo."
      }),
      "application/json; charset=utf-8"
    );
  });

  proxyReq.end();
}

function getVmixXml() {
  return new Promise((resolve, reject) => {
    const apiReq = http.request(
      {
        host: VMIX_HOST,
        port: VMIX_PORT,
        method: "GET",
        path: "/api/",
        timeout: 5000
      },
      (apiRes) => {
        const chunks = [];
        apiRes.on("data", (chunk) => chunks.push(chunk));
        apiRes.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }
    );

    apiReq.on("timeout", () => {
      apiReq.destroy();
      reject(new Error("vMix API timeout"));
    });
    apiReq.on("error", reject);
    apiReq.end();
  });
}

function callVmixApi(apiPath) {
  return new Promise((resolve, reject) => {
    const apiReq = http.request(
      {
        host: VMIX_HOST,
        port: VMIX_PORT,
        method: "GET",
        path: apiPath,
        timeout: 5000
      },
      (apiRes) => {
        apiRes.resume();
        apiRes.on("end", resolve);
      }
    );

    apiReq.on("timeout", () => {
      apiReq.destroy();
      reject(new Error("vMix API timeout"));
    });
    apiReq.on("error", reject);
    apiReq.end();
  });
}

function safeMediaFileName(rawName) {
  const original = String(rawName || "video.mp4");
  let decoded = original;

  try {
    decoded = decodeURIComponent(original);
  } catch {
    decoded = original;
  }

  const baseName = path.basename(decoded).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim();

  if (!baseName || path.extname(baseName).toLowerCase() !== ".mp4") {
    throw new Error("Selecciona un archivo MP4 valido.");
  }

  return baseName;
}

async function availableMediaPath(fileName) {
  await fs.promises.mkdir(AMO_VIAJAR_MEDIA_DIR, { recursive: true });
  const parsed = path.parse(fileName);
  let candidate = path.join(AMO_VIAJAR_MEDIA_DIR, fileName);
  let suffix = 2;

  while (fs.existsSync(candidate)) {
    candidate = path.join(AMO_VIAJAR_MEDIA_DIR, `${parsed.name} (${suffix})${parsed.ext}`);
    suffix += 1;
  }

  return candidate;
}

function xmlAttribute(tag, name) {
  const value = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1] || "";
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function findInputNumberByTitle(xml, title) {
  const target = title.toLowerCase();
  const tags = xml.match(/<input\b[^>]*>/gi) || [];

  for (const tag of tags) {
    const inputTitle = xmlAttribute(tag, "title").toLowerCase();
    const shortTitle = xmlAttribute(tag, "shortTitle").toLowerCase();

    if (inputTitle === target || shortTitle === target) {
      return xmlAttribute(tag, "number");
    }
  }

  return "";
}

async function waitForInputNumber(title) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const xml = await getVmixXml();
    const inputNumber = findInputNumberByTitle(xml, title);

    if (inputNumber) {
      return inputNumber;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("vMix agrego el archivo pero no pude identificar el nuevo input.");
}

async function addAmoViajarInput(filePath) {
  const title = path.basename(filePath);
  await callVmixApi(`/api/?Function=AddInput&Value=${encodeURIComponent(`Video|${filePath}`)}`);
  const inputNumber = await waitForInputNumber(title);

  await callVmixApi(`/api/?Function=AudioBusOn&Input=${encodeURIComponent(inputNumber)}&Value=A`);
  await callVmixApi(`/api/?Function=AudioBusOff&Input=${encodeURIComponent(inputNumber)}&Value=M`);

  return inputNumber;
}

async function uploadAmoViajar(req, res) {
  if (IS_REMOTE_VMIX) {
    send(
      res,
      409,
      JSON.stringify({ error: "La carga debe hacerse desde el panel instalado en la misma PC de vMix." }),
      "application/json; charset=utf-8"
    );
    return;
  }

  const contentLength = Number(req.headers["content-length"] || 0);

  if (!contentLength || contentLength > MAX_AMO_VIAJAR_FILE_SIZE) {
    send(res, 413, JSON.stringify({ error: "El archivo esta vacio o supera 20 GB." }), "application/json; charset=utf-8");
    return;
  }

  let finalPath;
  let temporaryPath;

  try {
    const fileName = safeMediaFileName(req.headers["x-file-name"]);
    finalPath = await availableMediaPath(fileName);
    temporaryPath = `${finalPath}.part`;
    const output = fs.createWriteStream(temporaryPath, { flags: "wx" });
    let received = 0;

    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => {
        received += chunk.length;

        if (received > MAX_AMO_VIAJAR_FILE_SIZE) {
          reject(new Error("El archivo supera 20 GB."));
          req.destroy();
        }
      });
      req.on("aborted", () => reject(new Error("La carga fue cancelada.")));
      req.on("error", reject);
      output.on("error", reject);
      output.on("finish", resolve);
      req.pipe(output);
    });

    await fs.promises.rename(temporaryPath, finalPath);
    const inputNumber = await addAmoViajarInput(finalPath);

    send(
      res,
      200,
      JSON.stringify({ fileName: path.basename(finalPath), inputNumber, bus: "A" }),
      "application/json; charset=utf-8"
    );
  } catch (error) {
    if (temporaryPath) {
      await fs.promises.unlink(temporaryPath).catch(() => {});
    }

    send(res, 500, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
  }
}

async function removeAmoViajar(req, res) {
  try {
    const incomingUrl = new URL(req.url, `http://${req.headers.host}`);
    const inputNumber = incomingUrl.searchParams.get("input") || "";
    const fileName = safeMediaFileName(incomingUrl.searchParams.get("file"));

    if (!/^\d+$/.test(inputNumber)) {
      throw new Error("Numero de input invalido.");
    }

    await callVmixApi(`/api/?Function=RemoveInput&Input=${encodeURIComponent(inputNumber)}`);
    const filePath = path.join(AMO_VIAJAR_MEDIA_DIR, fileName);

    if (!filePath.startsWith(`${AMO_VIAJAR_MEDIA_DIR}${path.sep}`)) {
      throw new Error("Ruta de archivo invalida.");
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    await fs.promises.unlink(filePath).catch((error) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });

    send(
      res,
      200,
      JSON.stringify({ inputNumber, fileName, removed: true }),
      "application/json; charset=utf-8"
    );
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
  }
}

async function readFileWithRetry(filePath, retries = 8) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  return fs.promises.readFile(filePath);
}

async function servePreviewSnapshot(res) {
  try {
    const xml = await getVmixXml();
    const preview = xml.match(/<preview>([^<]+)<\/preview>/)?.[1];

    if (!preview) {
      send(res, 404, "Preview not found");
      return;
    }

    await callVmixApi(`/api/?Function=SnapshotInput&Input=${encodeURIComponent(preview)}&Value=${encodeURIComponent(PREVIEW_SNAPSHOT_PATH)}`);
    const image = await readFileWithRetry(PREVIEW_SNAPSHOT_PATH, 12);

    send(res, 200, image, "image/jpeg");
  } catch (error) {
    send(res, 502, "No pude generar snapshot de Preview");
  }
}

async function serveProgramSnapshot(res) {
  try {
    await callVmixApi(`/api/?Function=Snapshot&Value=${encodeURIComponent(PROGRAM_OUTPUT_SNAPSHOT_PATH)}`);
    const image = await readFileWithRetry(PROGRAM_OUTPUT_SNAPSHOT_PATH, 12);

    send(res, 200, image, "image/jpeg");
  } catch (error) {
    send(res, 502, "No pude generar snapshot de Program");
  }
}

async function serveInputSnapshot(req, res) {
  try {
    const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    const inputNumber = requestPath.match(/^\/snapshot\/input\/(\d+)\.jpg$/)?.[1];

    if (!inputNumber) {
      send(res, 404, "Input snapshot not found");
      return;
    }

    await fs.promises.mkdir(INPUT_SNAPSHOT_DIR, { recursive: true });

    const snapshotPath = path.join(INPUT_SNAPSHOT_DIR, `input-${inputNumber}.jpg`);

    await callVmixApi(`/api/?Function=SnapshotInput&Input=${encodeURIComponent(inputNumber)}&Value=${encodeURIComponent(snapshotPath)}`);
    const image = await readFileWithRetry(snapshotPath, 8);

    send(res, 200, image, "image/jpeg");
  } catch (error) {
    send(res, 502, "No pude generar snapshot del input");
  }
}

function ensureVmixExternal() {
  const requests = ["/api/?Function=StartExternal"];

  requests.forEach((requestPath) => {
    const req = http.request(
      {
        host: VMIX_HOST,
        port: VMIX_PORT,
        method: "GET",
        path: requestPath,
        timeout: 2000
      },
      (apiRes) => apiRes.resume()
    );

    req.on("error", () => {});
    req.on("timeout", () => req.destroy());
    req.end();
  });
}

function streamMonitor(req, res, monitorName) {
  const device = MONITOR_DEVICES[monitorName];

  if (!device) {
    send(res, 404, "Monitor not found");
    return;
  }

  ensureVmixExternal();

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffmpeg",
    "Cache-Control": "no-store",
    "Connection": "close"
  });

  const stream = getSharedMonitorStream(monitorName, device);
  stream.clients.add(res);

  if (stream.lastChunk) {
    res.write(stream.lastChunk);
  }

  const removeClient = () => {
    stream.clients.delete(res);
  };

  req.on("close", removeClient);
  res.on("close", removeClient);
}

function getSharedMonitorStream(monitorName, device) {
  const existing = monitorStreams.get(monitorName);

  if (existing && !existing.process.killed) {
    return existing;
  }

  const stream = {
    clients: new Set(),
    lastChunk: null,
    process: spawn(FFMPEG_PATH, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "dshow",
      "-i",
      `video=${device}`,
      "-an",
      "-vf",
      "scale=640:360,fps=25",
      "-c:v",
      "mjpeg",
      "-q:v",
      "5",
      "-f",
      "mpjpeg",
      "pipe:1"
    ])
  };

  stream.process.stdout.on("data", (chunk) => {
    stream.lastChunk = chunk;
    stream.clients.forEach((client) => {
      if (!client.destroyed) {
        client.write(chunk);
      }
    });
  });

  stream.process.stderr.on("data", (chunk) => {
    console.error(`[${monitorName}] ${chunk}`);
  });

  stream.process.on("error", (error) => {
    monitorStreams.delete(monitorName);
    stream.clients.forEach((client) => {
      if (!client.destroyed) {
        client.end(`No pude iniciar monitor ${monitorName}: ${error.message}`);
      }
    });
  });

  stream.process.on("exit", () => {
    monitorStreams.delete(monitorName);
    stream.clients.forEach((client) => {
      if (!client.destroyed) {
        client.end();
      }
    });
  });

  monitorStreams.set(monitorName, stream);
  return stream;
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/amo-viajar/upload") {
    uploadAmoViajar(req, res);
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/amo-viajar/remove?")) {
    removeAmoViajar(req, res);
    return;
  }

  if (IS_REMOTE_VMIX && req.url.startsWith("/monitor/")) {
    send(res, 204, "");
    return;
  }

  if (req.url.startsWith("/monitor/program.mjpg")) {
    streamMonitor(req, res, "program");
    return;
  }

  if (req.url.startsWith("/monitor/program.jpg")) {
    serveProgramSnapshot(res);
    return;
  }

  if (req.url.startsWith("/monitor/preview.jpg")) {
    servePreviewSnapshot(res);
    return;
  }

  if (req.url.startsWith("/monitor/preview.mjpg")) {
    streamMonitor(req, res, "preview");
    return;
  }

  if (req.url.startsWith("/snapshot/input/")) {
    serveInputSnapshot(req, res);
    return;
  }

  if (req.url.startsWith("/vmix")) {
    proxyVmix(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  const publicHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`Panel vMix: http://${publicHost}:${PORT}`);
  console.log(`API vMix: http://${VMIX_HOST}:${VMIX_PORT}/api/`);
});
