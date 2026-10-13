import React from 'react'

export default function EventPage() {
  return (
    <div className="page-container" id="page-event">
      <div className="page-header">
        <h1 className="page-title">Event</h1>
        <p className="page-subtitle">Kelola nama, tanggal, lokasi, harga tiket, dan kuota acara.</p>
      </div>

      <div className="empty-card">
        <div className="empty-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h2 className="empty-title">Belum ada event</h2>
        <p className="empty-desc">
          Daftar acara komunitas masih kosong. Halaman modul Event siap diimplementasikan.
        </p>
      </div>
    </div>
  )
}
