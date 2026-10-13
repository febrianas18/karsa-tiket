import React, { useState, useEffect } from 'react'
import EventCard from './EventCard.jsx'
import EventFormModal from './EventFormModal.jsx'
import Toast from '../common/Toast.jsx'
import { getEvents, createEvent, seedSampleEvent } from '../../services/eventService.js'

export default function EventPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
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

  // Simpan event baru
  const handleCreateEvent = async (formData) => {
    await createEvent(formData)
    setToast({
      message: 'Event berhasil disimpan ke Firestore.',
      type: 'success'
    })
    await loadEvents()
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
          onClick={() => setIsFormOpen(true)}
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
              onClick={() => setIsFormOpen(true)}
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
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Modal Formulir Tambah Event */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitSuccess={handleCreateEvent}
      />
    </div>
  )
}
