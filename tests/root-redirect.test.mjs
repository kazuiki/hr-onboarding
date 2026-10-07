import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("the root route redirects visitors to login", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /import\s+\{\s*redirect\s*\}\s+from\s+["']next\/navigation["']/);
  assert.match(page, /redirect\(["']\/login["']\)/);
});
