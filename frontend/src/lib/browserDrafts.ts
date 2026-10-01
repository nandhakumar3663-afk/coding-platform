export function draftKey(userId: string | undefined, slug: string, language: string): string {
  return `algosphere:draft:v1:${encodeURIComponent(userId || 'guest')}:${encodeURIComponent(slug)}:${encodeURIComponent(language)}`;
}

export function readDraft(key: string): string {
  const raw = localStorage.getItem(key);
  if (!raw) return '';
  const draft = JSON.parse(raw);
  if (typeof draft.code !== 'string') throw new Error('Invalid browser draft');
  return draft.code;
}

export function writeDraft(key: string, code: string): void {
  localStorage.setItem(key, JSON.stringify({ code, updatedAt: new Date().toISOString() }));
}
