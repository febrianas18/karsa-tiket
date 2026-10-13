import React, { useState, useEffect } from 'react'
import { validateEventInput, SAMPLE_EVENT_DATA } from '../../services/eventService.js'

export default function EventFormModal({
  isOpen,
  initialData = null,
  onClose,
  onSubmitSuccess
}) {
  const isEditing = Boolean(initialData && initialData.id)

  const [formData, setFormData] = useState({
    nama: '',
    tanggal: '',
    lokasi: '',
    harga_tiket: '',
    kuota: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sinkronisasi data saat modal dibuka atau initialData berubah
  useEffect(() => {
    if (initialData) {
      setFormData({
        nama: initialData.nama || '',
        tanggal: initialData.tanggal || '',
        lokasi: initialData.lokasi || '',
        harga_tiket: initialData.harga_tiket !== undefined ? String(initialData.harga_tiket) : '',
        kuota: initialData.kuota !== undefined ? String(initialData.kuota) : ''
      })
    } else {
      setFormData({
        nama: '',
        tanggal: '',
        lokasi: '',
        harga_tiket: '',
        kuota: ''
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Isi otomatis form dengan data contoh dari Skema Firestore
  const handleUseSampleData = () => {
    setFormData({
      nama: SAMPLE_EVENT_DATA.nama,
      tanggal: SAMPLE_EVENT_DATA.tanggal,
      lokasi: SAMPLE_EVENT_DATA.lokasi,
      harga_tiket: String(SAMPLE_EVENT_DATA.harga_tiket),
      kuota: String(SAMPLE_EVENT_DATA.kuota)
    })
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateEventInput(formData)

    // Validasi AC 4: kuota diubah menjadi lebih kecil dari tiket terjual
    if (isEditing && initialData) {
      const parsedKuota = Number(formData.kuota)
      const tiketTerjual = Number(initialData.tiket_terjual || 0)
      if (!isNaN(parsedKuota) && parsedKuota < tiketTerjual) {
        validation.isValid = false
        validation.errors.kuota = `Kuota tidak boleh lebih kecil dari tiket terjual (${tiketTerjual} tiket).`
      }
    }

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmitSuccess(formData, initialData)
      onClose()
    } catch (err) {
      setErrors({ form: err.message || 'Gagal menyimpan event.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="form-event-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="form-event-title" className="modal-title">
              {isEditing ? 'Ubah Event' : 'Tambah Event'}
            </h2>
            <p className="modal-subtitle">
              {isEditing
                ? 'Perbarui data acara sesuai skema Cloud Firestore'
                : 'Isi data acara sesuai skema Cloud Firestore'}
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Tutup formulir">
            &times;
          </button>
        </div>

        {/* Quick action: Pakai Data Contoh dari Skema (hanya di mode tambah) */}
        {!isEditing && (
          <div className="sample-data-banner">
            <div className="sample-data-info">
              <span className="sample-data-badge">Contoh Skema</span>
              <span className="sample-data-text">Workshop Sablon Tote Bag (30 kuota, Rp 75.000)</span>
            </div>
            <button
              type="button"
              className="btn-sample-fill"
              onClick={handleUseSampleData}
              id="btn-use-sample-event"
            >
              Gunakan Data Contoh
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-event" noValidate>
          {errors.form && (
            <div className="form-error-banner" role="alert">
              {errors.form}
            </div>
          )}

          {/* Field: nama */}
          <div className="form-group">
            <label htmlFor="input-nama" className="form-label">
              Nama Acara <span className="text-danger">*</span>
            </label>
            <input
              id="input-nama"
              name="nama"
              type="text"
              className={`form-input ${errors.nama ? 'input-error' : ''}`}
              placeholder="Contoh: Workshop Sablon Tote Bag"
              maxLength={60}
              value={formData.nama}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            {errors.nama ? (
              <span className="field-error-msg">{errors.nama}</span>
            ) : (
              <span className="field-hint">Maksimal 60 karakter</span>
            )}
          </div>

          {/* Field: tanggal */}
          <div className="form-group">
            <label htmlFor="input-tanggal" className="form-label">
              Tanggal Acara <span className="text-danger">*</span>
            </label>
            <input
              id="input-tanggal"
              name="tanggal"
              type="date"
              className={`form-input ${errors.tanggal ? 'input-error' : ''}`}
              value={formData.tanggal}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            {errors.tanggal ? (
              <span className="field-error-msg">{errors.tanggal}</span>
            ) : (
              <span className="field-hint">Format YYYY-MM-DD</span>
            )}
          </div>

          {/* Field: lokasi */}
          <div className="form-group">
            <label htmlFor="input-lokasi" className="form-label">
              Lokasi Acara <span className="text-danger">*</span>
            </label>
            <input
              id="input-lokasi"
              name="lokasi"
              type="text"
              className={`form-input ${errors.lokasi ? 'input-error' : ''}`}
              placeholder="Contoh: Ruang Karsa, Jl. Merdeka No. 21"
              maxLength={100}
              value={formData.lokasi}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            {errors.lokasi ? (
              <span className="field-error-msg">{errors.lokasi}</span>
            ) : (
              <span className="field-hint">Maksimal 100 karakter</span>
            )}
          </div>

          {/* Row: harga_tiket & kuota */}
          <div className="form-row">
            {/* Field: harga_tiket */}
            <div className="form-group flex-1">
              <label htmlFor="input-harga_tiket" className="form-label">
                Harga Tiket (Rp) <span className="text-danger">*</span>
              </label>
              <input
                id="input-harga_tiket"
                name="harga_tiket"
                type="number"
                min={0}
                step={1}
                className={`form-input ${errors.harga_tiket ? 'input-error' : ''}`}
                placeholder="0"
                value={formData.harga_tiket}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.harga_tiket ? (
                <span className="field-error-msg">{errors.harga_tiket}</span>
              ) : (
                <span className="field-hint">0 = Gratis</span>
              )}
            </div>

            {/* Field: kuota */}
            <div className="form-group flex-1">
              <label htmlFor="input-kuota" className="form-label">
                Kuota (Kursi) <span className="text-danger">*</span>
              </label>
              <input
                id="input-kuota"
                name="kuota"
                type="number"
                min={1}
                max={500}
                step={1}
                className={`form-input ${errors.kuota ? 'input-error' : ''}`}
                placeholder="1 - 500"
                value={formData.kuota}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.kuota ? (
                <span className="field-error-msg">{errors.kuota}</span>
              ) : (
                <span className="field-hint">
                  {isEditing && initialData
                    ? `Min ${initialData.tiket_terjual || 1} (terjual: ${initialData.tiket_terjual || 0})`
                    : '1 sampai 500'}
                </span>
              )}
            </div>
          </div>

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
              id="btn-simpan-event"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
