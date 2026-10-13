import React, { useState, useEffect } from 'react'
import TiketCard from './TiketCard.jsx'
import TiketFormModal from './TiketFormModal.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import Toast from '../common/Toast.jsx'
import { LoadingState, EmptyState, ErrorState } from '../common/StateViews.jsx'
import {
  getTiket,
  createTiket,
  updateTiketStatus,
  seedSampleTiket
} from '../../services/tiketService.js'
import { getEvents } from '../../services/eventService.js'
import { getPembeli } from '../../services/pembeliService.js'

export default function TiketPage() {
  const [tiketList, setTiketList] = useState([])
  const [events, setEvents] = useState([])
  const [pembeliList, setPembeliList] = useState([])
  const [activeTab, setActiveTab] = useState('semua')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [cancelingTiket, setCancelingTiket] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState(null)

  // Memuat tiket dari Firestore dengan limit(20)
  const loadTiketData = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [tiketData, eventData, pembeliData] = await Promise.all([
        getTiket(),
        getEvents(),
        getPembeli()
      ])
      setTiketList(tiketData)
      setEvents(eventData)
      setPembeliList(pembeliData)
    } catch (err) {
      console.error(err)
      setErrorMessage('Gagal memuat data tiket. Silakan periksa koneksi atau coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTiketData()
  }, [])

  // Pembuatan tiket baru dengan addDoc
  const handleCreateTiket = async (formPayload) => {
    await createTiket(formPayload)
    setToast({
      message: 'Tiket berhasil dicatat. Status awal: menunggu_bayar.',
      type: 'success'
    })
    await loadTiketData()
  }

  // Pembaruan status (lunas atau hadir)
  const handleUpdateStatus = async (tiketId, newStatus, currentTiket) => {
    try {
      setIsProcessing(true)
      await updateTiketStatus(tiketId, newStatus, currentTiket)
      const label = newStatus === 'lunas' ? 'dikonfirmasi Lunas' : 'berhasil Check-in Hadir'
      setToast({
        message: `Tiket ${label}.`,
        type: 'success'
      })
      await loadTiketData()
    } catch (err) {
      setToast({
        message: err.message,
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Eksekusi pembatalan tiket (kuota event dikembalikan)
  const handleConfirmCancelTiket = async () => {
    if (!cancelingTiket) return
    try {
      setIsProcessing(true)
      await updateTiketStatus(cancelingTiket.id, 'dibatalkan', cancelingTiket)
      setToast({
        message: `Tiket ${cancelingTiket.nama_event} berhasil dibatalkan. Kuota tiket dikembalikan.`,
        type: 'success'
      })
      setCancelingTiket(null)
      await loadTiketData()
    } catch (err) {
      setToast({
        message: 'Gagal membatalkan tiket: ' + err.message,
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Muat data contoh dari skema
  const handleLoadSample = async () => {
    try {
      setIsLoading(true)
      await seedSampleTiket()
      setToast({
        message: 'Data contoh tiket "Tk63fHs" berhasil dimuat.',
        type: 'success'
      })
      await loadTiketData()
    } catch (err) {
      setToast({
        message: err.message,
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter list berdasarkan tabs
  const filteredTiketList = tiketList.filter((item) => {
    if (activeTab === 'semua') return true
    return item.status === activeTab
  })

  const tabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'menunggu_bayar', label: 'Menunggu' },
    { id: 'lunas', label: 'Lunas' },
    { id: 'hadir', label: 'Hadir' },
    { id: 'dibatalkan', label: 'Batal' }
  ]

  return (
    <div className="page-container" id="page-tiket">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Halaman */}
      <div className="page-header-action">
        <div>
          <h1 className="page-title">Tiket</h1>
          <p className="page-subtitle">Pencatatan pembelian, status pembayaran, dan kehadiran.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          id="btn-tambah-tiket-header"
          onClick={() => setIsFormOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Buat Tiket
        </button>
      </div>

      {/* Status Filter Tabs (PRD 5.3) */}
      {!isLoading && !errorMessage && tiketList.length > 0 && (
        <div className="status-tabs" role="tablist">
          {tabs.map((tab) => {
            const count = tab.id === 'semua'
              ? tiketList.length
              : tiketList.filter((t) => t.status === tab.id).length
            return (
              <button
                key={tab.id}
                type="button"
                className={`status-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <span>{tab.label}</span>
                <span className="tab-count-badge">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 1. Loading State */}
      {isLoading && (
        <LoadingState text="Memuat data tiket..." count={2} />
      )}

      {/* 2. Error State */}
      {!isLoading && errorMessage && (
        <ErrorState
          title="Gagal Memuat Tiket"
          message={errorMessage}
          onRetry={loadTiketData}
          retryLabel="Coba Lagi"
        />
      )}

      {/* 3. Empty State (Saat belum ada tiket sama sekali) */}
      {!isLoading && !errorMessage && tiketList.length === 0 && (
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
          description="Belum ada transaksi tiket yang dicatat. Buat tiket baru untuk pembeli atau muat contoh dari skema."
          action={(
            <div className="empty-actions">
              <button
                type="button"
                className="btn btn-primary"
                id="btn-buat-tiket-empty"
                onClick={() => setIsFormOpen(true)}
              >
                Buat Tiket Baru
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                id="btn-muat-contoh-tiket-empty"
                onClick={handleLoadSample}
              >
                Muat Data Contoh Skema
              </button>
            </div>
          )}
        />
      )}

      {/* Empty State bila filter status tab tidak memiliki tiket */}
      {!isLoading && !errorMessage && tiketList.length > 0 && filteredTiketList.length === 0 && (
        <div className="empty-card">
          <p className="empty-title">Tidak ada tiket dengan status "{activeTab}"</p>
          <p className="empty-desc">Pilih tab status lain untuk melihat tiket terdaftar.</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('semua')}
          >
            Tampilkan Semua Tiket
          </button>
        </div>
      )}

      {/* 4. Daftar Tiket */}
      {!isLoading && !errorMessage && filteredTiketList.length > 0 && (
        <div className="event-list" id="tiket-list-container">
          {filteredTiketList.map((tiket) => (
            <TiketCard
              key={tiket.id}
              tiket={tiket}
              onUpdateStatus={handleUpdateStatus}
              onCancelTicket={(t) => setCancelingTiket(t)}
            />
          ))}
        </div>
      )}

      {/* Modal Formulir Tambah Tiket */}
      <TiketFormModal
        isOpen={isFormOpen}
        events={events}
        pembeliList={pembeliList}
        onClose={() => setIsFormOpen(false)}
        onSubmitSuccess={handleCreateTiket}
      />

      {/* Dialog Konfirmasi Pembatalan Tiket */}
      <ConfirmDialog
        isOpen={Boolean(cancelingTiket)}
        title="Batalkan Pembelian Tiket"
        message={`Apakah Anda yakin ingin membatalkan pesanan tiket "${cancelingTiket?.nama_event}" atas nama ${cancelingTiket?.nama_pembeli}? Tiket terjual pada event akan berkurang ${cancelingTiket?.jumlah_tiket} dan kuota dikembalikan.`}
        confirmLabel="Batalkan Tiket"
        cancelLabel="Kembali"
        isDanger={true}
        isLoading={isProcessing}
        onConfirm={handleConfirmCancelTiket}
        onClose={() => setCancelingTiket(null)}
      />
    </div>
  )
}
