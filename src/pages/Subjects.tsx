import { useState } from 'react';
import { subjects, topics } from '../data/catalog';
import { topicProgress } from '../domain/progress';
import type { SubjectId } from '../domain/types';
import { useStudy } from '../state/StudyProvider';
import { Badge, Button, Heading, Icon, Panel } from '../components/ui';

export function SubjectPage({ subjectId, go }: { subjectId: SubjectId; go: (page: string) => void }) {
  const { state } = useStudy(), [filter, setFilter] = useState('all'), subject = subjects.find(s => s.id === subjectId)!;
  const all = topics.filter(t => t.subject === subjectId), filtered = all.filter(t => filter === 'ready' ? t.materialStatus === 'ready' : filter === 'started' ? topicProgress(state, t.id).status !== 'Не изучено' : true);
  return <><Heading eyebrow="МОИ ПРЕДМЕТЫ" title={subject.title} subtitle={subject.description}/><div className="subject-overview"><span className={`subject-symbol ${subject.tone}`}>{subject.symbol}</span><div><h3>{all.filter(t => t.materialStatus === 'ready').length} {subjectId === 'python' ? 'коротких уроков' : 'готовых модуля'}</h3><p className="muted">Тем в плане: {all.length}. Статусы и заметки доступны в каждой.</p></div><select className="select-control" aria-label="Показать темы" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Все темы</option><option value="ready">С готовыми уроками</option><option value="started">Мои начатые</option></select></div><>{subjectId === 'python' && <Panel><h2>Python Playground</h2><p className="muted">Напиши и выполни программу на этом устройстве.</p><Button onClick={() => go('python-playground')}>Открыть Python Playground</Button></Panel>}</>{filtered.length ? <div className="topic-list">{filtered.map(topic => <button className="topic-row" key={topic.id} onClick={() => go(`topic/${topic.id}`)}><span className="topic-index">{String(topic.order).padStart(2, '0')}</span><span className="topic-description"><b>{topic.title}</b><span>{topic.description}</span></span><Badge>{topicProgress(state, topic.id).status}</Badge><span className="topic-duration">{topic.minutes ? `${topic.minutes} мин` : 'Заметки'}</span><Icon name="arrow"/></button>)}</div> : <Panel><p className="muted">В этом списке пока нет тем.</p></Panel>}</>;
}
