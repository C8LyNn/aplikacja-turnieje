/* Portfolio R13 — standalone page served at /portfolio/ (hash routes: #/pl/, #/en/, #/<lang>/<project-slug>).
 * Content: data/portfolio-content.json. Media: only files listed in data/media-release.json are shown publicly.
 * Author preview (local dev only, see scripts/portfolio-author-preview.mjs): /portfolio/?podglad=autor */
(() => {
  'use strict';
  const root = document.getElementById('main');
  const langButtons = [...document.querySelectorAll('[data-lang]')];
  const dialog = document.getElementById('lightbox');
  const imgLarge = document.getElementById('lightbox-image');
  const titleLarge = document.getElementById('lightbox-title');
  const capLarge = document.getElementById('lightbox-caption');
  const banner = document.getElementById('author-banner');
  let data = null;
  let release = { approvedImages: [], publishedVideos: [] };
  let author = null;
  let lastZoomButton = null;

  const labels = {
    pl: {
      projects: 'Projekty', site: 'Strona główna', skip: 'Przejdź do treści', getInto: 'Poznaj projekt',
      filter: 'Szukaj projektu', filterPlaceholder: 'Nazwa, mechanika, obszar…', noResults: 'Brak projektów pasujących do zapytania.',
      loop: 'Jak działa projekt', loopEyebrow: 'PĘTLA GRY / DROGA UŻYTKOWNIKA',
      loopLead: 'Trzy kroki wyjaśniają doświadczenie odbiorcy przed wejściem w szczegółowe mechaniki.', step: 'KROK',
      problem: 'Problem', decision: 'Moja decyzja', impact: 'Znaczenie dla odbiorcy', evidence: 'Co potwierdza materiał',
      limitation: 'Czego ten materiał nie dowodzi', contribution: 'Mój wkład', author: 'Rola', phase: 'Stan projektu',
      gallery: 'Materiały i dowody',
      galleryLead: 'Oryginalne kadry z prototypów, dokumentacji uczelnianej i praktyk — bez retuszu i bez grafik generowanych.',
      galleryLeadText: 'Opisy oryginalnych materiałów z prototypów, dokumentacji uczelnianej i praktyk. Kadry pokazuję dopiero po potwierdzeniu praw do ich publikacji.',
      videos: 'Nagrania', zoom: 'Powiększ', back: 'Wszystkie projekty', next: 'Następny projekt', page: 'str.',
      caveat: 'Statusy i kadry są historyczne. Nie są dowodem aktualnego stanu produkcji ani funkcji, które wciąż powstają.',
      kinds: { prototype: 'Prototyp', academic: 'Dokumentacja uczelniana', gdd: 'GDD', internship: 'Praktyki' },
      filterAll: 'Wszystkie', filters: 'Rodzaj materiału', count: (n) => `${n} ${n === 1 ? 'materiał' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'materiały' : 'materiałów'}`,
      spotlight: 'Mechaniki, synergie i informacja zwrotna', spotlightAria: 'Otwórz studium przypadku Core Clash',
      spotlightAlt: 'Oryginalny zrzut ekranu z prototypu Core Clash', close: 'Zamknij', brandAria: 'Portfolio — strona główna',
      nav: 'Główna nawigacja', contact: 'Kontakt', review: 'Bez zgody na publikację', authorBanner: 'Podgląd autora (tylko lokalnie): widać kadry, które nie mają jeszcze zgody na publikację. Publiczna wersja pokazuje wyłącznie materiały z listy zatwierdzonych.',
      description: 'Jakub Powierski — Game Designer / Systems Designer. Studia przypadków sześciu projektów: mechaniki, ekonomia i systemy rozgrywki.',
      loadError: 'Nie udało się wczytać portfolio. Odśwież stronę.',
    },
    en: {
      projects: 'Projects', site: 'Main site', skip: 'Skip to content', getInto: 'Explore case study',
      filter: 'Find a project', filterPlaceholder: 'Name, mechanics, discipline…', noResults: 'No matching projects.',
      loop: 'How the project works', loopEyebrow: 'GAME LOOP / USER JOURNEY',
      loopLead: 'Three steps explain the experience before diving into individual mechanics.', step: 'STEP',
      problem: 'Problem', decision: 'My design decision', impact: 'User / player impact', evidence: 'What the evidence shows',
      limitation: 'What it does not prove', contribution: 'My contribution', author: 'Role', phase: 'Project status',
      gallery: 'Source material & evidence',
      galleryLead: 'Original prototype, academic-project and internship visuals — unretouched, nothing generated.',
      galleryLeadText: 'Descriptions of original prototype, academic-project and internship material. Frames are shown once their publication rights are confirmed.',
      videos: 'Recordings', zoom: 'Enlarge', back: 'All projects', next: 'Next project', page: 'p.',
      caveat: 'Captures and statuses are historical. They do not prove the current production build or features still in development.',
      kinds: { prototype: 'Prototype', academic: 'Academic document', gdd: 'GDD', internship: 'Internship' },
      filterAll: 'All', filters: 'Material type', count: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
      spotlight: 'Mechanics, synergies and feedback', spotlightAria: 'Open the Core Clash case study',
      spotlightAlt: 'Original capture from the Core Clash prototype', close: 'Close', brandAria: 'Portfolio — home',
      nav: 'Main navigation', contact: 'Contact', review: 'Not cleared for publication', authorBanner: 'Author preview (local only): shows frames that are not yet cleared for publication. The public version shows approved material only.',
      description: 'Jakub Powierski — Game Designer / Systems Designer. Case studies of six projects: mechanics, economies and gameplay systems.',
      loadError: 'The portfolio could not be loaded. Please refresh the page.',
    },
  };

  const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fold = (s, lang) => String(s).toLocaleLowerCase(lang).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const pad = (n) => String(n).padStart(2, '0');

  function route() {
    const parts = (location.hash || '#/pl/').replace(/^#\/?/, '').split('/').filter(Boolean);
    return { lang: parts[0] === 'en' ? 'en' : 'pl', slug: parts[1] || null };
  }
  const url = (lang, slug) => `#/${lang}/${slug || ''}`;
  const projectBySlug = (slug) => data.projects.find((p) => p.slug === slug) || null;

  /* Public: only allowlisted files. Author preview: allowlisted first, then the private local copies. */
  function imageUrl(file) {
    if (release.approvedImages.includes(file)) return `assets/${encodeURIComponent(file)}`;
    if (author && author.images && author.images[file]) return `__author/assets/${encodeURIComponent(file)}`;
    return null;
  }
  const isPending = (file) => !release.approvedImages.includes(file);

  function picture(src, alt, cls = '', loading = 'lazy') {
    return `<img class="${cls}" src="${escape(src)}" alt="${escape(alt)}" loading="${loading}" decoding="async">`;
  }
  function sourceLine(im, lang) {
    const title = im.source[lang];
    const hasPage = /(strona|slajd|page|slide) \d+/.test(title);
    return hasPage ? title : `${title} · ${labels[lang].page} ${im.page}`;
  }

  function setChrome(lang, project) {
    const d = labels[lang];
    document.documentElement.lang = lang;
    const brand = document.getElementById('brand');
    brand.href = url(lang); brand.setAttribute('aria-label', d.brandAria);
    const navProjects = document.getElementById('nav-projects');
    navProjects.href = url(lang); navProjects.textContent = d.projects;
    if (!project) navProjects.setAttribute('aria-current', 'page'); else navProjects.removeAttribute('aria-current');
    document.getElementById('nav-site').textContent = d.site;
    document.getElementById('primary-nav').setAttribute('aria-label', d.nav);
    document.getElementById('skip-link').textContent = d.skip;
    document.getElementById('footer-mail').textContent = d.contact;
    document.getElementById('lightbox-close').setAttribute('aria-label', d.close);
    langButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang)));
    document.title = (project ? `${project.label} — ` : '') + 'Portfolio — Jakub Powierski';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', project ? `${project.label} — ${project[lang].overview}` : d.description);
    banner.hidden = !author;
    if (author) banner.textContent = d.authorBanner;
  }

  function renderCards(lang, query = '') {
    const d = labels[lang];
    const q = fold(query.trim(), lang);
    const matches = data.projects.filter((p) => fold([
      p.label, p.category[lang], p.role[lang], p[lang].overview, p[lang].caseStudy.problem, p[lang].caseStudy.decision,
    ].join(' '), lang).includes(q));
    if (!matches.length) return `<p class="empty-results">${escape(d.noResults)}</p>`;
    return `<div class="card-grid">${matches.map((p, i) => {
      const src = imageUrl(p.featuredImage);
      const hero = p.images.find((im) => im.file === p.featuredImage) || p.images[0];
      return `<a class="project-card${src ? '' : ' no-media'}" style="--project-accent:${escape(p.accent)}" href="${url(lang, p.slug)}">
        ${src ? picture(src, hero.alt[lang], 'card-media', i < 3 ? 'eager' : 'lazy') : ''}
        <div class="card-body">
          <span class="card-overline">${escape(p.category[lang])}</span>
          <h3>${escape(p.label)}</h3>
          <p>${escape(p[lang].overview)}</p>
          <div class="card-end"><span>${escape(p.stage[lang])}</span><b>${escape(d.getInto)} <span aria-hidden="true">↗</span></b></div>
        </div>
      </a>`;
    }).join('')}</div>`;
  }

  function renderHome(lang) {
    const d = labels[lang];
    const intro = data.intro[lang];
    const core = projectBySlug('core-clash');
    const spotSrc = core && imageUrl(core.featuredImage);
    root.innerHTML = `
      <section class="hero"><div class="shell hero-inner${spotSrc ? '' : ' hero-solo'}">
        <div>
          <p class="eyebrow">${escape(intro.eyebrow)}</p>
          <h1>${escape(intro.title)}</h1>
          <p class="hero-description">${escape(intro.description)}</p>
          <a class="link-pill" href="#projects">${escape(intro.explore)} <span aria-hidden="true">↘</span></a>
        </div>
        ${spotSrc ? `<a class="hero-spotlight" href="${url(lang, 'core-clash')}" aria-label="${escape(d.spotlightAria)}">
          ${picture(spotSrc, d.spotlightAlt, 'hero-spotlight-image', 'eager')}
          <span class="hero-spotlight-info"><strong>Core Clash</strong><span>${escape(d.spotlight)} <span aria-hidden="true">↗</span></span></span>
        </a>` : ''}
      </div></section>
      <section class="projects-section" id="projects" aria-labelledby="projects-title"><div class="shell">
        <div class="section-head"><div><p class="eyebrow">PORTFOLIO / 01—${pad(data.projects.length)}</p><h2 id="projects-title">${escape(intro.projects)}</h2></div>
          <div class="search-box"><label for="search-projects">${escape(d.filter)}</label><input id="search-projects" type="search" autocomplete="off" placeholder="${escape(d.filterPlaceholder)}"></div>
        </div>
        <div id="project-results" aria-live="polite">${renderCards(lang)}</div>
      </div></section>`;
    root.querySelector('.link-pill').addEventListener('click', (ev) => {
      ev.preventDefault();
      const target = root.querySelector('#projects');
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      root.querySelector('#search-projects').focus({ preventScroll: true });
    });
    const input = root.querySelector('#search-projects');
    input.addEventListener('input', () => { root.querySelector('#project-results').innerHTML = renderCards(lang, input.value); });
  }

  function evidenceCard(im, lang, p) {
    const d = labels[lang];
    const src = imageUrl(im.file);
    const tags = `<div class="evidence-tags"><span class="source-tag">${escape(d.kinds[im.kind] || im.kind)}</span>${src && author && isPending(im.file) ? `<span class="review-tag">${escape(d.review)}</span>` : ''}</div>`;
    const info = `<div class="evidence-info">${tags}<h3>${escape(im.title[lang])}</h3><p>${escape(im.caption[lang])}</p><small>${escape(sourceLine(im, lang))}</small></div>`;
    if (!src) return `<article class="evidence-card text-only" data-kind="${escape(im.kind)}">${info}</article>`;
    return `<article class="evidence-card" data-kind="${escape(im.kind)}">
      <button class="evidence-zoom" type="button" data-src="${escape(src)}" data-alt="${escape(im.alt[lang])}" data-caption="${escape(`${im.alt[lang]} · ${sourceLine(im, lang)}. ${im.caption[lang]}`)}" data-title="${escape(p.label)}" aria-label="${escape(d.zoom)}: ${escape(im.title[lang])}">${picture(src, im.alt[lang])}</button>
      ${info}
    </article>`;
  }

  function renderVideos(lang, p) {
    const videos = (release.publishedVideos || []).filter((v) => v.project === p.slug && v.file);
    if (!videos.length) return '';
    return `<section class="video-section" aria-labelledby="videos-title"><div class="shell"><h2 id="videos-title">${escape(labels[lang].videos)}</h2>
      <div class="evidence-grid">${videos.map((v) => `<figure class="video-card"><video controls preload="metadata" src="media/${escape(v.file)}"${v.poster ? ` poster="media/${escape(v.poster)}"` : ''}></video>
        <figcaption><strong>${escape(v.title?.[lang] || v.id)}</strong> ${escape(v.caption?.[lang] || '')}</figcaption></figure>`).join('')}</div>
    </div></section>`;
  }

  function renderProject(lang, p) {
    const d = labels[lang];
    const r = p[lang];
    const cs = r.caseStudy;
    const index = data.projects.indexOf(p);
    const next = data.projects[(index + 1) % data.projects.length];
    const evidence = p.images.filter((im) => im.role === 'evidence');
    const heroImage = p.images.find((im) => im.role === 'hero');
    const heroSrc = heroImage && imageUrl(heroImage.file);
    const block = (label, text, cls = '') => `<div class="case-feature ${cls}"><h3>${escape(label)}</h3><p>${escape(text)}</p></div>`;
    const kinds = [...new Set(evidence.map((im) => im.kind))];
    const filterButtons = kinds.length > 1 ? [`<button class="evidence-filter is-current" type="button" data-filter="all" aria-pressed="true">${escape(d.filterAll)}</button>`,
      ...kinds.map((k) => `<button class="evidence-filter" type="button" data-filter="${escape(k)}" aria-pressed="false">${escape(d.kinds[k] || k)}</button>`)].join('') : '';
    const anyEvidenceImage = evidence.some((im) => imageUrl(im.file));
    root.innerHTML = `<div class="project-detail" style="--project-accent:${escape(p.accent)}">
      <div class="shell"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="${url(lang)}">${escape(d.back)}</a> <span aria-hidden="true">/</span> <span aria-current="page">${escape(p.label)}</span></nav>
        <section class="project-intro${heroSrc ? '' : ' intro-solo'}"><div><p class="eyebrow">${escape(p.category[lang])}</p><h1>${escape(p.label)}</h1><p class="project-overview">${escape(r.overview)}</p>
          <dl class="project-meta"><div><dt>${escape(d.author)}</dt><dd>${escape(p.role[lang])}</dd></div><div><dt>${escape(d.phase)}</dt><dd>${escape(p.stage[lang])}</dd></div></dl>
        </div>
        ${heroSrc ? `<figure class="visual-wrap"><button class="evidence-zoom hero-zoom" type="button" data-src="${escape(heroSrc)}" data-alt="${escape(heroImage.alt[lang])}" data-caption="${escape(`${heroImage.alt[lang]} · ${sourceLine(heroImage, lang)}. ${heroImage.caption[lang]}`)}" data-title="${escape(p.label)}" aria-label="${escape(d.zoom)}: ${escape(heroImage.title[lang])}">${picture(heroSrc, heroImage.alt[lang], '', 'eager')}</button><figcaption class="visual-caption">${escape(heroImage.alt[lang])} · ${escape(sourceLine(heroImage, lang))}${author && isPending(heroImage.file) ? ` · <span class="review-inline">${escape(d.review)}</span>` : ''}</figcaption></figure>` : ''}
        </section>
      </div>
      <section class="story-section" aria-labelledby="loop-title"><div class="shell"><p class="eyebrow">${escape(d.loopEyebrow)}</p><h2 id="loop-title">${escape(d.loop)}</h2>
        <p class="section-lead">${escape(d.loopLead)}</p>
        <ol class="loop-grid">${r.playerLoop.map((s, i) => `<li class="loop-step"><div class="loop-number">${escape(d.step)} ${pad(i + 1)}</div><p>${escape(s)}</p></li>`).join('')}</ol>
      </div></section>
      <section class="case-section" aria-labelledby="case-title"><div class="shell"><div class="case-heading"><div><p class="eyebrow">DESIGN CASE STUDY</p><h2 id="case-title">${escape(p.caseTitle[lang])}</h2></div><div class="case-index">${pad(index + 1)} / ${pad(data.projects.length)}</div></div>
        <div class="case-grid"><div>${block(d.problem, cs.problem)}${block(d.decision, cs.decision, 'featured')}
          <div class="contribution"><div class="label">${escape(d.contribution)}</div><p>${escape(p.contribution[lang])}</p></div>
        </div><div class="case-proof">${block(d.impact, cs.playerImpact)}${block(d.evidence, cs.existingEvidence)}
          <p class="limitation"><strong>${escape(d.limitation)}:</strong> ${escape(cs.limitation)}</p>
        </div></div>
      </div></section>
      ${renderVideos(lang, p)}
      <section class="evidence-section" aria-labelledby="gallery-title"><div class="shell"><div class="section-head"><div><p class="eyebrow">SOURCE MATERIAL</p><h2 id="gallery-title">${escape(d.gallery)}</h2></div></div>
        <p class="section-lead">${escape(anyEvidenceImage ? d.galleryLead : d.galleryLeadText)} ${escape(p.sourceSummary[lang])}</p>
        <div class="gallery-tools">${filterButtons ? `<div class="evidence-filter-label" id="filter-label">${escape(d.filters)}</div><div class="evidence-filters" role="group" aria-labelledby="filter-label">${filterButtons}</div>` : ''}<span id="gallery-count" aria-live="polite">${escape(d.count(evidence.length))}</span></div>
        <div class="evidence-grid">${evidence.map((im) => evidenceCard(im, lang, p)).join('')}</div>
        <p class="note">${escape(d.caveat)}</p>
      </div></section>
      <div class="shell next-project"><a href="${url(lang, next.slug)}"><span><small>${escape(d.next)}</small>${escape(next.label)}</span><span aria-hidden="true">↗</span></a></div>
    </div>`;
    root.querySelectorAll('.evidence-filter').forEach((btn) => btn.addEventListener('click', () => {
      const k = btn.dataset.filter;
      root.querySelectorAll('.evidence-filter').forEach((b) => { b.setAttribute('aria-pressed', String(b === btn)); b.classList.toggle('is-current', b === btn); });
      let shown = 0;
      root.querySelectorAll('.evidence-card').forEach((el) => { const visible = k === 'all' || el.dataset.kind === k; el.hidden = !visible; if (visible) shown++; });
      root.querySelector('#gallery-count').textContent = d.count(shown);
    }));
    root.querySelectorAll('[data-src]').forEach((btn) => btn.addEventListener('click', () => {
      lastZoomButton = btn;
      imgLarge.src = btn.dataset.src; imgLarge.alt = btn.dataset.alt;
      titleLarge.textContent = btn.dataset.title; capLarge.textContent = btn.dataset.caption;
      dialog.showModal();
      document.getElementById('lightbox-close').focus();
    }));
  }

  /* After an in-page route change, move focus to the new content (keyboard and screen-reader users);
     on the first load keep the natural order so Tab starts at the skip link. */
  function render(moveFocus = true) {
    const { lang, slug } = route();
    const p = slug ? projectBySlug(slug) : null;
    if (slug && !p) { location.replace(url(lang)); return; }
    setChrome(lang, p);
    if (p) renderProject(lang, p); else renderHome(lang);
    window.scrollTo(0, 0);
    if (moveFocus) root.focus({ preventScroll: true });
  }

  async function json(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) throw new Error(`${path}: ${response.status}`);
    return response.json();
  }

  async function start() {
    document.getElementById('lightbox-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { imgLarge.removeAttribute('src'); if (lastZoomButton && lastZoomButton.isConnected) lastZoomButton.focus(); });
    langButtons.forEach((button) => button.addEventListener('click', () => {
      const { lang, slug } = route();
      if (button.dataset.lang !== lang) location.hash = url(button.dataset.lang, slug);
    }));
    try {
      [data, release] = await Promise.all([json('data/portfolio-content.json'), json('data/media-release.json')]);
    } catch (error) {
      root.innerHTML = `<div class="shell noscript">${escape(labels[route().lang].loadError)}</div>`;
      return;
    }
    release.approvedImages = Array.isArray(release.approvedImages) ? release.approvedImages : [];
    if (new URLSearchParams(location.search).get('podglad') === 'autor') {
      try { const review = await json('__author/review.json'); if (review && review.authorPreview === true) author = review; } catch { author = null; }
    }
    addEventListener('hashchange', () => render(true));
    render(false);
  }
  start();
})();
