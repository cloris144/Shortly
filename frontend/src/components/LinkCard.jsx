import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function validateUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return 'Please enter a URL.';
  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Only HTTP and HTTPS URLs are supported.';
    }
    return null;
  } catch {
    return 'Please enter a valid URL.';
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LinkCard({ link, onUpdate, onDelete, onCopy, onViewClicks, isNew }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [highlighted, setHighlighted] = useState(isNew);
  const [copied, setCopied] = useState(false);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setHighlighted(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setEditValue(link.originalUrl);
    setEditError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue('');
    setEditError('');
  };

  const handleSave = async () => {
    const err = validateUrl(editValue);
    if (err) { setEditError(err); return; }
    setSaving(true);
    try {
      await onUpdate(link.id, editValue.trim());
      setEditing(false);
      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 2000);
    } catch (e) {
      setEditError(e.message || 'Could not update the link.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link.shortUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`link-card ${highlighted ? 'highlighted' : ''}`}>
      {!editing ? (
        <div className="link-view">
          {/* Short URL */}
          <div className="link-short">
            <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="link-short-url">
              {link.shortUrl}
            </a>
            <span className="link-short-code">{link.shortCode}</span>
          </div>

          {/* Original URL */}
          <div className="link-original" title={link.originalUrl}>
            {link.originalUrl}
          </div>

          {/* Date */}
          <div className="link-date">{formatDate(link.createdAt)}</div>

          {/* Actions */}
          <div className="link-actions">
            <button className="btn-clicks" onClick={() => onViewClicks(link)} title="View click history">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              {link.clickCount}
            </button>
            <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy short URL">
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>

            <button className="btn-icon" onClick={startEdit} title="Edit link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            <button className="btn-icon" onClick={() => onDelete(link)} title="Delete link" style={{ color: 'var(--danger)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="link-edit">
          <div className="link-edit-header">Edit destination URL</div>
          <div className="link-edit-row">
            <input
              ref={editInputRef}
              type="url"
              className={`link-edit-input ${editError ? 'error' : ''}`}
              value={editValue}
              onChange={(e) => { setEditValue(e.target.value); if (editError) setEditError(''); }}
              onKeyDown={handleEditKeyDown}
              disabled={saving}
              placeholder="https://example.com"
            />
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          </div>
          {editError && (
            <div className="link-edit-error">{editError}</div>
          )}
        </div>
      )}
    </div>
  );
}
