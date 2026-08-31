/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * CONNECTION DIAGNOSTIC.
 *
 * Answers one question: when the browser asks the dev server for an API route
 * and does not get the backend's answer, which hop broke?
 *
 * Run it with both servers already running:
 *
 *   node scripts/diagnose.mjs
 *   node scripts/diagnose.mjs --vite 5174 --backend 4000
 *
 * It checks the three hops in order and stops being useful only once every
 * line reads OK:
 *
 *   1. the backend itself                     (is it up, on the expected port)
 *   2. the dev server                         (is it up)
 *   3. the dev server's /api proxy            (does it reach the backend)
 *
 * The proxy hop is the one that usually fails, and it fails in two ways that
 * look identical in the browser console but have different fixes — this tells
 * them apart.
 */

const args = process.argv.slice(2);

function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);

  return index === -1 ? fallback : args[index + 1];
}

const backendPort = arg('backend', '4000');
const vitePort = arg('vite', '5174');
const backendUrl = `http://127.0.0.1:${backendPort}`;
const viteUrl = `http://127.0.0.1:${vitePort}`;

const results = [];

function report(step, ok, detail) {
  results.push(ok);
  console.log(`${ok ? '  OK  ' : ' FAIL '} ${step}`);

  if (detail) {
    console.log(`        ${detail}`);
  }
}

async function probe(url, init) {
  try {
    const response = await fetch(url, init);
    const text = await response.text();
    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      /* Not JSON — that is itself a finding, handled by the caller. */
    }

    return { ok: true, status: response.status, text, json };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

console.log(`\nBackend : ${backendUrl}`);
console.log(`Vite    : ${viteUrl}\n`);

/* ── 1. the backend ──────────────────────────────────────────────────────── */

const health = await probe(`${backendUrl}/health`);

if (!health.ok) {
  report('backend is reachable', false, `${health.error} — start it with: cd backend && npm run dev`);
} else {
  report('backend is reachable', health.status === 200, `HTTP ${health.status}`);
}

/* ── 2. the dev server ───────────────────────────────────────────────────── */

const root = await probe(viteUrl);

if (!root.ok) {
  report('dev server is reachable', false, `${root.error} — start it with: cd front && npm run dev`);
} else {
  report('dev server is reachable', root.status === 200, `HTTP ${root.status}`);
}

/* ── 3. the /api proxy ───────────────────────────────────────────────────── */

/*
 * Asking for JSON matters. Vite's SPA fallback only rewrites requests that
 * accept HTML, so an unproxied /api request returns a bare 404 — exactly what
 * the browser sees, and what a plain curl without this header would hide.
 */
const proxied = await probe(`${viteUrl}/api/v1/dashboard`, {
  headers: { Accept: 'application/json' }
});

if (!proxied.ok) {
  report('/api proxy reaches the backend', false, proxied.error);
} else if (proxied.json && typeof proxied.json.success === 'boolean') {
  // Our own envelope came back, so the request reached the backend. 401 here
  // is correct and expected: the route requires a session.
  report(
    '/api proxy reaches the backend',
    true,
    `HTTP ${proxied.status} — the backend answered (401 without a session is correct)`
  );
} else if (proxied.status === 404) {
  report(
    '/api proxy reaches the backend',
    false,
    'HTTP 404 with no backend envelope — the request never reached the backend.\n' +
      '        Either the dev server did not load front/vite.config.ts (start it from the\n' +
      '        front directory), or something between the browser and the dev server is\n' +
      '        answering instead — endpoint-security software that inspects local web\n' +
      '        traffic does this. Test by excluding localhost from its web scanning.'
  );
} else {
  report(
    '/api proxy reaches the backend',
    false,
    `HTTP ${proxied.status} with an unexpected body: ${proxied.text.slice(0, 120)}`
  );
}

/* ── 4. direct call, bypassing the dev server ────────────────────────────── */

const direct = await probe(`${backendUrl}/api/v1/dashboard`, {
  headers: { Accept: 'application/json', Origin: `http://localhost:${vitePort}` }
});

if (!direct.ok) {
  report('backend accepts a browser request from the dev-server origin', false, direct.error);
} else if (direct.status === 403) {
  report(
    'backend accepts a browser request from the dev-server origin',
    false,
    `HTTP 403 — the backend refuses origin http://localhost:${vitePort}.\n` +
      '        Add it to CORS_ALLOWED_ORIGINS in backend/.env, or remove that line to\n' +
      '        use the defaults.'
  );
} else {
  report(
    'backend accepts a browser request from the dev-server origin',
    true,
    `HTTP ${direct.status} — origin accepted`
  );
}

console.log(
  results.every(Boolean)
    ? '\nAll hops are healthy. If the browser still fails, hard-reload it (Ctrl+Shift+R).\n'
    : '\nFix the first FAIL above, then run this again.\n'
);

process.exit(results.every(Boolean) ? 0 : 1);
