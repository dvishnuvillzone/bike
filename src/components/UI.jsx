import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icons'
import { classNames, initials, statusTone } from '../data/utils'

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={classNames('card', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, icon, className = '' }) {
  return (
    <div className={classNames('card-header', className)}>
      <div className="card-heading">
        {icon && (
          <span className="card-heading-icon">
            <Icon name={icon} size={17} />
          </span>
        )}
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="card-action">{action}</div>}
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, hint, icon, tone = 'brand', trend }) {
  return (
    <div className="stat-card">
      <div className={classNames('stat-icon', `tone-${tone}`)}>
        <Icon name={icon} size={19} />
      </div>
      <div className="stat-copy">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
      {trend !== undefined && trend !== null && (
        <span
          className={classNames(
            'stat-trend',
            trend >= 0 ? 'trend-up' : 'trend-down',
          )}
        >
          <Icon name={trend >= 0 ? 'trend-up' : 'trend-down'} size={13} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  )
}

export function Badge({ tone, children, dot = false, className = '' }) {
  const resolved = tone || statusTone(children)
  return (
    <span className={classNames('badge', `tone-${resolved}`, className)}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}

export function Avatar({ name = '', size = 'md', className = '' }) {
  const tone =
    [...name].reduce((total, char) => total + char.charCodeAt(0), 0) % 6
  return (
    <span
      className={classNames('avatar', `avatar-${size}`, `avatar-tone-${tone}`, className)}
      title={name}
    >
      {initials(name)}
    </span>
  )
}

export function EmptyState({ icon = 'box', title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <strong>{title}</strong>
      {message && <p>{message}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  icon,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={classNames('modal', `modal-${size}`)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <div className="modal-title">
            {icon && (
              <span className="modal-title-icon">
                <Icon name={icon} size={18} />
              </span>
            )}
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, htmlFor, required, error, hint, children, className = '' }) {
  return (
    <div className={classNames('field', className)}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      {children}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

export function Input({ error, className = '', ...rest }) {
  return (
    <input
      className={classNames('input', error && 'input-error', className)}
      {...rest}
    />
  )
}

export function Select({ error, className = '', children, ...rest }) {
  return (
    <select
      className={classNames('select', error && 'input-error', className)}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Textarea({ error, className = '', ...rest }) {
  return (
    <textarea
      className={classNames('textarea', error && 'input-error', className)}
      {...rest}
    />
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={classNames('segmented', className)} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={classNames(value === option.value && 'active')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value = 0, tone = '', className = '' }) {
  return (
    <div className={classNames('progress', tone && `progress-${tone}`, className)}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="search-box">
      <Icon name="search" size={16} />
      <input
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={classNames('tab', value === tab.value && 'active')}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="tab-count">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(onClose, 4000)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className={classNames('toast', `toast-${toast.tone || 'success'}`)} role="status">
      <span className="toast-icon">
        <Icon name={toast.tone === 'error' ? 'alert' : 'check-circle'} size={18} />
      </span>
      <span>{toast.message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

export function InfoRow({ icon, label, value }) {
  return (
    <div className="info-row">
      {icon && <Icon name={icon} size={15} />}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
