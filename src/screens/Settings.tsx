import { useRef, useState } from 'react';
import { exportJSON, importJSON, setTheme, setUnits, useData } from '../store';
import { isoDay } from '../format';
import { Icon } from '../ui/Icon';
import { Button, Dialog, Header, Main, Section, Segmented } from '../ui/components';
import type { Theme, Units } from '../types';

export default function Settings() {
  const d = useData();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // TODO(Mike): open question 8 — file name, confirm and feedback for export/import are not designed.
  const doExport = () => {
    const url = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `loog-backup-${isoDay(Date.now())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Backup file saved.');
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setPending(await f.text());
    if (file.current) file.current.value = '';
  };

  return (
    <>
      <Header title="Settings" back="/" />
      <Main>
        <Section first>Preferences</Section>
        <div className="ft-list ft-list--settings">
          <div className="set-pref">
            <div className="set-pref__head">
              <span className="set-pref__title">Units</span>
              <span className="set-pref__sub">Weight and speed</span>
            </div>
            <Segmented<Units>
              label="Units" value={d.settings.units} onChange={setUnits}
              options={[{ value: 'kg_kmh', label: 'kg - km/h' }, { value: 'lbs_mph', label: 'lbs - mph' }]}
            />
          </div>
          <div className="set-pref">
            <div className="set-pref__head"><span className="set-pref__title">Theme</span></div>
            <Segmented<Theme>
              label="Theme" value={d.settings.theme} onChange={setTheme}
              options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
            />
          </div>
        </div>

        <Section>Your data</Section>
        <div className="ft-list ft-list--settings">
          <button type="button" className="set-action" onClick={doExport}>
            <span className="set-action__tile"><Icon name="upload" size={22} /></span>
            <span className="set-action__text"><span>Export data</span><span className="set-action__sub">Save a backup file</span></span>
            <span className="ft-row__chev"><Icon name="chevron-right" size={20} /></span>
          </button>
          <button type="button" className="set-action" onClick={() => file.current?.click()}>
            <span className="set-action__tile"><Icon name="download" size={22} /></span>
            <span className="set-action__text"><span>Import data</span><span className="set-action__sub">Restore from a backup file</span></span>
            <span className="ft-row__chev"><Icon name="chevron-right" size={20} /></span>
          </button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        {message && <p className="set-footer" role="status">{message}</p>}
        <p className="set-footer">Loog 1.0 - Your data stays on this device</p>
      </Main>

      {pending != null && (
        <Dialog title="Replace your data?" text="Importing replaces all workouts, history and goals on this device with the backup." onClose={() => setPending(null)}>
          <Button icon="download" onClick={async () => { const err = await importJSON(pending); setPending(null); setMessage(err ?? 'Your data has been restored.'); }}>Import</Button>
          <Button variant="neutral" onClick={() => setPending(null)}>Cancel</Button>
        </Dialog>
      )}
    </>
  );
}
