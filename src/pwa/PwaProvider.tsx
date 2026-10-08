import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Phase = 'preparing' | 'ready' | 'error' | 'unavailable' | 'development' | 'reload-required';
interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
type PwaState = { online: boolean; phase: Phase; updateWaiting: boolean; canInstall: boolean; install: () => Promise<void>; retry: () => void };
const PwaContext = createContext<PwaState | null>(null);

function inspect(worker: ServiceWorker): Promise<Phase> {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => { channel.port1.close(); resolve('error'); }, 5000);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close();
      const build = document.querySelector('meta[name="ege-build"]')?.getAttribute('content');
      resolve(event.data?.type !== 'OFFLINE_STATUS' || event.data.ready !== true ? 'error' : event.data.build === build ? 'ready' : 'reload-required');
    };
    worker.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
  });
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [phase, setPhase] = useState<Phase>(import.meta.env.DEV ? 'development' : 'preparing');
  const [updateWaiting, setWaiting] = useState(false), [installEvent, setInstallEvent] = useState<InstallEvent | null>(null), [retryCount, setRetry] = useState(0);
  useEffect(() => {
    const network = () => setOnline(navigator.onLine);
    const available = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    const installed = () => setInstallEvent(null);
    window.addEventListener('online', network); window.addEventListener('offline', network);
    window.addEventListener('beforeinstallprompt', available); window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('online', network); window.removeEventListener('offline', network); window.removeEventListener('beforeinstallprompt', available); window.removeEventListener('appinstalled', installed); };
  }, []);
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (!('serviceWorker' in navigator) || !window.isSecureContext) { setPhase('unavailable'); return; }
    let disposed = false, registration: ServiceWorkerRegistration | undefined;
    const listeners: (() => void)[] = [];
    const verify = async () => {
      const worker = navigator.serviceWorker.controller ?? registration?.active;
      if (worker?.state === 'activated') { const phase = await inspect(worker); if (!disposed) setPhase(phase); }
      if (!disposed) setWaiting(Boolean(registration?.waiting));
    };
    const watch = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const change = () => {
        if (worker.state === 'redundant' && !registration?.active && !disposed) setPhase('error');
        void verify();
      };
      worker.addEventListener('statechange', change); listeners.push(() => worker.removeEventListener('statechange', change));
    };
    const refresh = () => { if (navigator.onLine) void registration?.update().catch(() => {}); void verify(); };
    navigator.serviceWorker.addEventListener('controllerchange', verify);
    window.addEventListener('online', refresh);
    void (async () => {
      try {
        const base = new URL(import.meta.env.BASE_URL, document.baseURI);
        registration = await navigator.serviceWorker.getRegistration(base.href) ?? await navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.pathname, updateViaCache: 'none' });
        if (disposed) return;
        const found = () => { watch(registration?.installing ?? null); };
        registration.addEventListener('updatefound', found); listeners.push(() => registration?.removeEventListener('updatefound', found));
        watch(registration.installing); watch(registration.waiting); watch(registration.active);
        await verify();
        if (navigator.onLine) void registration.update().catch(() => {});
      } catch { if (!disposed) setPhase('error'); }
    })();
    return () => { disposed = true; listeners.forEach(remove => remove()); navigator.serviceWorker.removeEventListener('controllerchange', verify); window.removeEventListener('online', refresh); };
  }, [retryCount]);
  const install = async () => { if (!installEvent || phase !== 'ready') return; await installEvent.prompt(); await installEvent.userChoice; setInstallEvent(null); };
  return <PwaContext.Provider value={{ online, phase, updateWaiting, canInstall: Boolean(installEvent) && phase === 'ready', install, retry: () => { setPhase('preparing'); setRetry(value => value + 1); } }}>{children}</PwaContext.Provider>;
}
export function usePwa() { const value = useContext(PwaContext); if (!value) throw new Error('PwaProvider missing'); return value; }
