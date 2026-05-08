const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { generateShortCode } = require('../utils/shortCode');

function baseUrl(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('host');
  return `${proto}://${host}`;
}

function formatLink(row, req) {
  return {
    id: row.id,
    shortCode: row.short_code,
    originalUrl: row.original_url,
    shortUrl: `${baseUrl(req)}/${row.short_code}`,
    clickCount: row.click_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /api/links
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM short_links ORDER BY created_at DESC');
    res.json(result.rows.map(row => formatLink(row, req)));
  } catch (err) {
    console.error('GET /api/links:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.', code: 'INTERNAL_SERVER_ERROR' });
  }
});

// POST /api/links
router.post('/', async (req, res) => {
  let { originalUrl } = req.body;

  if (!originalUrl || typeof originalUrl !== 'string') {
    return res.status(400).json({ message: 'Please enter a valid URL.', code: 'INVALID_URL' });
  }

  originalUrl = normalizeUrl(originalUrl);

  if (!validateUrl(originalUrl)) {
    return res.status(400).json({
      message: originalUrl.startsWith('ftp://') || originalUrl.startsWith('file://')
        ? 'Only HTTP and HTTPS URLs are supported.'
        : 'Please enter a valid URL.',
      code: 'INVALID_URL',
    });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode();
    try {
      const result = await pool.query(
        'INSERT INTO short_links (short_code, original_url) VALUES ($1, $2) RETURNING *',
        [shortCode, originalUrl]
      );
      return res.status(201).json(formatLink(result.rows[0], req));
    } catch (err) {
      if (err.code === '23505') continue; // unique violation, retry
      throw err;
    }
  }

  res.status(500).json({ message: 'Could not generate a short URL. Please try again.', code: 'SHORT_CODE_GENERATION_FAILED' });
});

// PUT /api/links/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  let { originalUrl } = req.body;

  if (!originalUrl || typeof originalUrl !== 'string') {
    return res.status(400).json({ message: 'Please enter a valid URL.', code: 'INVALID_URL' });
  }

  originalUrl = normalizeUrl(originalUrl);

  if (!validateUrl(originalUrl)) {
    return res.status(400).json({ message: 'Please enter a valid URL.', code: 'INVALID_URL' });
  }

  try {
    const result = await pool.query(
      'UPDATE short_links SET original_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [originalUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Link not found.', code: 'LINK_NOT_FOUND' });
    }

    res.json(formatLink(result.rows[0], req));
  } catch (err) {
    console.error('PUT /api/links/:id:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.', code: 'INTERNAL_SERVER_ERROR' });
  }
});

// DELETE /api/links/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM short_links WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Link not found.', code: 'LINK_NOT_FOUND' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/links/:id:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.', code: 'INTERNAL_SERVER_ERROR' });
  }
});

// GET /api/links/:id/clicks
router.get('/:id/clicks', async (req, res) => {
  const { id } = req.params;
  try {
    const linkCheck = await pool.query('SELECT id FROM short_links WHERE id = $1', [id]);
    if (linkCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Link not found.', code: 'LINK_NOT_FOUND' });
    }

    const result = await pool.query(
      `SELECT id, ip, browser, browser_version, os, device_type, referer, user_agent, clicked_at
       FROM click_logs WHERE link_id = $1 ORDER BY clicked_at DESC`,
      [id]
    );

    res.json(result.rows.map(r => ({
      id: r.id,
      ip: r.ip,
      browser: r.browser,
      browserVersion: r.browser_version,
      os: r.os,
      deviceType: r.device_type,
      referer: r.referer,
      userAgent: r.user_agent,
      clickedAt: r.clicked_at,
    })));
  } catch (err) {
    console.error('GET /api/links/:id/clicks:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.', code: 'INTERNAL_SERVER_ERROR' });
  }
});

module.exports = router;
