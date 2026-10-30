// CC-001 R17-W10 / A33 — source contract for A10-approved aim-meter removal.
// Run on a complete candidate checkout: node --test scripts/cc001/w10/a33/aim-meter-contract.test.cjs
// STATIC CONTRACT ONLY: not a Unity compile, render test, or physical PC1/PC2 QA.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const assets=path.join(root,'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash');
const ui=fs.readFileSync(path.join(assets,'Presentation/BoardView.cs'),'utf8');
const gesture=fs.readFileSync(path.join(assets,'Input/LaunchGesture.cs'),'utf8');
const begin=ui.indexOf('static void RenderAim(');
const finish=ui.indexOf('static void RenderFrame(',begin);
assert.ok(begin>=0 && finish>begin,'RenderAim source block must exist');
const aim=ui.slice(begin,finish);
function has(pattern){return pattern.test(aim)}
test('A33 01: no aim-power rectangular badge',()=>assert.doesNotMatch(aim,/labelWidth|labelHeight|var label=new Rect\(/));
test('A33 02: no percentage text during aiming',()=>assert.doesNotMatch(aim,/RoundToInt\(power\s*\*\s*100\)|"%"|DRAG TO BUILD POWER/));
test('A33 03: no redundant rectangular strength track',()=>assert.doesNotMatch(aim,/label\.xMax|label\.yMax|Draw\.Surface\(label|Draw\.Rect\(new Rect\(label/));
test('A33 04: keep the exact 18-unit readiness threshold',()=>assert.match(aim,/bool ready\s*=\s*distance\s*>=\s*18\s*;/));
test('A33 05: preserve geometry-based power length cue',()=>assert.match(aim,/float previewLength\s*=\s*38\s*\+\s*Mathf\.Min\(distance,\s*590\s*\/\s*3\.38f\)/));
test('A33 06: preserve host-source non-authoritative wall trace',()=>assert.match(aim,/AimGuide\.Trace\(/));
test('A33 07: preserve A20 matrix-free arrow stroke',()=>assert.ok((aim.match(/AimStroke\(/g)||[]).length>=4));
test('A33 08: preserve arrow-head wings',()=>assert.match(aim,/Vector2 wing = new Vector2\(-direction\.y, direction\.x\)/));
test('A33 09: preserve finger and origin cues',()=>{assert.match(aim,/Ring\(origin,/);assert.match(aim,/Ring\(finger,/);});
test('A33 10: no GUI.matrix rotation introduced',()=>assert.doesNotMatch(aim,/GUIUtility\.RotateAroundPivot|GUI\.matrix\s*=/));
test('A33 11: mechanics remain min(590, drag*3.38)',()=>assert.match(gesture,/power\s*=\s*System\.Math\.Min\(590,length\*3\.38f\)/));
test('A33 12: mechanics reject drags below 18',()=>assert.match(gesture,/if\(length<18\|\|!GameSimulation\.Finite\(length\)\)return false/));
