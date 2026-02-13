/**
 * Offline Storage Manager
 * Provides unified interface for localStorage and IndexedDB
 * Uses localStorage for small data (<5MB) and IndexedDB for large datasets
 */

const DB_NAME = 'butterfly_offline';
const DB_VERSION = 1;
const STORES = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  MESSAGES: 'messages',
  CUSTOMERS: 'customers',
  QUEUE: 'queue',
  CACHE: 'cache',
};

/**
 * Initialize IndexedDB database
 */
let dbInstance: IDBDatabase | null = null;

export async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        const orderStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
        orderStore.createIndex('userId', 'userId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messageStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        messageStore.createIndex('productId', 'productId', { unique: false });
        messageStore.createIndex('customerId', 'customerId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        const queueStore = db.createObjectStore(STORES.QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Store data in localStorage (small data only)
 */
export function setLocalStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[localStorage] Error storing:', error);
  }
}

/**
 * Get data from localStorage
 */
export function getLocalStorage<T = any>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('[localStorage] Error retrieving:', error);
    return null;
  }
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[localStorage] Error removing:', error);
  }
}

/**
 * Store data in IndexedDB
 */
export async function setIndexedDB(
  storeName: string,
  data: any
): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get data from IndexedDB by key
 */
export async function getIndexedDB<T = any>(
  storeName: string,
  key: string | number
): Promise<T | null> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all data from IndexedDB store
 */
export async function getAllIndexedDB<T = any>(
  storeName: string
): Promise<T[]> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Query IndexedDB by index
 */
export async function queryIndexedDB<T = any>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Delete from IndexedDB
 */
export async function deleteIndexedDB(
  storeName: string,
  key: string | number
): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear entire IndexedDB store
 */
export async function clearIndexedDB(storeName: string): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Cache data with expiration
 */
export async function setCachedData(
  key: string,
  data: any,
  ttlMinutes: number = 60
): Promise<void> {
  const cacheEntry = {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  };

  // Store in both localStorage (for quick access) and IndexedDB
  setLocalStorage(`cache:${key}`, cacheEntry);
  await setIndexedDB(STORES.CACHE, cacheEntry);
}

/**
 * Get cached data if not expired
 */
export function getCachedData<T = any>(key: string): T | null {
  const cached = getLocalStorage<any>(`cache:${key}`);
  
  if (!cached) return null;
  
  if (cached.expiresAt && cached.expiresAt < Date.now()) {
    removeLocalStorage(`cache:${key}`);
    return null;
  }

  return cached.data;
}

/**
 * Export STORES for use in other modules
 */
export { STORES };
