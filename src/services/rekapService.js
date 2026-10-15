import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase.js'

function getLocalEventById(eventId) {
  try {
    const raw = localStorage.getItem('karsa_tiket_event')
    const list = raw ? JSON.parse(raw) : []
    return list.find((e) => e.id === eventId) || null
  } catch {
    return null
  }
}

function getLocalTiketByEventId(eventId) {
  try {
    const raw = localStorage.getItem('karsa_tiket_transaksi')
    const list = raw ? JSON.parse(raw) : []
    return list.filter((t) => t.event_id === eventId)
  } catch {
    return []
  }
}

/**
 * Mengambil data rekap untuk event tertentu sesuai PRD 5.4:
 * - Read getDoc(doc(db, "event", eventId))
 * - Read getDocs(query(collection(db, "tiket"), where("event_id", "==", eventId)))
 *
 * Menghitung:
 * - tiket terjual
 * - sisa kuota (kuota - tiket_terjual)
 * - pendapatan (hanya dari tiket berstatus 'lunas' dan 'hadir', 'menunggu_bayar' dan 'dibatalkan' diabaikan)
 * - jumlah hadir (dari tiket berstatus 'hadir')
 * - rincian per status
 */
export async function getRekapData(eventId) {
  if (!eventId) {
    throw new Error('ID event wajib diisi.')
  }

  let event = null
  let tiketList = []

  if (isFirebaseConfigured) {
    try {
      // 1. Ambil data event dari Firestore
      const eventDocRef = doc(db, 'event', eventId)
      const eventSnap = await getDoc(eventDocRef)
      if (eventSnap.exists()) {
        const data = eventSnap.data()
        event = {
          id: eventSnap.id,
          nama: data.nama,
          tanggal: data.tanggal,
          lokasi: data.lokasi,
          harga_tiket: Number(data.harga_tiket || 0),
          kuota: Number(data.kuota || 0),
          tiket_terjual: Number(data.tiket_terjual || 0),
          dibuat_pada: data.dibuat_pada?.toDate ? data.dibuat_pada.toDate().toISOString() : data.dibuat_pada
        }
      }

      // 2. Ambil data tiket sesuai event_id dari Firestore
      const q = query(collection(db, 'tiket'), where('event_id', '==', eventId))
      const tiketSnap = await getDocs(q)
      tiketList = tiketSnap.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          event_id: data.event_id,
          nama_event: data.nama_event,
          tanggal_event: data.tanggal_event,
          pembeli_id: data.pembeli_id,
          nama_pembeli: data.nama_pembeli,
          harga_tiket: Number(data.harga_tiket || 0),
          jumlah_tiket: Number(data.jumlah_tiket || 0),
          total: Number(data.total || 0),
          status: data.status,
          dibuat_pada: data.dibuat_pada?.toDate ? data.dibuat_pada.toDate().toISOString() : data.dibuat_pada
        }
      })
    } catch (err) {
      console.warn('Gagal membaca Firestore rekap, beralih ke cache lokal:', err)
      event = getLocalEventById(eventId)
      tiketList = getLocalTiketByEventId(eventId)
    }
  } else {
    event = getLocalEventById(eventId)
    tiketList = getLocalTiketByEventId(eventId)
  }

  // Fallback jika event tidak ditemukan di Firestore tapi ada di local
  if (!event) {
    event = getLocalEventById(eventId)
  }

  // Jika tetap tidak ditemukan
  if (!event) {
    throw new Error('Event yang dipilih tidak ditemukan.')
  }

  // Urutkan tiketList berdasarkan dibuat_pada descending
  tiketList.sort((a, b) => {
    const timeA = new Date(a.dibuat_pada || 0).getTime()
    const timeB = new Date(b.dibuat_pada || 0).getTime()
    return timeB - timeA
  })

  const kuota = Number(event.kuota || 0)
  const tiketTerjual = Number(event.tiket_terjual || 0)
  const sisaKuota = Math.max(0, kuota - tiketTerjual)
  const persentaseTerjual = kuota > 0 ? Math.min(100, Math.round((tiketTerjual / kuota) * 100)) : 0

  // AC 2: Pendapatan hanya dihitung dari status 'lunas' dan 'hadir'
  // Status 'menunggu_bayar' dan 'dibatalkan' tidak ikut dihitung
  const tiketLunasHadir = tiketList.filter((t) => t.status === 'lunas' || t.status === 'hadir')
  const pendapatan = tiketLunasHadir.reduce((acc, t) => acc + Number(t.total || 0), 0)

  // AC 1: Jumlah hadir dihitung dari tiket dengan status 'hadir'
  const tiketHadir = tiketList.filter((t) => t.status === 'hadir')
  const jumlahHadir = tiketHadir.reduce((acc, t) => acc + Number(t.jumlah_tiket || 0), 0)

  // Breakdown status transaksi
  const breakdown = {
    menunggu_bayar: {
      transaksi: 0,
      tiket: 0,
      total: 0
    },
    lunas: {
      transaksi: 0,
      tiket: 0,
      total: 0
    },
    hadir: {
      transaksi: 0,
      tiket: 0,
      total: 0
    },
    dibatalkan: {
      transaksi: 0,
      tiket: 0,
      total: 0
    }
  }

  tiketList.forEach((t) => {
    const st = t.status
    if (breakdown[st]) {
      breakdown[st].transaksi += 1
      breakdown[st].tiket += Number(t.jumlah_tiket || 0)
      breakdown[st].total += Number(t.total || 0)
    }
  })

  return {
    event,
    stats: {
      kuota,
      tiketTerjual,
      sisaKuota,
      persentaseTerjual,
      pendapatan,
      jumlahHadir,
      totalTransaksi: tiketList.length,
      breakdown
    },
    tiketList
  }
}
