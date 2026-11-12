import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { Bracket, Standing } from '@workspace/api-client-react';
import { RoundRobinView } from './round-robin-view';

afterEach(cleanup);
const bracket = {rounds:[{round:1,matches:[{
  id:72, matchNumber:4, status:'in_progress', player1Name:'Ala', player2Name:'Beata',
  player1Id:7, player2Id:8, score1:0, score2:0,
}]}]} as unknown as Bracket;
const standings = [{playerId:7,playerName:'Ala',rank:1,matchesPlayed:1,matchWins:1,matchLosses:0,gameWins:2,gameLosses:0,gameDiff:2}] as Standing[];

test('narrow standings has labeled scroll region, table name and expanded column names',()=>{
  render(<RoundRobinView bracket={bracket} standings={standings}/>);
  const region=screen.getByRole('region',{name:'Przewijana tabela klasyfikacji'});
  assert.equal(region.getAttribute('tabindex'),'0');
  const table=within(region).getByRole('table',{name:/Klasyfikacja graczy/});
  assert.equal(within(table).getByRole('columnheader',{name:'Rozegrane mecze'}).textContent,'M');
  assert.equal(within(table).getByRole('columnheader',{name:'Bilans gier'}).textContent,'+/−');
  assert.match(region.className,/overflow-x-auto/);
});
test('active round robin match has an explicit Polish status',()=>{
  render(<RoundRobinView bracket={bracket} standings={standings}/>);
  assert.ok(screen.getByText('W TOKU'));
});
