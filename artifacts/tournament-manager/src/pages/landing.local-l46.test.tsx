import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import Landing from './landing';
afterEach(()=>cleanup());
test('module navigation still exposes both portfolio and stable tournament links',()=>{
 const location=memoryLocation({path:'/'});
 render(<Router hook={location.hook}><Landing/></Router>);
 const cards=screen.getAllByRole('link');
 const portfolio=cards.find(card=>card.getAttribute('href')==='/portfolio/');
 const tournaments=cards.find(card=>card.getAttribute('href')==='/tournaments');
 assert.ok(portfolio);
 assert.ok(tournaments);
 assert.match(portfolio.className,/focus-visible:ring-2/);
 assert.match(tournaments.className,/motion-reduce:transform-none/);
});
