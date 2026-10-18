// Certified V148 HTML stays read-only. Test hooks are inserted into a browser response in memory.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const source = process.argv.slice(2).find(a => !a.startsWith('--')) || 'C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html';
const expectedSha256 = 'bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceBytes = fs.readFileSync(source);
if (digest(sourceBytes) !== expectedSha256) throw new Error('Certified source hash mismatch');
const featuredBytes = fs.readFileSync(path.join(root, 'Assets/Resources/Data/featured-decks.json'));
const featured = JSON.parse(featuredBytes);

// This function is stringified and evaluated inside the original source closure.
function sourceFeaturedAudit(decks, mode = 'targeted', matchIndex = 0) {
  const tests = [];
  const selectedIds = new Set(decks.flatMap(d => d.balls));
  let current = null;
  const check = (ok, label, expected, actual) => {
    current.assertions.push({ label, pass: !!ok, expected: expected ?? null, actual: actual ?? null });
    return !!ok;
  };
  const eq = (actual, expected, label) => check(actual === expected, label, expected, actual);
  const near = (actual, expected, label, tolerance = .001) => check(Math.abs(actual - expected) <= tolerance, label, expected, actual);
  const alive = type => state.balls.filter(b => !b.dead && (!type || b.type === type));
  const hazards = kind => state.hazards.filter(h => h.kind === kind && h.life > 0);
  const structures = kind => state.structures.filter(s => !s.dead && (!kind || s.kind === kind));
  const init = (mapKey = 'classic') => {
    ccStartManualTest({ seed: 'featured-source-smoke-v149', deckA: decks[0].balls, deckB: decks[1].balls, mapKey, speed: 1 });
    state.phase = 'aim';
    return centerCircle();
  };
  let c;
  const ball = (type, owner = 'player', dx = 0, dy = 0) => spawn(owner, type, c.x + dx, c.y + dy, 0, 0);
  const stop = b => { b.vx = 110; b.vy = 0; updateKeywordMotion(b, .2); b.vx = b.vy = 0; updateKeywordMotion(b, .2); };
  const turn = owner => { state.currentTurnNumber++; state.turn = owner; state.ownerTurns[owner]++; applyTurnStartEffects(owner); };
  const contact = (a, b, speed = 150) => {
    a.spawnGrace = b.spawnGrace = 0;
    b.x = a.x + a.r + b.r - .1; b.y = a.y;
    a.vx = speed; a.vy = b.vx = b.vy = 0;
    a.motionState = 'moving'; b.motionState = 'resting';
    keywordPhysicsFrame += 3; collide(a, b);
  };
  const test = (id, name, fn) => {
    if (!selectedIds.has(id) && !id.startsWith('combo:')) return;
    current = { id, name, assertions: [], pass: false };
    tests.push(current);
    try { c = init(); const detail = fn(); current.detail = detail ?? null; }
    catch (error) { current.error = String(error.stack || error); }
    current.pass = !current.error && current.assertions.length > 0 && current.assertions.every(a => a.pass);
    current.pipelineTail = V147_PIPELINE_LOG.slice(-4).map(e => structuredClone(e));
  };
  if (mode === 'match') {
    const deck = decks[matchIndex];
    massSimActive = true;
    try {
      const result = ccMassOneGame({ paired: false, alternateSides: false, seed: `featured-${deck.id}`, mapKey: 'classic',
        deckX: deck.balls, deckY: 'basic_only', strategyX: 'center_hard', strategyY: 'center_medium',
        maxPhysicsSteps: 10000, rules: { ...STANDARD_MATCH_RULES } }, 0);
      const deployment = deck.balls.map(id => ({ id, startingCopies: tierCopies(id), remainingCopies: playerStock[id], usedCopies: tierCopies(id) - playerStock[id] }));
      return { deckId: deck.id, deckName: deck.name, deckBalls: deck.balls, opponent: 'basic_only', rules: { ...STANDARD_MATCH_RULES },
        deployment, result, finalState: { gameOver: state.gameOver, phase: state.phase, result: state.gameResult,
          livingPlayerTypes: alive().filter(b => b.owner === 'player').map(b => b.type) },
        pass: state.gameOver && !result.safetyCap && result.forcedSettles === 0 && deployment.some(d => d.usedCopies > 0) && result.actions > 0 && result.physicsSteps > 0 && result.reason !== 'UNKNOWN' };
    } finally { massSimActive = false; matchStarted = false; }
  }

  test('anchor', 'STOP anchors; action preparation releases one earth stack', () => {
    const a = ball('anchor'); stop(a);
    eq(a.earthAnchorStacks, 3, 'STOP sets three anchor stacks'); eq(a.anchored, true, 'STOP anchored');
    prepareBallForAction(a); eq(a.earthAnchorStacks, 2, 'launch removes one earth stack'); eq(a.anchored, false, 'launch releases anchor');
  });
  test('bounce', 'High-speed natural wall contact adds shield, low speed does not', () => {
    const a = ball('bounce'); a.vx = 500;
    triggerNaturalWallEffects(a); eq(a.shieldHP, 5, 'overdrive wall grants five shield');
    a.naturalWallCooldown = 0; a.vx = 40; triggerNaturalWallEffects(a); eq(a.shieldHP, 5, 'slow wall grants no shield');
    return { wallRestitution: a.wallRestitution, restitution: a.restitution };
  });
  test('ricochet', 'STOP grants replay only in outer arena band', () => {
    const a = ball('ricochet'); stop(a); eq(!!a.finisherReplayReady, false, 'central STOP has no replay');
    state.currentTurnNumber++; a.x = field.left + 45; stop(a); eq(a.finisherReplayReady, true, 'outer STOP grants replay');
  });
  test('slingshot', 'STOP gathers and launches nearby ally', () => {
    const a = ball('slingshot'), ally = ball('normal', 'player', 100); a.lastMoveAngle = -Math.PI / 2;
    stop(a); check(ally.vy < -250, 'ally launches forward', '< -250', ally.vy);
    near(Math.hypot(ally.x - a.x, ally.y - a.y), a.r + ally.r + 8, 'ally gathered to source ring');
  });
  test('ram', 'Strong enemy contact damages and pushes beyond baseline impact', () => {
    const a = ball('ram'), e = ball('normal', 'cpu', 60); const hp = e.hp;
    contact(a, e, 200); check(e.hp < hp, 'enemy loses HP', `< ${hp}`, e.hp); check(e.vx > 100, 'enemy pushed forward', '> 100', e.vx);
    return { targetDamage: hp - e.hp, ramHp: a.hp };
  });
  test('pinballer', 'STOP deploys one edge bumper', () => {
    const a = ball('pinballer'); stop(a); const made = structures('bumper');
    eq(made.length, 1, 'one bumper'); check(made.every(s => s.bounce > 1), 'bumper amplifies rebound', '>1', made.map(s => s.bounce)); return made;
  });
  test('harpoon', 'STOP pulls farthest enemy in long range', () => {
    const a = ball('harpoon'), n = ball('normal', 'cpu', 65), f = ball('normal', 'cpu', 190);
    stop(a); check(f.vx < -500, 'far enemy pulled', '<-500', f.vx); eq(n.vx, 0, 'near enemy untouched');
  });
  test('singularity', 'DEATH hole grows, consumes both teams without DEATH and expires at ten', () => {
    const a = ball('singularity'); killBall(a); const h = hazards('blackHole')[0];
    eq(hazards('blackHole').length, 1, 'death produces one black hole'); if (!h) return;
    eq(h.r, 34, 'initial radius'); growBlackHolesOnTurn(); near(h.r, 40.8, 'global turn grows twenty percent');
    const deadType = ball('cascade', 'cpu', 140); deadType.x = h.x; deadType.y = h.y; update(.001);
    eq(deadType.v148Terminal, 'CONSUMED', 'enemy terminal state consumed'); eq(state.balls.includes(deadType), false, 'consumed ball removed'); eq(deadType.dead, false, 'consume is distinct from DEATH'); eq(alive('cascade').length, 0, 'consume suppresses Cascade DEATH successor');
    for (let i = 1; i < 10; i++) { const b = ball('normal', i % 2 ? 'player' : 'cpu', 150); b.x = h.x; b.y = h.y; update(.001); }
    eq(h.swallowed, 10, 'ten consumes'); eq(h.life <= 0, true, 'hole expires at ten'); eq(V148_CONSUME_LOG.length, 10, 'ten consume records');
  });
  test('gatekeeper', 'STOP creates pair, teleports, recast replaces pair and DEATH cleans up', () => {
    const a = ball('gatekeeper', 'player', -90, 80); stop(a); const pair = hazards('gatePortal');
    eq(pair.length, 2, 'two live portals'); if (pair.length !== 2) return;
    a.x = c.x + 175; a.y = c.y + 200;
    const b = ball('normal', 'cpu', 150); b.x = pair[0].x; b.y = pair[0].y; b.vx = 100;
    const before = { x: b.x, y: b.y }; processGatePortals();
    check(Math.hypot(b.x - before.x, b.y - before.y) > 100, 'ball teleported', '>100', Math.hypot(b.x - before.x, b.y - before.y));
    near(b.vx, 92, 'portal keeps 92 percent velocity');
    state.currentTurnNumber++; stop(a); eq(hazards('gatePortal').length, 2, 'recast retains one live pair');
    killBall(a); eq(hazards('gatePortal').length, 0, 'source death removes live portals');
  });
  test('cindertrail', 'Moving trail persists through frames and applies fire at turn end for three ticks', () => {
    const a = ball('cindertrail'); a.trailLastX = a.x - 70; a.trailLastY = a.y; emitElementTrail(a, 220);
    const h = hazards('elementTrail')[0]; eq(hazards('elementTrail').length, 1, 'one trail node'); if (!h) return;
    eq(h.element, 'fire', 'fire node'); const e = ball('normal', 'cpu', 150); e.x = h.x; e.y = h.y;
    update(.01); eq(e.fireStacks || 0, 0, 'physics frame does not apply periodic fire'); eq(h.turnsLeft, 3, 'physics does not age node');
    v148ResolveTurnEnd('player'); eq(e.fireStacks, 1, 'turn end applies fire'); eq(h.turnsLeft, 2, 'one lifetime tick spent');
    state.currentTurnNumber++; v148ResolveTurnEnd('cpu'); state.currentTurnNumber++; v148ResolveTurnEnd('player'); eq(h.life, 0, 'expires after third turn-end tick');
  });
  test('frostguard', 'STOP anchors and shields; incoming enemy HIT receives ice', () => {
    const a = ball('frostguard'); stop(a); eq(a.anchored, true, 'anchored'); eq(a.shieldHP, 10, 'ten shield');
    const e = ball('normal', 'cpu', -70); contact(e, a, 150); eq(e.iceStacks, 1, 'attacker receives ice');
  });
  test('worldshaper', 'STOP affects existing neutral geometry; classic empty map is a no-op', () => {
    const a = ball('worldshaper'); stop(a); eq(state.mapObstacles.length, 0, 'classic has no neutral geometry');
    eq(structures().length, 0, 'classic STOP creates no geometry');
    const map = MAP_VARIANTS.find(m => m.key !== 'classic' && (m.obstacles || []).length > 0) || MAP_VARIANTS.find(m => m.key !== 'classic');
    c = init(map.key); const w = ball('worldshaper', 'player', 0, 130);
    const before = state.mapObstacles.map(o => ({ id: o.id, x: o.x, y: o.y })); stop(w);
    const changed = before.filter((o, i) => o.x !== state.mapObstacles[i].x || o.y !== state.mapObstacles[i].y);
    check(before.length > 0, 'geometry map contains obstacles', '>0', before.length); check(changed.length > 0, 'STOP moves neutral geometry', '>0', changed.length);
    return { map: map.key, obstacleCount: before.length, moved: changed.length, outward: w.worldshaperOutward, before, after: state.mapObstacles.map(o => ({ id: o.id, x: o.x, y: o.y })) };
  });
  test('barricade', 'STOP attempts four small wall orbs with placement limits', () => {
    const a = ball('barricade'); stop(a); const made = structures('wallOrb');
    eq(made.length, 4, 'open board deploys four wall orbs'); eq(made.every(s => s.hitsRemaining === 2), true, 'each has two hit durability');
    return made;
  });
  test('sentry', 'STOP creates single finite-ammo turret; owner-turn parity gates firing', () => {
    const a = ball('sentry'); stop(a); const made = structures('turret'); eq(made.length, 1, 'one turret'); if (!made.length) return;
    const s = made[0], e = ball('normal', 'cpu', 100); eq(s.ammo, 5, 'five ammo');
    state.ownerTurns.player = 1; processTurrets('player'); eq(s.ammo, 5, 'odd owner turn skips');
    state.ownerTurns.player = 2; const hp = e.hp; processTurrets('player'); eq(s.ammo, 4, 'even owner turn spends one ammo'); eq(e.hp, hp - 5, 'shot deals five');
    return made;
  });
  test('mine', 'STOP arms, ally contact preserves mine, enemy HIT detonates', () => {
    const a = ball('mine'); stop(a); eq(a.mineArmed, true, 'armed on STOP'); eq(hazards('mineRing').length, 1, 'linked ring');
    const ally = ball('normal', 'player', -80); contact(ally, a, 100); eq(a.dead, false, 'ally cannot detonate'); eq(a.mineArmed, true, 'ally preserves armed state');
    ally.x = c.x - 150; const e = ball('normal', 'cpu', -80); const hp = e.hp; contact(e, a, 100);
    eq(a.dead, true, 'enemy HIT detonates mine'); eq(a.mineArmed, false, 'charge consumed'); check(e.hp < hp, 'enemy receives explosion damage', `<${hp}`, e.hp);
  });
  test('timebomb', 'STOP arms; enemy contact does not detonate; second owner TURN does', () => {
    const a = ball('timebomb'); stop(a); eq(a.timeBombArmed, true, 'armed'); eq(a.timeBombCounter, 0, 'counter zero');
    const e = ball('normal', 'cpu', -80); contact(e, a, 100); eq(a.dead, false, 'contact does not detonate');
    e.x = a.x + 100; e.y = a.y; e.vx = e.vy = a.vx = a.vy = 0;
    turn('cpu'); eq(a.timeBombCounter, 0, 'enemy turn does not increment');
    turn('player'); eq(a.dead, false, 'first owner turn survives'); eq(a.timeBombCounter, 1, 'first counter');
    turn('player'); eq(a.dead, true, 'second owner turn detonates');
  });
  test('web', 'STOP creates four single-charge nodes; enemy contact roots and consumes one', () => {
    const a = ball('web'); stop(a); const made = hazards('web'); eq(made.length, 4, 'open board produces four web nodes'); if (!made.length) return;
    const h = made[0], e = ball('normal', 'cpu', 170); e.x = h.x; e.y = h.y; e.vx = 70; update(.001);
    eq(h.charges, 0, 'node spent'); eq(!!e.v148Rooted, true, 'enemy rooted'); eq(hazards('web').length, 3, 'three web nodes remain');
    return made.map(h => ({ id: h.id, kind: h.kind, charges: h.charges, r: h.r }));
  });
  test('halo', 'First kinetic impact cancelled; second hurts', () => {
    const a = ball('halo'); const hp = a.hp; damageBall(a, 5, { kind: 'impact', kinetic: true });
    eq(a.hp, hp, 'first hit cancelled'); eq(a.divineShield, 0, 'halo consumed'); damageBall(a, 5, { kind: 'impact', kinetic: true }); eq(a.hp, hp - 5, 'second hit damages');
  });
  test('phoenix', 'DEATH returns to hand, regenerates and legally relaunches', () => {
    const a = ball('phoenix'); killBall(a); const hand = state.phoenixHand.player;
    eq(hand?.hp, 5, 'hand starts with five HP'); eq(V148_RETURN_LOG.at(-1)?.subtype, 'REPLAY_RETURN', 'hand emits canonical RETURN');
    eq(phoenixHandReady('player'), false, 'locked until next owner turn'); turn('player'); eq(phoenixHandReady('player'), true, 'unlocked'); eq(hand.hp, 10, 'regenerated five HP');
    const p = launchPad('player'); const reborn = spawnFromStock('player', 'phoenix', p.x, p.y, 0, -300);
    check(!!reborn && !reborn.dead, 'hand relaunch succeeds', true, !!reborn); eq(reborn?.hp, 10, 'relaunch preserves hand HP'); eq(state.phoenixHand.player, null, 'hand consumed');
  });
  test('brood', 'Five owner turns spawn five 5 HP broodlings and exhaust parent', () => {
    const a = ball('brood'); for (let i = 0; i < 5; i++) turn('player');
    eq(alive('broodling').length, 5, 'five broodlings'); eq(a.broodSpawnCount, 5, 'five charges spent'); eq(a.dead, true, 'parent exhausted');
    eq(alive('broodling').every(b => b.hp === 5 && b.scoreWeight === .5), true, 'children HP and scoring');
  });
  test('cascade', 'DEATH succession 20 to 10 to 5 ends, with same lineage and RETURN', () => {
    const a = ball('cascade'); eq(a.maxHp, 25, 'V148 normalized initial twenty-five'); killBall(a); const b = alive('cascade')[0];
    eq(b?.hp, 10, 'first successor ten'); eq(v148Lineage(b), v148Lineage(a), 'lineage retained');
    state.currentTurnNumber++; killBall(b); const d = alive('cascade')[0]; eq(d?.hp, 5, 'second successor five');
    state.currentTurnNumber++; killBall(d); eq(alive('cascade').length, 0, 'no fourth life'); eq(V148_RETURN_LOG.length, 2, 'two RETURN events');
  });
  test('gravehide', 'Three non-token RETURN events on separate turns produce permanent ancestry', () => {
    const a = ball('gravehide'), b = ball('normal', 'player', 120); const hp = a.maxHp;
    v148EmitReturn(b, b, 'REVIVE'); eq(a.v148ReturnStacks, 1, 'first return stack');
    v148EmitReturn(b, b, 'REVIVE'); eq(a.v148ReturnStacks, 1, 'one per turn');
    for (let i = 0; i < 2; i++) { state.currentTurnNumber++; v148EmitReturn(b, b, 'REVIVE'); }
    eq(a.v148ReturnStacks, 3, 'three stacks'); eq(a.v148Ancestral, true, 'ancestral upgrade'); eq(a.maxHp, hp + 10, 'plus ten max HP');
    state.currentTurnNumber++; v148EmitReturn(b, b, 'REVIVE'); eq(a.maxHp, hp + 10, 'upgrade does not repeat');
  });
  test('lifewave', 'STOP equalizes nearby ally HP ratios and heals base for three allies', () => {
    const a = ball('lifewave'), b = ball('normal', 'player', 80), d = ball('normal', 'player', -80);
    a.hp = 5; b.hp = 10; d.hp = d.maxHp; state.p1hp = 15; stop(a);
    check(a.hp > 5, 'injured source receives redistributed HP', '>5', a.hp); check(d.hp < d.maxHp, 'healthy ally shares HP', `<${d.maxHp}`, d.hp); eq(state.p1hp, 16, 'three allies heal one base HP');
    return [a, b, d].map(b => ({ type: b.type, hp: b.hp, maxHp: b.maxHp }));
  });
  test('fusion', 'Ally contact consumes Fusion and transfers its HP into shield', () => {
    const a = ball('fusion'), b = ball('normal', 'player', 60); const hp = a.hp; contact(a, b, 150);
    eq(a.dead, true, 'Fusion consumed'); eq(b.shieldHP, Math.max(5, hp), 'HP transferred to shield'); eq(b.dead, false, 'ally survives');
  });
  test('necromancer', 'Third owner turn revives eligible ally at 5 HP with RETURN', () => {
    const a = ball('necromancer'), dead = ball('ram', 'player', 120); killBall(dead);
    eq(state.graveyard.player.length, 1, 'eligible death enters graveyard'); turn('player'); turn('player'); eq(alive('ram').length, 0, 'not before third owner turn');
    turn('player'); const b = alive('ram')[0]; eq(b?.hp, 5, 'revived at five HP'); eq(a.necromancerRevives, 1, 'revive charge spent'); eq(V148_RETURN_LOG.at(-1)?.subtype, 'REVIVE', 'canonical return');
  });
  test('genesis', 'DEATH creates generator; next three global turns spawn living owned balls', () => {
    const a = ball('genesis'); killBall(a); const h = hazards('whiteHole')[0]; eq(hazards('whiteHole').length, 1, 'one white hole'); if (!h) return;
    processWhiteHolesOnTurn(); eq(h.spawned, 0, 'death turn does not spawn');
    const spawned = [];
    for (let i = 0; i < 3; i++) { state.currentTurnNumber++; processWhiteHolesOnTurn(); const b = alive().find(b => b.whiteHoleGenerated && !spawned.includes(b.id)); if (b) spawned.push(b.id); }
    eq(h.spawned, 3, 'three generated balls'); eq(spawned.length, 3, 'distinct generated instances'); eq(h.life, 0, 'generator expires');
    const children = state.balls.filter(b => spawned.includes(b.id)); eq(children.every(b => b.owner === 'player' && b.type !== 'genesis' && b.type !== 'shard' && b.hp > 0), true, 'spawn ownership, eligibility and HP');
    const child = children[0]; if (child) { child.vx = 200; updateKeywordMotion(child, .2); eq(child.motionState, 'moving', 'generated child participates in motion'); damageBall(child, 9999, { kind: 'audit' }); if (child.hp <= 0) killBall(child); eq(child.dead, true, 'generated child completes death lifecycle'); }
    return children.map(b => ({ id: b.id, type: b.type, dead: b.dead, hp: b.hp }));
  });
  test('chronomancer', 'Two STOP events save then restore position and HP', () => {
    const a = ball('chronomancer'); a.hp = 15; const saved = { x: a.x, y: a.y }; stop(a); check(!!a.chronomancerSave, 'snapshot created', true, !!a.chronomancerSave);
    a.x += 70; a.hp = 5; state.currentTurnNumber++; stop(a); eq(a.hp, 15, 'HP restored'); near(a.x, saved.x, 'x restored'); near(a.y, saved.y, 'y restored'); eq(a.chronomancerSave, null, 'snapshot consumed');
  });
  test('furnace', 'Owner TURN creates refreshable fire zone; turn end applies fire', () => {
    const a = ball('furnace'), e = ball('normal', 'cpu', 80); turn('cpu'); eq(hazards('elementZone').length, 0, 'enemy turn cannot create');
    turn('player'); const h = hazards('elementZone')[0]; eq(hazards('elementZone').length, 1, 'owner creates one zone'); eq(h?.r, 104, 'radius104');
    v148ResolveTurnEnd('player'); eq(e.fireStacks, 1, 'turn end applies fire'); turn('player'); eq(hazards('elementZone').length, 1, 'source refreshes one zone');
  });
  test('chainfrost', 'STOP chains ice to at most four enemies', () => {
    const a = ball('chainfrost'), enemies = [60, 110, 160, 210, 260].map(dx => ball('normal', 'cpu', 0, dx));
    stop(a); eq(enemies.filter(b => b.iceStacks === 1).length, 4, 'four receive one ice'); eq(enemies[4].iceStacks || 0, 0, 'fifth excluded');
  });
  test('rimeburst', 'Strong HIT on frozen enemy consumes freeze and spreads one ice to two', () => {
    const a = ball('rimeburst'), e = ball('normal', 'cpu', 50), n = ball('normal', 'cpu', 75, 50), d = ball('normal', 'cpu', 75, -50), f = ball('normal', 'cpu', 200);
    e.frozen = 2.4; contact(a, e, 140); eq(e.frozen, 0, 'freeze consumed'); eq(n.iceStacks, 1, 'first neighbor ice'); eq(d.iceStacks, 1, 'second neighbor ice'); eq(f.iceStacks || 0, 0, 'far target excluded');
  });
  test('banish', 'Enemy contact exiles without death and returns after three global turns', () => {
    const a = ball('banish'), e = ball('normal', 'cpu', 60); contact(a, e, 150);
    eq(e.banished, true, 'exiled'); eq(e.dead, false, 'not death'); eq(state.balls.includes(e), false, 'removed from active board'); eq(state.banished.length, 1, 'one queued return');
    state.currentTurnNumber += 2; processBanishedReturns(); eq(e.banished, true, 'still out after two turns');
    state.currentTurnNumber++; processBanishedReturns(); eq(e.banished, false, 'returns after three'); eq(state.balls.includes(e), true, 'back on board');
  });
  test('vortexmedic', 'STOP pulls enemies and heals the most injured nearby ally', () => {
    const a = ball('vortexmedic'), e = ball('normal', 'cpu', 100), ally = ball('normal', 'player', -80); ally.hp = 5;
    stop(a); check(e.vx < -300, 'enemy pulled', '<-300', e.vx); eq(ally.hp, 10, 'one enemy enables five healing');
  });
  test('leech', 'Enemy contact attaches; host owner TURN drains five and heals source', () => {
    const a = ball('leech'), e = ball('normal', 'cpu', 60); a.hp = 5; contact(a, e, 150);
    eq(a.attachedTo, e.id, 'attached to enemy'); update(.001); const hp = e.hp, leechHp = a.hp;
    turn('cpu'); eq(e.hp, hp - 5, 'host loses five HP'); eq(a.hp, Math.min(a.maxHp, leechHp + 5), 'leech gains drain'); eq(V148_DRAIN_LOG.at(-1)?.resourceType, 'BALL_HP', 'canonical drain logged');
  });
  test('assimilator', 'Enemy contact transforms target type while preserving owner', () => {
    const a = ball('assimilator'), e = ball('ram', 'cpu', 60); contact(a, e, 150);
    eq(e.type, 'assimilator', 'target transformed'); eq(e.owner, 'cpu', 'target remains enemy-owned'); eq(a.type, 'assimilator', 'source remains assimilator');
  });
  test('tesla', 'Owner TURN chains impulses to three enemies without electric damage', () => {
    const a = ball('tesla'), enemies = [60, 110, 160, 210].map(dx => ball('normal', 'cpu', dx)); const hp = enemies.map(b => b.hp);
    turn('player'); eq(enemies.filter(b => Math.hypot(b.vx, b.vy) > 0).length, 3, 'three enemy impulses');
    eq(enemies.every((b, i) => b.hp === hp[i]), true, 'wind Tesla applies no direct damage'); check(a.windMomentum > 0, 'source gains momentum', '>0', a.windMomentum);
  });
  test('mimic', 'Enemy contact steals type and turns target into Standard', () => {
    const a = ball('mimic'), e = ball('ram', 'cpu', 60); contact(a, e, 20);
    eq(a.type, 'ram', 'Mimic becomes target type'); eq(e.type, 'normal', 'target becomes Standard'); eq(a.owner, 'player', 'source ownership'); eq(e.owner, 'cpu', 'target ownership');
  });

  test('agony', 'Slow ally TOUCH triggers repeatable Bonfire DEATH without killing source', () => {
    const a = ball('agony'), b = ball('bonfire', 'player', 60), e = ball('normal', 'cpu', 65, 65); const hp = e.hp;
    contact(a, b, 20); eq(b.dead, false, 'Bonfire stays alive'); eq(e.hp, hp - 10, 'copied death deals ten'); eq(e.fireStacks, 1, 'copied death applies fire');
  });
  test('requiem', 'STOP repeats nearby ally DEATH, creates return without killing Cascade', () => {
    const a = ball('requiem'), b = ball('cascade', 'player', 70); stop(a);
    eq(b.dead, false, 'original Cascade remains alive'); eq(alive('cascade').length, 2, 'one successor created'); eq(V148_RETURN_LOG.length, 1, 'RETURN emitted by copied Cascade death');
    eq(alive('cascade').filter(b => b.hp === 10).length, 1, 'successor has ten HP');
  });
  test('bonfire', 'DEATH heals allies five and damages enemies ten plus fire', () => {
    const a = ball('bonfire'), ally = ball('normal', 'player', -70), e = ball('normal', 'cpu', 70); ally.hp = 5; const hp = e.hp;
    killBall(a); eq(ally.hp, 10, 'ally healed five'); eq(e.hp, hp - 10, 'enemy damaged ten'); eq(e.fireStacks, 1, 'enemy fire');
  });
  test('wildfire', 'DEATH creates fire zone; damage is periodic fire rather than immediate blast', () => {
    const a = ball('wildfire'), e = ball('normal', 'cpu', 70); const hp = e.hp; killBall(a);
    eq(hazards('elementZone').length, 1, 'fire zone created'); eq(e.hp, hp, 'no immediate death blast damage'); eq(e.fireStacks || 0, 0, 'no immediate fire');
    v148ResolveTurnEnd('player'); eq(e.fireStacks, 1, 'turn end fire'); turn('cpu'); eq(e.hp, hp - 5, 'owner-turn burn five');
  });
  test('soulburst', 'Lethal DEATH uses missing HP to cap burst at ten in short range', () => {
    const a = ball('soulburst'), e = ball('normal', 'cpu', 70), far = ball('normal', 'cpu', 170); const hp = e.hp, farHp = far.hp;
    a.hp = 0; killBall(a); eq(e.hp, hp - 10, 'missing HP burst caps ten'); eq(far.hp, farHp, 'outside short unharmed');
  });
  test('reclaimer', 'STOP revives oldest eligible ally fifteen HP, pays ten once', () => {
    const dead = ball('bonfire', 'player', 180); killBall(dead); const a = ball('reclaimer'); const hp = a.hp; stop(a);
    eq(alive('bonfire')[0]?.hp, 15, 'revived at fifteen'); eq(a.hp, hp - 10, 'cost ten'); eq(a.reclaimerUsed, true, 'single-use flag'); eq(V148_RETURN_LOG.at(-1)?.subtype, 'REVIVE', 'return emitted');
    state.currentTurnNumber++; stop(a); eq(alive('bonfire').length, 1, 'second STOP cannot revive again');
  });
  test('packheart', 'Cascade RETURN receives five shield once per target per turn; token excluded', () => {
    ball('packheart'); const a = ball('cascade', 'player', 110); killBall(a); const b = alive('cascade')[0];
    eq(b?.shieldHP, 5, 'Cascade return shield'); v148EmitReturn(a, b); eq(b?.shieldHP, 5, 'duplicate target same turn blocked');
    const token = ball('broodling', 'player', -120); v148EmitReturn(token, token); eq(token.shieldHP || 0, 0, 'token excluded');
    state.currentTurnNumber++; v148EmitReturn(a, b); eq(b.shieldHP, 10, 'same target next turn allowed');
  });
  test('blightpool', 'STOP zone applies toxin on turn end, three ticks only', () => {
    const a = ball('blightpool'), e = ball('normal', 'cpu', 70); stop(a); const h = hazards('blightZone')[0];
    eq(hazards('blightZone').length, 1, 'one zone'); eq(!!e.infected, false, 'no immediate toxin'); v148ResolveTurnEnd('player'); eq(e.infected, true, 'turn-end toxin'); eq(h.turnsLeft, 2, 'first lifetime tick');
    state.currentTurnNumber++; v148ResolveTurnEnd('cpu'); state.currentTurnNumber++; v148ResolveTurnEnd('player'); eq(h.life, 0, 'expires after three ticks');
  });
  test('plagueleech', 'Actual source requires poisoned sticky/webbed target before TOUCH can bind', () => {
    const a = ball('plagueleech'), e = ball('normal', 'cpu', 60); a.hp = 5; contact(a, e, 20);
    eq(!!e.infected, false, 'risk confirmed: clean target fails TOUCH gate'); eq(a.plagueLeechTargetId ?? null, null, 'risk confirmed: clean target not bound');
    applyToxinStatus(e, 'player', a.id); e.sticky = 1; contact(a, e, 20);
    eq(e.infected, true, 'TOUCH toxin'); eq(a.plagueLeechTargetId, e.id, 'target bound'); const hp = e.hp, own = a.hp;
    turn('player'); eq(e.hp, hp - 5, 'own turn drain'); eq(a.hp, own + 5, 'own healing'); eq(V148_DRAIN_LOG.length, 1, 'drain logged');
  });
  test('vector', 'Poisoned enemy DEATH spreads toxin to nearest clean enemy in medium', () => {
    const a = ball('vector'), e = ball('normal', 'cpu', 70), n = ball('normal', 'cpu', 130), far = ball('normal', 'cpu', -180);
    applyToxinStatus(e, 'player', a.id); killBall(e); eq(n.infected, true, 'nearest clean infected'); eq(!!far.infected, false, 'distant clean remains clear');
  });
  test('septiccore', 'HIT on toxin builds source-target Virulence; second qualifying turn bursts', () => {
    const a = ball('septiccore'), e = ball('normal', 'cpu', 60); applyToxinStatus(e, 'player', a.id);
    contact(a, e, 100); eq(v148Virulence(a, e), 1, 'first qualifying HIT stack');
    contact(a, e, 100); eq(v148Virulence(a, e), 1, 'per-target-per-turn gate');
    state.currentTurnNumber++; const hp = e.hp; contact(a, e, 100); eq(v148Virulence(a, e), 0, 'second turn threshold resets'); check(e.hp <= hp - 5, 'burst contributes five damage', `<=${hp - 5}`, e.hp);
  });
  test('consecrator', 'STOP zone cleanses toxin at TURN END, not during STOP', () => {
    const a = ball('consecrator'), b = ball('normal', 'player', 70); applyToxinStatus(b, 'cpu'); stop(a);
    eq(hazards('consecratedZone').length, 1, 'zone created'); eq(b.infected, true, 'STOP does not cleanse immediately');
    v148ResolveTurnEnd('player'); eq(b.infected, false, 'turn end removes toxin'); eq(b.toxinTurns, 0, 'toxin timer cleared');
  });
  test('absolver', 'Ward genuine CLEANSE adds shield to cleansed ally, not unaffected ally', () => {
    ball('absolver', 'player', -120); const a = ball('ward'), b = ball('normal', 'player', 70), untouched = ball('normal', 'player', 0, 100); applyFireStatus(b, 'cpu');
    stop(a); eq(b.fireStacks, 0, 'Ward clears fire'); eq(b.shieldHP, 10, 'Ward five plus Absolver five'); eq(untouched.shieldHP, 5, 'no cleanse payoff for clear ally');
  });
  test('penitent', 'Ally TOUCH transfers toxin but generic ally contagion re-infects relieved ally', () => {
    const a = ball('penitent'), b = ball('normal', 'player', 60); ball('absolver', 'player', -100); applyToxinStatus(b, 'cpu');
    contact(a, b, 20); eq(b.infected, true, 'risk confirmed: same collision re-infects ally'); eq(a.infected, true, 'Penitent takes toxin'); eq(a.toxinTurns, 3, 'duration transferred'); eq(V148_STATUS_TRANSFER_LOG.at(-1)?.status, 'TOXIN', 'transfer logged'); eq(b.shieldHP || 0, 0, 'transfer is not CLEANSE');
  });
  test('ward', 'STOP clears fire and gives shield but preserves toxin and ROOTED', () => {
    const a = ball('ward'), b = ball('normal', 'player', 80); applyFireStatus(b, 'cpu'); applyToxinStatus(b, 'cpu'); v148ApplyRooted(b, { owner: 'cpu', id: 99999 });
    stop(a); eq(b.fireStacks, 0, 'fire removed'); eq(b.shieldHP, 5, 'five shield'); eq(b.infected, true, 'toxin preserved'); eq(v148RootedActive(b), true, 'rooted preserved');
  });
  test('briarheart', 'ROOTED enemy HIT deals bonus five; slow TOUCH does not', () => {
    const a = ball('briarheart'), e = ball('normal', 'cpu', 60); v148ApplyRooted(e, { owner: 'player', id: a.id }); const hp = e.hp;
    contact(a, e, 20); eq(e.hp, hp, 'slow TOUCH no HIT bonus'); state.currentTurnNumber++; contact(a, e, 100); check(e.hp <= hp - 5, 'strong HIT includes bonus five', `<=${hp - 5}`, e.hp);
    return { targetLoss: hp - e.hp };
  });
  test('vinehook', 'STOP pulls nearest non-anchored enemy once per turn', () => {
    const a = ball('vinehook'), anchored = ball('anchor', 'cpu', 60), e = ball('normal', 'cpu', 110); anchored.anchored = true;
    stop(a); eq(anchored.vx, 0, 'anchored target skipped'); check(e.vx < -250, 'eligible target pulled', '<-250', e.vx);
    const vx = e.vx; stop(a); eq(e.vx, vx, 'second STOP same turn does not add impulse');
  });
  test('gravitymine', 'STOP arms persistent trap; enemy entering trigger range detonates', () => {
    const a = ball('gravitymine'); stop(a); eq(a.gravityMineArmed, true, 'armed'); const h = hazards('gravityMine')[0]; eq(hazards('gravityMine').length, 1, 'one linked trap'); if (!h) return;
    const e = ball('normal', 'cpu', 80); const hp = e.hp; update(.001); eq(a.dead, true, 'source consumed by trigger'); eq(h.life <= 0, true, 'trap expires'); check(e.hp < hp, 'enemy takes blast damage', `<${hp}`, e.hp);
  });
  test('horizonrelay', 'Every third enemy non-token Singularity consume damages base one', () => {
    const relay = ball('horizonrelay', 'player', -180), source = ball('singularity'); killBall(source); const h = hazards('blackHole')[0]; if (!h) throw new Error('Hole missing');
    const consume = (type, owner) => { const b = ball(type, owner, 170); b.x = h.x; b.y = h.y; update(.001); return b; };
    const hp = state.p2hp; consume('normal', 'player'); consume('broodling', 'cpu'); eq(relay.v148Horizon || 0, 0, 'ally and token consumes excluded');
    consume('normal', 'cpu'); eq(relay.v148Horizon, 1, 'first enemy consume'); consume('normal', 'cpu'); eq(state.p2hp, hp, 'second consume no base damage');
    consume('normal', 'cpu'); eq(state.p2hp, hp - 1, 'third consume one base damage'); eq(relay.v148Horizon, 0, 'counter reset');
  });
  test('doppelganger', 'Slow enemy TOUCH copies type and leaves enemy type intact', () => {
    const a = ball('doppelganger'), e = ball('ward', 'cpu', 60); contact(a, e, 20);
    eq(a.type, 'ward', 'copy at TOUCH speed'); eq(e.type, 'ward', 'enemy unchanged'); eq(a.owner, 'player', 'copy owner retained'); eq(a.doppelUsed, true, 'copy flag');
  });
  test('wildcard', 'STOP transforms into nonunique visible special preserving rounded HP ratio', () => {
    const a = ball('wildcard'); a.hp = 10; const ratio = a.hp / a.maxHp; stop(a);
    check(a.type !== 'wildcard' && a.type !== 'normal', 'different special', 'different special', a.type); eq(tierKey(a.type) !== 'unique', true, 'nonunique'); eq(!!TYPES[a.type].hidden, false, 'not hidden'); eq(a.hp, snapBallHp(a.maxHp * ratio, a.maxHp), 'ratio preserved through canonical HP rounding'); return { transformedType: a.type, hp: a.hp, maxHp: a.maxHp };
  });
  test('collector', 'Global deaths add unique signatures; STOP uses trait signature', () => {
    const a = ball('collector'); stop(a); eq(a.shieldHP, 5, 'empty collection grants shield');
    const e = ball('ice', 'cpu', 160); killBall(e); eq(a.collectorAbilities.has('ice'), true, 'enemy death collected'); eq(a.maxHp, 30, 'first unique type adds five max HP');
    const enemy = ball('normal', 'cpu', 70); state.currentTurnNumber++; stop(a); eq(enemy.iceStacks, 1, 'freeze signature applies ice');
  });
  test('echo', 'STOP repeats allied and enemy STOP handlers without recursive Echo', () => {
    const a = ball('echo'), ally = ball('chronomancer', 'player', -80), enemy = ball('chronomancer', 'cpu', 80); ball('echo', 'player', 0, 100);
    stop(a); check(!!ally.chronomancerSave, 'ally handler repeated', true, !!ally.chronomancerSave); check(!!enemy.chronomancerSave, 'enemy handler also repeated', true, !!enemy.chronomancerSave); eq(ally.motionStopCount, 0, 'repeated handler does not fabricate motion STOP');
  });
  test('timeshift', 'STOP swaps positions with nearest enemy in short range', () => {
    const a = ball('timeshift'), e = ball('normal', 'cpu', 80), far = ball('normal', 'cpu', -170); const ax = a.x, ex = e.x, fx = far.x; stop(a);
    near(a.x, ex, 'source at enemy position'); near(e.x, ax, 'enemy at source position'); near(far.x, fx, 'far enemy unchanged');
  });
  test('paradox', 'Own TURN snapshot restores position HP shield at STOP and remains reusable', () => {
    const a = ball('paradox'); a.hp = 15; a.shieldHP = 5; turn('player'); const saved = { x: a.x, y: a.y };
    a.x += 75; a.hp = 5; a.shieldHP = 0; stop(a); eq(a.hp, 15, 'HP rewind'); eq(a.shieldHP, 5, 'shield rewind'); near(a.x, saved.x, 'position rewind'); check(!!a.paradoxSnapshot, 'snapshot retained', true, !!a.paradoxSnapshot);
  });
  test('traitor', 'Slow enemy TOUCH swaps owners and self becomes Standard', () => {
    const a = ball('traitor'), e = ball('ward', 'cpu', 60); const hp = e.hp; contact(a, e, 20);
    eq(a.type, 'normal', 'self Standard'); eq(a.owner, 'cpu', 'self switches enemy'); eq(e.owner, 'player', 'enemy becomes ally'); eq(e.type, 'ward', 'captured type retained'); eq(e.hp, hp, 'early return skips impact damage');
  });

  test('combo:death-primary', 'Agony to Cascade RETURN to Packheart shield and Gravehide ancestry', () => {
    const g = ball('gravehide', 'player', -130), p = ball('packheart', 'player', 130), a = ball('agony'), b = ball('cascade', 'player', 60); const max = g.maxHp;
    for (let i = 0; i < 3; i++) {
      if (i) state.currentTurnNumber++;
      contact(a, b, 20); const child = alive('cascade').filter(x => x.id !== b.id).at(-1);
      eq(child?.shieldHP, 5, `return ${i + 1} gets Packheart shield`); eq(b.dead, false, `copied DEATH ${i + 1} preserves parent`);
      for (const x of [...state.balls]) if (x.type === 'cascade' && x.id !== b.id) { x.x = c.x + 180; x.y = c.y - 160 + i * 55; }
    }
    eq(g.v148ReturnStacks, 3, 'three qualifying turns stack'); eq(g.maxHp, max + 10, 'ancestral payoff');
  });
  test('combo:death-secondary', 'Requiem repeats Bonfire and Wildfire with healing and persistent fire zone', () => {
    const q = ball('requiem'), b = ball('bonfire', 'player', 65), w = ball('wildfire', 'player', -65), e = ball('normal', 'cpu', 65, 60), ally = ball('normal', 'player', 0, 60); ally.hp = 5; const hp = e.hp;
    stop(q); eq(b.dead, false, 'Bonfire survives'); eq(w.dead, false, 'Wildfire survives'); eq(e.hp, hp - 10, 'Bonfire damage'); eq(ally.hp, 10, 'Bonfire heal'); eq(hazards('elementZone').length, 1, 'Wildfire persistent zone');
  });
  test('combo:status-primary', 'Blightpool to Septic Core stacks to Vector death spread', () => {
    const pool = ball('blightpool', 'player', -70), septic = ball('septiccore'), vector = ball('vector', 'player', -160), e = ball('normal', 'cpu', 60), n = ball('normal', 'cpu', 120, 100);
    stop(pool); v148ResolveTurnEnd('player'); eq(e.infected, true, 'pool supplies toxin');
    contact(septic, e, 100); eq(v148Virulence(septic, e), 1, 'first virulence'); state.currentTurnNumber++; contact(septic, e, 100); eq(v148Virulence(septic, e), 0, 'virulence payoff');
    // Place the clean receiver outside the initial zone but within medium of death.
    v148ClearToxinStatus(n); killBall(e); eq(n.infected, true, 'Vector spreads on poisoned enemy death');
  });
  test('combo:status-secondary', 'Penitent transfer to Consecrator CLEANSE to Absolver shield', () => {
    const pen = ball('penitent'), ally = ball('normal', 'player', 60), con = ball('consecrator', 'player', -80), abs = ball('absolver', 'player', -150); applyFireStatus(ally, 'cpu');
    contact(pen, ally, 20); eq(pen.fireStacks, 1, 'transfer takes fire'); eq(ally.fireStacks, 0, 'ally relieved'); eq(ally.shieldHP || 0, 0, 'transfer gives no cleanse shield');
    stop(con); v148ResolveTurnEnd('player'); eq(pen.fireStacks, 0, 'Consecrator cleanses Penitent'); eq(pen.shieldHP, 5, 'Absolver rewards actual cleanse');
  });
  test('combo:gravity-primary', 'Web ROOTED survives Vinehook pull and enables Briarheart bonus', () => {
    const web = ball('web'), hook = ball('vinehook', 'player', -150), briar = ball('briarheart', 'player', -80, -120); stop(web); const h = hazards('web')[0]; if (!h) throw new Error('Web missing');
    const e = ball('normal', 'cpu', 150); e.x = h.x; e.y = h.y; update(.001); eq(v148RootedActive(e), true, 'Web supplies ROOTED');
    // Isolate the displacement mechanic with the original gated STOP; root resists forces.
    hook.x = e.x - 110; hook.y = e.y; stop(hook); eq(v148RootedActive(e), true, 'pull does not remove ROOTED');
    const hp = e.hp; briar.x = e.x - 60; briar.y = e.y; contact(briar, e, 100); check(e.hp <= hp - 5, 'Briarheart gated HIT gains damage', `<=${hp - 5}`, e.hp);
    return { rootedTargetVelocityAfterHook: e.vx, rooted: e.v148Rooted };
  });
  test('combo:gravity-secondary', 'Singularity consumes feed Horizon; death listeners receive no DEATH', () => {
    const relay = ball('horizonrelay', 'player', -180), collector = ball('collector', 'player', 180), singularity = ball('singularity'); killBall(singularity); const h = hazards('blackHole')[0];
    const collected = collector.collectorAbilities.size;
    for (let i = 0; i < 3; i++) { const e = ball('cascade', 'cpu', 150); e.x = h.x; e.y = h.y; update(.001); }
    eq(state.p2hp, 19, 'three enemy consumes yield one base damage'); eq(collector.collectorAbilities.size, collected, 'consumes do not notify Collector DEATH'); eq(alive('cascade').length, 0, 'consumed Cascade has no RETURN');
  });
  test('combo:reality-primary', 'Echo repeats temporal STOP; Chronomancer rewinds and Paradox snapshot restores', () => {
    const echo = ball('echo'), chrono = ball('chronomancer', 'player', -80), paradox = ball('paradox', 'player', 80); turn('player');
    stop(chrono); chrono.hp = 5; chrono.x -= 40; paradox.hp = 5; paradox.x += 40;
    stop(echo); eq(chrono.hp, 25, 'Echo triggers Chronomancer restore'); eq(chrono.chronomancerSave, null, 'save consumed'); eq(paradox.hp, 25, 'Echo triggers Paradox rewind');
  });
  test('combo:reality-secondary', 'Traitor captures enemy STOP ball and Echo activates captured ability', () => {
    const traitor = ball('traitor'), enemy = ball('chronomancer', 'cpu', 60), echo = ball('echo', 'player', 0, 90); contact(traitor, enemy, 20);
    eq(enemy.owner, 'player', 'enemy captured'); stop(echo); check(!!enemy.chronomancerSave, 'captured STOP repeated', true, !!enemy.chronomancerSave);
    eq(traitor.type, 'normal', 'payment is enemy Standard');
  });
  test('combo:death-emergent', 'Reclaimer RETURN triggers Packheart and Gravehide without fake death', () => {
    const g = ball('gravehide', 'player', -160), p = ball('packheart', 'player', 160), dead = ball('bonfire', 'player', 0, 190); killBall(dead); const r = ball('reclaimer'); stop(r);
    const revived = alive('bonfire')[0]; eq(revived?.shieldHP, 5, 'revived Bonfire gains shield'); eq(g.v148ReturnStacks, 1, 'revive adds one ancestral stack'); eq(revived?.hp, 15, 'revive health retained');
  });
  test('combo:status-emergent', 'Ward CLEANSE rewards fire removal while toxin stays active', () => {
    ball('absolver', 'player', -160); const ward = ball('ward'), ally = ball('normal', 'player', 80); applyFireStatus(ally, 'cpu'); applyToxinStatus(ally, 'cpu'); stop(ward);
    eq(ally.fireStacks, 0, 'fire cleansed'); eq(ally.infected, true, 'toxin remains'); eq(ally.shieldHP, 10, 'actual cleanse earns Absolver shield');
  });
  test('combo:gravity-emergent', 'Rooted enemy still counts for Vortex Medic healing although pull cannot move it', () => {
    const medic = ball('vortexmedic'), ally = ball('normal', 'player', -80), enemy = ball('normal', 'cpu', 80); ally.hp = 5; v148ApplyRooted(enemy, medic); stop(medic);
    eq(v148RootedActive(enemy), true, 'root preserved'); eq(enemy.vx, 0, 'root blocks physical pull'); eq(ally.hp, 10, 'enemy counts for five healing');
  });
  test('combo:reality-emergent', 'Mimic copied-type DEATH feeds Collector signature', () => {
    const collector = ball('collector', 'player', -160), mimic = ball('mimic'), enemy = ball('ice', 'cpu', 60); contact(mimic, enemy, 20);
    eq(mimic.type, 'ice', 'copied ice type'); killBall(mimic); eq(collector.collectorAbilities.has('ice'), true, 'Collector sees transformed type');
    collector.x = c.x; enemy.x = c.x + 70; enemy.y = c.y; stop(collector); eq(enemy.iceStacks, 1, 'collected freeze signature works');
  });
  test('combo:replacement-venom', 'Optional Plagueleech replacement Venom infects clean enemy and rewards second TOUCH', () => {
    const a = ball('venom'), e = ball('normal', 'cpu', 60); a.hp = 5; contact(a, e, 20); eq(e.infected, true, 'clean target infected');
    state.currentTurnNumber++; const hp = e.hp, own = a.hp; contact(a, e, 20); eq(e.hp, hp - 5, 'second contact damage five'); eq(a.hp, own + 5, 'second contact healing five');
  });

  const selected = decks.flatMap(d => d.balls);
  const ballTests = tests.filter(t => !t.id.startsWith('combo:')), interactions = tests.filter(t => t.id.startsWith('combo:'));
  return { tests: ballTests, interactions, selectedCount: selected.length, selectedUnique: new Set(selected).size,
    uncovered: selected.filter(id => !tests.some(t => t.id === id)),
    totals: { tests: ballTests.length, passed: ballTests.filter(t => t.pass).length, interactions: interactions.length, passedInteractions: interactions.filter(t => t.pass).length, assertions: tests.reduce((s, t) => s + t.assertions.length, 0), passedAssertions: tests.reduce((s, t) => s + t.assertions.filter(a => a.pass).length, 0) },
    sourceSpecs: selected.map(id => ({ id, spec: abilitySpecFor(id), description: v148PlayerDescription(id) })),
    maps: MAP_VARIANTS.map(m => ({ key: m.key, name: m.name })), effectRange: EFFECT_RANGE, motion: KEYWORD_MOTION };
}

