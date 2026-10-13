import React, { useState, useEffect } from 'react'
import EventCard from './EventCard.jsx'
import EventFormModal from './EventFormModal.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import Toast from '../common/Toast.jsx'
import { LoadingState, EmptyState, ErrorState } from '../common/StateViews.jsx'
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
      setErrorMessage('Gagal memuat daftar event. Silakan periksa koneksi atau coba lagi.')
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

      {/* 1. Loading State */}
      {isLoading && (
        <LoadingState text="Memuat daftar event..." count={2} />
      )}

      {/* 2. Error State */}
      {!isLoading && errorMessage && (
        <ErrorState
          title="Gagal Memuat Event"
          message={errorMessage}
          onRetry={loadEvents}
          retryLabel="Coba Lagi"
        />
      )}

      {/* 3. Empty State (AC 2: Belum ada event) */}
      {!isLoading && !errorMessage && events.length === 0 && (
        <EmptyState
          icon={(
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          )}
          title="Belum ada event"
          description="Daftar acara komunitas masih kosong. Buat event pertama atau gunakan data contoh dari skema."
          action={(
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
          )}
        />
      )}

      {/* 4. Daftar Event (Success State dengan Data) */}
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
