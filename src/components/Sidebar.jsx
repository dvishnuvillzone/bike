import { useStore } from '../data/storeContext'
import { classNames } from '../data/utils'
import { NAV_GROUPS } from '../data/navigation'
import { Icon } from './Icons'

export default function Sidebar({ page, onNavigate, open, onClose }) {
  const { data } = useStore()
  const technicians = data.technicians || []
  const online = technicians.filter((tech) => tech.status === 'Online').length
  const busy = technicians.filter((tech) => tech.status === 'Busy').length
  const activeJobs = data.jobs.filter(
    (job) => job.status === 'Pending' || job.status === 'In Progress',
  ).length
  const total = Math.max(technicians.length, 1)
  const coverage = Math.round(((online + busy) / total) * 100)

  return (
    <>
      <div
        className={classNames('sidebar-backdrop', open && 'show')}
        onClick={onClose}
      />
      <aside className={classNames('sidebar', open && 'open')}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Icon name="wrench" size={21} />
          </span>
          <div className="brand-text">
            <strong>Villzone</strong>
            <span>Bike Service OS</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={classNames('nav-item', page === item.id && 'active')}
                  onClick={() => {
                    onNavigate(item.id)
                    onClose()
                  }}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {item.id === 'pending' && activeJobs > 0 && (
                    <em className="nav-count">{activeJobs}</em>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="live-card">
            <div className="live-head">
              <span className="live-dot" />
              <strong>Workshop live</strong>
              <span>{coverage}%</span>
            </div>
            <p>
              {online} online · {busy} busy · {technicians.length - online - busy}{' '}
              off
            </p>
            <div className="live-bar">
              <span style={{ width: `${coverage}%` }} />
            </div>
            <div className="live-meta">
              <span>{activeJobs} active jobs</span>
              <span>7 bays</span>
            </div>
          </div>
          <div className="sidebar-signature">
            <Icon name="shield" size={14} />
            Admin workspace · v2.0
          </div>
        </div>
      </aside>
    </>
  )
}
