import { useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Tabs, Textarea, useToast } from '@zhiyu/ui-kit';
import { adminApi } from '../../../lib/http.ts';
import type { AdminSentence, I18nMap, Locale } from '../../../lib/types.ts';
import { LOCALES, LOCALE_LABELS } from '../../../lib/types.ts';

type Props = {
  open: boolean;
  sentence: AdminSentence | null;
  onClose: () => void;
  onSaved: () => void;
};

type Form = { pinyin: string; content: I18nMap };

function fromSentence(s: AdminSentence | null): Form {
  if (!s) return { pinyin: '', content: { zh: '', en: '', vi: '', th: '', id: '' } };
  return { pinyin: s.pinyin, content: { zh: s.content_zh, en: s.content_en, vi: s.content_vi, th: s.content_th, id: s.content_id } };
}

export function SentenceEditDrawer({ open, sentence, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<Form>(fromSentence(sentence));
  const [tab, setTab] = useState<Locale>('zh');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setForm(fromSentence(sentence)); setTab('zh'); setErr(null); setBusy(false); }, [sentence, open]);

  const errorTabs = useMemo(() => {
    const errs = new Set<Locale>();
    for (const lng of LOCALES) {
      const v = form.content[lng];
      if (!v.trim()) errs.add(lng);
      else if (v.length > 500) errs.add(lng);
    }
    return errs;
  }, [form.content]);

  const isValid = form.pinyin.trim() && form.pinyin.length <= 1000 && errorTabs.size === 0;

  async function save() {
    if (!sentence || !isValid) return;
    setBusy(true); setErr(null);
    try {
      await adminApi(`/china/sentences/${sentence.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          pinyin: form.pinyin.trim(),
          content_zh: form.content.zh, content_en: form.content.en,
          content_vi: form.content.vi, content_th: form.content.th, content_id: form.content.id,
        }),
      });
      toast.success('已保存');
      onSaved();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  if (!sentence) return null;
  return (
    <Drawer
      open={open}
      onClose={busy ? () => undefined : onClose}
      side="right"
      width={520}
      title={`编辑句子 #${sentence.seq_label}`}
      testId="sentence-edit-drawer"
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy} data-testid="sentence-edit-cancel">取消</Button>
        <Button onClick={save} disabled={!isValid || busy} data-testid="sentence-edit-save">{busy ? '保存中…' : '保存'}</Button>
      </>}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="zy-field">
          <label className="zy-label"><span className="zy-required">*</span>拼音</label>
          <Textarea
            data-testid="sentence-pinyin"
            value={form.pinyin}
            onChange={(e) => setForm({ ...form, pinyin: e.target.value })}
            rows={2}
            maxLength={1000}
          />
          <div className="zy-helper">{form.pinyin.length}/1000 · 编辑后语音将自动重新生成</div>
        </div>
        <div className="zy-field">
          <label className="zy-label"><span className="zy-required">*</span>内容（5 语言必填）</label>
          <Tabs
            items={LOCALES.map((l) => ({ key: l, label: LOCALE_LABELS[l], flag: errorTabs.has(l) ? 'error' : undefined }))}
            active={tab}
            onChange={(k) => setTab(k as Locale)}
            testIdPrefix="sentence-tab"
          />
          <Textarea
            data-testid={`sentence-content-${tab}`}
            value={form.content[tab]}
            onChange={(e) => setForm({ ...form, content: { ...form.content, [tab]: e.target.value } })}
            rows={5}
            maxLength={500}
          />
          <div className="zy-helper">{form.content[tab].length}/500</div>
        </div>
        {err && <p className="zy-error-text" data-testid="sentence-edit-error">{err}</p>}
      </div>
    </Drawer>
  );
}
