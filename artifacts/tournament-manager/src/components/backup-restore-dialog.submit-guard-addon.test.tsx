import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { TestAuthProvider } from '../../test/auth-provider';
import { BackupRestoreDialog } from './backup-restore-dialog';

const oldFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
afterEach(() => { cleanup(); globalThis.fetch = oldFetch; sessionStorage.clear(); localStorage.clear(); });
function showDialog(onClose = () => {}) {
  const location = memoryLocation({ path: '/dashboard' });
  return render(<TestAuthProvider><Router hook={location.hook} searchHook={location.searchHook}><BackupRestoreDialog open onClose={onClose} /></Router></TestAuthProvider>);
}

test('L35 restore UI accurately describes V2-only import and accessible close button', () => {
  showDialog();
  assert.ok(screen.getByText('Przywróć backup V2'));
  assert.match(screen.getByText(/Import backupu V3 jest wyłączony/).textContent ?? '', /eksport V3/);
  assert.ok(screen.getByRole('button', { name: 'Zamknij okno przywracania' }));
});

test('L35 invalid uploaded backup is announced to assistive technology', async () => {
  showDialog();
  const file = new File(['{invalid'], 'bad.json', { type: 'application/json' });
  fireEvent.change(screen.getByLabelText('Plik backupu'), { target: { files: [file] } });
  const alert = await screen.findByRole('alert');
  assert.match(alert.textContent ?? '', /Nie można odczytać pliku/);
});

test('L35 rapid double click cannot import two copies of one backup', async () => {
  let count=0;let release!: () => void;
  globalThis.fetch = async (input) => {
    if (String(input).includes('/api/tournaments/import')) {
      count++;
      return new Promise<Response>(resolve => { release = () => resolve(json({ tournament: { id: 72, name: 'Restored Cup' }, organizerToken: 'token' })); });
    }
    return json([]);
  };
  showDialog();
  const backup = {
    schemaVersion: 2, resultModelVersion: 'series_v1', rankingPolicy: 'match_record_v1',
    tournament: { name: 'Source Cup', visibility: 'public' },
    players: [], matches: [], resultHistory: [], actionLog: [],
  };
  const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
  fireEvent.change(screen.getByLabelText('Plik backupu'), { target: { files: [file] } });
  await screen.findByText(/Wczytano backup V2/);
  await userEvent.type(screen.getByLabelText(/Nowe hasło organizatora/), 'restored-pass');
  const button = screen.getByRole('button', { name: 'Przywróć jako nowy turniej' });
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => assert.equal(count, 1));
  assert.equal((screen.getByRole('button', { name: 'Anuluj' }) as HTMLButtonElement).disabled, true);
  release();
  await waitFor(() => assert.equal(count, 1));
});
