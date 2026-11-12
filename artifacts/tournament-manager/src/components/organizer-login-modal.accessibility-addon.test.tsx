import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAuthProvider } from '../../test/auth-provider';
import { OrganizerLoginModal } from './organizer-login-modal';

const savedFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
afterEach(() => {
  cleanup();
  globalThis.fetch = savedFetch;
  sessionStorage.clear(); localStorage.clear();
});

test('L33 legacy code has a real accessible label and matches its input', async () => {
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/credential-state')) {
      return json({ exists: true, accessMode: 'legacy_upgrade', private: false });
    }
    return json({ error: 'unexpected POST' }, 400);
  };
  render(<TestAuthProvider><OrganizerLoginModal tournamentId={71} tournamentName="Legacy" onSuccess={() => {}} /></TestAuthProvider>);
  const code = await screen.findByLabelText('Kod prowadzącego');
  assert.equal((code as HTMLInputElement).id, 'organizer-login-host-code');
  assert.equal((code as HTMLInputElement).type, 'password');
  assert.ok(screen.getByLabelText('Nowe hasło organizatora'));
});

test('L33 rejected organizer login is announced and stale error clears while typing', async () => {
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/credential-state')) {
      return json({ exists: true, accessMode: 'organizer_login', private: false });
    }
    return json({ error: 'Niepoprawne hasło' }, 403);
  };
  render(<TestAuthProvider><OrganizerLoginModal tournamentId={71} tournamentName="Cup" onSuccess={() => assert.fail('should not login')} /></TestAuthProvider>);
  const input = await screen.findByLabelText('Hasło organizatora');
  await userEvent.type(input, 'bad-password');
  await userEvent.click(screen.getByRole('button', { name: 'Zaloguj' }));
  const alert = await screen.findByRole('alert');
  assert.match(alert.textContent ?? '', /Niepoprawne hasło/);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  await userEvent.type(input, 'x');
  await waitFor(() => assert.equal(screen.queryByRole('alert'), null));
  assert.equal(input.getAttribute('aria-invalid'), 'false');
});

test('L33 credential lookup error appears as alert without exposing takeover form', async () => {
  globalThis.fetch = async () => json({ error: 'Serwer niedostępny' }, 503);
  render(<TestAuthProvider><OrganizerLoginModal tournamentId={71} tournamentName="Cup" onSuccess={() => {}} /></TestAuthProvider>);
  await screen.findByRole('alert');
  assert.equal(screen.queryByRole('button', { name: 'Zaloguj' }), null);
});
