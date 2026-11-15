import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const [script, args] of [
  ["typescript/bin/tsc", ["-b"]],
  ["vite/bin/vite.js", ["build"]],
]) {
  const result = spawnSync(
    process.execPath,
    [resolve(root, "node_modules", script), ...args],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
