import { useStore } from '../data/storeContext'
import { Avatar } from './UI'
import { Icon } from './Icons'

const DATE_LABEL = new Date().toLocaleDateString('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export default function Topbar({ title, subtitle, onMenu, onNavigate, hideMenu = false }) {
  const { data, lowStock } = useStore()
  const activeJobs = data.jobs.filter(
    (job) => job.status === 'Pending' || job.status === 'In Progress',
  ).length

  return (
    <header className="topbar">
      {!hideMenu && (
        <button
          type="button"
          className="icon-btn menu-btn"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>
      )}

      <div className="topbar-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions">
        <span className="date-chip">
          <Icon name="calendar" size={14} />
          {DATE_LABEL}
        </span>
        <span className="topbar-divider" />
        <button
          type="button"
          className="icon-btn notification-btn"
          onClick={() => onNavigate('admin')}
          title={`${lowStock.length} spare parts need attention`}
          aria-label="Low stock alerts"
        >
          <Icon name="bell" size={18} />
          {lowStock.length > 0 && <span className="notif-dot" />}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm topbar-cta"
          onClick={() => onNavigate('new-job')}
        >
          <Icon name="plus" size={15} />
          New job
        </button>
        <div className="profile">
          <Avatar name="Villzone Admin" size="sm" />
          <div className="profile-copy">
            <strong>Admin</strong>
            <span>{activeJobs} jobs on floor</span>
          </div>
        </div>
      </div>
    </header>
  )
}
