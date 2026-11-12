import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { TestAuthProvider } from '../../test/auth-provider';
import SupportEntry from './support-entry';

const originalFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body),{status, headers:{'content-type':'application/json'}});
afterEach(()=>{ cleanup();globalThis.fetch=originalFetch;sessionStorage.clear();localStorage.clear(); });

test('L30 initial 503 shows retry and not false empty list', async()=>{
 let calls=0;
 globalThis.fetch=async (input)=>{
   const path=new URL(String(input),'http://localhost').pathname;
   if(path!=='/api/tournaments') return json({},404);
   return ++calls===1?json({error:'temporary'},503):json([]);
 };
 const loc=memoryLocation({path:'/support'});
 render(<TestAuthProvider><Router hook={loc.hook} searchHook={loc.searchHook}><SupportEntry /></Router></TestAuthProvider>);
 assert.match((await screen.findByRole('alert')).textContent??'',/Nie udało się pobrać/);
 assert.equal(screen.queryByText('Brak aktywnych turniejów'),null);
 await userEvent.click(screen.getByRole('button',{name:'Spróbuj ponownie'}));
 await screen.findByText('Brak aktywnych turniejów');
 await waitFor(()=>assert.equal(calls,2));
});

import { useQueryClient } from '@tanstack/react-query';
import { getListTournamentsQueryKey } from '@workspace/api-client-react';
function TestRefresh() {
  const queryClient = useQueryClient();
  return <button type="button" onClick={() => { void queryClient.refetchQueries({ queryKey: getListTournamentsQueryKey() }); }}>Odśwież testowo</button>;
}
test('L30 stale list remains visible and is explicitly labeled after failed refetch', async () => {
  let calls = 0;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input), 'http://localhost').pathname;
    if (path !== '/api/tournaments') return json({}, 404);
    calls++;
    return calls === 1
      ? json([{ id: 22, name: 'Test Cup', status: 'active', format: 'swiss' }])
      : json({ error: 'timeout' }, 503);
  };
  const loc = memoryLocation({ path: '/support' });
  render(<TestAuthProvider><Router hook={loc.hook} searchHook={loc.searchHook}><TestRefresh/><SupportEntry /></Router></TestAuthProvider>);
  await screen.findByRole('button', { name: /Test Cup/ });
  await userEvent.click(screen.getByRole('button', { name: 'Odśwież testowo' }));
  const alert = await screen.findByRole('alert');
  assert.match(alert.textContent ?? '', /ostatnio pobrane dane/);
  assert.ok(screen.getByRole('button', { name: /Test Cup/ }));
  await waitFor(() => assert.equal(calls, 2));
});
