#!/usr/bin/env node
/**
 * CI gate: re-runs openapi-typescript against `openapi.json` and diffs
 * the result against the committed `src/generated/types.ts`. Drift means
 * either openapi.json was edited by hand, or the generator output the
 * current types from a different OpenAPI commit.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tracked = new URL("../src/generated/types.ts", import.meta.url).pathname;
const openapi = new URL("../openapi.json", import.meta.url).pathname;

const tmp = mkdtempSync(join(tmpdir(), "contract-types-"));
const candidate = join(tmp, "types.ts");

try {
  execFileSync(
    new URL("../node_modules/.bin/openapi-typescript", import.meta.url).pathname,
    [openapi, "--output", candidate],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  const expected = readFileSync(tracked, "utf8");
  const actual = readFileSync(candidate, "utf8");
  if (expected !== actual) {
    console.error(
      `[verify:contract-types] Drift detected. Run \`pnpm --filter @vibly-ai/coordinator-http-contract gen\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log("[verify:contract-types] In sync.");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
