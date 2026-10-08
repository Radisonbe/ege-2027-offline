import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { contentVersion } from '../data/catalog';
import { emptyState } from '../domain/progress';
import type { StudyState } from '../domain/types';
import { repository } from '../storage/repository';

type Store = { state: StudyState; ready: boolean; storageError: string; saving: boolean; mutate: (update: (previous: StudyState) => StudyState) => void };
const StudyContext = createContext<Store | null>(null);
export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => emptyState(contentVersion));
  const [ready, setReady] = useState(false), [storageError, setError] = useState(''), [saving, setSaving] = useState(false);
  const loaded = useRef(false), dirty = useRef(false), saveQueue = useRef(Promise.resolve());
  const loadFailed = useRef(false);
  useEffect(() => {
    let cancelled = false;
    repository.load().then(saved => { if (!cancelled) { if (saved) setState(saved); loaded.current = true; setReady(true); } }).catch(error => {
      if (!cancelled) { loadFailed.current = true; setError(String(error instanceof Error ? error.message : error)); setReady(true); }
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
    if (!loaded.current || !dirty.current || loadFailed.current) return;
    setSaving(true);
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => repository.save(state)).then(() => setError('')).catch(() => {
      setError('Не удалось сохранить изменения на устройстве. Данные этого занятия пока находятся только в открытой вкладке.');
    }).finally(() => setSaving(false));
  }, [state]);
  const mutate = (update: (previous: StudyState) => StudyState) => {
    if (!ready || loadFailed.current) return;
    dirty.current = true;
    setState(previous => ({ ...update(previous), contentVersion, updatedAt: new Date().toISOString() }));
  };
  return <StudyContext.Provider value={{ state, ready, storageError, saving, mutate }}>{children}</StudyContext.Provider>;
}
export function useStudy() { const store = useContext(StudyContext); if (!store) throw new Error('StudyProvider missing'); return store; }
