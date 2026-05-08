import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchClicks } from '../api';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function DeviceIcon({ type }) {
  if (type === 'Mobile') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
  if (type === 'Tablet') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
  if (type === 'Bot') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function ClickRow({ click, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="click-row">
      <div className="click-row-main" onClick={() => setExpanded(v => !v)}>
        <span className="click-index">#{index + 1}</span>
        <span className="click-device">
          <DeviceIcon type={click.deviceType} />
          {click.deviceType}
        </span>
        <span className="click-browser">{click.browser}{click.browserVersion ? ` ${click.browserVersion}` : ''}</span>
        <span className="click-os">{click.os}</span>
        <span className="click-ip">{click.ip || '—'}</span>
        <span className="click-time">{formatDateTime(click.clickedAt)}</span>
        <span className="click-expand-icon" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="click-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="click-detail-inner">
              {click.referer && (
                <div className="click-detail-row">
                  <span className="click-detail-label">Referer</span>
                  <span className="click-detail-value">{click.referer}</span>
                </div>
              )}
              <div className="click-detail-row">
                <span className="click-detail-label">User-Agent</span>
                <span className="click-detail-value click-ua">{click.userAgent || '—'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ClickDrawer({ link, onClose }) {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClicks(link.id)
      .then(setClicks)
      .catch(() => setError('Failed to load click history.'))
      .finally(() => setLoading(false));
  }, [link.id]);

  return (
    <motion.div
      className="drawer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      >
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">Click History</h2>
            <div className="drawer-subtitle">{link.shortUrl}</div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="drawer-stats">
          <div className="drawer-stat">
            <span className="drawer-stat-value">{link.clickCount}</span>
            <span className="drawer-stat-label">Total Clicks</span>
          </div>
          {clicks.length > 0 && (() => {
            const devices = clicks.reduce((acc, c) => { acc[c.deviceType] = (acc[c.deviceType] || 0) + 1; return acc; }, {});
            const top = Object.entries(devices).sort((a, b) => b[1] - a[1])[0];
            return (
              <div className="drawer-stat">
                <span className="drawer-stat-value">{top[0]}</span>
                <span className="drawer-stat-label">Top Device</span>
              </div>
            );
          })()}
          {clicks.length > 0 && (() => {
            const browsers = clicks.reduce((acc, c) => { acc[c.browser] = (acc[c.browser] || 0) + 1; return acc; }, {});
            const top = Object.entries(browsers).sort((a, b) => b[1] - a[1])[0];
            return (
              <div className="drawer-stat">
                <span className="drawer-stat-value">{top[0]}</span>
                <span className="drawer-stat-label">Top Browser</span>
              </div>
            );
          })()}
        </div>

        <div className="drawer-body">
          {loading && (
            <div className="drawer-loading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading...
            </div>
          )}

          {error && <div className="drawer-error">{error}</div>}

          {!loading && !error && clicks.length === 0 && (
            <div className="drawer-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <p>No clicks yet.</p>
              <p>Share your short link to start tracking.</p>
            </div>
          )}

          {!loading && !error && clicks.length > 0 && (
            <>
              <div className="click-list-header">
                <span>Device</span>
                <span>Browser</span>
                <span>OS</span>
                <span>IP</span>
                <span>Time</span>
                <span></span>
              </div>
              <div className="click-list">
                {clicks.map((click, i) => (
                  <ClickRow key={click.id} click={click} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
