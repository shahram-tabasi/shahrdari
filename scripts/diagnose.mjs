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

    return {
      ok: true,
      status: response.status,
      text,
      json,
      headers: response.headers,
      /*
       * Every response this API produces carries an X-Request-Id, set before
       * routing and therefore present on success pages, on error pages and on
       * its own 404s alike. Its ABSENCE on a reply that did arrive means the
       * reply was not written by this server — something else on the machine
       * answered in its place.
       */
      fromOurServer: response.headers.has('x-request-id')
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/** Who answered, when the answer did not come from this API. */
function describeResponder(result) {
  const server = result.headers?.get('server');
  const powered = result.headers?.get('x-powered-by');
  const type = result.headers?.get('content-type');
  const body = result.text.trim().slice(0, 160).replace(/\s+/g, ' ');

  return [
    server ? `Server: ${server}` : null,
    powered ? `X-Powered-By: ${powered}` : null,
    type ? `Content-Type: ${type}` : null,
    body ? `Body: ${body}` : '(empty body)'
  ]
    .filter(Boolean)
    .map(line => `        ${line}`)
    .join('\n');
}

/**
 * Explain a reply that arrived but was not written by this API.
 *
 * The `X-Powered-By: Express` header narrows it down decisively: this API
 * strips that header, so its presence means a DIFFERENT Node application holds
 * the port. Without it, an interceptor sitting in front of local traffic is the
 * likelier explanation. The two have different fixes, so they get different
 * advice rather than one hedged paragraph.
 */
function explainForeignReply(result, port) {
  const anotherNodeApp = result.headers?.get('x-powered-by');

  return anotherNodeApp
    ? 'The reply carries no X-Request-Id but does carry X-Powered-By, which this\n' +
        '        API strips. A DIFFERENT Node/Express application is holding this port.\n' +
        '        These commands take no editing — run them as-is.\n' +
        '        See what it is:\n' +
        `          Windows : Get-Process -Id (Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique) | Format-List Id, ProcessName, Path\n` +
        `          macOS   : lsof -nP -iTCP:${port} -sTCP:LISTEN\n` +
        `          Linux   : ss -lntp | grep :${port}\n` +
        '        Stop it, once you are sure you do not need it:\n' +
        `          Windows : Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique) -Force\n` +
        `          macOS / Linux : kill $(lsof -t -iTCP:${port} -sTCP:LISTEN)\n` +
        "        Then start this project's backend again."
    : 'The reply carries no X-Request-Id, so this API did not write it.\n' +
        '        Either another program holds this port, or software on this machine\n' +
        "        is inspecting local web traffic and answering in the server's place.\n" +
        '        Endpoint-security suites do this; exclude localhost from their web\n' +
        '        scanning and try again.';
}

console.log(`\nBackend : ${backendUrl}`);
console.log(`Vite    : ${viteUrl}\n`);

/* ── 1. the backend ──────────────────────────────────────────────────────── */

const health = await probe(`${backendUrl}/health`);

if (!health.ok) {
  report(
    'backend is reachable',
    false,
    `nothing answered on port ${backendPort} (${health.error})\n` +
      '        Start it with: cd backend && npm run dev'
  );
} else if (health.status === 200 && health.fromOurServer) {
  report('backend is reachable', true, 'HTTP 200');
} else if (!health.fromOurServer) {
  report(
    'backend is reachable',
    false,
    `HTTP ${health.status} — something answered on port ${backendPort}, but it is not this API.\n` +
      `        ${explainForeignReply(health, backendPort)}\n` +
      describeResponder(health)
  );
} else {
  report('backend is reachable', false, `HTTP ${health.status} from the API — check its console output`);
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
      (proxied.fromOurServer
        ? '        Start the dev server from the front directory so it loads\n' +
          '        front/vite.config.ts and installs the /api proxy.'
        : `        ${explainForeignReply(proxied, vitePort)}`) +
      '\n' +
      describeResponder(proxied)
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
} else if (!direct.fromOurServer) {
  report(
    'backend accepts a browser request from the dev-server origin',
    false,
    `HTTP ${direct.status} — the reply did not come from this API.\n` +
      `        ${explainForeignReply(direct, backendPort)}\n` +
      describeResponder(direct)
  );
} else if (direct.status === 401 || direct.status === 200) {
  // 401 is the correct answer without a session; the origin was accepted.
  report(
    'backend accepts a browser request from the dev-server origin',
    true,
    `HTTP ${direct.status} — origin accepted`
  );
} else {
  report(
    'backend accepts a browser request from the dev-server origin',
    false,
    `HTTP ${direct.status} — unexpected; the API answered but not with 200 or 401`
  );
}

console.log(
  results.every(Boolean)
    ? '\nAll hops are healthy. If the browser still fails, hard-reload it (Ctrl+Shift+R).\n'
    : '\nFix the first FAIL above, then run this again.\n'
);

process.exit(results.every(Boolean) ? 0 : 1);
