require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');
const linksRouter = require('./routes/links');
const { parseUserAgent } = require('./utils/parseUserAgent');

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.use('/api/links', linksRouter);

app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  if (shortCode === 'favicon.ico') return res.status(404).end();

  try {
    const result = await pool.query(
      'UPDATE short_links SET click_count = click_count + 1, updated_at = NOW() WHERE short_code = $1 RETURNING id, original_url',
      [shortCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).send(notFoundPage());
    }

    const { id: linkId, original_url } = result.rows[0];

    // Log click details (non-blocking)
    const ua = req.get('user-agent') || '';
    const ip = req.get('x-forwarded-for')?.split(',')[0].trim() || req.get('x-real-ip') || req.ip;
    const referer = req.get('referer') || req.get('referrer') || null;
    const { browser, browserVersion, os, deviceType } = parseUserAgent(ua);

    pool.query(
      `INSERT INTO click_logs (link_id, ip, user_agent, browser, browser_version, os, device_type, referer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [linkId, ip, ua, browser, browserVersion, os, deviceType, referer]
    ).catch(err => console.error('click_log insert failed:', err.message));

    res.redirect(302, original_url);
  } catch (err) {
    console.error('Redirect error:', err.message);
    res.status(500).send('Something went wrong.');
  }
});

function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 - Short Link Not Found</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      background: #f8faff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #0f172a;
    }
    .container { text-align: center; padding: 2rem; }
    .code { font-size: 5rem; font-weight: 700; color: #e2e8f0; line-height: 1; }
    h1 { font-size: 1.5rem; font-weight: 600; margin: 1rem 0 0.5rem; }
    p { color: #64748b; margin-bottom: 2rem; }
    a {
      display: inline-block;
      padding: 0.625rem 1.5rem;
      background: #4f46e5;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.15s;
    }
    a:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">404</div>
    <h1>Short link not found.</h1>
    <p>This link may have been deleted or never existed.</p>
    <a href="/">Go to dashboard</a>
  </div>
</body>
</html>`;
}

async function start() {
  let retries = 12;
  while (retries > 0) {
    try {
      await initDb();
      break;
    } catch (err) {
      retries--;
      console.error(`DB not ready, retrying in 3s... (${retries} left): ${err.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (retries === 0) {
    console.error('Could not connect to database. Exiting.');
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

start();
