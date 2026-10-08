import { usePwa } from '../pwa/PwaProvider';
import { Button } from './ui';

export function NetworkStatus() {
  const { online, phase } = usePwa();
  return <span className="network-status" title={phase === 'ready' ? 'Учебный комплект сохранён. Можно заниматься без интернета.' : 'Состояние подключения устройства'}><span aria-hidden="true" className={online ? 'network-dot' : 'network-dot offline'}/>{online ? 'Онлайн' : 'Офлайн'}</span>;
}
export function PwaNotice() {
  const { phase, updateWaiting, retry } = usePwa();
  if (updateWaiting || phase === 'reload-required') return <div className="pwa-notice" role="status">Новая версия готова. Заверши занятие и закрой все вкладки и окна приложения. При следующем открытии включится обновление; прогресс сохранится.</div>;
  if (phase === 'preparing') return <div className="pwa-notice" role="status">Сохраняем полный учебный комплект для занятий без интернета…</div>;
  if (phase === 'error') return <div className="pwa-notice" role="status"><span>Полный комплект ещё не подготовлен для офлайн-запуска. При подключении к сети попробуй ещё раз.</span><Button variant="outline" onClick={retry}>Повторить подготовку</Button></div>;
  return null;
}
