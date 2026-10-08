import { intervals } from '../data/catalog';
import { addDays, formatDate } from '../domain/progress';
import { useStudy } from '../state/StudyProvider';
import { Button } from './ui';

export function Schedule({ topic }: { topic: string }) {
  const { state, mutate } = useStudy(), due = state.reviews[`topic:${topic}`]?.due;
  return <div className="schedule"><p>Когда вернуться к этому? {due && <span className="muted">Запланировано: {formatDate(due)}</span>}</p><div className="button-row">{intervals.map((days, stage) => <Button key={days} variant={due === addDays(days) ? 'secondary' : 'outline'} onClick={() => mutate(previous => ({ ...previous, reviews: { ...previous.reviews, [`topic:${topic}`]: { id: `topic:${topic}`, targetType: 'topic', targetId: topic, due: addDays(days), stage } } }))}>{days === 1 ? 'Завтра' : `Через ${days} дн.`}</Button>)}</div></div>;
}
