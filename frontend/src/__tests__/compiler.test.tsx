// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProblemPage } from '../pages/ProblemPage';
import { AuthProvider, useAuth } from '../context/AuthContext';

const mocks = vi.hoisted(() => ({
  callback: null as any,
  user: { id: 'auth-user-1', email: 'student@example.com', user_metadata: { username: 'student' } },
  query: null as any,
  load: vi.fn(), save: vi.fn(), getMe: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { user: mocks.user, access_token: 'token' } } }),
      onAuthStateChange: (callback: any) => { mocks.callback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
    },
    from: () => mocks.query,
  },
}));
vi.mock('../api/client', () => ({
  api: {
    getMe: (...args: any[]) => mocks.getMe(...args),
    getProblems: async () => ({ problems: [{ id: 1, slug: 'one', title: 'Question one', problem_number: 1, difficulty: 'Easy' }] }),
    getProblemBySlug: async () => ({ problem: { id: 1, slug: 'one', title: 'Question one', problem_number: 1, difficulty: 'Easy', description: 'Practice' } }),
  },
  setAuthToken: vi.fn(), removeAuthToken: vi.fn(), getAuthToken: vi.fn(),
}));
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, options }: any) => <textarea aria-label="Code editor" value={value} readOnly={options.readOnly} onChange={e => onChange(e.target.value)} />,
}));

function mount() {
  return render(<AuthProvider><MemoryRouter initialEntries={['/problem/one']}><Routes>
    <Route path="/problem/:slug" element={<ProblemPage />} />
    <Route path="/login" element={<p>Login screen</p>} />
  </Routes></MemoryRouter></AuthProvider>);
}
const saveButton = () => screen.getByRole('button', { name: 'Save code' }) as HTMLButtonElement;
const editor = () => screen.getByRole('textbox', { name: 'Code editor' }) as HTMLTextAreaElement;
const ready = async () => { await waitFor(() => expect(saveButton().disabled).toBe(false)); };
beforeEach(() => {
  mocks.load.mockReset().mockResolvedValue({ data: null, error: null });
  mocks.save.mockReset().mockResolvedValue({ error: null });
  mocks.getMe.mockReset().mockResolvedValue({ user: { ...mocks.user, id: 'backend-id', username: 'student', role: 'student' } });
  mocks.query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: mocks.load, upsert: mocks.save };
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe('Compiler draft regression checks', () => {
  it('shows a labeled Save button and saves with the Supabase user ID', async () => {
    mount(); await ready();
    expect(saveButton().textContent).toContain('Save');
    fireEvent.change(editor(), { target: { value: 'print(42)' } });
    fireEvent.click(saveButton());
    await screen.findByText('Saved to your account');
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'auth-user-1', problem_slug: 'one', language: 'python', code: 'print(42)' }), expect.anything());
  });
  it('restores drafts separately for each language and marks reset as unsaved', async () => {
    mocks.load.mockResolvedValueOnce({ data: { code: 'print(42)' }, error: null });
    mount(); await ready(); expect(editor().value).toBe('print(42)');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'java' } });
    await ready(); expect(editor().value).toBe('');
    expect(mocks.query.eq).toHaveBeenCalledWith('language', 'java');
    fireEvent.click(screen.getByTitle('Clear editor'));
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
  });
  it('handles load rejection and failed save without leaving Save disabled', async () => {
    mocks.load.mockRejectedValueOnce(new Error('offline'));
    mount(); await ready();
    expect(screen.getByText('Could not load saved code. Check your connection.')).toBeTruthy();
    mocks.save.mockResolvedValueOnce({ error: new Error('offline') });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    fireEvent.click(saveButton());
    await screen.findByText('Save failed. Check your connection and try again.');
    expect(saveButton().disabled).toBe(false); log.mockRestore();
  });
  it('does not mark edits made during a save as saved', async () => {
    let finish: any;
    mocks.save.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    mount(); await ready();
    fireEvent.change(editor(), { target: { value: 'old' } }); fireEvent.click(saveButton());
    fireEvent.change(editor(), { target: { value: 'new' } });
    await act(async () => finish({ error: null }));
    expect(screen.getByText('Unsaved changes')).toBeTruthy(); expect(editor().value).toBe('new');
  });
  it('clears the previous user draft on sign-out and directs Save to login', async () => {
    mocks.load.mockResolvedValueOnce({ data: { code: 'private draft' }, error: null });
    mount(); await ready(); expect(editor().value).toBe('private draft');
    act(() => mocks.callback('SIGNED_OUT', null));
    expect(editor().value).toBe(''); fireEvent.click(saveButton());
    expect(await screen.findByText('Login screen')).toBeTruthy();
  });
  it('keeps auth callback synchronous and ignores profile results after sign-out', async () => {
    let finish: any;
    mocks.getMe.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    function Identity() { const { user } = useAuth(); return <p>{user?.username || 'guest'}</p>; }
    render(<AuthProvider><Identity /></AuthProvider>);
    await waitFor(() => expect(mocks.getMe).toHaveBeenCalled());
    let returned: any;
    act(() => { returned = mocks.callback('SIGNED_IN', { user: mocks.user, access_token: 'token' }); });
    expect(returned).toBeUndefined();
    act(() => mocks.callback('SIGNED_OUT', null));
    await act(async () => finish({ user: { ...mocks.user, username: 'stale' } }));
    expect(screen.getByText('guest')).toBeTruthy();
  });
});
