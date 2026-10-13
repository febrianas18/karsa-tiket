import React from 'react'

export default function EventCard({ event, onEdit, onDelete }) {
  const {
    id,
    nama,
    tanggal,
    lokasi,
    harga_tiket,
    kuota,
    tiket_terjual = 0
  } = event

  const sisaKuota = Math.max(0, Number(kuota) - Number(tiket_terjual))
  const isHabis = sisaKuota === 0 || Number(tiket_terjual) >= Number(kuota)

  const formatRupiah = (val) => {
    const num = Number(val)
    if (num === 0) return 'Gratis'
    return `Rp ${num.toLocaleString('id-ID')}`
  }

  // Format tanggal YYYY-MM-DD ke format baca Indonesia
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

  return (
    <article className="event-card" id={`event-card-${id || 'sample'}`}>
      <div className="event-card-header">
        <div className="event-date-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{formatDisplayDate(tanggal)}</span>
        </div>

        {isHabis ? (
          <span className="badge-status badge-habis" id={`label-habis-${id}`}>Habis</span>
        ) : (
          <span className="badge-status badge-tersedia">Sisa {sisaKuota} tiket</span>
        )}
      </div>

      <h3 className="event-title">{nama}</h3>

      <div className="event-location">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>{lokasi}</span>
      </div>

      <div className="event-footer-info">
        <div className="event-price-block">
          <span className="event-price-label">Harga Tiket</span>
          <span className="event-price-value">{formatRupiah(harga_tiket)}</span>
        </div>

        <div className="event-quota-block">
          <span className="event-quota-label">Kuota</span>
          <span className="event-quota-value">
            <strong>{tiket_terjual}</strong> / {kuota} terjual
          </span>
        </div>
      </div>

      {/* Tombol Ubah dan Hapus */}
      <div className="event-card-actions">
        <button
          type="button"
          className="btn-card-action btn-card-edit"
          id={`btn-edit-event-${id}`}
          onClick={() => onEdit?.(event)}
          aria-label={`Ubah event ${nama}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Ubah
        </button>

        <button
          type="button"
          className="btn-card-action btn-card-delete"
          id={`btn-delete-event-${id}`}
          onClick={() => onDelete?.(event)}
          aria-label={`Hapus event ${nama}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Hapus
        </button>
      </div>
    </article>
  )
}
