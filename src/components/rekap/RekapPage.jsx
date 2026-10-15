import React, { useState, useEffect } from 'react'
import { LoadingState, EmptyState, ErrorState } from '../common/StateViews.jsx'
import { getEvents } from '../../services/eventService.js'
import { getRekapData } from '../../services/rekapService.js'

export default function RekapPage() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [rekapData, setRekapData] = useState(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingRekap, setIsLoadingRekap] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  // Format Rupiah
  const formatRupiah = (val) => {
    const num = Number(val || 0)
    return `Rp ${num.toLocaleString('id-ID')}`
  }

  // Format Tanggal Indonesia
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

  // Badge status tiket
  const getStatusBadge = (st) => {
    switch (st) {
      case 'menunggu_bayar':
        return <span className="badge-status badge-menunggu">Menunggu Bayar</span>
      case 'lunas':
        return <span className="badge-status badge-lunas">Lunas</span>
      case 'hadir':
        return <span className="badge-status badge-hadir">Hadir</span>
      case 'dibatalkan':
        return <span className="badge-status badge-dibatalkan">Dibatalkan</span>
      default:
        return <span className="badge-status">{st}</span>
    }
  }

  // 1. Memuat daftar event pertama kali
  const loadInitialEvents = async () => {
    setIsLoadingEvents(true)
    setErrorMessage(null)
    try {
      const eventList = await getEvents()
      setEvents(eventList)
      if (eventList.length > 0) {
        const firstId = eventList[0].id
        setSelectedEventId(firstId)
        await loadRekap(firstId)
      } else {
        setRekapData(null)
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('Gagal memuat daftar event. Periksa koneksi Anda dan coba lagi.')
    } finally {
      setIsLoadingEvents(false)
    }
  }

  // 2. Memuat data rekap untuk event yang dipilih
  const loadRekap = async (eventId) => {
    if (!eventId) return
    setIsLoadingRekap(true)
    setErrorMessage(null)
    try {
      const data = await getRekapData(eventId)
      setRekapData(data)
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message || 'Gagal memuat ringkasan rekap event.')
    } finally {
      setIsLoadingRekap(false)
    }
  }

  useEffect(() => {
    loadInitialEvents()
  }, [])

  // Event handler ketika user memilih event lain di dropdown
  const handleSelectEvent = (e) => {
    const newId = e.target.value
    setSelectedEventId(newId)
    loadRekap(newId)
  }

  // Helper status keterisian kuota
  const getProgressStatusClass = (persen, sisa) => {
    if (sisa === 0) return 'status-habis'
    if (persen >= 80) return 'status-hampir-penuh'
    return 'status-tersedia'
  }

  const getProgressStatusLabel = (persen, sisa) => {
    if (sisa === 0) return 'Habis'
    if (persen >= 80) return 'Hampir Penuh'
    return 'Tersedia'
  }

  return (
    <div className="page-container rekap-container" id="page-rekap">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Rekap</h1>
        <p className="page-subtitle">Ringkasan tiket terjual, sisa kuota, pendapatan, dan jumlah hadir.</p>
      </div>

      {/* Loading state awal saat memuat daftar event */}
      {isLoadingEvents && (
        <LoadingState text="Memuat daftar event..." count={2} />
      )}

      {/* Error state umum jika gagal memuat */}
      {!isLoadingEvents && errorMessage && (
        <ErrorState
          title="Gagal Memuat Rekap"
          message={errorMessage}
          onRetry={() => {
            if (selectedEventId) {
              loadRekap(selectedEventId)
            } else {
              loadInitialEvents()
            }
          }}
          retryLabel="Coba Lagi"
        />
      )}

      {/* Empty state jika belum ada event sama sekali */}
      {!isLoadingEvents && !errorMessage && events.length === 0 && (
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
          description="Tambahkan event terlebih dahulu di modul Event untuk melihat data rekapitulasi."
        />
      )}

      {/* Konten Utama Rekap saat event tersedia */}
      {!isLoadingEvents && !errorMessage && events.length > 0 && (
        <>
          {/* Card Pemilih Event */}
          <div className="rekap-selector-card" id="rekap-selector-card">
            <label htmlFor="select-event-rekap" className="rekap-selector-label">
              Pilih Event yang Direkap
            </label>
            <select
              id="select-event-rekap"
              className="rekap-select-input"
              value={selectedEventId}
              onChange={handleSelectEvent}
              disabled={isLoadingRekap}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nama} ({ev.tanggal})
                </option>
              ))}
            </select>

            {rekapData?.event && (
              <div className="rekap-event-meta">
                <span className="rekap-meta-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {formatDisplayDate(rekapData.event.tanggal)}
                </span>
                <span className="rekap-meta-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {rekapData.event.lokasi}
                </span>
                <span className="rekap-meta-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  {rekapData.event.harga_tiket === 0 ? 'Gratis' : formatRupiah(rekapData.event.harga_tiket)}
                </span>
              </div>
            )}
          </div>

          {/* Skeleton loading saat mengganti event */}
          {isLoadingRekap && (
            <LoadingState text="Memuat rekapitulasi data..." count={2} />
          )}

          {/* AC 3: Tampilkan Empty State jika event belum memiliki tiket */}
          {!isLoadingRekap && rekapData && rekapData.tiketList.length === 0 && (
            <EmptyState
              icon={(
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
              )}
              title="Belum ada tiket terjual"
              description={`Event "${rekapData.event.nama}" belum memiliki data penjualan tiket. Buat tiket di modul Tiket untuk melihat ringkasan.`}
            />
          )}

          {/* Data Rekap Lengkap jika sudah ada transaksi tiket */}
          {!isLoadingRekap && rekapData && rekapData.tiketList.length > 0 && (
            <>
              {/* Batang Kemajuan (Progress Bar Kuota) */}
              <div className="rekap-progress-card" id="rekap-progress-card">
                <div className="rekap-progress-header">
                  <span className="rekap-progress-title">Keterisian Kuota Acara</span>
                  <span
                    className={`rekap-progress-badge ${getProgressStatusClass(
                      rekapData.stats.persentaseTerjual,
                      rekapData.stats.sisaKuota
                    )}`}
                  >
                    {getProgressStatusLabel(
                      rekapData.stats.persentaseTerjual,
                      rekapData.stats.sisaKuota
                    )}
                  </span>
                </div>

                <div className="rekap-progress-bar-track">
                  <div
                    className={`rekap-progress-bar-fill ${
                      rekapData.stats.sisaKuota === 0 ? 'bar-full' : ''
                    }`}
                    style={{ width: `${rekapData.stats.persentaseTerjual}%` }}
                    role="progressbar"
                    aria-valuenow={rekapData.stats.persentaseTerjual}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>

                <div className="rekap-progress-footer">
                  <span>
                    Terjual: <strong>{rekapData.stats.tiketTerjual}</strong> dari{' '}
                    <strong>{rekapData.stats.kuota}</strong> tiket ({rekapData.stats.persentaseTerjual}%)
                  </span>
                  <span>
                    Sisa: <strong>{rekapData.stats.sisaKuota}</strong> kursi
                  </span>
                </div>
              </div>

              {/* 4 Kartu Angka (Stat Cards) */}
              <div className="rekap-stats-grid" id="rekap-stats-grid">
                {/* 1. Tiket Terjual */}
                <div className="rekap-stat-card" id="card-stat-terjual">
                  <div className="rekap-stat-icon-wrap icon-wrap-terjual">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <span className="rekap-stat-label">Tiket Terjual</span>
                  <div className="rekap-stat-value">{rekapData.stats.tiketTerjual}</div>
                  <span className="rekap-stat-desc">
                    {rekapData.stats.persentaseTerjual}% dari kuota {rekapData.stats.kuota}
                  </span>
                </div>

                {/* 2. Sisa Kuota */}
                <div className="rekap-stat-card" id="card-stat-kuota">
                  <div className="rekap-stat-icon-wrap icon-wrap-kuota">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <span className="rekap-stat-label">Sisa Kuota</span>
                  <div className="rekap-stat-value">{rekapData.stats.sisaKuota}</div>
                  <span className="rekap-stat-desc">
                    {rekapData.stats.sisaKuota === 0 ? 'Tiket sudah habis' : 'Kursi masih tersedia'}
                  </span>
                </div>

                {/* 3. Pendapatan (Hanya Lunas & Hadir) */}
                <div className="rekap-stat-card" id="card-stat-pendapatan">
                  <div className="rekap-stat-icon-wrap icon-wrap-pendapatan">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                  </div>
                  <span className="rekap-stat-label">Pendapatan</span>
                  <div className="rekap-stat-value value-pendapatan">
                    {formatRupiah(rekapData.stats.pendapatan)}
                  </div>
                  <span className="rekap-stat-desc">Dari tiket lunas & hadir</span>
                </div>

                {/* 4. Jumlah Hadir */}
                <div className="rekap-stat-card" id="card-stat-hadir">
                  <div className="rekap-stat-icon-wrap icon-wrap-hadir">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <span className="rekap-stat-label">Jumlah Hadir</span>
                  <div className="rekap-stat-value">{rekapData.stats.jumlahHadir}</div>
                  <span className="rekap-stat-desc">
                    {rekapData.stats.tiketTerjual > 0
                      ? `${Math.round(
                          (rekapData.stats.jumlahHadir / rekapData.stats.tiketTerjual) * 100
                        )}% check-in kehadiran`
                      : 'Belum ada check-in'}
                  </span>
                </div>
              </div>

              {/* Rincian Status Transaksi (Breakdown Status) */}
              <div className="rekap-breakdown-card" id="rekap-breakdown-card">
                <div className="rekap-section-header">
                  <h2 className="rekap-section-title">Rincian Status Pembayaran</h2>
                  <span className="rekap-section-count">
                    {rekapData.stats.totalTransaksi} Pesanan
                  </span>
                </div>

                <div className="rekap-breakdown-list">
                  {/* Hadir */}
                  <div className="rekap-breakdown-item breakdown-hadir">
                    <div className="breakdown-item-left">
                      <div className="breakdown-dot dot-hadir"></div>
                      <div>
                        <div className="breakdown-item-name">Hadir (Check-in)</div>
                        <div className="breakdown-item-qty">
                          {rekapData.stats.breakdown.hadir.transaksi} transaksi (
                          {rekapData.stats.breakdown.hadir.tiket} tiket)
                        </div>
                      </div>
                    </div>
                    <div className="breakdown-item-right">
                      <span className="breakdown-item-total">
                        {formatRupiah(rekapData.stats.breakdown.hadir.total)}
                      </span>
                      <span className="breakdown-item-note">Masuk pendapatan</span>
                    </div>
                  </div>

                  {/* Lunas */}
                  <div className="rekap-breakdown-item breakdown-lunas">
                    <div className="breakdown-item-left">
                      <div className="breakdown-dot dot-lunas"></div>
                      <div>
                        <div className="breakdown-item-name">Lunas (Belum Hadir)</div>
                        <div className="breakdown-item-qty">
                          {rekapData.stats.breakdown.lunas.transaksi} transaksi (
                          {rekapData.stats.breakdown.lunas.tiket} tiket)
                        </div>
                      </div>
                    </div>
                    <div className="breakdown-item-right">
                      <span className="breakdown-item-total">
                        {formatRupiah(rekapData.stats.breakdown.lunas.total)}
                      </span>
                      <span className="breakdown-item-note">Masuk pendapatan</span>
                    </div>
                  </div>

                  {/* Menunggu Bayar */}
                  <div className="rekap-breakdown-item breakdown-menunggu">
                    <div className="breakdown-item-left">
                      <div className="breakdown-dot dot-menunggu"></div>
                      <div>
                        <div className="breakdown-item-name">Menunggu Bayar</div>
                        <div className="breakdown-item-qty">
                          {rekapData.stats.breakdown.menunggu_bayar.transaksi} transaksi (
                          {rekapData.stats.breakdown.menunggu_bayar.tiket} tiket)
                        </div>
                      </div>
                    </div>
                    <div className="breakdown-item-right">
                      <span className="breakdown-item-total">
                        {formatRupiah(rekapData.stats.breakdown.menunggu_bayar.total)}
                      </span>
                      <span className="breakdown-item-note">Belum dihitung</span>
                    </div>
                  </div>

                  {/* Dibatalkan */}
                  <div className="rekap-breakdown-item breakdown-dibatalkan">
                    <div className="breakdown-item-left">
                      <div className="breakdown-dot dot-dibatalkan"></div>
                      <div>
                        <div className="breakdown-item-name">Dibatalkan</div>
                        <div className="breakdown-item-qty">
                          {rekapData.stats.breakdown.dibatalkan.transaksi} transaksi (
                          {rekapData.stats.breakdown.dibatalkan.tiket} tiket)
                        </div>
                      </div>
                    </div>
                    <div className="breakdown-item-right">
                      <span className="breakdown-item-total">
                        {formatRupiah(rekapData.stats.breakdown.dibatalkan.total)}
                      </span>
                      <span className="breakdown-item-note">Batal / kembali</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daftar Transaksi Tiket untuk Event Terpilih */}
              <div className="rekap-tiket-list-wrap" id="rekap-tiket-list-wrap">
                <div className="rekap-section-header">
                  <h2 className="rekap-section-title">Riwayat Tiket Event Ini</h2>
                  <span className="rekap-section-count">
                    {rekapData.tiketList.length} Pembeli
                  </span>
                </div>

                <div className="rekap-tiket-items">
                  {rekapData.tiketList.map((t) => (
                    <div key={t.id} className="rekap-tiket-item" id={`rekap-tiket-${t.id}`}>
                      <div className="rekap-tiket-info-main">
                        <span className="rekap-tiket-pembeli">{t.nama_pembeli}</span>
                        <div className="rekap-tiket-sub">
                          <span>{t.jumlah_tiket} tiket</span>
                          <span>•</span>
                          <span>{t.pembeli_id}</span>
                        </div>
                      </div>
                      <div className="rekap-tiket-amount-box">
                        <span className="rekap-tiket-total">{formatRupiah(t.total)}</span>
                        {getStatusBadge(t.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
