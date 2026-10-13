import React from 'react'

export default function PembeliPage() {
  return (
    <div className="page-container" id="page-pembeli">
      <div className="page-header">
        <h1 className="page-title">Pembeli</h1>
        <p className="page-subtitle">Kelola nama, nomor WhatsApp, dan email pembeli.</p>
      </div>

      <div className="empty-card">
        <div className="empty-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h2 className="empty-title">Belum ada pembeli</h2>
        <p className="empty-desc">
          Data kontak pembeli belum tersedia. Halaman modul Pembeli siap diimplementasikan.
        </p>
      </div>
    </div>
  )
}
