import { createElement, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { ContentNode } from '../domain/types';
import { MathText } from './MathText';
import { isCodeText } from '../domain/math-text';

export type IconName = 'home' | 'errors' | 'review' | 'progress' | 'math' | 'russian' | 'informatics' | 'python' | 'settings' | 'shield' | 'feather' | 'clock' | 'calendar' | 'moon' | 'sun' | 'menu' | 'arrow' | 'back' | 'chevron' | 'book' | 'practice' | 'check' | 'bulb' | 'plus' | 'close' | 'pause' | 'play';
const paths: Record<IconName, ReactNode> = {
  home: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  errors: <><path d="M5 4h10l4 4v12H5zM3 7h4M3 12h4M3 17h4M12 9l5-5 3 3-5 5-4 1z"/></>,
  review: <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/></>,
  progress: <><path d="M4 20v-5m5 5V9m5 11v-8m5 8V4M3 11l6-7 5 4 6-6"/></>,
  math: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M15 7c-5-2-5 7-6 10m-1-6h7"/></>,
  russian: <><path d="M3 5h12M9 2v3m-4 3c1 5 4 7 8 9M12 5c0 6-5 11-9 12m11 4 4-10 4 10m-6-4h5"/></>,
  informatics: <><text x="4" y="10" stroke="none" fill="currentColor" fontSize="9" fontFamily="monospace">01</text><text x="4" y="20" stroke="none" fill="currentColor" fontSize="9" fontFamily="monospace">10</text></>,
  python: <><path d="m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18"/></>,
  settings: <><path d="M3 6h18M3 18h18"/><circle cx="8" cy="6" r="3" fill="var(--sidebar)"/><circle cx="16" cy="18" r="3" fill="var(--sidebar)"/></>,
  shield: <><path d="m12 3 8 4v6c0 5-8 8-8 8S4 18 4 13V7zM8 12l3 3 5-6"/></>,
  feather: <><path d="M4 20 17 7M4 17 7 7l9-4 5 4-5 9-10 2m3-6h7"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 10h18m-13 4h2m4 0h2m-8 3h2m4 0h2"/></>,
  moon: <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>, sun: <><circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,
  menu: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, back: <path d="M20 12H4m6-6-6 6 6 6"/>, chevron: <path d="m9 5 7 7-7 7"/>,
  book: <><path d="M12 5c-3-3-7-3-10-2v16c3-1 7-1 10 2 3-3 7-3 10-2V3c-3-1-7-1-10 2Zm0 0v16"/></>,
  practice: <><path d="M8 3h8M9 3v7l-6 9a1 1 0 0 0 1 2h16a1 1 0 0 0 1-2l-6-9V3M7 15h10"/></>,
  check: <><path d="m4 12 5 5L20 6m-6 8 2 2 6-7"/></>, bulb: <><path d="M9 18h6m-6 3h6M8 14c-6-6-2-11 4-11s10 5 4 11l-1 2H9z"/></>,
  plus: <path d="M12 4v16M4 12h16"/>, close: <path d="m5 5 14 14M5 19 19 5"/>, pause: <path d="M8 5v14M16 5v14"/>, play: <path d="m8 4 12 8-12 8Z"/>,
};
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>; }
export function Button({ variant = 'primary', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) {
  return <button type="button" data-slot="button" className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`panel ${className}`}>{children}</section>; }
export function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Heading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}
export function Empty({ title, children }: { title: string; children: ReactNode }) { return <div className="empty-state"><div className="empty-icon"><Icon name="check" size={24}/></div><h3>{title}</h3><p>{children}</p></div>; }
export function ProgressBar({ value, label }: { value: number; label: string }) { return <div className="progress-bar" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${Math.min(100, Math.max(0, value))}%` }}/></div>; }
const tags = new Set(['div', 'span', 'p', 'h2', 'h3', 'h4', 'b', 'strong', 'small', 'pre', 'code', 'ol', 'ul', 'li', 'sup', 'em', 'section', 'br']);
export function Content({ node, math=false }: { node: ContentNode; math?:boolean }) {
  // Inert, allowlisted data tree: no HTML injection, handlers or executable source.
  const tag = tags.has(node.tag) ? node.tag : 'div';
  const renderMath=math&&tag!=='code'&&!(tag==='pre'&&isCodeText(node.children.filter(c=>typeof c==='string').join('\n')));
  return createElement(tag, { className: [node.className,renderMath&&tag==='pre'?'math-example':''].filter(Boolean).join(' ')||undefined }, ...(tag === 'br' ? [] : node.children.map((child, i) => typeof child === 'object' ? <Content key={i} node={child} math={renderMath}/> : renderMath?<MathText key={i}>{child}</MathText>:child)));
}
export function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="app-dialog" aria-labelledby="dialog-title" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="section-heading"><h2 id="dialog-title">{title}</h2><Button variant="ghost" onClick={close} aria-label="Закрыть"><Icon name="close"/></Button></div>{children}</dialog>;
}
