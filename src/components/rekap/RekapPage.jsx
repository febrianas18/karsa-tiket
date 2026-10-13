import React from 'react'

export default function RekapPage() {
  return (
    <div className="page-container" id="page-rekap">
      <div className="page-header">
        <h1 className="page-title">Rekap</h1>
        <p className="page-subtitle">Ringkasan tiket terjual, sisa kuota, pendapatan, dan jumlah hadir.</p>
      </div>

      <div className="empty-card">
        <div className="empty-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h2 className="empty-title">Belum ada data rekap</h2>
        <p className="empty-desc">
          Pilih event untuk melihat ringkasan penjualan dan kehadiran. Halaman modul Rekap siap diimplementasikan.
        </p>
      </div>
    </div>
  )
}
