import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("root metadata uses the PKII ICO tab icon", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.match(layout, /icon:\s*"\/pkiiicon\.ico"/);
  assert.doesNotMatch(layout, /icon:\s*"\/pkii-logo-tab\.jpg"/);
});

test("the tab icon is an ICO file", async () => {
  const icon = await readFile(new URL("../public/pkiiicon.ico", import.meta.url));

  assert.deepEqual(icon.subarray(0, 4), Buffer.from([0, 0, 1, 0]));
});
