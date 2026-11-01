import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";


const require = createRequire(import.meta.url);
const packagePath =
  require.resolve("@tailwindcss/language-server/package.json");
const serverPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const serverPath = path.resolve(
  path.dirname(packagePath),
  serverPackage.bin["tailwindcss-language-server"],
);
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const rootUri = pathToFileURL(root + path.sep).href;
const fixing = process.argv.includes("--fix");
const verbose = process.argv.includes("--verbose");
const child = spawn(process.execPath, [serverPath, "--stdio"], {
  cwd: root,
  windowsHide: true,
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = Buffer.alloc(0);
let nextId = 0;
let stopped = false;
let phase = "initialize";
let lastDiagnostic = Date.now();
const pending = new Map();
const diagnostics = new Map();
const probeUri = pathToFileURL(
  path.join(root, "components", "__tailwind_canonical_probe__.tsx"),
).href;
const canonical = (items) =>
  items.filter((item) => item.code === "suggestCanonicalClasses");

function send(message) {
  const body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...message }));
  child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  child.stdin.write(body);
}
function request(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tailwind request timed out: ${method}`));
    }, 30000);
    pending.set(id, { resolve, reject, timer });
    send({ id, method, params });
  });
}
function notify(method, params) {
  send({ method, params });
}
function onMessage(message) {
  if (message.id !== undefined && message.method) {
    let result = null;
    if (message.method === "workspace/configuration") {
      result = message.params.items.map((item) => {
        if (item.section === "editor") return { tabSize: 2 };
        if (item.section !== "tailwindCSS") return null;
        return {
          validate: true,
          rootFontSize: 16,
          lint: { suggestCanonicalClasses: "warning", cssConflict: "ignore" },
          experimental: { configFile: path.join(root, "app", "globals.css") },
        };
      });
    }
    if (message.method === "workspace/workspaceFolders")
      result = [{ uri: rootUri, name: path.basename(root) }];
    send({ id: message.id, result });
    return;
  }
  if (message.id !== undefined && pending.has(message.id)) {
    const task = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(task.timer);
    if (message.error) task.reject(new Error(JSON.stringify(message.error)));
    else task.resolve(message.result);
    return;
  }
  if (
    message.method === "textDocument/publishDiagnostics" &&
    phase !== "shutdown"
  ) {
    diagnostics.set(message.params.uri, message.params.diagnostics);
    lastDiagnostic = Date.now();
    if (verbose)
      console.log(
        `Diagnostics ${message.params.uri}: ${canonical(message.params.diagnostics).length}`,
      );
  }
  if (
    message.method === "window/logMessage" &&
    (verbose || message.params.message.includes("Loaded tailwindcss v"))
  )
    console.log(message.params.message);
}

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const end = buffer.indexOf("\r\n\r\n");
    if (end < 0) return;
    const length = Number(
      buffer
        .subarray(0, end)
        .toString()
        .match(/Content-Length:\s*(\d+)/i)?.[1],
    );
    if (!Number.isFinite(length))
      throw new Error("Invalid Tailwind LSP header");
    if (buffer.length < end + 4 + length) return;
    const body = buffer.subarray(end + 4, end + 4 + length).toString();
    buffer = buffer.subarray(end + 4 + length);
    onMessage(JSON.parse(body));
  }
});
child.stderr.on("data", (chunk) => console.error(chunk.toString().trim()));
child.on("error", (error) => {
  stopped = true;
  for (const task of pending.values()) {
    clearTimeout(task.timer);
    task.reject(error);
  }
  pending.clear();
});
child.on("exit", () => {
  stopped = true;
  for (const task of pending.values()) {
    clearTimeout(task.timer);
    task.reject(new Error("Tailwind language server exited."));
  }
  pending.clear();
});
child.stdin.on("error", () => {
  stopped = true;
});

async function waitFor(predicate) {
  const deadline = Date.now() + 120000;
  while (!predicate()) {
    if (stopped || Date.now() >= deadline)
      throw new Error(`Tailwind audit failed during ${phase}.`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
function sourceFiles(folder) {
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? sourceFiles(path.join(folder, entry.name))
        : /\.(tsx|jsx)$/.test(entry.name)
          ? [path.join(folder, entry.name)]
          : [],
    );
}
function open(uri, text) {
  notify("textDocument/didOpen", {
    textDocument: { uri, text, languageId: "typescriptreact", version: 1 },
  });
}
function applyFixes(findings) {
  const files = new Map();
  for (const finding of findings) {
    if (!files.has(finding.file)) files.set(finding.file, []);
    files.get(finding.file).push(finding);
  }
  for (const [file, items] of files) {
    let source = fs.readFileSync(file, "utf8");
    const starts = [0];
    for (let i = 0; i < source.length; i++)
      if (source[i] === "\n") starts.push(i + 1);
    const offset = (point) => starts[point.line] + point.character;
    const edits = items
      .map((item) => {
        const start = offset(item.range.start),
          end = offset(item.range.end);
        const expected = item.message.match(/`([^`]+)`/)?.[1];
        if (
          source.slice(start, end) !== expected ||
          item.suggestions?.length !== 1
        )
          throw new Error(
            `Cannot safely apply the canonical fix at ${file}:${item.range.start.line + 1}`,
          );
        return { start, end, text: item.suggestions[0] };
      })
      .sort((a, b) => b.start - a.start);
    for (const edit of edits)
      source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
    fs.writeFileSync(file, source);
  }
}

try {
  await request("initialize", {
    processId: process.pid,
    rootUri,
    workspaceFolders: [{ uri: rootUri, name: path.basename(root) }],
    capabilities: {
      textDocument: { publishDiagnostics: { relatedInformation: true } },
      workspace: {
        configuration: true,
        workspaceFolders: true,
        didChangeWatchedFiles: { dynamicRegistration: true },
      },
    },
  });
  notify("initialized", {});
  phase = "project discovery";


  open(probeUri, '<div className="h-[91px]" />');
  await waitFor(() =>
    canonical(diagnostics.get(probeUri) ?? []).some((item) =>
      item.suggestions?.includes("h-22.75"),
    ),
  );

  phase = "source diagnostics";
  const files = [
    ...sourceFiles(path.join(root, "app")),
    ...sourceFiles(path.join(root, "components")),
  ];
  const uris = files.map((file) => pathToFileURL(file).href);


  for (let i = 0; i < files.length; i++) {
    open(uris[i], fs.readFileSync(files[i], "utf8"));
    await waitFor(() => diagnostics.has(uris[i]));
    if ((i + 1) % 10 === 0)
      console.log(`Checked ${i + 1}/${files.length} files…`);
  }
  await waitFor(
    () =>
      uris.every((uri) => diagnostics.has(uri)) &&
      Date.now() - lastDiagnostic >= 1500,
  );
  const findings = uris.flatMap((uri) =>
    canonical(diagnostics.get(uri)).map((item) => ({
      file: fileURLToPath(uri),
      ...item,
    })),
  );
  if (fixing && findings.length) {
    applyFixes(findings);
    console.log(
      `Applied ${findings.length} canonical fixes. Run npm run format, then npm run styles:check.`,
    );
  } else {
    for (const finding of findings.slice(0, 20))
      console.error(
        `${path.relative(root, finding.file)}:${finding.range.start.line + 1}: ${finding.message}`,
      );
    console.log(
      `Tailwind IntelliSense ${serverPackage.version}: ${files.length} files, ${findings.length} suggestCanonicalClasses warnings.`,
    );
    if (findings.length) process.exitCode = 1;
  }
  phase = "shutdown";
  await request("shutdown", null);
  notify("exit");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  child.kill();
}
