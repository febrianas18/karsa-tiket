import React from 'react'

export default function TiketCard({ tiket, onUpdateStatus, onCancelTicket }) {
  const {
    id,
    nama_event,
    tanggal_event,
    nama_pembeli,
    pembeli_id,
    harga_tiket,
    jumlah_tiket,
    total,
    status
  } = tiket

  const formatRupiah = (val) => {
    const num = Number(val)
    if (num === 0) return 'Gratis'
    return `Rp ${num.toLocaleString('id-ID')}`
  }

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const [year, month, day] = dateStr.split('-')
      if (year && month && day) {
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ]
        const monthName = months[parseInt(month, 10) - 1] || month
        return `${parseInt(day, 10)} ${monthName} ${year}`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  // Label dan style badge status
  const getStatusBadge = (st) => {
    switch (st) {
      case 'menunggu_bayar':
        return <span className="badge-status badge-menunggu">Menunggu Bayar</span>
      case 'lunas':
        return <span className="badge-status badge-lunas">Lunas</span>
      case 'hadir':
        return <span className="badge-status badge-hadir">Hadir (Check-in)</span>
      case 'dibatalkan':
        return <span className="badge-status badge-dibatalkan">Dibatalkan</span>
      default:
        return <span className="badge-status">{st}</span>
    }
  }

  return (
    <article className="event-card tiket-card" id={`tiket-card-${id || 'sample'}`}>
      <div className="event-card-header">
        <div className="event-date-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{formatDisplayDate(tanggal_event)}</span>
        </div>
        {getStatusBadge(status)}
      </div>

      <h3 className="event-title">{nama_event}</h3>

      {/* Info Pembeli */}
      <div className="tiket-buyer-info">
        <div className="buyer-icon-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span className="buyer-name">{nama_pembeli}</span>
        </div>
        <span className="buyer-wa">({pembeli_id})</span>
      </div>

      {/* Footer Info: Jumlah & Total */}
      <div className="event-footer-info">
        <div className="event-quota-block">
          <span className="event-quota-label">Jumlah Tiket</span>
          <span className="event-quota-value">
            <strong>{jumlah_tiket}</strong> tiket (@{formatRupiah(harga_tiket)})
          </span>
        </div>

        <div className="event-price-block" style={{ textAlign: 'right' }}>
          <span className="event-price-label">Total Bayar</span>
          <span className="event-price-value">{formatRupiah(total)}</span>
        </div>
      </div>

      {/* Aksi Berdasarkan Alur Status (PRD 4 & Skema 5.1) */}
      {status === 'menunggu_bayar' && (
        <div className="event-card-actions">
          <button
            type="button"
            className="btn-card-action btn-card-delete"
            id={`btn-cancel-tiket-${id}`}
            onClick={() => onCancelTicket?.(tiket)}
          >
            Batalkan
          </button>
          <button
            type="button"
            className="btn-card-action btn-card-primary-action"
            id={`btn-lunas-tiket-${id}`}
            onClick={() => onUpdateStatus?.(id, 'lunas', tiket)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Konfirmasi Lunas
          </button>
        </div>
      )}

      {status === 'lunas' && (
        <div className="event-card-actions">
          <button
            type="button"
            className="btn-card-action btn-card-checkin"
            id={`btn-hadir-tiket-${id}`}
            onClick={() => onUpdateStatus?.(id, 'hadir', tiket)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Check-in Hadir
          </button>
        </div>
      )}
    </article>
  )
}
