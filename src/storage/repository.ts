import type { StudyState } from '../domain/types';
import { validateStudyState } from '../domain/backup';

// Versioned, atomic document for the first iteration. Static content lives separately.
// The interface also supports a later indexed collection implementation without UI changes.
export interface ProgressRepository { load(): Promise<StudyState | undefined>; save(state: StudyState): Promise<void>; replace(state: StudyState, previous: StudyState): Promise<void> }
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
      const transaction = db.transaction(STORE, 'readwrite'), store = transaction.objectStore(STORE), request = store.get('current');
      let result: StudyState | undefined;
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Миграция не завершена. Исходное сохранение не изменено.'));
      request.onsuccess = () => {
        const state = request.result;
        try {
          result = state ? validateStudyState(state) : undefined;
          if (state?.schemaVersion === 1) {
            // Original document and the migrated version commit together, or neither does.
            store.add(state, `before-migration:1-2:${new Date().toISOString()}:${crypto.randomUUID()}`);
            store.put(result, 'current');
          }
        } catch { transaction.abort(); reject(new Error('Локальное сохранение имеет неподдерживаемую структуру. Оно не перезаписано.')); }
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
  async replace(state, previous) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite'), store = transaction.objectStore(STORE);
      // Unique rollback copy and replacement are committed together, or neither is committed.
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Импорт не завершён'));
      try {
        store.add(previous, `before-import:${new Date().toISOString()}:${crypto.randomUUID()}`);
        store.put(state, 'current');
      } catch (error) { transaction.abort(); reject(error); }
    });
  },
};
