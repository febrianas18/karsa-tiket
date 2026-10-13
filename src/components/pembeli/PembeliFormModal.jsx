import React, { useState, useEffect } from 'react'
import { validatePembeliInput, SAMPLE_PEMBELI_DATA } from '../../services/pembeliService.js'

export default function PembeliFormModal({
  isOpen,
  initialData = null,
  onClose,
  onSubmitSuccess
}) {
  const isEditing = Boolean(initialData && initialData.no_whatsapp)

  const [formData, setFormData] = useState({
    nama: '',
    no_whatsapp: '',
    email: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama: initialData.nama || '',
        no_whatsapp: initialData.no_whatsapp || '',
        email: initialData.email || ''
      })
    } else {
      setFormData({
        nama: '',
        no_whatsapp: '',
        email: ''
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

  // Gunakan data contoh Nadia Putri dari Skema Firestore
  const handleUseSampleData = () => {
    setFormData({
      nama: SAMPLE_PEMBELI_DATA.nama,
      no_whatsapp: SAMPLE_PEMBELI_DATA.no_whatsapp,
      email: SAMPLE_PEMBELI_DATA.email
    })
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validatePembeliInput(formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmitSuccess(formData, initialData)
      onClose()
    } catch (err) {
      setErrors({ form: err.message || 'Gagal menyimpan pembeli.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="form-pembeli-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="form-pembeli-title" className="modal-title">
              {isEditing ? 'Ubah Pembeli' : 'Tambah Pembeli'}
            </h2>
            <p className="modal-subtitle">
              {isEditing
                ? 'Perbarui data kontak pembeli tiket'
                : 'Pendaftaran data pembeli sesuai skema Firestore'}
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Tutup formulir">
            &times;
          </button>
        </div>

        {/* Quick action: Pakai Data Contoh dari Skema */}
        {!isEditing && (
          <div className="sample-data-banner">
            <div className="sample-data-info">
              <span className="sample-data-badge">Contoh Skema</span>
              <span className="sample-data-text">Nadia Putri (081355512345)</span>
            </div>
            <button
              type="button"
              className="btn-sample-fill"
              onClick={handleUseSampleData}
              id="btn-use-sample-pembeli"
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
            <label htmlFor="input-pembeli-nama" className="form-label">
              Nama Pembeli <span className="text-danger">*</span>
            </label>
            <input
              id="input-pembeli-nama"
              name="nama"
              type="text"
              className={`form-input ${errors.nama ? 'input-error' : ''}`}
              placeholder="Contoh: Nadia Putri"
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

          {/* Field: no_whatsapp */}
          <div className="form-group">
            <label htmlFor="input-pembeli-no_whatsapp" className="form-label">
              Nomor WhatsApp <span className="text-danger">*</span>
            </label>
            <input
              id="input-pembeli-no_whatsapp"
              name="no_whatsapp"
              type="tel"
              className={`form-input ${errors.no_whatsapp ? 'input-error' : ''}`}
              placeholder="Contoh: 081355512345"
              value={formData.no_whatsapp}
              onChange={handleChange}
              disabled={isSubmitting || isEditing}
              required
            />
            {errors.no_whatsapp ? (
              <span className="field-error-msg">{errors.no_whatsapp}</span>
            ) : (
              <span className="field-hint">
                {isEditing ? 'Nomor WhatsApp merupakan ID dokumen (tidak dapat diubah)' : 'Diawali 08, 10 sampai 13 angka'}
              </span>
            )}
          </div>

          {/* Field: email */}
          <div className="form-group">
            <label htmlFor="input-pembeli-email" className="form-label">
              Email <span className="text-danger">*</span>
            </label>
            <input
              id="input-pembeli-email"
              name="email"
              type="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="Contoh: nadia.putri@contoh.id"
              maxLength={80}
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            {errors.email ? (
              <span className="field-error-msg">{errors.email}</span>
            ) : (
              <span className="field-hint">Wajib mengandung tanda @ (maks 80 karakter)</span>
            )}
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
              id="btn-simpan-pembeli"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembeli'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
