import React, { useState, useEffect } from 'react'
import PembeliCard from './PembeliCard.jsx'
import PembeliFormModal from './PembeliFormModal.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import Toast from '../common/Toast.jsx'
import { LoadingState, EmptyState, ErrorState } from '../common/StateViews.jsx'
import {
  getPembeli,
  createPembeli,
  updatePembeli,
  deletePembeli,
  seedSamplePembeli
} from '../../services/pembeliService.js'

export default function PembeliPage() {
  const [pembeliList, setPembeliList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPembeli, setEditingPembeli] = useState(null)
  const [deletingPembeli, setDeletingPembeli] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // Memuat daftar pembeli dari Firestore (getDocs limit 20)
  const loadPembeli = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const data = await getPembeli()
      setPembeliList(data)
    } catch (err) {
      console.error(err)
      setErrorMessage('Gagal memuat daftar pembeli. Silakan periksa koneksi atau coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPembeli()
  }, [])

  const handleOpenAdd = () => {
    setEditingPembeli(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (pembeli) => {
    setEditingPembeli(pembeli)
    setIsFormOpen(true)
  }

  const handleOpenDelete = (pembeli) => {
    setDeletingPembeli(pembeli)
  }

  const handleSubmitForm = async (formData, initialData) => {
    if (initialData && initialData.no_whatsapp) {
      await updatePembeli(initialData.no_whatsapp, formData)
      setToast({
        message: 'Data pembeli berhasil diperbarui.',
        type: 'success'
      })
    } else {
      await createPembeli(formData)
      setToast({
        message: 'Pembeli baru berhasil disimpan ke Firestore.',
        type: 'success'
      })
    }
    await loadPembeli()
  }

  const handleConfirmDelete = async () => {
    if (!deletingPembeli) return
    try {
      setIsDeleting(true)
      await deletePembeli(deletingPembeli.no_whatsapp)
      setToast({
        message: `Pembeli "${deletingPembeli.nama}" berhasil dihapus.`,
        type: 'success'
      })
      setDeletingPembeli(null)
      await loadPembeli()
    } catch (err) {
      setToast({
        message: 'Gagal menghapus pembeli: ' + err.message,
        type: 'error'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLoadSample = async () => {
    try {
      setIsLoading(true)
      await seedSamplePembeli()
      setToast({
        message: 'Data contoh "Nadia Putri" berhasil dimuat.',
        type: 'success'
      })
      await loadPembeli()
    } catch (err) {
      setToast({
        message: err.message,
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter pencarian berdasarkan nama atau nomor WhatsApp (AC 4)
  const filteredList = pembeliList.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      item.nama?.toLowerCase().includes(q) ||
      item.no_whatsapp?.includes(q) ||
      item.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-container" id="page-pembeli">
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
          <h1 className="page-title">Pembeli</h1>
          <p className="page-subtitle">Kelola nama, nomor WhatsApp, dan email pembeli.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          id="btn-tambah-pembeli-header"
          onClick={handleOpenAdd}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Pembeli
        </button>
      </div>

      {/* Kolom Cari (Pencarian Pembeli Sesuai PRD 5.2) */}
      {!isLoading && !errorMessage && pembeliList.length > 0 && (
        <div className="search-bar-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            id="input-cari-pembeli"
            type="text"
            className="search-input"
            placeholder="Cari berdasarkan nama atau no WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Bersihkan pencarian"
            >
              &times;
            </button>
          )}
        </div>
      )}

      {/* 1. Loading State */}
      {isLoading && (
        <LoadingState text="Memuat daftar pembeli..." count={2} />
      )}

      {/* 2. Error State */}
      {!isLoading && errorMessage && (
        <ErrorState
          title="Gagal Memuat Pembeli"
          message={errorMessage}
          onRetry={loadPembeli}
          retryLabel="Coba Lagi"
        />
      )}

      {/* 3. Empty State */}
      {!isLoading && !errorMessage && pembeliList.length === 0 && (
        <EmptyState
          icon={(
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          )}
          title="Belum ada pembeli"
          description="Data kontak pembeli masih kosong. Tambah pembeli baru atau muat data contoh Nadia Putri."
          action={(
            <div className="empty-actions">
              <button
                type="button"
                className="btn btn-primary"
                id="btn-tambah-pembeli-empty"
                onClick={handleOpenAdd}
              >
                Tambah Pembeli
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                id="btn-muat-contoh-pembeli-empty"
                onClick={handleLoadSample}
              >
                Muat Data Contoh Skema
              </button>
            </div>
          )}
        />
      )}

      {/* Empty State jika Pencarian Tidak Ditemukan */}
      {!isLoading && !errorMessage && pembeliList.length > 0 && filteredList.length === 0 && (
        <div className="empty-card">
          <p className="empty-title">Tidak ada pembeli yang cocok</p>
          <p className="empty-desc">Pencarian untuk "{searchQuery}" tidak menemukan hasil.</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSearchQuery('')}
          >
            Hapus Filter Pencarian
          </button>
        </div>
      )}

      {/* 4. Daftar Pembeli */}
      {!isLoading && !errorMessage && filteredList.length > 0 && (
        <div className="event-list" id="pembeli-list-container">
          {filteredList.map((pembeli) => (
            <PembeliCard
              key={pembeli.no_whatsapp}
              pembeli={pembeli}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Modal Formulir Tambah / Ubah Pembeli */}
      <PembeliFormModal
        isOpen={isFormOpen}
        initialData={editingPembeli}
        onClose={() => {
          setIsFormOpen(false)
          setEditingPembeli(null)
        }}
        onSubmitSuccess={handleSubmitForm}
      />

      {/* Dialog Konfirmasi Hapus Pembeli */}
      <ConfirmDialog
        isOpen={Boolean(deletingPembeli)}
        title="Hapus Pembeli"
        message={`Apakah Anda yakin ingin menghapus data pembeli "${deletingPembeli?.nama}" (${deletingPembeli?.no_whatsapp})?`}
        confirmLabel="Hapus Pembeli"
        cancelLabel="Batal"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingPembeli(null)}
      />
    </div>
  )
}
