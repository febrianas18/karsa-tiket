import React from 'react'

/**
 * Loading State Component
 * Menampilkan animasi skeleton card yang elegan saat mengambil data dari Firestore
 */
export function LoadingState({ text = 'Memuat data acara...', count = 2 }) {
  return (
    <div className="state-container loading-state-view" role="status" aria-live="polite">
      <div className="loading-spinner-wrap">
        <div className="spinner"></div>
        <span className="loading-text">{text}</span>
      </div>
      <div className="skeleton-list">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-pill"></div>
              <div className="skeleton-badge"></div>
            </div>
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-subtitle"></div>
            <div className="skeleton-footer">
              <div className="skeleton-box"></div>
              <div className="skeleton-box"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Empty State Component
 * Tampil saat pembacaan Firestore berhasil tetapi belum ada data dalam koleksi
 */
export function EmptyState({
  icon,
  title = 'Belum Ada Data',
  description = 'Data masih kosong.',
  action = null
}) {
  return (
    <div className="state-container empty-state-view" id="empty-state-view">
      <div className="state-icon-wrap empty-icon-glow">
        {icon || (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        )}
      </div>
      <h3 className="state-title">{title}</h3>
      {description && <p className="state-desc">{description}</p>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  )
}

/**
 * Error State Component
 * Tampil saat proses pembacaan Firestore gagal atau terjadi galat jaringan
 */
export function ErrorState({
  title = 'Gagal Memuat Data',
  message = 'Terjadi kesalahan saat memuat data dari server.',
  onRetry = null,
  retryLabel = 'Coba Lagi'
}) {
  return (
    <div className="state-container error-state-view" role="alert" id="error-state-view">
      <div className="state-icon-wrap error-icon-glow">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 className="state-title error-title-text">{title}</h3>
      <p className="state-desc error-desc-text">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="btn-retry-load"
          onClick={onRetry}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          {retryLabel}
        </button>
      )}
    </div>
  )
}
