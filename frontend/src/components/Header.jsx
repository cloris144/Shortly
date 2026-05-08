import { motion } from 'framer-motion';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  );
}

const MODES = [
  { key: 'light',  Icon: SunIcon,    label: 'Light'  },
  { key: 'system', Icon: SystemIcon, label: 'System' },
  { key: 'dark',   Icon: MoonIcon,   label: 'Dark'   },
];

const WS_LABELS = { connected: 'Live', connecting: 'Connecting…', disconnected: 'Offline' };

export default function Header({ mode, setMode, wsStatus }) {
  return (
    <motion.header
      className="header"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="header-inner">
        <div className="header-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <span className="header-title">Shortly</span>
        <span className="header-subtitle">Create, manage, and track simple short links.</span>
        <span className={`ws-badge ws-badge--${wsStatus}`} title={`WebSocket: ${wsStatus}`}>
          <span className="ws-dot" />
          {WS_LABELS[wsStatus]}
        </span>

        <div className="theme-toggle" role="group" aria-label="Color theme">
          {MODES.map(({ key, Icon, label }) => (
            <button
              key={key}
              className={`theme-btn ${mode === key ? 'active' : ''}`}
              onClick={() => setMode(key)}
              title={label}
              aria-pressed={mode === key}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>
    </motion.header>
  );
}
