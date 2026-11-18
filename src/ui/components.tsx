// The Loog component set (handoff section 3), built once with variants.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { editNum, parseNum } from '../format';

// ---- Layout -------------------------------------------------------------------------

type MainVariant = 'tab' | 'pinned-tab' | 'pinned' | 'live';

/** Scroll content with the right bottom padding so nothing hides behind the tab bar or pinned button (2.6). */
export function Main({ variant = 'tab', tight, children }: { variant?: MainVariant; tight?: boolean; children: ReactNode }) {
  const cls = { tab: '', 'pinned-tab': 'main--pinned-tab', pinned: 'main--pinned', live: 'main--live' }[variant];
  return <main className={`main ${cls} ${tight ? 'main--tight' : ''}`}>{children}</main>;
}

/** Primary button fixed above the tab bar (or at the bottom when there is none). */
export const Pinned = ({ children, noTab }: { children: ReactNode; noTab?: boolean }) => (
  <div className={`fixed-col pinned ${noTab ? 'pinned--notab' : ''}`}>{children}</div>
);

// ---- Header (3.2) --------------------------------------------------------------------

interface HeaderProps {
  title: ReactNode;
  /** Plain-text title, used to pick the long-title size (> 13 characters). */
  titleText?: string;
  date?: string;
  back?: string | (() => void);
  onClose?: () => void;
  closeLabel?: string;
  right?: ReactNode;
}

export function Header({ title, titleText, date, back, onClose, closeLabel = 'Close', right }: HeaderProps) {
  const text = titleText ?? (typeof title === 'string' ? title : '');
  return (
    <div className="hdr">
      {back && (typeof back === 'string' ? <IconButton icon="chevron-left" label="Back" to={back} /> : <IconButton icon="chevron-left" label="Back" onClick={back} />)}
      {onClose && <IconButton icon="x" label={closeLabel} onClick={onClose} />}
      <div className="hdr__titles">
        {typeof title === 'string' ? <h1 className={`hdr__title ${text.length > 13 ? 'hdr__title--long' : ''}`}>{title}</h1> : title}
        {date && <span className="hdr__date">{date}</span>}
      </div>
      {right}
    </div>
  );
}

export const Section = ({ children, first }: { children: ReactNode; first?: boolean }) => (
  <div className={`ft-section ${first ? 'ft-section--first' : ''}`}>{children}</div>
);

// ---- Buttons (3.3) ---------------------------------------------------------------------

interface ButtonProps {
  icon?: IconName;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'neutral' | 'danger';
  className?: string;
}

