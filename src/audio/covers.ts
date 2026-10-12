import { openDb } from './db'

const STORE = 'covers'

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = run(tx.objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function saveCover(id: string, blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(blob, id))
}

export async function loadCover(id: string): Promise<Blob | null> {
  const blob = await withStore<Blob | undefined>('readonly', (store) => store.get(id))
  return blob ?? null
}

export async function squareCover(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const size = 1080
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('cover')
  }
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  ctx.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((next) => resolve(next), 'image/jpeg', 0.86))
  if (!blob) throw new Error('cover')
  return blob
}
