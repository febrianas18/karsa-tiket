import React, { useState, useEffect } from 'react'
import EventCard from './EventCard.jsx'
import EventFormModal from './EventFormModal.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import Toast from '../common/Toast.jsx'
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  seedSampleEvent
} from '../../services/eventService.js'

export default function EventPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deletingEvent, setDeletingEvent] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // Memuat daftar event dari Firestore
  const loadEvents = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const data = await getEvents()
      setEvents(data)
    } catch (err) {
      console.error(err)
      setErrorMessage('Gagal memuat daftar event. Silakan periksa koneksi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Buka modal untuk tambah
  const handleOpenAdd = () => {
    setEditingEvent(null)
    setIsFormOpen(true)
  }

  // Buka modal untuk ubah
  const handleOpenEdit = (event) => {
    setEditingEvent(event)
    setIsFormOpen(true)
  }

  // Buka konfirmasi hapus
  const handleOpenDelete = (event) => {
    setDeletingEvent(event)
  }

  // Simpan event baru atau perbarui event yang ada
  const handleSubmitForm = async (formData, initialData) => {
    if (initialData && initialData.id) {
      await updateEvent(initialData.id, formData, initialData.tiket_terjual || 0)
      setToast({
        message: 'Event berhasil diperbarui.',
        type: 'success'
      })
    } else {
      await createEvent(formData)
      setToast({
        message: 'Event berhasil disimpan ke Firestore.',
        type: 'success'
      })
    }
    await loadEvents()
  }

  // Eksekusi penghapusan event setelah dikonfirmasi
  const handleConfirmDelete = async () => {
    if (!deletingEvent) return
    try {
      setIsDeleting(true)
      await deleteEvent(deletingEvent.id)
      setToast({
        message: `Event "${deletingEvent.nama}" berhasil dihapus.`,
        type: 'success'
      })
      setDeletingEvent(null)
      await loadEvents()
    } catch (err) {
      setToast({
        message: 'Gagal menghapus event: ' + err.message,
        type: 'error'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Muat data contoh dari skema secara instan
  const handleLoadSample = async () => {
    try {
      setIsLoading(true)
      await seedSampleEvent()
      setToast({
        message: 'Data contoh "Workshop Sablon Tote Bag" berhasil dimuat.',
        type: 'success'
      })
      await loadEvents()
    } catch (err) {
      setToast({
        message: 'Gagal memuat data contoh: ' + err.message,
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container" id="page-event">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header dengan Action Button */}
      <div className="page-header-action">
        <div>
          <h1 className="page-title">Event</h1>
          <p className="page-subtitle">Kelola nama, tanggal, lokasi, harga tiket, dan kuota acara.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          id="btn-tambah-event-header"
          onClick={handleOpenAdd}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Event
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state-container" aria-label="Memuat data event...">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div className="error-card" role="alert">
          <div className="error-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="error-title">Gagal Memuat Event</h3>
          <p className="error-desc">{errorMessage}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadEvents}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty State (AC 2: Belum ada event) */}
      {!isLoading && !errorMessage && events.length === 0 && (
        <div className="empty-card" id="empty-state-event">
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
            Daftar acara komunitas masih kosong. Buat event pertama atau gunakan data contoh dari skema.
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              id="btn-tambah-event-empty"
              onClick={handleOpenAdd}
            >
              Tambah Event
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              id="btn-muat-contoh-empty"
              onClick={handleLoadSample}
            >
              Muat Data Contoh Skema
            </button>
          </div>
        </div>
      )}

      {/* Daftar Event */}
      {!isLoading && !errorMessage && events.length > 0 && (
        <div className="event-list" id="event-list-container">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Modal Formulir Tambah / Ubah Event */}
      <EventFormModal
        isOpen={isFormOpen}
        initialData={editingEvent}
        onClose={() => {
          setIsFormOpen(false)
          setEditingEvent(null)
        }}
        onSubmitSuccess={handleSubmitForm}
      />

      {/* Dialog Konfirmasi Hapus Event */}
      <ConfirmDialog
        isOpen={Boolean(deletingEvent)}
        title="Hapus Event"
        message={`Apakah Anda yakin ingin menghapus event "${deletingEvent?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Event"
        cancelLabel="Batal"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  )
}
