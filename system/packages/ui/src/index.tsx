import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { AlertCircle, Bookmark, Check, Clipboard, Info, Loader, NotebookPen, Search, TriangleAlert, Volume2, XCircle } from 'lucide-react';

export function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ');
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'ink'; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return <button data-slot="button" className={cx('zy-shadcn-root zy-glass-subtle zy-button', `zy-button-${variant}`, `zy-button-${size}`, className)} {...props} />;
}

export function IconButton({ label, children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button data-slot="button" className={cx('zy-shadcn-root zy-glass-subtle zy-icon-button', className)} aria-label={label} title={label} {...props}>{children}</button>;
}

export function Input({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined }) {
  const inputId = id ?? `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return <label data-slot="field" className="zy-field" htmlFor={inputId}><span>{label}</span><input data-slot="input" className="zy-glass-strong" id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} {...props} />{error ? <small id={`${inputId}-error`}><AlertCircle size={14} />{error}</small> : null}</label>;
}

export function TextArea({ label, error, id, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string | undefined }) {
  const inputId = id ?? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return <label data-slot="field" className="zy-field" htmlFor={inputId}><span>{label}</span><textarea data-slot="textarea" className="zy-glass-strong" id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} {...props} />{error ? <small id={`${inputId}-error`}><AlertCircle size={14} />{error}</small> : null}</label>;
}

export function Select({ label, error, id, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string | undefined; children: ReactNode }) {
  const inputId = id ?? `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return <label data-slot="field" className="zy-field" htmlFor={inputId}><span>{label}</span><select data-slot="select" className="zy-glass-strong" id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} {...props}>{children}</select>{error ? <small id={`${inputId}-error`}><AlertCircle size={14} />{error}</small> : null}</label>;
}

export function SearchInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string }) {
  return <label className="zy-field zy-search"><span>{props.label ?? 'Search'}</span><Search size={18} /><input {...props} type="search" /></label>;
}

export function Card({ variant = 'paper', className, children }: { variant?: 'paper' | 'porcelain' | 'outlined' | 'interactive' | 'ink'; className?: string; children: ReactNode }) {
  const glass = variant === 'paper' ? 'zy-glass-strong' : variant === 'ink' ? 'zy-glass-ink' : variant === 'outlined' ? 'zy-glass-subtle' : 'zy-glass-panel';
  return <section data-slot="card" className={cx('zy-shadcn-root zy-card', glass, `zy-card-${variant}`, className)}>{children}</section>;
}

export function Badge({ tone = 'info', children }: { tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; children: ReactNode }) {
  return <span data-slot="badge" className={cx('zy-shadcn-root zy-glass-subtle zy-badge', `zy-badge-${tone}`)}>{children}</span>;
}

