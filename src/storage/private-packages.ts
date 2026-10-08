import { preparePrivateImport, type StoredPrivatePackage } from '../domain/private-packages.ts';

// Separate database: importing content never upgrades/replaces the progress DB.
const NAME = 'ege-private-learning-packages', STORE = 'packages';
let database: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); database = undefined; };
      resolve(db);
    };
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => { database = undefined; reject(new Error('Закрой другие окна приложения перед импортом личного пакета.')); };
  });
  return database;
}
export async function importPrivatePackage(json: string): Promise<StoredPrivatePackage> {
  const pack = preparePrivateImport(json); // Validate before opening any transaction.
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).add(pack); // Duplicate ID fails; never silently replace.
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('Личный пакет не сохранён.'));
  });
  return pack;
}
export async function loadPrivatePackages(): Promise<StoredPrivatePackage[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as StoredPrivatePackage[]);
    request.onerror = () => reject(request.error);
  });
}
