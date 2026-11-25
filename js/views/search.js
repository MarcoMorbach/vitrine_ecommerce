/* ==========================================================================
   views/search.js — Resultados de busca e categorias
   Filtros com contagem (facetas), ordenação, chips de filtros ativos,
   modo grade/lista, "Você quis dizer?" e estado vazio útil.
   Os filtros ficam na URL (#/busca?q=...&frete=1) → link compartilhável e botão voltar funcionando.
   ========================================================================== */
window.App = window.App || {};
App.views = App.views || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui, icon = ui.icon;

  const SORTS = [['relevancia', 'Mais relevantes'], ['vendidos', 'Mais vendidos'], ['menor', 'Menor preço'], ['maior', 'Maior preço'], ['avaliacao', 'Melhor avaliados'], ['desconto', 'Maior desconto']];
  const PRICE_RANGES = [[0, 100], [100, 300], [300, 1000], [1000, 3000], [3000, 0]];

  App.views.search = ({ query, params }) => {
    const q = { ...query };
    if (params.cat) q.cat = params.cat;
    const { results, base } = App.catalog.search(q);
    const cat = q.cat && App.getCategory(q.cat);
    const listMode = App.db.get('view', 'grid') === 'list';
    const link = changes => '#/busca' + u.toQuery({ ...q, ...changes });

    const title = q.q ? `Resultados para “${u.esc(q.q)}”` : cat ? cat.name : q.oferta ? 'Ofertas' : q.frete ? 'Produtos com frete grátis' : q.ordem === 'vendidos' ? 'Mais vendidos' : 'Todos os produtos';

    // Facetas: contagens calculadas sobre a base da busca (antes dos filtros)
    const catCounts = App.categories.map(c => ({ c, n: base.filter(p => p.cat === c.slug).length })).filter(x => x.n);
    const inCat = cat ? base.filter(p => p.cat === cat.slug) : base;
    const brands = [...new Set(inCat.map(p => p.brand))].sort();
    const selBrands = q.marca ? q.marca.split(',') : [];

    const chips = [];
    if (q.q) chips.push(['q', `“${u.esc(q.q)}”`]);
    if (cat) chips.push(['cat', cat.name]);
    if (q.min || q.max) chips.push(['min,max', `${q.min ? u.money(q.min) : 'R$ 0'} – ${q.max ? u.money(q.max) : 'sem limite'}`]);
    if (q.frete) chips.push(['frete', 'Frete grátis']);
    if (q.expresso) chips.push(['expresso', 'Chega amanhã']);
    if (q.aval) chips.push(['aval', `${q.aval}★ ou mais`]);
    if (q.desc) chips.push(['desc', `${q.desc}% OFF ou mais`]);
    if (q.oferta) chips.push(['oferta', 'Em oferta']);
    selBrands.forEach(b => chips.push([`marca:${b}`, b]));
    const removeLink = k => {
      if (k.startsWith('marca:')) {
        const rest = selBrands.filter(b => b !== k.slice(6)).join(',');
        return link({ marca: rest });
      }
      const ch = {}; k.split(',').forEach(x => { ch[x] = ''; });
      return link(ch);
    };

    const dym = !results.length && q.q ? App.catalog.didYouMean(q.q) : null;
    const activeCount = chips.filter(c => c[0] !== 'q').length;

    const html = `
      <div class="container">
        ${ui.breadcrumb([{ label: 'Início', href: '#/' }, ...(cat ? [{ label: cat.name }] : [{ label: q.q ? 'Busca' : title }])])}
        <div class="search-layout">
          <aside class="filters" id="filters" aria-label="Filtros">
            <div class="filters-head">
              <h2>Filtrar</h2>
              <button class="icon-btn" type="button" data-action="close-filters" aria-label="Fechar filtros">${icon('close')}</button>
            </div>

            <div class="filter-group">
              <label class="toggle"><span><span class="ship-free">${icon('truck')} Frete grátis</span></span><input type="checkbox" id="f-frete" data-filter="frete" ${q.frete ? 'checked' : ''}></label>
              <label class="toggle"><span><span class="ship-express">${icon('bolt')} Chega amanhã</span></span><input type="checkbox" id="f-expresso" data-filter="expresso" ${q.expresso ? 'checked' : ''}></label>
              <label class="toggle"><span>Somente ofertas</span><input type="checkbox" id="f-oferta" data-filter="oferta" ${q.oferta ? 'checked' : ''}></label>
            </div>

            <div class="filter-group">
              <h3>Categorias</h3>
              <ul>
                ${q.cat ? `<li><a href="${link({ cat: '' })}">${icon('left')} Todas as categorias</a></li>` : ''}
                ${catCounts.map(({ c, n }) => `<li><a href="${link({ cat: c.slug })}" ${q.cat === c.slug ? 'aria-current="true"' : ''}>${c.name}<span class="count">${n}</span></a></li>`).join('')}
              </ul>
            </div>

            <div class="filter-group">
              <h3>Preço</h3>
              <ul>
                ${PRICE_RANGES.map(([a, b]) => {
                  const n = inCat.filter(p => p.price >= a && (!b || p.price <= b)).length;
                  if (!n) return '';
                  const label = !a ? `Até ${u.money(b)}` : !b ? `Acima de ${u.money(a)}` : `${u.money(a)} a ${u.money(b)}`;
                  const on = String(q.min || '') === String(a || '') && String(q.max || '') === String(b || '');
                  return `<li><a href="${link({ min: a || '', max: b || '' })}" ${on ? 'aria-current="true"' : ''}>${label}<span class="count">${n}</span></a></li>`;
                }).join('')}
              </ul>
              <form class="price-form" id="price-form" aria-label="Faixa de preço personalizada">
                <label class="sr-only" for="pmin">Preço mínimo</label>
                <input id="pmin" name="min" inputmode="numeric" placeholder="Mínimo" value="${u.esc(q.min || '')}">
                <label class="sr-only" for="pmax">Preço máximo</label>
                <input id="pmax" name="max" inputmode="numeric" placeholder="Máximo" value="${u.esc(q.max || '')}">
                <button class="btn btn-secondary" type="submit" aria-label="Aplicar faixa de preço">${icon('right')}</button>
              </form>
            </div>

            <div class="filter-group">
              <h3>Avaliação</h3>
              <ul>
                ${[4.5, 4].map(r => `<li><a href="${link({ aval: q.aval === String(r) ? '' : r })}" ${q.aval === String(r) ? 'aria-current="true"' : ''}><span class="flex" style="gap:6px">${ui.stars(r)} ou mais</span><span class="count">${inCat.filter(p => p.rating >= r).length}</span></a></li>`).join('')}
              </ul>
            </div>

            <div class="filter-group">
              <h3>Desconto</h3>
              <ul>
                ${[20, 30, 40].map(d => ({ d, n: inCat.filter(p => u.pctOff(p.old, p.price) >= d).length })).filter(x => x.n || q.desc === String(x.d)).map(({ d, n }) => `<li><a href="${link({ desc: q.desc === String(d) ? '' : d })}" ${q.desc === String(d) ? 'aria-current="true"' : ''}>${d}% OFF ou mais<span class="count">${n}</span></a></li>`).join('')}
              </ul>
            </div>

            ${brands.length > 1 ? `
            <fieldset class="filter-group" style="border:0;margin:0;padding-inline:0">
              <legend><h3 style="margin:0 0 8px">Marca</h3></legend>
              ${brands.map(b => `<label class="check"><input type="checkbox" data-brand="${u.esc(b)}" ${selBrands.includes(b) ? 'checked' : ''}> ${u.esc(b)} <span class="count muted small">(${inCat.filter(p => p.brand === b).length})</span></label>`).join('')}
            </fieldset>` : ''}
          </aside>

          <section aria-labelledby="results-title">
            <div class="results-bar">
              <h1 id="results-title">${title}</h1>
              <span class="count" role="status">${u.plural(results.length, 'resultado', 'resultados')}</span>
              <div class="results-tools">
                <button class="btn btn-ghost btn-sm filters-open-btn" type="button" data-action="open-filters" aria-controls="filters">${icon('filter')} Filtros${activeCount ? ` (${activeCount})` : ''}</button>
                <label class="sr-only" for="sort">Ordenar por</label>
                <select id="sort" aria-label="Ordenar por">${SORTS.map(([v, l]) => `<option value="${v}" ${(q.ordem || 'relevancia') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
                <div class="view-toggle" role="group" aria-label="Modo de exibição">
                  <button type="button" data-view="grid" aria-pressed="${!listMode}" aria-label="Exibir em grade">${icon('grid')}</button>
                  <button type="button" data-view="list" aria-pressed="${listMode}" aria-label="Exibir em lista">${icon('list')}</button>
                </div>
              </div>
            </div>

            ${chips.length ? `<div class="active-filters" aria-label="Filtros ativos">
              ${chips.map(([k, l]) => `<a class="chip active" href="${removeLink(k)}" aria-label="Remover filtro ${l.replace(/<[^>]+>/g, '')}">${l} ${icon('close')}</a>`).join('')}
              ${chips.length > 1 ? `<a class="chip" href="#/busca">Limpar tudo</a>` : ''}
            </div>` : ''}

            ${results.length ? ui.grid(results, { list: listMode }) : `
              <div class="panel">
                ${ui.empty({
                  icon: 'search',
                  title: dym ? `Você quis dizer <a href="#/busca?q=${encodeURIComponent(dym)}">${u.esc(dym)}</a>?` : 'Não encontramos produtos com esses filtros',
                  text: 'Confira a ortografia, use termos mais genéricos ou remova alguns filtros.',
                  action: `<div class="flex" style="justify-content:center"><a class="btn btn-primary" href="#/busca">Ver todos os produtos</a>${chips.length ? `<a class="btn btn-ghost" href="${q.q ? '#/busca?q=' + encodeURIComponent(q.q) : '#/busca'}">Limpar filtros</a>` : ''}</div>`
                })}
              </div>
              <section class="section"><h2>Os mais vendidos da Vitrine</h2>${ui.rail('rail-sug', [...App.products].sort((a, b) => b.sold - a.sold).slice(0, 10))}</section>`}
          </section>
        </div>
      </div>`;

    return {
      title: `${title.replace(/<[^>]+>|“|”/g, '')} | Vitrine`,
      html,
      mount(root) {
        const go = changes => { location.hash = link(changes); };
        root.addEventListener('change', e => {
          const t = e.target;
          if (t.id === 'sort') go({ ordem: t.value === 'relevancia' ? '' : t.value });
          if (t.dataset.filter) go({ [t.dataset.filter]: t.checked ? 1 : '' });
          if (t.dataset.brand !== undefined) {
            const set = new Set(selBrands);
            t.checked ? set.add(t.dataset.brand) : set.delete(t.dataset.brand);
            go({ marca: [...set].join(',') });
          }
        });
        u.$('#price-form', root).addEventListener('submit', e => {
          e.preventDefault();
          const f = e.target;
          let min = u.digits(f.min.value), max = u.digits(f.max.value);
          if (min && max && Number(min) > Number(max)) [min, max] = [max, min]; // corrige inversão em vez de dar erro
          go({ min, max });
        });
        root.addEventListener('click', e => {
          const v = e.target.closest('[data-view]');
          if (v) { App.db.set('view', v.dataset.view); App.router.render(true); }
          if (e.target.closest('[data-action="open-filters"]')) openFilters(root);
          if (e.target.closest('[data-action="close-filters"]')) closeFilters(root);
        });
      }
    };
  };

  function openFilters(root) {
    const f = u.$('#filters', root);
    f.classList.add('open');
    const bd = document.createElement('div');
    bd.className = 'filters-backdrop';
    bd.addEventListener('click', () => closeFilters(root));
    f.after(bd);
    document.body.style.overflow = 'hidden';
    u.$('button, a, input', f).focus();
    f.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { closeFilters(root); f.removeEventListener('keydown', esc); } });
  }
  function closeFilters(root) {
    u.$('#filters', root)?.classList.remove('open');
    u.$('.filters-backdrop', root)?.remove();
    document.body.style.overflow = '';
    u.$('.filters-open-btn', root)?.focus();
  }
})(window.App);
