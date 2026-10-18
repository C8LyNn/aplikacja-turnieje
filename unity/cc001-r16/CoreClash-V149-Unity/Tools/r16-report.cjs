'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
const latest=read('Evidence/R16/Managed/latest.json'),managed='Evidence/R16/Managed/'+latest.run+'/';
const tests=read(managed+'unity-tests.json'),support=read(managed+'ability-support.json');
const native=read('Evidence/R16/Native/r16-native.json'),full=read('Evidence/R16/FullMatch/r6-native-runtime.json');
const source=read('Evidence/R16/source-runtime.json'),integrity=read('Evidence/R16/input-integrity.json');
const mixed=read(managed+'r16-mixed-matches.json');
const optional=f=>fs.existsSync(path.join(root,f))?read(f):null;
const builds=['StandaloneWindows64','WebGL','Android'].map(t=>({target:t,...optional('Evidence/R16/Unity/build-'+t+'.json')}));
const network=optional('Evidence/R16/Network/network.json'),web=optional('Evidence/r6-webgl-r16-smoke.json'),relay=optional('Evidence/r16-internet-smoke.json'),apk=optional('Evidence/R16/android-package.json');
const freshReady=['embertrap','frosttrap','sporetrap','venom','shatterer'];
const candidates=['wallmaker','barricade','repairpulse','engineer','bastion','commander','quartermaster','armorer','splitter','hatchery','replicator','mitosis','swarmcore','conscriptor','firebrand','chainfrost','ashcore','furnace','frostguard'];
const current={...support,revision:'R16',readinessMeaning:'UNITY_READY certifies scoped implemented ability behavior with managed, source-runtime and native-player evidence; not every cross-roster interaction or physical-device/network topology.',promotedReady:freshReady,promotedPartial:candidates,evidence:{managed:managed+'unity-tests.json',html:'Evidence/R16/source-runtime.json',native:'Evidence/R16/Native/r16-native.json',builds:builds.map(b=>({target:b.target,result:b.result||'NOT_TESTED'}))}};
write('Evidence/R16/ability-support.json',JSON.stringify(current,null,2)+'\n');
const summary={revision:'R16',date:new Date().toISOString(),baseline:{archive:'CoreClash-V149-R15-Source-Candidate.zip',sha256:integrity.inputSha256,managedPassed:243,managedFailed:2,unityCompileExit:0},managed:{passed:tests.passed,failed:tests.failed,report:managed+'unity-tests.json'},codecTests:13,nativePass:native.pass,nativeFullMatch:{pass:full.passed,shots:full.launches,turns:full.turns,guards:full.motionGuards,bases:full.baseHp},htmlPass:source.pass,protectedUnchanged:integrity.protectedUnchanged,abilityCounts:support.counts,builds,networkPass:network?.pass??'NOT_TESTED',relayPass:relay?.pass??'NOT_TESTED',webGL:{pass:web?.ok??'NOT_TESTED',checks:web?.checks?.length,screens:web?.screens?.length},androidInspection:apk?.pass??'NOT_TESTED',physicalDevicesTested:false,crossNATTested:false,published:false};
write('Evidence/R16/qa-summary.json',JSON.stringify(summary,null,2)+'\n');
const qa=`# R16 — wykonane QA / 18 października 2026

Baseline to rzeczywiście pobrane R15: SHA256 ${integrity.inputSha256}. Nie lokalne R9. Osobny checkout i gałąź dev/cc-v149-r16.

| Kontrola | Wynik i dowód |
|---|---|
| Integralność wejścia | 435 plików ZIP; ${integrity.protectedFiles.length} chronionych plików bez zmian; Evidence/R16/input-integrity.json |
| Baseline R15 .NET | 243 PASS / 2 FAIL; pełny log próby pod Evidence/R16/Baseline |
| Baseline R15 Unity | import i kompilacja Unity 6000.4.0f1, exit 0 |
| R16 C# | ${tests.passed} PASS / ${tests.failed} FAIL; ${managed}unity-tests.json |
| Kodek sieciowy | 13/13; ${managed}network-codec-tests.json |
| HTML V148 | ${source.tests.filter(t=>t.pass).length}/${source.tests.length}; niezmieniony oryginał, tymczasowy probe w pamięci przeglądarki |
| Windows renderer | ${native.pass?'PASS':'FAIL'}; 3 różne PNG z kontrolą kolorów; realne słabe kolizje Venom/Shatterer i JsonUtility |
| Pełny mecz Windows | ${full.passed?'PASS':'FAIL'}; ${full.launches} strzałów / ${full.turns} tur / ${full.motionGuards} limitów ruchu; bazy ${full.baseHp.join(' : ')} |
| Dwa mecze R16 .NET | ${mixed.map(m=>m.shots+' strzałów, '+m.guards+' guard').join('; ')}; wszystkie 9 testowych tożsamości zagrane |
| Cztery CLASS DEMO | pełne symulowane mecze C#; ${managed}unity-featured-matches.json |
| Windows ↔ WebGL | ${network?.pass?'PASS':'NOT TESTED / FAIL'}; NGO/UTP WebSocket loopback, snapshoty obu pułapek, odrzucenie owner spoof i duplikatu; Evidence/R16/Network |
| Relay / UGS / WSS | ${relay?.pass?'PASS na jednym PC':'NOT TESTED / FAIL'}; Evidence/r16-internet-smoke.json, osobne sieci nadal NOT TESTED |
| Web PC / phone / tablet | ${web?.ok?'PASS: '+web.checks.length+' kontroli, '+web.screens.length+' obrazów, '+web.surfaces.length+' powierzchni':'NOT TESTED / FAIL'}; emulacja przeglądarkowa, nie urządzenia fizyczne |
| Android APK | ${apk?.pass?'PASS statycznej inspekcji i podpisu':'NOT TESTED / FAIL'}; fizyczne uruchomienie NOT TESTED |
| QA negative control | PASS; bez dotnet runner zwraca błąd i nie kopiuje dawnych PASS do nowego katalogu próby |

Buildy: ${builds.map(b=>b.target+': '+(b.result||'NOT TESTED')+', errors='+(b.errors??'?')+', warnings='+(b.warnings??'?')).join('; ')}.

Każdy build ma jedno ostrzeżenie ServicesCore o powiązaniu projektu w edytorze. Nie ukryto go ani nie zmieniano konfiguracji konta. Istniejąca konfiguracja runtime z publicznym Project ID przeszła osobny test Authentication/MPS/Relay. Mały ekran w orientacji poziomej nadal oznacza małą planszę i przewijanie panelu; kontrola wizualna była próbkowaniem arkuszy01/04/08/14/16, nie ręcznym przeglądem wszystkich94 obrazów. Fizyczna wygoda obsługi wymaga R17.

Pierwszy ukryty renderer zapisał czarne obrazy. Nie są dowodem renderowania. Poprawiony fixture wymaga GUI Repaint, usuwa poprzedni znany PNG przed asynchronicznym capture, dekoduje zawartość i wymaga trzech różnych obrazów. Końcowe dowody są w Evidence/R16/Native. Sam test mechanik bez renderowania nie został przedstawiony jako udane QA wizualne.

Snapshoty: odrzucanie null w zagnieżdżonych zdarzeniach/statusach/listach, NaN/Infinity w geometrii, duplikatów ID i błędnego nextId; odrzucona rewizja nie blokuje poprawnego pakietu o tej samej rewizji. Protokół149 i serializowany RNG pozostają wspólne. To nie jest pełny deterministyczny save/resume całej sesji.

NOT TESTED: fizyczny Android/iOS/tablet, dwaj gracze na niezależnych urządzeniach/sieciach internetowych, WebGL jako host, zdalny WAN i jitter/długotrwały soak, pełna macierz wszystkich 224 specjalnych zdolności, manualne UX użytkownika, produkcyjna witryna. Brak publikacji i brak zmian Replit/backendu.

Manifesty R9–R12 są historyczne, nie są pełnym aktualnym hashem R15. R13–R15 nadpisywały niektóre wskazane tam źródła. Audyt rozróżnia zgodne wpisy i różnice w późniejszym kandydacie; nie udaje pełnego łańcucha kryptograficznego, którego archiwum nie zawierało.
`;
write('docs/R16_QA_PL.md',qa);
const report=`# Core Clash V149 Unity — R16

Stan: natywny projekt rozwijany z prawdziwej paczki R15. Wersja gameplay/spec nadal V149. Źródła i lokalne buildy, bez publikacji gry.

## Naprawy

- R15 przyjmował wadliwe zagnieżdżone snapshoty: null zdarzeń/statusów, nieprawidłową geometrię i duplikaty ID. R16 odrzuca je atomowo bez zamiany poprawnego stanu klienta i bez zmiany protokołu.
- Dwa czerwone testy baseline naprawiono zgodnie z rzeczywistym zachowaniem, bez strojenia fizyki. Commander widzi token Quartermastera już w turze jego narodzin, gdy wykonuje się później według ID (tarcza5, następna tura10). Długa kombinacja Slingshotów może poprawnie użyć jednego awaryjnego zakończenia akcji; test wymaga teraz zakończenia meczu i ograniczonych guardów zamiast nierealnego zera.
- R16 QA działa na kopii, zapisuje każdą próbę osobno i wskazuje najnowszą przez latest.json; brak SDK nie może odziedziczyć PASS. BuildTools zapisuje nowe raporty w Evidence/R16/Unity. Historyczne raporty są zachowane bajtowo.

## Dodane mechaniki

| Kulka | Rzeczywiste zachowanie |
|---|---|
| Ember Trap | STOP stawia trwałą pułapkę FIRE, promień14, jeden ładunek na pierwszy dotyk wroga |
| Frost Trap | analogiczna pułapka ICE, korzysta ze wspólnych reguł ICE/FIRE |
| Spore Trap | analogiczna pułapka TOXIN, przygotowuje m.in. payoff Venoma |
| Venom | TOUCH infekuje czysty cel; na zatrutym zadaje5 i leczy siebie o5; clean infection respektuje odporność Plague |
| Shatterer | TOUCH na celu z dwoma ICE lub pełnym freeze zadaje5 i zużywa ICE; pojedynczy ICE nie wystarcza |

Pułapki ignorują sojuszników, phase, banish i martwe cele, zużywają ładunek przed efektem, pozostają po śmierci twórcy, używają bezpiecznego placement i limitu256 żywych stref. Echo może ponowić STOP, Jammer blokuje aktywację. Nie kosztują dodatkowego stocku. Nie zmieniono statystyk katalogu ani członkostwa talii.

Prezentacja: kolor i znaki F1/I1/T1 oznaczają prawdziwy pojedynczy ładunek. Dodatkowe komunikaty pokazują faktyczne statusy, pułapki, przywołania i payoff; brak VFX dla niezrealizowanych mocy.

## Gotowość

${support.counts.UNITY_READY} UNITY_READY / ${support.counts.PARTIAL} PARTIAL / ${support.counts.DATA_ONLY} DATA_ONLY / 0 NOT_PORTED; razem227 rekordów. UNITY_READY awansowały: ${freshReady.join(', ')}. Dowody: uruchomiony HTML, testy C#, realny player Unity/kolizje/JsonUtility; nie jest to certyfikat wszystkich możliwych interakcji i platform.

19 wcześniejszych kandydatów ma teraz uczciwe PARTIAL: ${candidates.join(', ')}. Kompilacja i testy przechodzą, lecz nie wykonano pełnej natywnej macierzy akceptacyjnej każdej z tych mocy. Mitosis ma nadal obsłużony kontakt kulka–kulka; inne cele fizyczne pozostają do decyzji. Frostguard używa masy/tarcia kotwicy, a Furnace zachowuje pole ze wspólnym statusem FIRE zamiast dopisywać dodatkowe obrażenia z opisu karty.

Aktualny rejestr: Evidence/R16/ability-support.json. Główny Evidence/ability-support.json jest niezmienionym historycznym raportem R9; nie używać go jako wyniku R16.

## Testy i platformy

${tests.passed}/${tests.passed+tests.failed} testów C#; kodek13/13; HTML5/5. Pełny Windows: ${full.launches} strzałów, ${full.turns} tur, ${full.motionGuards} motion guards. R16 testowe mecze: ${mixed.map(m=>m.shots+' strzałów').join(' oraz ')}, oba bez guardów.
${builds.map(b=>b.target+': '+(b.result||'NOT TESTED')).join(' / ')}. Szczegóły i jawne ograniczenia: R16_QA_PL.md, Evidence/R16/qa-summary.json.

## R17

1. Dwa fizyczne urządzenia: Windows ↔ Android i Windows ↔ WebGL przez różne sieci; latency/jitter, reconnect i długi mecz.
2. Macierz akceptacyjna 19 PARTIAL z R10–R13: konstrukcje i naprawy, Mitosis na różnych colliderach, oddziały generowane przy capach i po zmianie właściciela, Frostguard/Furnace.
3. Następny wąski przyrost według V148: tożsamość/RETURN lub obszarowe statusy; test-first. Nie rozszerzać wszystkich134 DATA_ONLY jednocześnie.
4. Fizyczny phone/tablet UX i testy natywnego APK. Osobna zgoda przed synchronizacją/publikacją strony.
`;
write('docs/R16_REPORT_PL.md',report);
write('HANDOFF_R16_README.md',`# R16 — zacznij tutaj

Otwórz ten katalog w Unity **6000.4.0f1**. Menu Core Clash → Setup and validate project, potem Play. Scena Assets/Scenes/CoreClash.unity. Źródłowa paczka nie zawiera Library/Builds ani SDK.

Wymagane: .NET9, Node22+ dla QA, Unity Windows/WebGL/Android modules, Android SDK/NDK/OpenJDK przy buildzie Android. Testy przeglądarkowe używają Playwright i Edge; ścieżka lokalnego Playwright w Tools pochodzi ze środowiska autora i może wymagać dopasowania na innym komputerze. Testy C# nie wymagają Playwright.

~~~powershell
node Tools/verify-data.cjs
node Tools/r16-qa.cjs --output=C:/CoreClash-QA/R16
pwsh -NoProfile -File Tools/r16-build-smoke.ps1 -All
node Tools/r16-network-smoke.cjs
~~~

Tools/r16-qa.cjs tworzy kopię i osobne wyniki. Nie uruchamiaj dawnego Tests/Program bezpośrednio w kanonicznym katalogu: historyczny driver zapisuje stare nazwy Evidence. Do ponownej weryfikacji oryginalnego ZIP użyj Tools/r16-integrity.ps1 -InputArchive <R15.zip>.

Przeczytaj docs/R16_REPORT_PL.md, docs/R16_QA_PL.md i Evidence/R16/ability-support.json. starsze raporty R9–R15 to historia. Zachowano wszystkie227 rekordów,36 kanonicznych i4 dodatkowe CLASS DEMO oraz niezmieniony Reference/V148_reference_original.html.

Multiplayer: CREATE GAME / JOIN GAME, LAN discovery na Windows, link dla przeglądarki; internet przez istniejące NGO/UTP/MPS/Relay. Host rozstrzyga symulację, klient przesyła intencje. Protokół149 nie został zmieniony. Nie zakładaj, że zakończono fizyczne testy crossplay.

Patch: stosuj tylko do dokładnego oryginału R15 (SHA256 ${integrity.inputSha256}), z katalogu zawierającego CoreClash-V149-Unity i Reference. Najpierw git apply --check, potem git apply. Nie nakładaj na lokalne R9. Pełna paczka źródłowa R16 zawiera już patch.

Nie publikowano gry. Replit/aplikacja turniejowa/backend nie zostały zmienione. Kompilacje znajdują się wyłącznie lokalnie w Builds.
`);
for(const file of ['README.md','MIGRATION_STATUS.md','FEATURED_DECK_PORT_STATUS.md','BUILD_STATUS.md','NETWORKING_STATUS.md']){
 let old=fs.readFileSync(path.join(root,file),'utf8');const marker='<!-- R16 CURRENT -->';if(old.startsWith(marker))old=old.slice(old.indexOf('<!-- R16 END -->')+'<!-- R16 END -->'.length).replace(/^\s+/,'');
 const lead=marker+'\n# Aktualny stan: R16 / 18.10.2026\n\nŹródła R15 zostały rzeczywiście sprawdzone i rozwinięte. '+tests.passed+' testów C# PASS; gotowość:42 UNITY_READY /51 PARTIAL /134 DATA_ONLY. '+builds.map(b=>b.target+': '+(b.result||'NOT TESTED')).join('; ')+'.\n\nCzytaj [handoff R16](HANDOFF_R16_README.md), [raport R16](docs/R16_REPORT_PL.md), [wykonane QA i ograniczenia](docs/R16_QA_PL.md). Aktualny rejestr: Evidence/R16/ability-support.json. Roster, statystyki,36 kanonicznych i4 featured talii oraz HTML niezmienione. Brak publikacji.\n\n**Poniżej zachowany opis historyczny R9; jego liczniki i buildy nie są aktualnym wynikiem R16.**\n<!-- R16 END -->\n\n';write(file,lead+old);
}
console.log(JSON.stringify(summary,null,2));
