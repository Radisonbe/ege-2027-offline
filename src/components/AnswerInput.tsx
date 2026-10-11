import { useLayoutEffect, useRef, type InputHTMLAttributes } from 'react';
import { insertAnswerSymbol } from '../domain/numeric-input';
import { Button } from './ui';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode'> & {
  value: string;
  onValueChange: (value: string) => void;
  numeric?: boolean;
  allowFraction?: boolean;
};

/** Shared controlled answer field. The decimal keyboard stays open on touch. */
export function AnswerInput({ value, onValueChange, numeric = false, allowFraction = true, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<{ value: string; cursor: number; scrollLeft: number } | null>(null);
  useLayoutEffect(() => {
    const field = input.current, restore = pending.current;
    if (!field || !restore || field.value !== restore.value) return;
    pending.current = null;
    field.focus({ preventScroll: true });
    field.setSelectionRange(restore.cursor, restore.cursor);
    field.scrollLeft = restore.scrollLeft;
  });
  function insertSymbol(symbol: '/' | '−') {
    const field = input.current;
    if (!field || field.matches(':disabled') || field.readOnly) return;
    const next = insertAnswerSymbol(field.value, field.selectionStart, field.selectionEnd, symbol, field.maxLength);
    if (!next) { field.focus({ preventScroll: true }); return; }
    pending.current = { ...next, scrollLeft: field.scrollLeft };
    onValueChange(next.value);
  }
  const field = <input {...props} ref={input} type="text" inputMode={numeric ? 'decimal' : 'text'} value={value}
    onChange={e => { pending.current = null; onValueChange(e.target.value); }}/>
  const key = (symbol: '/' | '−', label: string) => <Button key={symbol} variant="outline"
    className="numeric-input-key" disabled={props.disabled || props.readOnly}
    aria-label={label} aria-controls={props.id} title={`Вставить ${symbol} в позицию курсора`}
    onPointerDown={e => { if (e.button === 0) e.preventDefault(); }}
    onMouseDown={e => { if (e.button === 0) e.preventDefault(); }}
    onClick={() => insertSymbol(symbol)}>{symbol}</Button>;
  return numeric ? <div className={`numeric-answer-input ${allowFraction ? '' : 'without-fraction'}`}>
    {field}{key('−', 'Вставить минус')}{allowFraction && key('/', 'Вставить дробную черту')}
  </div> : field;
}
