import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setActiveOrganizerToken } from '@workspace/api-client-react';
import { TestAuthProvider } from '../../test/auth-provider';
import { setOrganizerToken } from '@/lib/auth';
import { SecurityPanel } from './security-panel';

const oldFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
afterEach(() => {
  cleanup(); globalThis.fetch = oldFetch; sessionStorage.clear();
  setActiveOrganizerToken(null);
});

test('L34 support password has accessible label and named visibility control', async () => {
  setOrganizerToken(71, 'owner-token');
  globalThis.fetch = async () => json([]);
  render(<TestAuthProvider><SecurityPanel tournamentId={71} hasOrganizerPassword /></TestAuthProvider>);
  const input = screen.getByLabelText('Nowe hasło wsparcia') as HTMLInputElement;
  assert.equal(input.type, 'password');
  await userEvent.click(screen.getByRole('button', { name: 'Pokaż hasło wsparcia' }));
  assert.equal(input.type, 'text');
  assert.equal(screen.getByRole('button', { name: 'Ukryj hasło wsparcia' }).getAttribute('aria-pressed'), 'true');
});

test('L34 two rapid support password submissions create exactly one POST', async () => {
  setOrganizerToken(71, 'owner-token');
  let count = 0; let release!: () => void;
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/auth/change-support-password')) {
      count++;
      return new Promise<Response>(resolve => { release = () => resolve(json({ ok: true })); });
    }
    return json([]);
  };
  const { container } = render(<TestAuthProvider><SecurityPanel tournamentId={71} hasOrganizerPassword /></TestAuthProvider>);
  await userEvent.type(screen.getByLabelText('Nowe hasło wsparcia'), 'strong-support-pass');
  const form = container.querySelector('form')!;
  fireEvent.submit(form); fireEvent.submit(form);
  await waitFor(() => assert.equal(count, 1));
  release();
  await screen.findByRole('status');
});

test('L34 first organizer password cannot be submitted twice while request is pending', async () => {
  setOrganizerToken(71, 'legacy-owner-token');
  let count = 0; let release!: () => void;
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/auth/set-organizer-password')) {
      count++;
      return new Promise<Response>(resolve => { release = () => resolve(json({ token: 'new-token' })); });
    }
    return json([]);
  };
  const { container } = render(<TestAuthProvider><SecurityPanel tournamentId={71} hasOrganizerPassword={false} /></TestAuthProvider>);
  await userEvent.type(screen.getByLabelText('Pierwsze hasło organizatora'), 'new-organizer-password');
  const form = container.querySelector('form')!;
  fireEvent.submit(form); fireEvent.submit(form);
  await waitFor(() => assert.equal(count, 1));
  release();
  await waitFor(() => assert.equal(screen.queryByText('Pierwsze hasło organizatora'), null));
});
