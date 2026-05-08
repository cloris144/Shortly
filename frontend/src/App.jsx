import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from './hooks/useTheme';
import { useWebSocket } from './hooks/useWebSocket';
import Header from './components/Header';
import CreateInput from './components/CreateInput';
import StatsBar from './components/StatsBar';
import LinkList from './components/LinkList';
import DeleteModal from './components/DeleteModal';
import ClickDrawer from './components/ClickDrawer';
import Toast from './components/Toast';
import { fetchLinks, createLink, updateLink, deleteLink } from './api';

function normalizeUrl(url) {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newLinkId, setNewLinkId] = useState(null);
  const [clickTarget, setClickTarget] = useState(null);
  const [lastWsMsg, setLastWsMsg] = useState(null);
  const { mode, setMode } = useTheme();
  const toastId = useRef(0);
  const wsStatusRef = useRef('connecting');
  const linksRef = useRef([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // Keep linksRef in sync so WS handler can read current links without a dep
  const setLinksAndRef = useCallback((updater) => {
    setLinks(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      linksRef.current = next;
      return next;
    });
  }, []);

  // Load initial data
  useEffect(() => {
    fetchLinks()
      .then(data => setLinksAndRef(data))
      .catch(() => addToast('Failed to load links. Please refresh.', 'error'))
      .finally(() => setLoading(false));
  }, [addToast, setLinksAndRef]);

  // WebSocket live sync
  const wsStatus = useWebSocket(useCallback((msg) => {
    setLastWsMsg(msg);
    switch (msg.type) {
      case 'link:created':
        // WS is single source of truth for creates when connected.
        // handleCreate skips setLinks when WS is connected, so no duplicate.
        // Dedup guard covers the edge case where both paths race.
        setLinksAndRef(prev => prev.some(l => l.id === msg.data.id) ? prev : [msg.data, ...prev]);
        break;
      case 'link:updated':
        setLinksAndRef(prev => prev.map(l => l.id === msg.data.id ? msg.data : l));
        break;
      case 'link:deleted':
        setLinksAndRef(prev => prev.filter(l => l.id !== msg.data.id));
        setClickTarget(prev => prev?.id === msg.data.id ? null : prev);
        break;
      case 'link:clicked':
        setLinksAndRef(prev => prev.map(l =>
          l.id === msg.data.id
            ? { ...l, clickCount: msg.data.clickCount, updatedAt: msg.data.updatedAt }
            : l
        ));
        break;
    }
  }, [setLinksAndRef]));

  // Keep wsStatusRef current so handleCreate can read it without closure issues
  useEffect(() => { wsStatusRef.current = wsStatus; }, [wsStatus]);

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  const handleCreate = async (originalUrl) => {
    const normalized = normalizeUrl(originalUrl);

    // Reject duplicate original URLs
    if (linksRef.current.some(l => l.originalUrl === normalized)) {
      throw Object.assign(new Error('A short link for this URL already exists.'), { code: 'DUPLICATE_URL' });
    }

    const newLink = await createLink(originalUrl);
    setNewLinkId(newLink.id);
    setTimeout(() => setNewLinkId(null), 3000);
    addToast('Short URL created successfully!', 'success');

    // Only update list directly if WS is offline — otherwise the link:created
    // event is the single source of truth and will arrive momentarily.
    if (wsStatusRef.current !== 'connected') {
      setLinksAndRef(prev => prev.some(l => l.id === newLink.id) ? prev : [newLink, ...prev]);
    }
  };

  const handleUpdate = async (id, originalUrl) => {
    const updated = await updateLink(id, originalUrl);
    // WS event will sync other clients; update locally for instant feedback
    setLinksAndRef(prev => prev.map(l => l.id === id ? updated : l));
    addToast('Link updated.', 'success');
    return updated;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteLink(target.id);
      setLinksAndRef(prev => prev.filter(l => l.id !== target.id));
      addToast('Link deleted.', 'success');
    } catch {
      addToast('Could not delete the link.', 'error');
    }
  };

  const stats = {
    totalLinks: links.length,
    totalClicks: links.reduce((sum, l) => sum + l.clickCount, 0),
    latestLink: links.length > 0 ? links[0].shortUrl : null,
  };

  return (
    <div className="app">
      <Header mode={mode} setMode={setMode} wsStatus={wsStatus} />

      <main className="main">
        <CreateInput onCreate={handleCreate} />
        <StatsBar stats={stats} loading={loading} />
        <LinkList
          links={links}
          loading={loading}
          onUpdate={handleUpdate}
          onDelete={setDeleteTarget}
          onCopy={() => addToast('Short URL copied to clipboard.', 'success')}
          onViewClicks={setClickTarget}
          newLinkId={newLinkId}
        />
      </main>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            key="delete-modal"
            link={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
        {clickTarget && (
          <ClickDrawer
            key="click-drawer"
            link={clickTarget}
            lastWsMsg={lastWsMsg}
            onClose={() => setClickTarget(null)}
          />
        )}
      </AnimatePresence>

      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
