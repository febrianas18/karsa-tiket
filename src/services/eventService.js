import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase.js'

const LOCAL_STORAGE_KEY = 'karsa_tiket_event'

// Data contoh dari Skema-Firestore-Karsa-Tiket.docx
export const SAMPLE_EVENT_DATA = {
  nama: 'Workshop Sablon Tote Bag',
  tanggal: '2026-10-18',
  lokasi: 'Ruang Karsa, Jl. Merdeka No. 21',
  harga_tiket: 75000,
  kuota: 30,
  tiket_terjual: 2
}

// Helper membaca cache lokal
function getLocalEvents() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Helper menyimpan cache lokal
function saveLocalEvents(events) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events))
  } catch (err) {
    console.error('Gagal menyimpan cache lokal:', err)
  }
}

/**
 * Validasi data event sesuai Skema Firestore & PRD:
 * - nama: 1 - 60 karakter
 * - tanggal: format YYYY-MM-DD
 * - lokasi: 1 - 100 karakter
 * - harga_tiket: angka bulat >= 0
 * - kuota: angka bulat 1 - 500
 */
export function validateEventInput({ nama, tanggal, lokasi, harga_tiket, kuota }) {
  const errors = {}

  if (!nama || typeof nama !== 'string' || nama.trim().length < 1 || nama.trim().length > 60) {
    errors.nama = 'Nama acara wajib diisi (1 sampai 60 karakter).'
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!tanggal || !dateRegex.test(tanggal)) {
    errors.tanggal = 'Tanggal acara wajib berformat YYYY-MM-DD.'
  }

  if (!lokasi || typeof lokasi !== 'string' || lokasi.trim().length < 1 || lokasi.trim().length > 100) {
    errors.lokasi = 'Lokasi acara wajib diisi (1 sampai 100 karakter).'
  }

  const parsedHarga = Number(harga_tiket)
  if (isNaN(parsedHarga) || parsedHarga < 0 || !Number.isInteger(parsedHarga)) {
    errors.harga_tiket = 'Harga tiket harus berupa angka bulat minimal 0.'
  }

  const parsedKuota = Number(kuota)
  if (isNaN(parsedKuota) || parsedKuota < 1 || parsedKuota > 500 || !Number.isInteger(parsedKuota)) {
    errors.kuota = 'Kuota harus berupa angka bulat antara 1 sampai 500.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Mengambil daftar event dari Firestore (query ordered by tanggal, limit 20)
 * Fallback otomatis ke LocalStorage jika offline
 */
export async function getEvents() {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'event'), orderBy('tanggal'), limit(20))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          nama: data.nama,
          tanggal: data.tanggal,
          lokasi: data.lokasi,
          harga_tiket: Number(data.harga_tiket || 0),
          kuota: Number(data.kuota || 0),
          tiket_terjual: Number(data.tiket_terjual || 0),
          dibuat_pada: data.dibuat_pada?.toDate ? data.dibuat_pada.toDate().toISOString() : data.dibuat_pada
        }
      })
      saveLocalEvents(list)
      return list
    } catch (err) {
      console.warn('Gagal membaca Firestore, beralih ke cache lokal:', err)
      return getLocalEvents()
    }
  }

  return getLocalEvents()
}

/**
 * Menyimpan event baru ke Firestore (addDoc)
 * Field persis sesuai skema: nama, tanggal, lokasi, harga_tiket, kuota, tiket_terjual (0), dibuat_pada
 */
export async function createEvent(formData) {
  const validation = validateEventInput(formData)
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0]
    throw new Error(firstError)
  }

  const payload = {
    nama: formData.nama.trim(),
    tanggal: formData.tanggal,
    lokasi: formData.lokasi.trim(),
    harga_tiket: Math.round(Number(formData.harga_tiket)),
    kuota: Math.round(Number(formData.kuota)),
    tiket_terjual: 0,
    dibuat_pada: serverTimestamp()
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'event'), payload)
      const newEvent = {
        id: docRef.id,
        ...payload,
        dibuat_pada: new Date().toISOString()
      }
      const local = getLocalEvents()
      saveLocalEvents([newEvent, ...local])
      return newEvent
    } catch (err) {
      console.warn('Gagal menyimpan ke Firestore online, menyimpan ke cache lokal:', err)
      const fallbackEvent = {
        id: 'local_' + Date.now(),
        ...payload,
        dibuat_pada: new Date().toISOString()
      }
      const local = getLocalEvents()
      saveLocalEvents([fallbackEvent, ...local])
      return fallbackEvent
    }
  } else {
    const fallbackEvent = {
      id: 'local_' + Date.now(),
      ...payload,
      dibuat_pada: new Date().toISOString()
    }
    const local = getLocalEvents()
    saveLocalEvents([fallbackEvent, ...local])
    return fallbackEvent
  }
}

/**
 * Memperbarui data event di Firestore (updateDoc)
 * AC 4: Kuota tidak boleh lebih kecil dari tiket terjual
 */
export async function updateEvent(id, formData, currentTiketTerjual = 0) {
  const validation = validateEventInput(formData)
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0]
    throw new Error(firstError)
  }

  const parsedKuota = Math.round(Number(formData.kuota))
  if (parsedKuota < Number(currentTiketTerjual)) {
    throw new Error(`Kuota tidak boleh lebih kecil dari tiket terjual (${currentTiketTerjual} tiket).`)
  }

  const payload = {
    nama: formData.nama.trim(),
    tanggal: formData.tanggal,
    lokasi: formData.lokasi.trim(),
    harga_tiket: Math.round(Number(formData.harga_tiket)),
    kuota: parsedKuota
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'event', id)
      await updateDoc(docRef, payload)
    } catch (err) {
      console.warn('Gagal memperbarui di Firestore online, memperbarui cache lokal:', err)
    }
  }

  const local = getLocalEvents()
  const updated = local.map((ev) => (ev.id === id ? { ...ev, ...payload } : ev))
  saveLocalEvents(updated)
  return { id, ...payload, tiket_terjual: currentTiketTerjual }
}

/**
 * Menghapus event dari Firestore (deleteDoc)
 */
export async function deleteEvent(id) {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'event', id)
      await deleteDoc(docRef)
    } catch (err) {
      console.warn('Gagal menghapus di Firestore online, menghapus cache lokal:', err)
    }
  }

  const local = getLocalEvents()
  const filtered = local.filter((ev) => ev.id !== id)
  saveLocalEvents(filtered)
  return true
}

/**
 * Menambahkan data contoh dari skema ke Firestore
 */
export async function seedSampleEvent() {
  const payload = {
    ...SAMPLE_EVENT_DATA,
    dibuat_pada: serverTimestamp()
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'event'), payload)
      const seeded = {
        id: docRef.id,
        ...payload,
        dibuat_pada: new Date().toISOString()
      }
      const local = getLocalEvents()
      saveLocalEvents([seeded, ...local])
      return seeded
    } catch (err) {
      console.warn('Gagal seed ke Firestore, menggunakan penyimpanan lokal:', err)
    }
  }

  const seededLocal = {
    id: 'sample_Ev27dKm',
    ...payload,
    dibuat_pada: new Date().toISOString()
  }
  const local = getLocalEvents()
  saveLocalEvents([seededLocal, ...local])
  return seededLocal
}
