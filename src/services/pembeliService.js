import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase.js'

const LOCAL_STORAGE_KEY = 'karsa_tiket_pembeli'

// Data contoh dari Skema-Firestore-Karsa-Tiket.docx
export const SAMPLE_PEMBELI_DATA = {
  nama: 'Nadia Putri',
  no_whatsapp: '081355512345',
  email: 'nadia.putri@contoh.id'
}

function getLocalPembeli() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalPembeli(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Gagal menyimpan cache pembeli:', err)
  }
}

/**
 * Validasi input data pembeli sesuai Skema & PRD:
 * - nama: 1 - 60 karakter
 * - no_whatsapp: diawali 08, panjang 10 sampai 13 angka
 * - email: mengandung @ dan maksimal 80 karakter
 */
export function validatePembeliInput({ nama, no_whatsapp, email }) {
  const errors = {}

  if (!nama || typeof nama !== 'string' || nama.trim().length < 1 || nama.trim().length > 60) {
    errors.nama = 'Nama pembeli wajib diisi (1 sampai 60 karakter).'
  }

  const phoneRegex = /^08\d{8,11}$/
  if (!no_whatsapp || !phoneRegex.test(no_whatsapp.trim())) {
    errors.no_whatsapp = 'Nomor WhatsApp harus diawali 08 dengan 10 sampai 13 digit angka.'
  }

  if (!email || !email.includes('@') || email.length > 80) {
    errors.email = 'Email wajib mengandung tanda @ dan maksimal 80 karakter.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Mengambil daftar pembeli dari Firestore dibatasi limit(20)
 * Query: getDocs(query(collection(db, "pembeli"), orderBy("nama"), limit(20)))
 */
export async function getPembeli() {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'pembeli'), orderBy('nama'), limit(20))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          nama: data.nama,
          no_whatsapp: data.no_whatsapp,
          email: data.email,
          dibuat_pada: data.dibuat_pada?.toDate ? data.dibuat_pada.toDate().toISOString() : data.dibuat_pada
        }
      })
      saveLocalPembeli(list)
      return list
    } catch (err) {
      console.warn('Gagal membaca Firestore pembeli, beralih ke cache lokal:', err)
      return getLocalPembeli()
    }
  }

  return getLocalPembeli()
}

/**
 * Menyimpan data pembeli baru ke Firestore
 * Memeriksa nomor WhatsApp unik dengan getDoc sesuai PRD 5.2 & Skema Bagian 4
 */
export async function createPembeli(formData) {
  const validation = validatePembeliInput(formData)
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0]
    throw new Error(firstError)
  }

  const cleanNoWhatsapp = formData.no_whatsapp.trim()
  const payload = {
    nama: formData.nama.trim(),
    no_whatsapp: cleanNoWhatsapp,
    email: formData.email.trim(),
    dibuat_pada: serverTimestamp()
  }

  if (isFirebaseConfigured) {
    try {
      // Periksa apakah nomor WhatsApp sudah terdaftar
      const docRef = doc(db, 'pembeli', cleanNoWhatsapp)
      const existingSnap = await getDoc(docRef)
      if (existingSnap.exists()) {
        throw new Error('Nomor WhatsApp sudah terdaftar')
      }

      await setDoc(docRef, payload)
      const newPembeli = {
        id: cleanNoWhatsapp,
        ...payload,
        dibuat_pada: new Date().toISOString()
      }
      const local = getLocalPembeli()
      saveLocalPembeli([newPembeli, ...local.filter((p) => p.no_whatsapp !== cleanNoWhatsapp)])
      return newPembeli
    } catch (err) {
      if (err.message === 'Nomor WhatsApp sudah terdaftar') {
        throw err
      }
      console.warn('Gagal simpan online, simpan lokal:', err)
      const local = getLocalPembeli()
      if (local.some((p) => p.no_whatsapp === cleanNoWhatsapp)) {
        throw new Error('Nomor WhatsApp sudah terdaftar')
      }
      const newPembeli = {
        id: cleanNoWhatsapp,
        ...payload,
        dibuat_pada: new Date().toISOString()
      }
      saveLocalPembeli([newPembeli, ...local])
      return newPembeli
    }
  } else {
    const local = getLocalPembeli()
    if (local.some((p) => p.no_whatsapp === cleanNoWhatsapp)) {
      throw new Error('Nomor WhatsApp sudah terdaftar')
    }
    const newPembeli = {
      id: cleanNoWhatsapp,
      ...payload,
      dibuat_pada: new Date().toISOString()
    }
    saveLocalPembeli([newPembeli, ...local])
    return newPembeli
  }
}

/**
 * Memperbarui data pembeli di Firestore (updateDoc)
 */
export async function updatePembeli(no_whatsapp, formData) {
  const validation = validatePembeliInput({ ...formData, no_whatsapp })
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0]
    throw new Error(firstError)
  }

  const payload = {
    nama: formData.nama.trim(),
    email: formData.email.trim()
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'pembeli', no_whatsapp)
      await updateDoc(docRef, payload)
    } catch (err) {
      console.warn('Gagal update pembeli di Firestore:', err)
    }
  }

  const local = getLocalPembeli()
  const updated = local.map((p) => (p.no_whatsapp === no_whatsapp ? { ...p, ...payload } : p))
  saveLocalPembeli(updated)
  return { id: no_whatsapp, no_whatsapp, ...payload }
}

/**
 * Menghapus data pembeli di Firestore (deleteDoc)
 */
export async function deletePembeli(no_whatsapp) {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'pembeli', no_whatsapp)
      await deleteDoc(docRef)
    } catch (err) {
      console.warn('Gagal hapus pembeli di Firestore:', err)
    }
  }

  const local = getLocalPembeli()
  const filtered = local.filter((p) => p.no_whatsapp !== no_whatsapp)
  saveLocalPembeli(filtered)
  return true
}

/**
 * Seed data contoh pembeli dari skema
 */
export async function seedSamplePembeli() {
  return createPembeli(SAMPLE_PEMBELI_DATA)
}
