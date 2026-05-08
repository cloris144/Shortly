import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from './hooks/useTheme';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import CreateInput from './components/CreateInput';
import StatsBar from './components/StatsBar';
import LinkList from './components/LinkList';
import DeleteModal from './components/DeleteModal';
import ClickDrawer from './components/ClickDrawer';
import Toast from './components/Toast';
import { fetchLinks, createLink, updateLink, deleteLink } from './api';

export default function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newLinkId, setNewLinkId] = useState(null);
  const [clickTarget, setClickTarget] = useState(null);
  const { mode, setMode } = useTheme();
  const toastId = useRef(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const loadLinks = useCallback(async () => {
    try {
      const data = await fetchLinks();
      setLinks(data);
    } catch {
      addToast('Failed to load links. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const handleCreate = async (originalUrl) => {
    const newLink = await createLink(originalUrl);
    setLinks((prev) => [newLink, ...prev]);
    setNewLinkId(newLink.id);
    setTimeout(() => setNewLinkId(null), 3000);
    addToast('Short URL created successfully!', 'success');
  };

  const handleUpdate = async (id, originalUrl) => {
    const updated = await updateLink(id, originalUrl);
    setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
    addToast('Link updated.', 'success');
    return updated;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteLink(target.id);
      setLinks((prev) => prev.filter((l) => l.id !== target.id));
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
      <Header mode={mode} setMode={setMode} />

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
            onClose={() => setClickTarget(null)}
          />
        )}
      </AnimatePresence>

      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