(async () => {
  const html = sourceBytes.toString('utf8'), insertAt = html.lastIndexOf('})();');
  if (insertAt < 0) throw new Error('Source closure not found');
  const body = html.slice(0, insertAt) + '\nwindow.__SOURCE_FEATURED_AUDIT__=' + sourceFeaturedAudit.toString() + ';\n' + html.slice(insertAt);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { sourcePath: source, sourceSha256: expectedSha256, sourceBytes: sourceBytes.length, featuredSha256: digest(featuredBytes),
    generatedAt: new Date().toISOString(), method: 'Original HTML source closure; instrumentation in memory only; isolated headless Edge; source update/trigger/death resolvers',
    limitations: ['Targeted deterministic scenarios are source behavior checks, not Unity parity tests or balance certification.',
      'Matches use the original synchronous no-render source harness and original standard rules; four seeds cannot certify balance.',
      'Some unit scenarios directly invoke original helper functions to isolate mechanics; full matches use the normal source action/update pipeline.',
      'requestAnimationFrame is suppressed in the audit page to prevent uncontrolled concurrent source frames; tested frames are explicit source update calls.'], pageErrors: [], matches: [] };
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => report.pageErrors.push(e.message));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.route('https://core-clash-source-audit.invalid/**', route => route.fulfill({ status: 200, contentType: 'text/html', body }));
    await page.goto('https://core-clash-source-audit.invalid/');
    await page.waitForFunction(() => !!window.__SOURCE_FEATURED_AUDIT__);
    report.targeted = await page.evaluate(decks => window.__SOURCE_FEATURED_AUDIT__(decks), featured.decks);
    console.log(JSON.stringify({ targeted: report.targeted.totals, failed: [...report.targeted.tests, ...report.targeted.interactions].filter(t => !t.pass).map(t => ({ id: t.id, error: t.error, assertions: t.assertions.filter(a => !a.pass), pipelineTail: t.pipelineTail })) }, null, 2));
    if (!process.argv.includes('--targeted-only')) {
      for (let i = 0; i < featured.decks.length; i++) {
        const result = await page.evaluate(({ decks, i }) => window.__SOURCE_FEATURED_AUDIT__(decks, 'match', i), { decks: featured.decks, i });
        report.matches.push(result); console.log(JSON.stringify({ deck: result.deckId, pass: result.pass, result: result.result }));
      }
    }
    report.sourceUnchanged = digest(fs.readFileSync(source)) === expectedSha256;
    report.pass = report.sourceUnchanged && !report.pageErrors.length && !report.targeted.uncovered.length && report.targeted.totals.passed === 36 && report.targeted.totals.passedInteractions === report.targeted.totals.interactions && report.matches.length === 4 && report.matches.every(m => m.pass);
    fs.mkdirSync(path.join(root, 'Evidence'), { recursive: true });
    fs.writeFileSync(path.join(root, 'Evidence/source-featured-smoke.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ pass: report.pass, sourceUnchanged: report.sourceUnchanged, pageErrors: report.pageErrors, matches: report.matches.length }));
    if (!report.pass && !process.argv.includes('--targeted-only')) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
