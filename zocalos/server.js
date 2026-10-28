const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT || 3010);
const HOST = process.env.HOST || "0.0.0.0";
const VMIX_HOST = process.env.VMIX_HOST || "127.0.0.1";
const VMIX_PORT = Number(process.env.VMIX_PORT || 8088);
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

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

    send(res, 200, data, MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream");
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
        const body = Buffer.concat(chunks);
        sendOnce(
          proxyRes.statusCode || 200,
          body,
          proxyRes.headers["content-type"] || "text/xml; charset=utf-8"
        );
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

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/vmix")) {
    proxyVmix(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  const publicHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`Panel zocalos: http://${publicHost}:${PORT}`);
  console.log(`API vMix: http://${VMIX_HOST}:${VMIX_PORT}/api/`);
});
