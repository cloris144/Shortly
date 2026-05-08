import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

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
    if (!parsed.hostname.includes('.')) return 'Please enter a valid URL.';
    return null;
  } catch {
    return 'Please enter a valid URL.';
  }
}

export default function CreateInput({ onCreate }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const handleSubmit = async () => {
    const err = validateUrl(value);
    if (err) {
      setError(err);
      shake();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onCreate(value.trim());
      setValue('');
    } catch (e) {
      setError(e.message || 'Could not create the short link.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    if (error) setError('');
  };

  return (
    <motion.section
      className="create-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="create-card">
        <label className="create-label" htmlFor="url-input">Shorten a URL</label>
        <div className="create-row">
          <div className={`create-input-wrap ${shaking ? 'shake' : ''}`}>
            <span className="create-input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              id="url-input"
              ref={inputRef}
              type="url"
              className={`create-input ${error ? 'error' : ''}`}
              placeholder="Paste a long URL and press Enter"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="off"
              autoFocus
            />
          </div>
          <button
            className="create-btn"
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                Create
              </>
            )}
          </button>
        </div>
        {error && (
          <motion.p
            className="create-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}
      </div>
    </motion.section>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