export function Tabs({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) {
  return <div data-slot="tabs" className="zy-shadcn-root zy-glass-subtle zy-tabs" role="tablist">{items.map((item) => <button key={item} role="tab" aria-selected={item === value} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

export function Segmented({ items, value, onChange, label }: { items: string[]; value: string; label: string; onChange: (value: string) => void }) {
  return <fieldset data-slot="segmented-control" className="zy-shadcn-root zy-glass-subtle zy-segmented"><legend>{label}</legend>{items.map((item) => <button type="button" key={item} aria-pressed={item === value} onClick={() => onChange(item)}>{item}</button>)}</fieldset>;
}

export function Toast({ type, children }: { type: 'success' | 'info' | 'warning' | 'error' | 'loading'; children: ReactNode }) {
  const icons = { success: Check, info: Info, warning: TriangleAlert, error: XCircle, loading: Loader };
  const Icon = icons[type];
  return <div data-slot="toast" className={cx('zy-shadcn-root zy-glass-elevated zy-toast', `zy-toast-${type}`)} role="status" aria-live="polite"><Icon size={18} />{children}</div>;
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="zy-empty"><div className="zy-empty-mark">□</div><h3>{title}</h3>{action}</div>;
}

export function DataTable<T extends Record<string, unknown>>({ rows, columns, selected, onToggle }: { rows: T[]; columns: Array<keyof T>; selected?: Set<string>; onToggle?: (id: string) => void }) {
  const columnCount = columns.length + (onToggle ? 1 : 0);
  return <div data-slot="table-container" className="zy-shadcn-root zy-glass-strong zy-table-wrap"><table className="zy-table" data-columns={columnCount}><thead><tr>{onToggle ? <th><span className="sr-only">Select</span></th> : null}{columns.map((column) => <th key={String(column)}>{String(column)}</th>)}</tr></thead><tbody>{rows.map((row, index) => { const id = String(row.id ?? index); return <tr key={id}>{onToggle ? <td><input type="checkbox" checked={selected?.has(id) ?? false} onChange={() => onToggle(id)} aria-label={`Select row ${id}`} /></td> : null}{columns.map((column) => <td key={String(column)}>{String(row[column] ?? '')}</td>)}</tr>; })}</tbody></table></div>;
}

export function PinyinText({ zh, pinyin, mode = 'tones' }: { zh: string; pinyin: string; mode?: 'letters' | 'tones' | 'hidden' }) {
  return <span className="zy-pinyin-text"><strong>{zh}</strong>{mode === 'hidden' ? null : <small>{mode === 'letters' ? pinyin.replace(/[1-5]/g, '') : pinyin}</small>}</span>;
}

export function SentenceCard({ zh, pinyin, pinyinTones, translation, keyPoint, pinyinMode = 'tones', translationMode = 'inline', active = false, saved = false, noteOpen = false, noteValue = '', noteError, onPlay, onSave, onCopy, onNoteOpen, onNoteChange, onNoteSubmit }: { zh: string; pinyin: string; pinyinTones?: string | undefined; translation: string; keyPoint?: string | null | undefined; pinyinMode?: 'letters' | 'tones' | 'hidden'; translationMode?: 'inline' | 'collapse' | 'hidden'; active?: boolean; saved?: boolean; noteOpen?: boolean; noteValue?: string; noteError?: string | undefined; onPlay?: () => void; onSave?: () => void; onCopy?: () => void; onNoteOpen?: () => void; onNoteChange?: (value: string) => void; onNoteSubmit?: () => void }) {
  const spokenPinyin = pinyinMode === 'tones' ? (pinyinTones ?? pinyin) : pinyin;
  const translationVisible = translationMode !== 'hidden';
  return <Card variant="paper" className={cx('zy-sentence', active && 'is-playing')}>
    <PinyinText zh={zh} pinyin={spokenPinyin} mode={pinyinMode} />
    {translationVisible ? <p className={cx(translationMode === 'collapse' && 'is-muted')}>{translation}</p> : null}
    {keyPoint ? <small className="zy-key-point">{keyPoint}</small> : null}
    <div className="zy-sentence-actions" role="toolbar" aria-label="Sentence actions">
      <Button variant="ghost" size="sm" onClick={onPlay}><Volume2 size={16} />Play</Button>
      <Button variant={saved ? 'secondary' : 'ghost'} size="sm" onClick={onSave}><Bookmark size={16} />{saved ? 'Saved' : 'Save'}</Button>
      <Button variant="ghost" size="sm" onClick={onNoteOpen}><NotebookPen size={16} />Note</Button>
      <Button variant="ghost" size="sm" onClick={onCopy}><Clipboard size={16} />Copy</Button>
    </div>
    {noteOpen ? <div className="zy-sentence-note"><TextArea label="Sentence note" maxLength={500} value={noteValue} onChange={(event) => onNoteChange?.(event.currentTarget.value)} error={noteError} /><Button size="sm" onClick={onNoteSubmit}>Save note</Button></div> : null}
  </Card>;
}