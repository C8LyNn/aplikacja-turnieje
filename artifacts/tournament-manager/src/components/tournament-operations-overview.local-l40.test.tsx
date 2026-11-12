import assert from 'node:assert/strict';
import { afterEach,test } from 'node:test';
import React from 'react';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { getGetTournamentAssistantQueryKey } from '@workspace/api-client-react';
import { TournamentOperationsOverview } from './tournament-operations-overview';

const initialFetch=globalThis.fetch;
afterEach(()=>{cleanup();globalThis.fetch=initialFetch;});

test('failed advisory refetch cannot leave a clickable stale recommendation',async()=>{
  const id=74;
  const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnMount:true}}});
  client.setQueryData(getGetTournamentAssistantQueryKey(id),{operations:{
    version:1,advisory:true,progress:{completed:0,total:1,percent:0,inProgress:0,pending:1,postponed:0,cancelled:0},
    recommendedAction:{title:'Zatwierdź',description:'Ostatni poprawny odczyt',href:`/tournaments/${id}?tab=stages`,availability:'ready',requiresConfirmation:true},blockers:[],
  }});
  let requests=0;
  globalThis.fetch=(async()=>{requests++;return new Response(JSON.stringify({error:'Unavailable'}),{status:503,headers:{'content-type':'application/json'}})}) as typeof fetch;
  const location=memoryLocation({path:`/tournaments/${id}`,record:true});
  render(<QueryClientProvider client={client}><Router hook={location.hook}><TournamentOperationsOverview tournamentId={id} enabled /></Router></QueryClientProvider>);
  await waitFor(()=>assert.ok(screen.getByText(/ostatniego udanego odczytu/).closest('[role=alert]')));
  assert.equal(screen.queryByRole('link',{name:/Przejdź do właściwego widoku/}),null);
  assert.ok(screen.getByText(/Przejście z nieaktualnej rekomendacji jest wstrzymane/));
  const before=requests;
  fireEvent.click(screen.getByRole('button',{name:'Ponów odczyt'}));
  await waitFor(()=>assert.ok(requests>before));
});
