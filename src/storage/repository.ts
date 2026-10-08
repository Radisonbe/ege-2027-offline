import type { StudyState } from '../domain/types';

// Versioned, atomic document for the first iteration. Static content lives separately.
// The interface also supports a later indexed collection implementation without UI changes.
export interface ProgressRepository { load(): Promise<StudyState | undefined>; save(state: StudyState): Promise<void> }
const DB_NAME = 'ege-local-center';
const STORE = 'progress';
let database: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); database = undefined; }; resolve(db); };
    request.onerror = () => reject(request.error ?? new Error('Хранилище недоступно'));
    request.onblocked = () => reject(new Error('Закрой другую вкладку приложения, чтобы открыть хранилище.'));
  });
  return database;
}
export const repository: ProgressRepository = {
  async load() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get('current');
      request.onsuccess = () => {
        const state = request.result as StudyState | undefined;
        if (state && (state.app !== 'ege-local-center' || state.schemaVersion !== 1)) { reject(new Error('Сохранение другой версии. Оно не перезаписано.')); return; }
        resolve(state);
      };
      request.onerror = () => reject(request.error);
    });
  },
  async save(state) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(state, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Сохранение не завершено'));
    });
  },
};
