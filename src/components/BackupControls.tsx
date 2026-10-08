import { useRef, useState, type ChangeEvent } from 'react';
import { MAX_BACKUP_BYTES, parseBackup, serializeBackup, type ProgressBackup } from '../domain/backup';
import { useStudy } from '../state/StudyProvider';
import { Button, Modal } from './ui';

function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `ege-progress-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function BackupControls() {
  const { state, ready, saving, replacing, storageError, flush, replaceProgress } = useStudy();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ProgressBackup | null>(null), [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function exportData() {
    setBusy(true); setMessage('');
    try { download(serializeBackup(await flush())); setMessage('Резервная копия подготовлена. Сохрани JSON вне данных браузера.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось подготовить резервную копию. Прогресс не изменён.'); }
    finally { setBusy(false); }
  }
  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setBusy(true); setMessage(''); setPending(null); setAcknowledged(false);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Файл больше 20 МБ. Текущий прогресс не изменён.');
      setPending(parseBackup(await file.text()));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Файл не удалось прочитать. Прогресс не изменён.'); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!pending || !acknowledged) return;
    setBusy(true); setMessage('');
    try { await replaceProgress(pending.data); setPending(null); setAcknowledged(false); setMessage('Данные восстановлены из резервной копии. Они сохранены на этом устройстве.'); }
    catch { setMessage('Не удалось сохранить импорт. Текущий прогресс не изменён.'); }
    finally { setBusy(false); }
  }
  return <><p>Экспорт сохраняет попытки, ошибки, заметки, повторения, историю занятий, настройки и черновики программных заданий. Учебный комплект в этот файл не входит.</p><div className="button-row"><Button variant="outline" disabled={!ready || busy || replacing} onClick={() => void exportData()}>Экспортировать JSON</Button><Button variant="outline" disabled={!ready || busy || replacing || Boolean(storageError)} onClick={() => fileInput.current?.click()}>Импортировать JSON</Button><input ref={fileInput} hidden type="file" accept=".json,application/json" aria-label="Файл резервной копии" className="visually-hidden" onChange={event => void selectFile(event)}/></div><p className="small muted">Очистка данных сайта или работа в инкогнито может привести к потере прогресса. Храни резервную копию отдельно. Облачной синхронизации нет.</p><p className="small muted" role="status">{storageError ? 'Сохранение требует внимания: ' + storageError : saving || replacing ? 'Сохраняем изменения…' : 'Изменения занятий сохранены в IndexedDB на этом устройстве.'}</p>{message && <p className="backup-message" role="status">{message}</p>}{pending && <Modal title="Заменить текущий прогресс?" close={() => { if (!busy && !replacing) setPending(null); }}><p>Файл проверен. В нём: <b>{pending.data.attempts.length} попыток</b>, <b>{pending.data.errors.length} ошибок</b> и <b>{Object.keys(pending.data.topics).length} тем с данными</b>.</p><p>Перед импортом закрой другие вкладки и окна приложения. Импорт полностью заменит нынешние попытки ({state.attempts.length}), ошибки ({state.errors.length}), заметки, повторения, историю, настройки и черновики заданий. В старых backup черновиков нет: при импорте они тоже будут заменены. Отдельная песочница сохраняется отдельно. Учебные материалы не изменятся.</p><p className="small muted">Перед заменой прежний прогресс будет сохранён отдельной записью в локальной базе. Для независимой резервной копии сначала экспортируй текущие данные.</p><Button variant="outline" disabled={busy || replacing} onClick={() => void exportData()}>Сначала экспортировать текущие данные</Button><label className="import-confirmation"><input type="checkbox" checked={acknowledged} disabled={busy || replacing} onChange={event => setAcknowledged(event.target.checked)}/>Понимаю, что импорт заменит текущий прогресс</label><div className="button-row"><Button disabled={!acknowledged || busy || replacing} onClick={() => void confirm()}>{replacing ? 'Сохраняем…' : 'Заменить данные'}</Button><Button variant="outline" disabled={busy || replacing} onClick={() => setPending(null)}>Отмена</Button></div></Modal>}</>;
}