export function Button({ icon, children, onClick, disabled, variant = 'primary', className = '' }: ButtonProps) {
  return (
    <button type="button" className={`ft-btn ${variant !== 'primary' ? `ft-btn--${variant}` : ''} ${className}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={20} stroke={2.25} />}
      {children}
    </button>
  );
}

interface IconButtonProps {
  icon: IconName;
  label: string;
  onClick?: () => void;
  to?: string;
  variant?: 'default' | 'ghost' | 'opt' | 'x56';
}

export function IconButton({ icon, label, onClick, to, variant = 'default' }: IconButtonProps) {
  const cls = `ft-iconbtn ${variant !== 'default' ? `ft-iconbtn--${variant}` : ''}`;
  const size = variant === 'ghost' ? 20 : 22;
  const stroke = variant === 'ghost' ? 2 : 2.25;
  if (to) {
    return <Link to={to} className={cls} aria-label={label}><Icon name={icon} size={size} stroke={stroke} /></Link>;
  }
  return <button type="button" className={cls} aria-label={label} onClick={onClick}><Icon name={icon} size={size} stroke={stroke} /></button>;
}

export const PlayButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" className="ft-play" aria-label={label} onClick={onClick}><Icon name="play" size={18} /></button>
);

export const AddRow = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button type="button" className="ft-addrow" onClick={onClick}><Icon name="plus" size={20} stroke={2.25} />{children}</button>
);

export const DangerRow = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button type="button" className="ft-dangerrow" onClick={onClick}><Icon name="trash-2" size={20} stroke={2.25} />{children}</button>
);

// ---- Chips (3.7) ----------------------------------------------------------------------

export const Chip = ({ children, hero }: { children: ReactNode; hero?: boolean }) => (
  <span className={`ft-chip ${hero ? 'ft-chip--hero' : ''}`}>{children}</span>
);

/** Green PR pill: "PR", "1 PR", "2 PRs". */
export function PRPill({ count }: { count?: number }) {
  const label = count == null ? 'PR' : `${count} ${count === 1 ? 'PR' : 'PRs'}`;
  return <span className="ft-pr"><Icon name="trophy" size={14} />{label}</span>;
}

// ---- Rows (3.5) ------------------------------------------------------------------------

interface RowProps {
  title: ReactNode;
  badge?: ReactNode;
  sub?: ReactNode;
  lead?: ReactNode;
  trail?: ReactNode;
  /** Trailing chevron inside the tappable area. */
  chevron?: boolean;
  check?: boolean;
  done?: boolean;
  to?: string;
  onClick?: () => void;
  pick?: boolean;
  className?: string;
  label?: string;
}

export function Row({ title, badge, sub, lead, trail, chevron, check, done, to, onClick, pick, className = '', label }: RowProps) {
  const body = (
    <>
      <span className="ft-row__body">
        <span className="ft-row__title"><span>{title}</span>{badge}</span>
        {sub != null && sub !== '' && <span className="ft-row__sub">{sub}</span>}
      </span>
      {chevron && <span className="ft-row__chev"><Icon name="chevron-right" size={20} /></span>}
      {check && <span className="ft-row__check"><Icon name="check" size={22} stroke={2.25} /></span>}
    </>
  );
  const cls = `ft-row ${pick ? 'ft-row--pick' : ''} ${lead ? 'ft-row--handle' : ''} ${done ? 'ft-row--done' : ''} ${className}`;
  const main = to ? (
    <Link to={to} className="ft-row__main" aria-label={label}>{body}</Link>
  ) : onClick ? (
    <button type="button" className="ft-row__main" onClick={onClick} aria-label={label}>{body}</button>
  ) : (
    <span className="ft-row__main">{body}</span>
  );
  return <div className={cls}>{lead}{main}{trail}</div>;
}

export const ListCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`ft-list ${className}`}>{children}</div>
);

// ---- Fields (3.8) ------------------------------------------------------------------------

export const Label = ({ children, htmlFor, spaced }: { children: ReactNode; htmlFor?: string; spaced?: boolean }) => (
  <label className={`ft-label ${spaced ? 'ft-label--spaced' : ''}`} htmlFor={htmlFor}>{children}</label>
);

export function TextField({ id, value, onChange, placeholder, autoFocus, selectOnFocus, trail, inputMode, onEnter, label }: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  selectOnFocus?: boolean;
  trail?: ReactNode;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'search';
  onEnter?: () => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!autoFocus) return;
    ref.current?.focus();
    if (selectOnFocus) ref.current?.select();
  }, [autoFocus, selectOnFocus]);
  return (
    <div className="ft-field">
      <input
        ref={ref} id={id} value={value} placeholder={placeholder} inputMode={inputMode} aria-label={label}
        type={inputMode === 'search' ? 'search' : 'text'} maxLength={60} autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => selectOnFocus && e.currentTarget.select()}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.(); }}
      />
      {trail && <span className="ft-field__trail">{trail}</span>}
    </div>
  );
}

export function SelectField({ id, value, onChange, placeholder, options }: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="ft-field">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={value ? '' : 'is-placeholder'}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="ft-field__trail"><Icon name="chevron-down" size={20} /></span>
    </div>
  );
}

/** Native picker under a styled field: shows our own formatted value or placeholder. */
export function PickerField({ id, type, value, display, placeholder, icon, onChange }: {
  id?: string;
  type: 'date' | 'time';
  value: string;
  display: string;
  placeholder?: string;
  icon: IconName;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="ft-field" onClick={() => { try { ref.current?.showPicker?.(); } catch { /* not supported */ } }}>
      <span className={`ft-field__value ${display ? '' : 'is-placeholder'}`}>{display || placeholder}</span>
      <span className="ft-field__trail"><Icon name={icon} size={20} /></span>
      <input ref={ref} id={id} className="ft-field__overlay" type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder ?? display} />
    </div>
  );
}

export function NotesField({ value, onChange, label = 'Notes' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <div className="ft-field ft-field--notes">
      <textarea ref={ref} rows={2} value={value} aria-label={label} placeholder="You can add notes about your workout here" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Tappable number field (Edit session). Opens the numeric keypad. */
export function NumberField({ value, onChange, decimal, label }: { value: number | undefined; onChange: (v: number | undefined) => void; decimal?: boolean; label: string }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      className="ft-num" aria-label={label} inputMode={decimal ? 'decimal' : 'numeric'}
      value={text ?? editNum(value)}
      onFocus={(e) => { setText(editNum(value)); e.currentTarget.select(); }}
      onChange={(e) => {
        // Counts straight away (not only when you leave the field), so Log works right after typing.
        setText(e.target.value);
        const n = parseNum(e.target.value);
        if (n != null) onChange(Math.max(0, n));
      }}
      onBlur={(e) => { const n = parseNum(e.target.value); onChange(n == null ? undefined : Math.max(0, n)); setText(null); }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}

// ---- Stepper (3.9) -------------------------------------------------------------------------

export function Stepper({ value, onChange, step, suggested, decimal, min = 0, label, format }: {
  /** Display units. */
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step: number;
  /** Grey = suggestion; ink = edited. Colour only. */
  suggested?: boolean;
  decimal?: boolean;
  min?: number;
  label: string;
  format: (v: number) => string;
}) {
  const [text, setText] = useState<string | null>(null);
  const round = (n: number) => Math.round(n * 100) / 100;
  const commit = (raw: string) => {
    setText(null);
    const n = parseNum(raw);
    if (raw.trim() === '') return;
    if (n != null) onChange(Math.max(min, round(n)));
  };
  return (
    <div className="ft-stepper">
      <button type="button" className="ft-stepper__btn" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, round((value ?? step) - step)))}>
        <Icon name="minus" size={20} stroke={2.25} />
      </button>
      <input
        className={`ft-stepper__val ${suggested ? 'is-suggested' : ''}`} aria-label={label}
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={text ?? (value == null ? '' : format(value))}
        placeholder="–"
        onFocus={(e) => { setText(editNum(value)); requestAnimationFrame(() => e.target.select()); }}
        onChange={(e) => {
          // Counts straight away (not only when you leave the field), so Log works right after typing.
          setText(e.target.value);
          const n = parseNum(e.target.value);
          if (n != null) onChange(Math.max(min, round(n)));
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
      <button type="button" className="ft-stepper__btn" aria-label={`Increase ${label}`} onClick={() => onChange(round((value ?? 0) + step))}>
        <Icon name="plus" size={20} stroke={2.25} />
      </button>
    </div>
  );
}

// ---- Segmented (3.13) ------------------------------------------------------------------------

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="ft-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** Progress | Goals header tabs. */
export function TopTabs() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const value = pathname.startsWith('/progress/goals') ? 'goals' : 'progress';
  return (
    <div className="hdr">
      <div style={{ flex: 1 }}>
        <Segmented
          label="Progress or Goals" value={value}
          options={[{ value: 'progress', label: 'Progress' }, { value: 'goals', label: 'Goals' }]}
          onChange={(v) => nav(v === 'goals' ? '/progress/goals' : '/progress', { replace: true })}
        />
      </div>
    </div>
  );
}

// ---- Ring (3.14) and bar (3.15) -----------------------------------------------------------------

export function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 23;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <div className="ft-ring" role="img" aria-label={`${done} of ${total} exercises done`}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="5" />
        {frac > 0 && (
          <circle className="ft-ring__fill" cx="28" cy="28" r={r} fill="none" stroke="var(--pink)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
        )}
      </svg>
      <span className="ft-ring__label">{done}/{total}</span>
    </div>
  );
}

/** Progress bar. With `gain`, a green segment shows what this session added. */
export function ProgressBar({ value, gain = 0, label }: { value: number; gain?: number; label: string }) {
  const base = Math.max(0, Math.min(1, value));
  const g = Math.max(0, Math.min(1 - base, gain));
  return (
    <div className="ft-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((base + g) * 100)}>
      {base > 0 && <div className="ft-bar__fill" style={{ width: `${base * 100}%` }} />}
      {g > 0 && <div className="ft-bar__gain" style={{ width: `${g * 100}%` }} />}
    </div>
  );
}

// ---- Toggle and checkbox (3.16) ---------------------------------------------------------------------

export const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" className="ft-toggle-row" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
    <span>{label}</span>
    <span className="ft-toggle" aria-checked={checked} />
  </button>
);

export const CheckRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" className="ft-check-row" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}>
    <span className="ft-check" data-on={checked}>{checked && <Icon name="check" size={16} stroke={2.75} />}</span>
    <span>{label}</span>
  </button>
);

// ---- Tab bar (3.17) ------------------------------------------------------------------------------------

const TABS: { to: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { to: '/', label: 'Home', icon: 'house', match: (p) => p === '/' || p.startsWith('/settings') },
  { to: '/workouts', label: 'Workouts', icon: 'dumbbell', match: (p) => p.startsWith('/workouts') || p.startsWith('/exercises') },
  { to: '/history', label: 'History', icon: 'history', match: (p) => p.startsWith('/history') },
  { to: '/progress', label: 'Progress', icon: 'chart-column', match: (p) => p.startsWith('/progress') || p.startsWith('/goals') },
];

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed-col ft-tabbar" aria-label="Main">
      {TABS.map((t) => {
        const on = t.match(pathname);
        return (
          <Link key={t.to} to={t.to} className="ft-tab" aria-current={on ? 'page' : undefined}>
            <Icon name={t.icon} size={24} stroke={on ? 2.25 : 2} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ---- Dialog (3.18) and sheet (3.19) ---------------------------------------------------------------------------

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

/** The system Back button (Android back, Samsung back gesture) closes an open dialog or sheet instead of leaving the screen. */
function useBackToClose(onClose: () => void) {
  const blocker = useBlocker(({ historyAction }) => historyAction === 'POP');
  useEffect(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
      onClose();
    }
  }, [blocker, onClose]);
}

export function Dialog({ title, text, onClose, children }: { title: string; text: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  useBackToClose(onClose);
  return (
    <div className="ft-scrim" onClick={onClose}>
      <div className="ft-dialog" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className="ft-dialog__title">{title}</h2>
        <p className="ft-dialog__text">{text}</p>
        {children}
      </div>
    </div>
  );
}

/** Pull-up sheet. Close by tapping the scrim or dragging it down *(assumed)*. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  useBackToClose(onClose);
  const startY = useRef<number | null>(null);
  const [dy, setDy] = useState(0);
  return (
    <div className="ft-scrim ft-scrim--sheet" onClick={onClose}>
      <div
        className="ft-sheet" role="dialog" aria-modal="true" aria-label={title}
        style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => { startY.current = e.clientY; }}
        onPointerMove={(e) => { if (startY.current != null) setDy(Math.max(0, e.clientY - startY.current)); }}
        onPointerUp={() => { if (dy > 80) onClose(); startY.current = null; setDy(0); }}
        onPointerCancel={() => { startY.current = null; setDy(0); }}
      >
        <div className="ft-sheet__grab" />
        <h2 className="ft-sheet__title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const SheetAction = ({ children, danger, onClick }: { children: ReactNode; danger?: boolean; onClick: () => void }) => (
  <button type="button" className={`ft-sheet__action ${danger ? 'ft-sheet__action--danger' : ''}`} onClick={onClick}>{children}</button>
);

// ---- Empty state (3.20) ----------------------------------------------------------------------------------------

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="ft-empty">
      <div className="ft-empty__art" aria-hidden="true">
        {Array.from({ length: 49 }, (_, i) => <span key={i} className={i === 24 ? 'today' : ''} />)}
      </div>
      <h2 className="ft-empty__title">{title}</h2>
      <p className="ft-empty__text">{text}</p>
    </div>
  );
}
