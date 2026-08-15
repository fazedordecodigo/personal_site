import { createReadStream, realpathSync } from "node:fs";
import { access, lstat, realpath } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const MIME_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
});

function isContained(candidate, root) {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === "" || (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

function sendText(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...headers,
  });
  response.end(body);
}

function parseRequestPath(requestUrl) {
  let parsed;
  try {
    parsed = new URL(requestUrl ?? "", "http://127.0.0.1");
  } catch {
    return null;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
  if (pathname.includes("\0")) {
    return null;
  }
  return pathname;
}

export function createStaticServer({ root }) {
  if (typeof root !== "string" || root.length === 0) {
    throw new TypeError("root must be a non-empty path");
  }
  const rootPath = realpathSync(resolve(root));

  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Method Not Allowed\n", { allow: "GET, HEAD" });
      return;
    }

    const pathname = parseRequestPath(request.url);
    if (pathname === null) {
      sendText(response, 400, "Bad Request\n");
      return;
    }
    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const candidate = resolve(join(rootPath, `.${requestedPath}`));
    if (!isContained(candidate, rootPath)) {
      sendText(response, 404, "Not Found\n");
      return;
    }

    let stat;
    try {
      stat = await lstat(candidate);
      if (!stat.isFile()) {
        sendText(response, 404, "Not Found\n");
        return;
      }
      const resolvedCandidate = await realpath(candidate);
      if (!isContained(resolvedCandidate, rootPath) || resolvedCandidate !== candidate) {
        sendText(response, 404, "Not Found\n");
        return;
      }
    } catch {
      sendText(response, 404, "Not Found\n");
      return;
    }

    const contentType = MIME_TYPES[extname(candidate).toLowerCase()];
    if (!contentType) {
      sendText(response, 404, "Not Found\n");
      return;
    }
    response.writeHead(200, {
      "content-type": contentType,
      "content-length": stat.size,
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(candidate).pipe(response);
  });
}

async function main() {
  const [, , root = "public", port = "4173"] = process.argv;
  await access(root);
  const server = createStaticServer({ root });
  server.listen(Number(port), "127.0.0.1", () => {
    console.log(`Listening on http://127.0.0.1:${port}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
