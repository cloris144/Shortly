import { motion } from 'framer-motion';

function StatCard({ label, value, delay }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${typeof value === 'string' && value.startsWith('http') ? 'small' : ''}`}>
        {value}
      </div>
    </motion.div>
  );
}

export default function StatsBar({ stats, loading }) {
  const items = [
    {
      label: 'Total Links',
      value: loading ? null : stats.totalLinks,
    },
    {
      label: 'Total Clicks',
      value: loading ? null : stats.totalClicks,
    },
    {
      label: 'Latest Link',
      value: loading ? null : (stats.latestLink || '—'),
    },
  ];

  return (
    <section className="stats-section">
      <div className="stats-grid">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            className="stat-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="stat-label">{item.label}</div>
            {loading ? (
              <div className="stat-skeleton" style={{ width: '60%' }} />
            ) : (
              <div className={`stat-value ${item.label === 'Latest Link' && item.value !== '—' ? 'small' : item.value === '—' ? 'muted' : ''}`}>
                {item.value}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
