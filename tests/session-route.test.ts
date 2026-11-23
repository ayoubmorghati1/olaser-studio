import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST, DELETE } from "../app/api/session/route";
const req = (origin: string, password: string) =>
  new NextRequest("http://localhost:3000/api/session", {
    method: "POST",
    headers: {
      origin,
      host: "localhost:3000",
      "content-type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
test("Session route verifies origin, password, HttpOnly cookie and logout", async () => {
  process.env.STUDIO_PASSWORD = "route-test-password";
  process.env.SESSION_SECRET = "a".repeat(48);
  assert.equal(
    (await POST(req("http://evil.test", "route-test-password"))).status,
    403,
  );
  assert.equal((await POST(req("http://localhost:3000", "wrong"))).status, 401);
  const result = await POST(
    req("http://localhost:3000", "route-test-password"),
  );
  assert.equal(result.status, 200);
  assert.match(result.headers.get("set-cookie") ?? "", /HttpOnly/i);
  assert.match(result.headers.get("set-cookie") ?? "", /SameSite=strict/i);
  const out = await DELETE(req("http://localhost:3000", ""));
  assert.equal(out.status, 200);
  assert.match(out.headers.get("set-cookie") ?? "", /Max-Age=0/);
  delete process.env.SESSION_SECRET;
  assert.equal(
    (await POST(req("http://localhost:3000", "route-test-password"))).status,
    503,
  );
});
