/* ==========================================================================
   app.js — Inicialização, roteador (SPA por hash) e comportamentos globais
   Por que hash (#/rota)? O GitHub Pages só serve arquivos estáticos e não
   permite reescrever URLs no servidor. Com hash, todas as rotas carregam o
   mesmo index.html e o JavaScript decide o que mostrar — sem erro 404.
   ========================================================================== */
window.App = window.App || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui;

  // ---------------- Roteador ----------------
  const ROUTES = [
    ['/', 'home'],
    ['/busca', 'search'],
    ['/categoria/:cat', 'search'],
    ['/produto/:id/:slug?', 'product'],
    ['/carrinho', 'cart'],
    ['/checkout', 'checkout'],
    ['/conta', 'account'],
    ['/pedidos', 'orders'],
    ['/pedido/:id', 'order'],
    ['/favoritos', 'favorites'],
    ['/ofertas', 'offers'],
    ['/ajuda', 'help']
  ].map(([pattern, view]) => {
    const keys = [];
    const rx = pattern.replace(/\/:(\w+)(\?)?/g, (_, k, opt) => { keys.push(k); return opt ? '(?:/([^/]+))?' : '/([^/]+)'; });
    return { rx: new RegExp('^' + rx + '/?$'), keys, view };
  });

  let cleanup = null;
  let lastView = null;

  function parseHash() {
    const raw = decodeURI(location.hash.slice(1)) || '/';
    const [main, anchor] = raw.split('#');
    const [path, qs] = main.split('?');
    for (const r of ROUTES) {
      const m = r.rx.exec(path);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => { if (m[i + 1] !== undefined) params[k] = decodeURIComponent(m[i + 1]); });
        return { view: r.view, params, query: u.parseQuery(qs), anchor, path };
      }
    }
    return { view: 'notFound', params: {}, query: {}, anchor, path };
  }

  /** Gera um seletor para reencontrar o elemento focado após re-renderizar */
  function focusKey(el) {
    if (!el || el === document.body || !App.$app.contains(el)) return null;
    if (el.id) return '#' + CSS.escape(el.id);
    const attrs = Array.from(el.attributes)
      .filter(a => a.name.startsWith('data-') || a.name === 'href' || (a.name === 'value' && el.type === 'radio'))
      .map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join('');
    return attrs ? el.tagName.toLowerCase() + attrs : null;
  }

  /**
   * Renderiza a rota atual.
   * @param {boolean} soft true = mesma tela atualizada (mantém rolagem e foco)
   */
  function render(soft = false) {
    const route = parseHash();
    const sameView = route.view === lastView;
    const keepFocus = soft || (sameView && route.view === 'search');
    const focusSel = keepFocus ? focusKey(document.activeElement) : null;
    const scrollY = window.scrollY;

    if (typeof cleanup === 'function') cleanup();
    cleanup = null;
    document.body.style.overflow = '';
    if (!soft) ui.closeDialogs();

    const view = App.views[route.view] || App.views.notFound;
    let res;
    try {
      res = view(route);
    } catch (err) {
      console.error(err);
      res = App.views.notFound();
    }
    const el = document.createElement('div');
    el.className = 'view';
    el.innerHTML = res.html;
    App.$app.replaceChildren(el);
    document.title = res.title || 'Vitrine';
    if (res.mount) cleanup = res.mount(el, route) || null;
    ui.initRails(el);
    ui.tickCountdowns();
    markActiveNav();
    syncSearchInput(route);
    lastView = route.view;

    if (soft) {
      window.scrollTo(0, scrollY);
    } else if (route.anchor && document.getElementById(route.anchor)) {
      setTimeout(() => document.getElementById(route.anchor).scrollIntoView({ block: 'start' }), 30);
    } else {
      window.scrollTo(0, 0);
    }

    const target = focusSel && u.$(focusSel, el);
    if (target) {
      target.focus({ preventScroll: true });
    } else if (!soft) {
      // Acessibilidade: ao trocar de página, leva o foco ao título e anuncia a nova página
      const h1 = u.$('h1', el);
      if (h1 && lastFocusedByUser) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
      ui.announce(document.title.replace(' | Vitrine', ''));
    }
  }

  let lastFocusedByUser = false; // evita roubar o foco no primeiro carregamento
  App.router = { render, parse: parseHash };

  function markActiveNav() {
    const h = location.hash || '#/';
    u.$$('#nav-links a, .drawer-list a').forEach(a => {
      if (a.getAttribute('href') === h) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // ---------------- Busca com sugestões (padrão combobox WAI-ARIA) ----------------
  const input = () => u.$('#search-input');
  const box = () => u.$('#search-suggest');
  let activeIdx = -1;

  function syncSearchInput(route) {
    if (document.activeElement === input()) return;
    input().value = route.view === 'search' ? (route.query.q || '') : '';
    u.$('#search-cat').value = route.view === 'search' ? (route.params.cat || route.query.cat || '') : '';
  }

  function highlight(text, terms) {
    let out = u.esc(text);
    terms.forEach(t => {
      if (t.length < 2) return;
      const i = u.norm(out).indexOf(t);
      if (i >= 0) out = out.slice(0, i) + '<mark>' + out.slice(i, i + t.length) + '</mark>' + out.slice(i + t.length);
    });
    return out;
  }

  function openSuggest() {
    const q = input().value.trim();
    const terms = u.norm(q).split(/\s+/).filter(Boolean);
    let html = '';
    if (!q) {
      const recent = App.searches.list();
      if (!recent.length) return closeSuggest();
      html += `<li class="suggest-title" role="presentation">Buscas recentes</li>`;
      html += recent.map((t, i) => `<li role="option" id="sg-${i}" data-term="${u.esc(t)}" aria-selected="false">${ui.icon('history')} ${u.esc(t)}</li>`).join('');
    } else {
      const cat = u.$('#search-cat').value;
      const found = App.catalog.search({ q, cat }).results.slice(0, 6);
      html += `<li role="option" id="sg-0" data-term="${u.esc(q)}" aria-selected="false">${ui.icon('search')} Buscar “<strong>${u.esc(q)}</strong>”${cat ? ` em ${u.esc(App.getCategory(cat).name)}` : ''}</li>`;
      if (found.length) {
        html += `<li class="suggest-title" role="presentation">Produtos</li>`;
        html += found.map((p, i) => `<li role="option" id="sg-${i + 1}" data-href="${App.productUrl(p)}" aria-selected="false"><img src="${App.img(p)}" alt="" width="40" height="40"><span>${highlight(p.title, terms)}</span><span class="s-price">${u.money(p.price)}</span></li>`).join('');
      } else {
        const dym = App.catalog.didYouMean(q);
        if (dym) html += `<li role="option" id="sg-1" data-term="${u.esc(dym)}" aria-selected="false">${ui.icon('help')} Você quis dizer “<strong>${u.esc(dym)}</strong>”?</li>`;
      }
    }
    box().innerHTML = html;
    box().hidden = false;
    input().setAttribute('aria-expanded', 'true');
    activeIdx = -1;
    input().removeAttribute('aria-activedescendant');
  }

  function closeSuggest() {
    box().hidden = true;
    input().setAttribute('aria-expanded', 'false');
    input().removeAttribute('aria-activedescendant');
    activeIdx = -1;
  }

  function choose(opt) {
    if (!opt) return;
    if (opt.dataset.href) { closeSuggest(); App.searches.push(input().value); location.hash = opt.dataset.href; input().blur(); return; }
    input().value = opt.dataset.term;
    submitSearch();
  }

  function submitSearch() {
    const q = input().value.trim();
    const cat = u.$('#search-cat').value;
    closeSuggest();
    if (q) App.searches.push(q);
    location.hash = '#/busca' + u.toQuery({ q, cat });
    input().blur();
  }

  function initSearch() {
    const sel = u.$('#search-cat');
    sel.insertAdjacentHTML('beforeend', App.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join(''));
    const inp = input();
    inp.addEventListener('input', u.debounce(openSuggest, 120));
    inp.addEventListener('focus', openSuggest);
    inp.addEventListener('keydown', e => {
      const opts = u.$$('[role="option"]', box());
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (box().hidden) openSuggest();
        if (!opts.length) return;
        e.preventDefault();
        activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        opts.forEach((o, i) => o.setAttribute('aria-selected', i === activeIdx));
        inp.setAttribute('aria-activedescendant', opts[activeIdx].id);
        opts[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        choose(opts[activeIdx]);
      } else if (e.key === 'Escape') {
        if (!box().hidden) { e.preventDefault(); closeSuggest(); } else inp.value = '';
      } else if (e.key === 'Tab') closeSuggest();
    });
    box().addEventListener('mousedown', e => { e.preventDefault(); choose(e.target.closest('[role="option"]')); });
    u.$('#search-form').addEventListener('submit', e => { e.preventDefault(); submitSearch(); });
    document.addEventListener('click', e => { if (!e.target.closest('.search')) closeSuggest(); });
    sel.addEventListener('change', () => { if (inp.value.trim()) submitSearch(); });
  }

  // ---------------- Tema claro/escuro ----------------
  function currentTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function updateThemeButton() {
    const dark = currentTheme() === 'dark';
    const b = u.$('.theme-toggle');
    b.setAttribute('aria-pressed', dark);
    u.$('.theme-label', b).textContent = dark ? 'Tema claro' : 'Tema escuro';
    u.$('meta[name="theme-color"]').setAttribute('content', dark ? '#110c2e' : '#1b1442');
  }

  // ---------------- Diálogo de CEP ----------------
  function openCep() {
    const d = ui.openDialog('cep-dialog');
    const inp = u.$('#cep-input', d);
    const loc = App.location.get();
    inp.value = loc ? u.maskCEP(loc.cep) : '';
    u.$('#cep-error', d).textContent = '';
    inp.removeAttribute('aria-invalid');
    setTimeout(() => inp.focus(), 30);
  }

  function initCep() {
    const form = u.$('#cep-form');
    const inp = u.$('#cep-input');
    inp.addEventListener('input', () => { inp.value = u.maskCEP(inp.value); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const err = u.$('#cep-error');
      if (!u.isCEP(inp.value)) { err.textContent = 'Digite um CEP com 8 números.'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
      const btn = u.$('button[type="submit"]', form);
      btn.disabled = true; btn.textContent = 'Buscando…';
      const data = await App.location.lookup(inp.value);
      btn.disabled = false; btn.textContent = 'Usar este CEP';
      if (data.notFound) { err.textContent = 'CEP não encontrado. Confira os números.'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
      App.location.set(data);
      u.$('#cep-dialog').close();
      ui.toast(`Entregas para ${u.esc(App.location.label())}`);
    });
  }

  // ---------------- Eventos globais (delegação: 1 ouvinte para a página toda) ----------------
  function initGlobalEvents() {
    document.addEventListener('click', e => {
      const t = e.target;

      // Âncoras internas (#avaliacoes, #main, #top) sem quebrar o roteador
      const a = t.closest('a[href^="#"]');
      if (a && !a.getAttribute('href').startsWith('#/')) {
        e.preventDefault();
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); u.$('.logo').focus({ preventScroll: true }); return; }
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); target.setAttribute('tabindex', target.getAttribute('tabindex') || '-1'); target.focus({ preventScroll: true }); }
        return;
      }

      const add = t.closest('[data-add-cart]');
      if (add) {
        App.cart.add(Number(add.dataset.addCart), 1, 0);
        ui.showMiniCart(Number(add.dataset.addCart), 0);
        return;
      }

      const fav = t.closest('[data-fav]');
      if (fav) {
        const id = Number(fav.dataset.fav);
        const on = App.fav.toggle(id);
        const p = App.getProduct(id);
        u.$$(`[data-fav="${id}"]`).forEach(b => {
          b.setAttribute('aria-pressed', on);
          b.setAttribute('aria-label', `${on ? 'Remover dos' : 'Adicionar aos'} favoritos: ${p.title}`);
        });
        ui.toast(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos', on ? { action: 'Ver lista', onAction: () => { location.hash = '#/favoritos'; } } : {});
        return;
      }

      const rail = t.closest('[data-rail]');
      if (rail) {
        const r = document.getElementById(rail.dataset.rail);
        r.scrollBy({ left: r.clientWidth * 0.9 * Number(rail.dataset.dir), behavior: 'smooth' });
        return;
      }

      const act = t.closest('[data-action]');
      if (!act) return;
      switch (act.dataset.action) {
        case 'open-menu': ui.openDialog('menu-drawer'); break;
        case 'open-cep': openCep(); break;
        case 'close-dialog': { const d = act.closest('dialog'); if (d) d.close(); break; }
        case 'toggle-theme': {
          const next = currentTheme() === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          App.db.set('theme', next);
          updateThemeButton();
          break;
        }
        case 'clear-history': App.history.clear(); render(true); ui.toast('Histórico de navegação limpo'); break;
        default: break;
      }
    });

    // Fecha diálogos ao clicar no fundo escurecido
    u.$$('dialog').forEach(d => d.addEventListener('click', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    }));
    // Links dentro do menu lateral fecham o menu
    u.$('#menu-drawer').addEventListener('click', e => { if (e.target.closest('a')) e.currentTarget.close(); });

    // Atalho de teclado: "/" foca a busca (flexibilidade e eficiência de uso)
    document.addEventListener('keydown', e => {
      lastFocusedByUser = true;
      if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) {
        e.preventDefault();
        input().focus();
      }
    });
    document.addEventListener('pointerdown', () => { lastFocusedByUser = true; }, { once: true });

    // Mantém o cabeçalho atualizado quando os dados mudam (inclusive em outra aba)
    ['cart', 'favorites', 'session', 'users', 'cep'].forEach(k => App.bus.on('change:' + k, ui.refreshHeader));
    window.addEventListener('storage', e => {
      if (e.key === 'vitrine:cart' && ['cart', 'checkout'].includes(lastView)) render(true);
    });

    window.addEventListener('hashchange', () => render(false));
    setInterval(ui.tickCountdowns, 1000);
  }

  // ---------------- Inicialização ----------------
  function init() {
    App.$app = u.$('#app');
    u.$('#menu-categories').innerHTML = App.categories.map(c => `<li><a href="#/categoria/${c.slug}">${c.name} ${ui.icon('right')}</a></li>`).join('');
    initSearch();
    initCep();
    initGlobalEvents();
    updateThemeButton();
    ui.refreshHeader();
    if (!location.hash.startsWith('#/')) history.replaceState(null, '', '#/');
    render(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.App);
