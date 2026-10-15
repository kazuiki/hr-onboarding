import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";

test("the root route is a landing page linking to the sign-in page", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /href="\/onboardingSys\?tab=employee"/);
  assert.match(page, /href="\/onboardingSys\?tab=hr"/);
});

test("the sign-in page lives at /onboardingSys", async () => {
  const info = await stat(new URL("../app/onboardingSys/page.tsx", import.meta.url));
  assert.ok(info.isFile());
});
