import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { contentVersion } from '../data/catalog';
import { emptyState } from '../domain/progress';
import { validateStudyState } from '../domain/backup';
import type { StudyState } from '../domain/types';
import { repository } from '../storage/repository';

type Store = { state: StudyState; ready: boolean; storageError: string; saving: boolean; replacing: boolean; mutate: (update: (previous: StudyState) => StudyState) => void; flush: () => Promise<StudyState>; replaceProgress: (state: StudyState) => Promise<void> };
const StudyContext = createContext<Store | null>(null);
export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => emptyState(contentVersion));
  const [ready, setReady] = useState(false), [storageError, setError] = useState(''), [saving, setSaving] = useState(false), [replacing, setReplacing] = useState(false);
  const current = useRef(state), loaded = useRef(false), saveQueue = useRef(Promise.resolve());
  const loadFailed = useRef(false), lock = useRef(false), pending = useRef(0), unsaved = useRef(false);
  useEffect(() => {
    let cancelled = false;
    repository.load().then(saved => { if (!cancelled) { if (saved) { current.current = saved; setState(saved); } loaded.current = true; setReady(true); } }).catch(error => {
      if (!cancelled) { loadFailed.current = true; setError(String(error instanceof Error ? error.message : error)); setReady(true); }
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', state.settings.theme === 'dark'); }, [state.settings.theme]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (pending.current || unsaved.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', unload); return () => window.removeEventListener('beforeunload', unload);
  }, []);
  function persist(next: StudyState) {
    pending.current++; setSaving(true);
    saveQueue.current = saveQueue.current.then(async () => {
      try { await repository.save(next); unsaved.current = false; setError(''); }
      catch { unsaved.current = true; setError('Не удалось сохранить изменения на устройстве. Данные занятия пока находятся только в открытой вкладке. Сделай экспорт резервной копии.'); }
      finally { pending.current--; setSaving(pending.current > 0); }
    });
  }
  const mutate = (update: (previous: StudyState) => StudyState) => {
    if (!loaded.current || loadFailed.current || lock.current) return;
    const next = { ...update(current.current), contentVersion, updatedAt: new Date().toISOString() };
    current.current = next; setState(next); persist(next);
  };
  const flush = async () => {
    if (!loaded.current || loadFailed.current) throw new Error('Локальное сохранение ещё не прочитано. Экспорт не выполнен, исходные данные не изменены.');
    await saveQueue.current; return current.current;
  };
  const replaceProgress = async (input: StudyState) => {
    if (!loaded.current || loadFailed.current || lock.current) throw new Error('Сначала дождись открытия локального хранилища.');
    const next = validateStudyState(JSON.parse(JSON.stringify(input)));
    lock.current = true; setReplacing(true);
    try {
      await saveQueue.current;
      // Import commits in one transaction; UI changes only after successful persistence.
      await repository.replace(next, current.current);
      current.current = next; setState(next); unsaved.current = false; setError('');
    } finally { lock.current = false; setReplacing(false); }
  };
  return <StudyContext.Provider value={{ state, ready, storageError, saving, replacing, mutate, flush, replaceProgress }}>{children}</StudyContext.Provider>;
}
export function useStudy() { const store = useContext(StudyContext); if (!store) throw new Error('StudyProvider missing'); return store; }
