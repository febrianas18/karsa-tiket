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
  increment,
  serverTimestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase.js'

const LOCAL_STORAGE_KEY = 'karsa_tiket_transaksi'

// Data contoh dari Skema-Firestore-Karsa-Tiket.docx
export const SAMPLE_TIKET_DATA = {
  event_id: 'Ev27dKm',
  nama_event: 'Workshop Sablon Tote Bag',
  tanggal_event: '2026-10-18',
  pembeli_id: '081355512345',
  nama_pembeli: 'Nadia Putri',
  harga_tiket: 75000,
  jumlah_tiket: 2,
  total: 150000,
  status: 'menunggu_bayar'
}

function getLocalTiket() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalTiket(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Gagal menyimpan cache tiket:', err)
  }
}

/**
 * Validasi pembuatan tiket baru sesuai PRD 5.3 & Tiga Aturan Nilai Skema:
 * - Aturan 2: jumlah_tiket selalu 1 sampai 5 dan tidak melebihi sisa kuota
 * - Aturan 3: total selalu sama dengan harga_tiket × jumlah_tiket
 */
export function validateTiketInput({ event, pembeli, jumlah_tiket }) {
  const errors = {}

  if (!event || !event.id) {
    errors.event = 'Pilih acara yang ingin dibeli tiketnya.'
  }

  if (!pembeli || !pembeli.no_whatsapp) {
    errors.pembeli = 'Pilih pembeli yang memesan tiket.'
  }

  const jumlah = Number(jumlah_tiket)
  if (isNaN(jumlah) || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > 5) {
    errors.jumlah_tiket = 'Jumlah tiket harus berupa angka bulat antara 1 sampai 5.'
  } else if (event) {
    const sisaKuota = Math.max(0, Number(event.kuota || 0) - Number(event.tiket_terjual || 0))
    if (jumlah > sisaKuota) {
      errors.jumlah_tiket = `Jumlah tiket melebihi sisa kuota yang tersedia (${sisaKuota} tiket tersisa).`
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Mengambil daftar tiket dari Firestore dibatasi limit(20)
 * Query: getDocs(query(collection(db, "tiket"), orderBy("dibuat_pada", "desc"), limit(20)))
 */
export async function getTiket() {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'tiket'), orderBy('dibuat_pada', 'desc'), limit(20))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((docSnap) => {
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
      saveLocalTiket(list)
      return list
    } catch (err) {
      console.warn('Gagal membaca Firestore tiket, beralih ke cache lokal:', err)
      return getLocalTiket()
    }
  }

  return getLocalTiket()
}

/**
 * Menyimpan tiket baru dengan addDoc
 * Sesuai PRD 5.3:
 * addDoc(collection(db, "tiket"), {...}) lalu updateDoc(doc(db, "event", eventId), { tiket_terjual: increment(jumlah) })
 */
export async function createTiket({ event, pembeli, jumlah_tiket }) {
  const validation = validateTiketInput({ event, pembeli, jumlah_tiket })
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0]
    throw new Error(firstError)
  }

  const jumlah = Math.round(Number(jumlah_tiket))
  const harga = Math.round(Number(event.harga_tiket || 0))
  const total = harga * jumlah

  const payload = {
    event_id: event.id,
    nama_event: event.nama,
    tanggal_event: event.tanggal,
    pembeli_id: pembeli.no_whatsapp,
    nama_pembeli: pembeli.nama,
    harga_tiket: harga,
    jumlah_tiket: jumlah,
    total: total,
    status: 'menunggu_bayar',
    dibuat_pada: serverTimestamp()
  }

  if (isFirebaseConfigured) {
    try {
      // 1. Simpan tiket baru dengan addDoc
      const docRef = await addDoc(collection(db, 'tiket'), payload)

      // 2. Tambah tiket_terjual pada event dengan increment
      try {
        const eventDocRef = doc(db, 'event', event.id)
        await updateDoc(eventDocRef, {
          tiket_terjual: increment(jumlah)
        })
      } catch (evErr) {
        console.warn('Gagal memperbarui kuota event:', evErr)
      }

      const newTiket = {
        id: docRef.id,
        ...payload,
        dibuat_pada: new Date().toISOString()
      }
      const local = getLocalTiket()
      saveLocalTiket([newTiket, ...local])
      return newTiket
    } catch (err) {
      console.warn('Gagal menyimpan ke Firestore online, menyimpan ke cache lokal:', err)
    }
  }

  const fallbackTiket = {
    id: 'local_tk_' + Date.now(),
    ...payload,
    dibuat_pada: new Date().toISOString()
  }
  const local = getLocalTiket()
  saveLocalTiket([fallbackTiket, ...local])
  return fallbackTiket
}

