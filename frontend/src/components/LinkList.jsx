import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LinkCard from './LinkCard';

const PAGE_SIZE = 10;

const cardVariants = {
  initial: { opacity: 0, y: -16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 32 } },
  exit: { opacity: 0, x: -40, scale: 0.95, transition: { duration: 0.2 } },
};

const SORT_OPTIONS = [
  { value: 'newest',       label: 'Newest first' },
  { value: 'oldest',       label: 'Oldest first' },
  { value: 'most_clicks',  label: 'Most clicks'  },
  { value: 'least_clicks', label: 'Fewest clicks' },
  { value: 'url_az',       label: 'URL A → Z'    },
];

function applySort(links, sortBy) {
  const arr = [...links];
  switch (sortBy) {
    case 'oldest':       return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'most_clicks':  return arr.sort((a, b) => b.clickCount - a.clickCount);
    case 'least_clicks': return arr.sort((a, b) => a.clickCount - b.clickCount);
    case 'url_az':       return arr.sort((a, b) => a.originalUrl.localeCompare(b.originalUrl));
    default:             return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(page, totalPages);
  return (
    <div className="pagination">
      <button
        className="pg-btn pg-arrow"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`pg-btn${p === page ? ' pg-btn--active' : ''}`}
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className="pg-btn pg-arrow"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );
}

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
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const displayed = useMemo(() => {
    let result = links;
    const q = filter.trim().toLowerCase();
    if (q) {
      result = result.filter(l =>
        l.originalUrl.toLowerCase().includes(q) ||
        l.shortCode.toLowerCase().includes(q)
      );
    }
    return applySort(result, sortBy);
  }, [links, filter, sortBy]);

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const pageSlice = displayed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filter or sort changes
  useEffect(() => { setPage(1); }, [filter, sortBy]);

  // If a live update shrinks totalPages, snap back
  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

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

  const isFiltered = filter.trim().length > 0;

  return (
    <section className="links-section">
      <div className="links-header">
        <span className="links-title">Your Links</span>
        {links.length > 0 && (
          <span className="links-count">
            {isFiltered ? `${displayed.length} / ${links.length}` : links.length}{' '}
            {links.length === 1 ? 'link' : 'links'}
          </span>
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
          {/* Filter + sort bar */}
          <div className="filter-bar">
            <div className="filter-input-wrap">
              <span className="filter-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                className="filter-input"
                type="text"
                placeholder="Search by URL or short code…"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                aria-label="Filter links"
              />
              {isFiltered && (
                <button className="filter-clear" onClick={() => setFilter('')} aria-label="Clear search">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="sort-wrap">
              <svg className="sort-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/>
              </svg>
              <select
                className="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                aria-label="Sort links"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="sort-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {displayed.length === 0 ? (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3>No results for "{filter}"</h3>
              <p>Try a different keyword or <button className="link-btn" onClick={() => setFilter('')}>clear the search</button>.</p>
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
                {pageSlice.map((link) => (
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

              <Pagination
                page={safePage}
                totalPages={totalPages}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
