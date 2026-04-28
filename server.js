/**
 * CodeRoom Backend — server.js
 *
 * Express server that proxies code execution requests to Judge0 CE.
 * Supports: Python, Java, C, C++, JavaScript
 *
 * FREE OPTIONS (no payment required):
 *   A) judge0.com public instance — ZERO setup, no API key needed (default)
 *      URL: https://ce.judge0.com
 *
 *   B) RapidAPI free tier — 50 req/day, requires free account
 *      URL: https://rapidapi.com/judge0-official/api/judge0-ce
 *
 *   C) Self-hosted Judge0 — unlimited, requires Docker
 *      URL: https://github.com/judge0/judge0
 *
 * Usage:
 *   npm install
 *   node server.js
 */

const express = require('express');
const cors    = require('cors');

// Use built-in fetch (Node 18+) or node-fetch for older Node versions
let fetch;
try {
    fetch = globalThis.fetch;
    if (!fetch) throw new Error();
} catch {
    fetch = require('node-fetch');
}

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ----------------------------------------------------------------
   CONFIGURATION
   ----------------------------------------------------------------
   OPTION A — Free public Judge0 CE (DEFAULT, no key needed):
     Uses https://ce.judge0.com — free, no sign-up required.
     Rate limit: ~5 req/s, shared instance.

   OPTION B — RapidAPI free tier:
     1. Sign up at https://rapidapi.com
     2. Subscribe (free): https://rapidapi.com/judge0-official/api/judge0-ce
     3. Set env: RAPIDAPI_KEY=your_key node server.js

   OPTION C — Self-hosted (no key, unlimited):
     1. Follow https://github.com/judge0/judge0
     2. Set env: JUDGE0_URL=http://localhost:2358 node server.js
   ---------------------------------------------------------------- */

const JUDGE0_BASE_URL = process.env.JUDGE0_URL  || 'https://ce.judge0.com';   // ← free, no key
const RAPIDAPI_KEY    = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST   = 'judge0-ce.p.rapidapi.com';

const usingRapidAPI   = Boolean(RAPIDAPI_KEY);
const usingPublicCE   = !usingRapidAPI && JUDGE0_BASE_URL.includes('ce.judge0.com');

/* ----------------------------------------------------------------
   Helper: build request headers
   ---------------------------------------------------------------- */
function buildHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (usingRapidAPI) {
        headers['X-RapidAPI-Key']  = RAPIDAPI_KEY;
        headers['X-RapidAPI-Host'] = RAPIDAPI_HOST;
    }
    return headers;
}

/* ----------------------------------------------------------------
   Helper: poll Judge0 until status is not queued/processing
   ---------------------------------------------------------------- */
async function pollResult(token) {
    const url         = `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,status`;
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 700)); // 700 ms between polls

        const res  = await fetch(url, { method: 'GET', headers: buildHeaders() });
        const data = await res.json();

        const statusId = data.status ? data.status.id : 0;
        // 1 = In Queue, 2 = Processing, 3+ = finished (accepted or error)
        if (statusId !== 1 && statusId !== 2) {
            return data;
        }
    }
    throw new Error('Execution timed out after polling.');
}

/* ----------------------------------------------------------------
   POST /run — main endpoint
   Body: { source_code: string, language_id: number }
   ---------------------------------------------------------------- */
app.post('/run', async (req, res) => {
    const { source_code, language_id, stdin = '' } = req.body;

    if (!source_code || !language_id) {
        return res.status(400).json({ error: 'source_code and language_id are required.' });
    }

    try {
        // Step 1: Submit code to Judge0 — include stdin for interactive programs
        const submitRes = await fetch(
            `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=false`,
            {
                method:  'POST',
                headers: buildHeaders(),
                body:    JSON.stringify({ source_code, language_id, stdin })
            }
        );

        if (!submitRes.ok) {
            const errText = await submitRes.text();
            console.error('Judge0 submit error:', errText);
            return res.status(502).json({ error: 'Judge0 submission failed: ' + errText });
        }

        const { token } = await submitRes.json();

        if (!token) {
            return res.status(502).json({ error: 'No token returned from Judge0.' });
        }

        // Step 2: Poll for result
        const result = await pollResult(token);

        return res.json({
            stdout:         result.stdout         || '',
            stderr:         result.stderr         || '',
            compile_output: result.compile_output || '',
            status:         result.status         || {}
        });

    } catch (err) {
        console.error('Server error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/* ----------------------------------------------------------------
   GET /health — simple health check
   ---------------------------------------------------------------- */
app.get('/health', (req, res) => {
    res.json({
        status:   'ok',
        message:  'CodeRoom backend is running.',
        judge0:   JUDGE0_BASE_URL,
        auth:     usingRapidAPI ? 'RapidAPI key' : usingPublicCE ? 'public (no key)' : 'self-hosted'
    });
});

/* ----------------------------------------------------------------
   Start
   ---------------------------------------------------------------- */
app.listen(PORT, () => {
    console.log(`\n✅  CodeRoom backend running at http://localhost:${PORT}`);
    console.log(`    Health check : http://localhost:${PORT}/health`);
    console.log(`    Judge0 URL   : ${JUDGE0_BASE_URL}`);

    if (usingRapidAPI) {
        console.log('    Auth         : RapidAPI key ✓');
    } else if (usingPublicCE) {
        console.log('    Auth         : free public instance — no key needed ✓');
    } else {
        console.log('    Auth         : self-hosted / custom instance');
    }
    console.log();
});
