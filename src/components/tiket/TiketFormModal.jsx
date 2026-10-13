import React, { useState, useEffect } from 'react'
import { validateTiketInput } from '../../services/tiketService.js'

export default function TiketFormModal({
  isOpen,
  events = [],
  pembeliList = [],
  onClose,
  onSubmitSuccess
}) {
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedPembeliId, setSelectedPembeliId] = useState('')
  const [jumlahTiket, setJumlahTiket] = useState(1)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form saat dibuka
  useEffect(() => {
    if (isOpen) {
      if (events.length > 0 && !selectedEventId) {
        setSelectedEventId(events[0].id)
      }
      if (pembeliList.length > 0 && !selectedPembeliId) {
        setSelectedPembeliId(pembeliList[0].no_whatsapp)
      }
      setJumlahTiket(1)
      setErrors({})
    }
  }, [isOpen, events, pembeliList])

  if (!isOpen) return null

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null
  const selectedPembeli = pembeliList.find((p) => p.no_whatsapp === selectedPembeliId) || null

  const sisaKuota = selectedEvent
    ? Math.max(0, Number(selectedEvent.kuota || 0) - Number(selectedEvent.tiket_terjual || 0))
    : 0

  const hargaSatuan = Number(selectedEvent?.harga_tiket || 0)
  const totalBayar = hargaSatuan * Number(jumlahTiket || 0)

  const formatRupiah = (val) => {
    const num = Number(val)
    if (num === 0) return 'Gratis (Rp 0)'
    return `Rp ${num.toLocaleString('id-ID')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateTiketInput({
      event: selectedEvent,
      pembeli: selectedPembeli,
      jumlah_tiket: jumlahTiket
    })

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmitSuccess({
        event: selectedEvent,
        pembeli: selectedPembeli,
        jumlah_tiket: jumlahTiket
      })
      onClose()
    } catch (err) {
      setErrors({ form: err.message || 'Gagal menyimpan tiket.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="form-tiket-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="form-tiket-title" className="modal-title">Buat Tiket Baru</h2>
            <p className="modal-subtitle">Catat pembelian tiket acara ke Cloud Firestore</p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Tutup formulir">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-event" noValidate>
          {errors.form && (
            <div className="form-error-banner" role="alert">
              {errors.form}
            </div>
          )}

          {/* Select Event */}
          <div className="form-group">
            <label htmlFor="select-tiket-event" className="form-label">
              Pilih Acara (Event) <span className="text-danger">*</span>
            </label>
            {events.length === 0 ? (
              <p className="field-error-msg">Belum ada acara tersedia. Tambahkan event terlebih dahulu.</p>
            ) : (
              <select
                id="select-tiket-event"
                className={`form-input ${errors.event ? 'input-error' : ''}`}
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="">-- Pilih Acara --</option>
                {events.map((ev) => {
                  const sisa = Math.max(0, Number(ev.kuota || 0) - Number(ev.tiket_terjual || 0))
                  return (
                    <option key={ev.id} value={ev.id} disabled={sisa === 0}>
                      {ev.nama} ({ev.tanggal}) - Sisa {sisa} kuota {sisa === 0 ? '[HABIS]' : ''}
                    </option>
                  )
                })}
              </select>
            )}
            {errors.event && <span className="field-error-msg">{errors.event}</span>}
          </div>

          {/* Select Pembeli */}
          <div className="form-group">
            <label htmlFor="select-tiket-pembeli" className="form-label">
              Pilih Pembeli <span className="text-danger">*</span>
            </label>
            {pembeliList.length === 0 ? (
              <p className="field-error-msg">Belum ada data pembeli. Daftarkan pembeli terlebih dahulu.</p>
            ) : (
              <select
                id="select-tiket-pembeli"
                className={`form-input ${errors.pembeli ? 'input-error' : ''}`}
                value={selectedPembeliId}
                onChange={(e) => setSelectedPembeliId(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="">-- Pilih Pembeli --</option>
                {pembeliList.map((p) => (
                  <option key={p.no_whatsapp} value={p.no_whatsapp}>
                    {p.nama} ({p.no_whatsapp})
                  </option>
                ))}
              </select>
            )}
            {errors.pembeli && <span className="field-error-msg">{errors.pembeli}</span>}
          </div>

          {/* Jumlah Tiket: 1 sampai 5 */}
          <div className="form-group">
            <label htmlFor="input-tiket-jumlah" className="form-label">
              Jumlah Tiket (1 - 5) <span className="text-danger">*</span>
            </label>
            <input
              id="input-tiket-jumlah"
              type="number"
              min={1}
              max={Math.min(5, Math.max(1, sisaKuota))}
              className={`form-input ${errors.jumlah_tiket ? 'input-error' : ''}`}
              value={jumlahTiket}
              onChange={(e) => setJumlahTiket(Math.max(1, parseInt(e.target.value || '1', 10)))}
              disabled={isSubmitting || sisaKuota === 0}
              required
            />
            {errors.jumlah_tiket ? (
              <span className="field-error-msg">{errors.jumlah_tiket}</span>
            ) : (
              <span className="field-hint">Maksimal 5 tiket dan tidak melebihi sisa kuota ({sisaKuota} tiket)</span>
            )}
          </div>

          {/* Kalkulasi Ringkasan Biaya */}
          {selectedEvent && (
            <div className="tiket-summary-box">
              <div className="summary-row">
                <span>Harga Satuan:</span>
                <strong>{formatRupiah(hargaSatuan)}</strong>
              </div>
              <div className="summary-row">
                <span>Jumlah Dipesan:</span>
                <strong>{jumlahTiket} tiket</strong>
              </div>
              <div className="summary-row total-highlight">
                <span>Total Pembayaran:</span>
                <span className="summary-total-val">{formatRupiah(totalBayar)}</span>
              </div>
              <div className="summary-status-note">
                Status awal tiket: <strong>menunggu_bayar</strong>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btn-simpan-tiket"
              disabled={isSubmitting || sisaKuota === 0 || events.length === 0 || pembeliList.length === 0}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tiket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
