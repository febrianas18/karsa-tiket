import React from 'react'
import { EmptyState } from '../common/StateViews.jsx'

export default function TiketPage() {
  return (
    <div className="page-container" id="page-tiket">
      <div className="page-header">
        <h1 className="page-title">Tiket</h1>
        <p className="page-subtitle">Mencatat pembelian, total bayar, pelunasan, dan kehadiran.</p>
      </div>

      <EmptyState
        icon={(
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
            <path d="M13 5v2"></path>
            <path d="M13 11v2"></path>
            <path d="M13 17v2"></path>
          </svg>
        )}
        title="Belum ada tiket"
        description="Belum ada transaksi tiket yang dicatat. Halaman modul Tiket siap diimplementasikan."
      />
    </div>
  )
}
