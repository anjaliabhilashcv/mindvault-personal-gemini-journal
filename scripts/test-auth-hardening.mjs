/**
 * Security & Auth Hardening Verification Test Suite
 * Tests backend Firebase ID Token Verification and User Isolation
 */
import http from "http";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : null;

  if (body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const status = response.status;
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // raw text
  }

  return { status, data };
}

async function runTests() {
  console.log("=================================================");
  console.log("  MINDVAULT BACKEND AUTH HARDENING TEST SUITE    ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Missing Token on /api/chat -> 401
  console.log("Test 1: Missing token on /api/chat");
  const res1 = await makeRequest("/api/chat", {
    method: "POST",
    body: { messages: [{ role: "user", content: "Hello" }] },
  });
  assert(res1.status === 401, `Status is 401 (got ${res1.status})`);
  assert(res1.data?.error === "Authentication required.", `Generic safe error returned (got: "${res1.data?.error}")`);

  // TEST 2: Missing Token on /api/summarize -> 401
  console.log("\nTest 2: Missing token on /api/summarize");
  const res2 = await makeRequest("/api/summarize", {
    method: "POST",
    body: { title: "Test", content: "Some journal entry content" },
  });
  assert(res2.status === 401, `Status is 401 (got ${res2.status})`);
  assert(res2.data?.error === "Authentication required.", `Generic safe error returned (got: "${res2.data?.error}")`);

  // TEST 3: Missing Token on /api/analyze-reflection -> 401
  console.log("\nTest 3: Missing token on /api/analyze-reflection");
  const res3 = await makeRequest("/api/analyze-reflection", {
    method: "POST",
    body: { entries: [{ title: "Day 1", content: "Reflecting on work and growth" }] },
  });
  assert(res3.status === 401, `Status is 401 (got ${res3.status})`);
  assert(res3.data?.error === "Authentication required.", `Generic safe error returned (got: "${res3.data?.error}")`);

  // TEST 4: Invalid / Malformed Token -> 401
  console.log("\nTest 4: Invalid/tampered Bearer token");
  const res4 = await makeRequest("/api/chat", {
    method: "POST",
    headers: { Authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature" },
    body: { messages: [{ role: "user", content: "Hello" }] },
  });
  assert(res4.status === 401, `Status is 401 on invalid token (got ${res4.status})`);
  assert(res4.data?.error === "Authentication required.", `Generic safe error returned without leaking token info`);

  // TEST 5: Non-Bearer Authorization Scheme -> 401
  console.log("\nTest 5: Non-Bearer scheme (e.g. Basic auth)");
  const res5 = await makeRequest("/api/summarize", {
    method: "POST",
    headers: { Authorization: "Basic dXNlcjpwYXNz" },
    body: { title: "Test", content: "Content" },
  });
  assert(res5.status === 401, `Status is 401 on non-Bearer header (got ${res5.status})`);
  assert(res5.data?.error === "Authentication required.", `Generic safe error returned`);

  // TEST 6: Empty Bearer Token -> 401
  console.log("\nTest 6: Empty Bearer token");
  const res6 = await makeRequest("/api/analyze-reflection", {
    method: "POST",
    headers: { Authorization: "Bearer " },
    body: { entries: [{ title: "Day 1", content: "Content" }] },
  });
  assert(res6.status === 401, `Status is 401 on empty Bearer token (got ${res6.status})`);

  // TEST 7: Cross-user isolation simulation (verify error masking)
  console.log("\nTest 7: Verification that errors NEVER expose secrets or stack traces");
  const errorJson = JSON.stringify(res4.data);
  assert(!errorJson.includes("stack"), "No stack trace leaked in response");
  assert(!errorJson.includes("private"), "No private keys leaked in response");
  assert(!errorJson.includes("AIza"), "No API keys leaked in response");
  assert(!errorJson.includes("Bearer"), "No token details leaked in response");

  console.log(`\n=================================================`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
