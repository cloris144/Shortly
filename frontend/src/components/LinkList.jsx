import { motion, AnimatePresence } from 'framer-motion';
import LinkCard from './LinkCard';

const cardVariants = {
  initial: { opacity: 0, y: -16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 32 } },
  exit: { opacity: 0, x: -40, scale: 0.95, transition: { duration: 0.2 } },
};

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton-line" style={{ width: '35%' }} />
        <div className="skeleton-line" style={{ width: '65%' }} />
      </div>
      <div className="skeleton-line" style={{ width: 60 }} />
    </div>
  );
}

export default function LinkList({ links, loading, onUpdate, onDelete, onCopy, onViewClicks, newLinkId }) {
  if (loading) {
    return (
      <section className="links-section">
        <div className="links-header">
          <span className="links-title">Your Links</span>
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  return (
    <section className="links-section">
      <div className="links-header">
        <span className="links-title">Your Links</span>
        {links.length > 0 && (
          <span className="links-count">{links.length} {links.length === 1 ? 'link' : 'links'}</span>
        )}
      </div>

      {links.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <h3>No short links yet</h3>
          <p>Paste a URL above to create your first short link.</p>
        </motion.div>
      ) : (
        <>
          {/* Desktop table header */}
          <div className="table-header">
            <span>Short URL</span>
            <span>Original URL</span>
            <span>Created</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          <AnimatePresence mode="popLayout">
            {links.map((link) => (
              <motion.div
                key={link.id}
                layout
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <LinkCard
                  link={link}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onCopy={onCopy}
                  onViewClicks={onViewClicks}
                  isNew={link.id === newLinkId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
