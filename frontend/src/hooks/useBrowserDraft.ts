import { useMemo, useState } from 'react';
import { draftKey, readDraft, writeDraft } from '../lib/browserDrafts';

export function useBrowserDraft(userId: string | undefined, slug: string, language: string) {
  const key = draftKey(userId, slug, language);
  const initial = useMemo(() => {
    try { return { key, code: readDraft(key), saved: true }; }
    catch { return { key, code: '', saved: false }; }
  }, [key]);
  const [state, setState] = useState(initial);
  // Derive the new editor contents immediately when the account, question, or language changes.
  const current = state.key === key ? state : initial;
  const update = (code: string) => {
    try {
      writeDraft(key, code);
      setState({ key, code, saved: true });
    } catch {
      setState({ key, code, saved: false });
    }
  };
  return { code: current.code, saved: current.saved, update, save: () => update(current.code) };
}
