const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shortly',
  user: process.env.DB_USER || 'shortly',
  password: process.env.DB_PASSWORD || 'shortly_pass',
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS short_links (
        id           SERIAL PRIMARY KEY,
        short_code   VARCHAR(10) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        click_count  INTEGER DEFAULT 0 NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_short_links_short_code ON short_links(short_code);

      CREATE TABLE IF NOT EXISTS click_logs (
        id             SERIAL PRIMARY KEY,
        link_id        INTEGER NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
        ip             TEXT,
        user_agent     TEXT,
        browser        TEXT,
        browser_version TEXT,
        os             TEXT,
        device_type    TEXT,
        referer        TEXT,
        country        TEXT,
        clicked_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_click_logs_link_id ON click_logs(link_id);
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
