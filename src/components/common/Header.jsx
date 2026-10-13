import React from 'react'

export default function Header({ activeModule }) {
  const moduleLabels = {
    event: 'Event',
    pembeli: 'Pembeli',
    tiket: 'Tiket',
    rekap: 'Rekap'
  }

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-logo" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
            <path d="M13 5v2"></path>
            <path d="M13 11v2"></path>
            <path d="M13 17v2"></path>
          </svg>
        </div>
        <div>
          <div className="brand-title">Karsa Tiket</div>
          <div className="brand-subtitle">Tiketing Event</div>
        </div>
      </div>
      <span className="header-badge" id="current-module-badge">
        {moduleLabels[activeModule] || 'Event'}
      </span>
    </header>
  )
}
