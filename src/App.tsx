import { useEffect, useRef, useState } from 'react';
import { subjects, topicById } from './data/catalog';
import type { SubjectId } from './domain/types';
import { useStudy } from './state/StudyProvider';
import { Button, Icon, Panel, type IconName } from './components/ui';
import { Dashboard } from './pages/Dashboard';
import { SubjectPage } from './pages/Subjects';
import { TopicPage } from './pages/Topic';
import { ErrorsPage } from './pages/Errors';
import { ReviewPage } from './pages/Review';
import { ProgressPage } from './pages/Progress';
import { SettingsPage } from './pages/Settings';
import { EasyPage, SessionPage } from './pages/Sessions';

const mainNavigation: { id: string; label: string; icon: IconName }[] = [{ id: 'home', label: 'Главная', icon: 'home' }, { id: 'errors', label: 'Мои ошибки', icon: 'errors' }, { id: 'review', label: 'Повторение', icon: 'review' }, { id: 'progress', label: 'Прогресс', icon: 'progress' }];
const validRoutes = new Set(['home', 'errors', 'review', 'progress', 'settings', 'easy', 'session', ...subjects.map(s => s.id)]);
function route() { let hash = ''; try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return 'home'; } return validRoutes.has(hash) || (hash.startsWith('topic/') && topicById[hash.slice(6)]) ? hash : 'home'; }
function Navigation({ page, go }: { page: string; go: (page: string) => void }) {
  const { state } = useStudy(), errors = state.errors.filter(e => e.status !== 'закрепил').length;
  return <><div data-slot="sidebar-header"><button type="button" className="brand" onClick={() => go('home')}><span className="brand-mark">[27]</span><span><strong>ЕГЭ 2027</strong><small>Личный учебный центр</small></span></button></div><div data-slot="sidebar-content"><nav aria-label="Главное меню"><div data-slot="sidebar-group"><p data-slot="sidebar-group-label">МОЁ ОБУЧЕНИЕ</p><ul data-slot="sidebar-menu">{mainNavigation.map(item => <li key={item.id}><button type="button" className="nav-button" data-active={page === item.id} aria-current={page === item.id ? 'page' : undefined} onClick={() => go(item.id)}><Icon name={item.icon}/><span>{item.label}</span>{item.id === 'errors' && errors > 0 && <b className="nav-count">{errors}</b>}</button></li>)}</ul></div><div data-slot="sidebar-group"><p data-slot="sidebar-group-label">ПРЕДМЕТЫ</p><ul data-slot="sidebar-menu">{subjects.map(subject => { const active = page === subject.id || (page.startsWith('topic/') && topicById[page.slice(6)]?.subject === subject.id); return <li key={subject.id}><button type="button" className="nav-button" data-active={active} aria-current={active ? 'page' : undefined} onClick={() => go(subject.id)}><Icon name={subject.id}/><span>{subject.short}</span></button></li>; })}</ul></div></nav><div className="sidebar-prompt"><Icon name="feather" size={22}/><p>Сегодня мало сил?</p><span>Пять коротких вопросов — тоже занятие.</span><Button variant="outline" onClick={() => go('easy')}>Лёгкое повторение <Icon name="arrow" size={15}/></Button></div></div><div data-slot="sidebar-footer"><button className="sidebar-settings" type="button" onClick={() => go('settings')}><Icon name="settings"/>Данные и настройки</button><div className="local-storage-label"><Icon name="shield" size={15}/><span>Прогресс в этом браузере</span></div></div></>;
}
export function App() {
  const { state, ready, storageError, mutate } = useStudy(), [page, setPage] = useState(route), [mobile, setMobile] = useState(false), menu = useRef<HTMLDialogElement>(null);
  useEffect(() => { function update() { setPage(route()); window.scrollTo({ top: 0 }); } window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  useEffect(() => { if (mobile) menu.current?.showModal(); else menu.current?.close(); }, [mobile]);
  const go = (next: string) => { window.location.hash = next; setPage(next); setMobile(false); window.scrollTo({ top: 0 }); };
  const title = page.startsWith('topic/') ? topicById[page.slice(6)]?.title : mainNavigation.find(item => item.id === page)?.label ?? subjects.find(s => s.id === page)?.short ?? ({ settings: 'Данные и настройки', easy: 'Лёгкое повторение', session: '15 минут' } as Record<string, string>)[page];
  let screen;
  if (!ready) screen = <Panel><h2>Твой учебный центр</h2><p>Загружаем сохранённый прогресс…</p></Panel>;
  else if (page === 'home') screen = <Dashboard go={go}/>;
  else if (subjects.some(s => s.id === page)) screen = <SubjectPage key={page} subjectId={page as SubjectId} go={go}/>;
  else if (page.startsWith('topic/')) screen = <TopicPage key={page} id={page.slice(6)} go={go}/>;
  else if (page === 'errors') screen = <ErrorsPage/>;
  else if (page === 'review') screen = <ReviewPage go={go}/>;
  else if (page === 'progress') screen = <ProgressPage/>;
  else if (page === 'settings') screen = <SettingsPage/>;
  else if (page === 'easy') screen = <EasyPage go={go}/>;
  else if (page === 'session') screen = <SessionPage go={go}/>;
  return <div className="app-frame"><a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>К содержимому</a><aside className="study-sidebar desktop-sidebar" data-slot="sidebar-inner"><Navigation page={page} go={go}/></aside><dialog ref={menu} className="mobile-sidebar study-sidebar" aria-label="Главное меню" onCancel={() => setMobile(false)} onClick={e => { if (e.target === e.currentTarget) setMobile(false); }}><div className="mobile-sidebar-inner"><Button variant="ghost" className="mobile-close" aria-label="Закрыть меню" onClick={() => setMobile(false)}><Icon name="close"/></Button><Navigation page={page} go={go}/></div></dialog><div className="app-surface"><header className="topbar"><div className="breadcrumb"><Button variant="ghost" className="mobile-menu" aria-label="Открыть меню" onClick={() => setMobile(true)}><Icon name="menu"/></Button><span>Личный учебный центр</span><Icon name="chevron" size={15}/><b>{title}</b></div><div className="topbar-right"><span className="year-label">ЕГЭ 2027</span><Button variant="ghost" aria-label={state.settings.theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'} onClick={() => mutate(previous => ({ ...previous, settings: { ...previous.settings, theme: previous.settings.theme === 'light' ? 'dark' : 'light' } }))}><Icon name={state.settings.theme === 'light' ? 'moon' : 'sun'} size={19}/></Button><div className="avatar" aria-label="Radisonbe">R</div></div></header><main id="main-content" tabIndex={-1} className="main-content">{storageError && <div className="storage-warning" role="alert">{storageError}</div>}{screen}<footer className="site-footer"><span>Шаг за шагом, к пониманию.</span><button type="button" onClick={() => go('settings')}>Проекты ФИПИ ЕГЭ-2027 · О материалах</button></footer></main></div></div>;
}