/**
 * Memperbarui status tiket sesuai aturan transisi status (PRD 4 & Skema 5.1):
 * - menunggu_bayar -> lunas atau dibatalkan
 * - lunas -> hadir
 * - dibatalkan: tiket_terjual event dikurangi increment(-jumlah_tiket)
 */
export async function updateTiketStatus(tiketId, newStatus, currentTiket) {
  const { status: oldStatus, event_id, jumlah_tiket } = currentTiket

  // Validasi transisi status
  if (oldStatus === 'menunggu_bayar' && (newStatus !== 'lunas' && newStatus !== 'dibatalkan')) {
    throw new Error('Status menunggu_bayar hanya boleh diubah ke "lunas" atau "dibatalkan".')
  }
  if (oldStatus === 'lunas' && newStatus !== 'hadir') {
    throw new Error('Status lunas hanya boleh diubah ke "hadir".')
  }
  if (oldStatus === 'hadir' || oldStatus === 'dibatalkan') {
    throw new Error(`Tiket dengan status "${oldStatus}" tidak dapat diubah lagi.`)
  }

  if (isFirebaseConfigured) {
    try {
      const tiketDocRef = doc(db, 'tiket', tiketId)
      await updateDoc(tiketDocRef, { status: newStatus })

      // Jika tiket dibatalkan, kurangi tiket_terjual pada event
      if (newStatus === 'dibatalkan' && event_id) {
        try {
          const eventDocRef = doc(db, 'event', event_id)
          await updateDoc(eventDocRef, {
            tiket_terjual: increment(-Number(jumlah_tiket || 0))
          })
        } catch (evErr) {
          console.warn('Gagal mengembalikan kuota event:', evErr)
        }
      }
    } catch (err) {
      console.warn('Gagal memperbarui status di Firestore:', err)
    }
  }

  const local = getLocalTiket()
  const updated = local.map((tk) => (tk.id === tiketId ? { ...tk, status: newStatus } : tk))
  saveLocalTiket(updated)
  return { ...currentTiket, status: newStatus }
}

/**
 * Menghapus tiket dari Firestore (deleteDoc)
 */
export async function deleteTiket(tiketId) {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'tiket', tiketId)
      await deleteDoc(docRef)
    } catch (err) {
      console.warn('Gagal menghapus tiket di Firestore:', err)
    }
  }

  const local = getLocalTiket()
  const filtered = local.filter((tk) => tk.id !== tiketId)
  saveLocalTiket(filtered)
  return true
}

/**
 * Seed data contoh tiket dari skema
 */
export async function seedSampleTiket() {
  const payload = {
    ...SAMPLE_TIKET_DATA,
    dibuat_pada: serverTimestamp()
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'tiket'), payload)
      return { id: docRef.id, ...payload }
    } catch (err) {
      console.warn('Gagal seed tiket online:', err)
    }
  }

  const fallback = { id: 'sample_Tk63fHs', ...payload, dibuat_pada: new Date().toISOString() }
  const local = getLocalTiket()
  saveLocalTiket([fallback, ...local])
  return fallback
}
