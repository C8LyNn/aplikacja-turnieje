import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { TestAuthProvider } from '../../test/auth-provider';
import { RoleSelectionLink } from './app-navigation';
afterEach(()=>{cleanup();sessionStorage.clear();localStorage.clear();});
for(const [location,expected] of [['/support','/tournaments/stable'],['/tournaments/stable','/tournaments/stable'],['/experimental/tournaments/support','/experimental/tournaments']] as const){
 test(`L31 role chooser from ${location} resolves ${expected}`,()=>{
  const loc=memoryLocation({path:location});
  render(<TestAuthProvider><Router hook={loc.hook} searchHook={loc.searchHook}><RoleSelectionLink /></Router></TestAuthProvider>);
  const link=screen.getByRole('link',{name:'Zmień rolę turniejową'});
  assert.equal(link.getAttribute('href'),expected);
  assert.equal(link.getAttribute('aria-current'),location===expected?'page':null);
  assert.ok(link.className.includes('whitespace-nowrap'));
  assert.equal(link.querySelector('.sm\:hidden')?.textContent,'Zmień rolę');
 });
}
