const DB = 'rapper-life'
const VERSION = 2

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('takes')) db.createObjectStore('takes')
      if (!db.objectStoreNames.contains('covers')) db.createObjectStore('covers')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
