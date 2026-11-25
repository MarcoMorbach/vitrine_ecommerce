/* ==========================================================================
   views/product.js — Página de produto (PDP)
   Galeria com miniaturas e zoom, variações de cor, preço com parcelas e Pix,
   cálculo de frete por CEP, caixa de compra, vendedor com reputação,
   "Compre junto", características, perguntas e respostas e avaliações.
   ========================================================================== */
window.App = window.App || {};
App.views = App.views || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui, icon = ui.icon;

  App.views.product = ({ params, query }) => {
    const p = App.getProduct(params.id);
    if (!p) return App.views.notFound();
    App.history.push(p.id);

    const color = Math.min(Number(query.cor) || 0, p.c.length - 1);
    const cat = App.getCategory(p.cat);
    const off = u.pctOff(p.old, p.price);
    const inst = u.installments(p.price);
    const seller = App.sellers[p.seller];
    const dist = App.catalog.distribution(p);
    const reviews = App.catalog.reviews(p);
    const qa = App.qa.list(p.id);
    const bundle = App.catalog.bundle(p);
    const related = App.catalog.related(p);
    const maxQty = Math.min(p.stock, 10);
    const views = ['Frente', 'Detalhe', 'Outro ângulo'];

    const html = `
      <div class="container">
        ${ui.breadcrumb([{ label: 'Início', href: '#/' }, { label: cat.name, href: `#/categoria/${cat.slug}` }, { label: p.title.split(' ').slice(0, 4).join(' ') + '…' }])}

        <article class="pdp" aria-labelledby="pdp-title">
          <!-- Galeria -->
          <div class="gallery" aria-label="Imagens do produto">
            <div class="thumbs" role="group" aria-label="Miniaturas">
              ${views.map((v, i) => `<button type="button" data-thumb="${i}" aria-label="Ver imagem: ${v}" ${i ? '' : 'aria-current="true"'}><img src="${App.img(p, color, i)}" alt="" width="64" height="64"></button>`).join('')}
            </div>
            <div>
              <div class="main-img" id="main-img">
                <img src="${App.img(p, color, 0)}" alt="${u.esc(p.title)} — ${views[0]}" width="600" height="600" fetchpriority="high" id="main-img-el">
                <span class="hint">Passe o mouse para ampliar</span>
              </div>
              <div class="gallery-dots">${views.map((v, i) => `<button type="button" data-thumb="${i}" aria-label="Imagem ${i + 1}" ${i ? '' : 'aria-current="true"'}></button>`).join('')}</div>
            </div>
          </div>

          <!-- Informações -->
          <div class="pdp-info">
            <div class="meta">
              <span>Novo</span><span aria-hidden="true">|</span><span>${u.soldLabel(p.sold)}</span>
              ${p.badge ? `<span class="tag ${p.badge === 'Mais vendido' ? 'tag-best' : p.badge === 'Lançamento' ? 'tag-new' : 'tag-deal'}">${p.badge}</span>` : ''}
            </div>
            <div class="pdp-title-row">
              <h1 id="pdp-title">${u.esc(p.title)}</h1>
              ${ui.favButton(p)}
            </div>
            <p class="small">Marca: <a href="#/busca?q=${encodeURIComponent(p.brand)}">${u.esc(p.brand)}</a></p>
            <a href="#avaliacoes" class="rating" aria-label="Nota ${p.rating} de 5, ${p.reviews} avaliações. Ir para avaliações">${ui.stars(p.rating)} <strong>${String(p.rating).replace('.', ',')}</strong> <span>(${u.num(p.reviews)} avaliações)</span></a>

            <div class="pdp-price">
              ${p.old ? `<span class="price-old">${u.money(p.old)}</span>` : ''}
              <div class="price-row">${u.priceHTML(p.price)} ${off ? `<span class="off" style="font-size:1.05rem">${off}% OFF</span>` : ''}</div>
              <span class="installments free">em até <strong>${inst.n}x ${u.money(inst.value)} sem juros</strong></span>
              <span class="pix-price">${icon('pix')} ou <strong>${u.money(u.pix(p.price))}</strong> no Pix (5% de desconto)</span>
              <button class="btn-link small" type="button" data-action="payment-info" style="justify-self:start">Ver os meios de pagamento</button>
            </div>

            ${p.c.length > 1 ? `
            <div class="pdp-variants">
              <span class="label" id="color-label">Cor: <strong>${u.esc(p.c[color].n)}</strong></span>
              <div class="swatches" role="radiogroup" aria-labelledby="color-label">
                ${p.c.map((c, i) => `<button type="button" class="swatch" role="radio" aria-checked="${i === color}" data-color="${i}" aria-label="${u.esc(c.n)}" title="${u.esc(c.n)}" ${i === color ? '' : 'tabindex="-1"'}><img src="${App.img(p, i, 0)}" alt="" width="44" height="44"></button>`).join('')}
              </div>
            </div>` : ''}

            <h2 class="h3" style="font-size:1rem">O que você precisa saber sobre este produto</h2>
            <ul class="feats">${p.feats.map(f => `<li>${u.esc(f)}</li>`).join('')}</ul>
          </div>

          <!-- Caixa de compra -->
          <aside class="buybox" aria-label="Comprar">
            <div class="ship-calc" id="ship-calc"></div>
            <div>
              <p class="stock ${p.stock < 15 ? 'low' : ''}" style="margin:0">${p.stock < 15 ? `Últimas ${p.stock} unidades!` : 'Estoque disponível'}</p>
              <div class="flex mt-1">
                <label for="qty-select">Quantidade:</label>
                <select id="qty-select" class="input" style="width:auto;min-height:40px">
                  ${Array.from({ length: maxQty }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'unidades' : 'unidade'}</option>`).join('')}
                </select>
                <span class="muted small">(${p.stock} disponíveis)</span>
              </div>
            </div>
            <div class="stack">
              <button class="btn btn-primary btn-lg btn-block" type="button" data-buy-now>Comprar agora</button>
              <button class="btn btn-secondary btn-lg btn-block" type="button" data-add-pdp>${icon('cart')} Adicionar ao carrinho</button>
            </div>
            <div class="seller">
              <div class="flex"><span>Vendido por <strong>${u.esc(seller.name)}</strong></span>${seller.medal ? `<span class="tag tag-new">${seller.medal}</span>` : ''}</div>
              <div class="thermo" role="img" aria-label="Reputação do vendedor: ${seller.level} de 5">${[1, 2, 3, 4, 5].map(i => `<span class="${i === seller.level ? 'on' : ''}"></span>`).join('')}</div>
              <span class="muted">${seller.sales} · vende na Vitrine desde ${seller.since}</span>
            </div>
            <div class="guarantee">
              <div>${icon('return')}<span><strong>Devolução grátis.</strong> Você tem 30 dias a partir do recebimento.</span></div>
              <div>${icon('shield')}<span><strong>Compra Garantida</strong>: receba o produto que está esperando ou devolvemos o dinheiro.</span></div>
            </div>
            <button class="btn btn-ghost btn-sm" type="button" data-share>${icon('share')} Compartilhar</button>
          </aside>
        </article>

        ${bundle.length ? `
        <section class="panel pdp-section" aria-labelledby="h-bundle">
          <h2 id="h-bundle">Compre junto</h2>
          <div class="bundle" id="bundle">
            ${[p, ...bundle].map((b, i) => `
              ${i ? '<span class="bundle-plus" aria-hidden="true">+</span>' : ''}
              <label class="bundle-item">
                <img src="${App.img(b)}" alt="" width="150" height="150" loading="lazy">
                <span class="check"><input type="checkbox" data-bundle="${b.id}" data-price="${b.price}" checked ${i ? '' : 'disabled'}> <span>${i ? '' : '<strong>Este item:</strong> '}${u.esc(b.title.split(' ').slice(0, 5).join(' '))}</span></span>
                <strong>${u.money(b.price)}</strong>
              </label>`).join('')}
            <div class="bundle-total">
              <span>Preço total: <strong id="bundle-total" style="font-size:1.2rem"></strong></span>
              <button class="btn btn-secondary" type="button" data-add-bundle>Adicionar selecionados ao carrinho</button>
            </div>
          </div>
        </section>` : ''}

        <section class="panel pdp-section" aria-labelledby="h-desc">
          <h2 id="h-desc">Descrição</h2>
          <p>${u.esc(p.desc)}</p>
          <h3 class="mt-2">Características principais</h3>
          <table class="specs"><tbody>
            <tr><th scope="row">Marca</th><td>${u.esc(p.brand)}</td></tr>
            ${Object.entries(p.specs).map(([k, v]) => `<tr><th scope="row">${u.esc(k)}</th><td>${u.esc(v)}</td></tr>`).join('')}
            ${p.c.length > 1 ? `<tr><th scope="row">Cores</th><td>${p.c.map(c => u.esc(c.n)).join(', ')}</td></tr>` : ''}
          </tbody></table>
        </section>

        <section class="panel pdp-section" aria-labelledby="h-qa" id="perguntas">
          <h2 id="h-qa">${icon('chat')} Perguntas e respostas</h2>
          <form id="qa-form" class="field" novalidate>
            <label for="qa-input">Pergunte ao vendedor</label>
            <div class="input-group">
              <input id="qa-input" maxlength="200" placeholder="Escreva sua pergunta…" aria-describedby="qa-count">
              <button class="btn btn-primary" type="submit">Perguntar</button>
            </div>
            <small class="help" id="qa-count">0/200 caracteres · Evite dados pessoais.</small>
          </form>
          <h3 class="small muted">Últimas perguntas feitas</h3>
          <div id="qa-list">${qa.map(qaItem).join('')}</div>
        </section>

        <section class="panel pdp-section" aria-labelledby="h-rev" id="avaliacoes">
          <h2 id="h-rev">Opiniões sobre o produto</h2>
          <div class="reviews-layout">
            <div>
              <div class="flex"><span class="score-big">${String(p.rating).replace('.', ',')}</span><div>${ui.stars(p.rating)}<div class="muted small">${u.num(p.reviews)} avaliações</div></div></div>
              <div class="histogram" role="group" aria-label="Filtrar avaliações por estrelas">
                ${dist.map((n, i) => {
                  const s = 5 - i, pct = Math.round((n / p.reviews) * 100);
                  return `<button type="button" data-star-filter="${s}" aria-pressed="false" aria-label="${s} estrelas: ${pct}%"><span>${s} ${icon('star', 'i-fill')}</span><span class="progress"><span style="width:${pct}%"></span></span><span class="muted">${pct}%</span></button>`;
                }).join('')}
              </div>
              <button class="btn btn-ghost btn-block mt-2" type="button" data-action="write-review">Escrever uma avaliação</button>
              <form id="review-form" class="mt-2" hidden novalidate>
                <fieldset class="star-input" id="rv-stars">
                  <legend class="label" style="margin-bottom:4px">Sua nota</legend>
                  ${[5, 4, 3, 2, 1].map(s => `<input type="radio" name="stars" id="rv-s${s}" value="${s}"><label for="rv-s${s}" title="${s} estrelas">${icon('star')}<span class="sr-only">${s} estrelas</span></label>`).join('')}
                </fieldset>
                <div class="field mt-1"><label for="rv-title">Título</label><input id="rv-title" maxlength="60" placeholder="Resuma sua experiência"></div>
                <div class="field"><label for="rv-text">Comentário</label><textarea id="rv-text" maxlength="600" placeholder="O que você achou do produto?"></textarea></div>
                <button class="btn btn-primary btn-block" type="submit">Publicar avaliação</button>
              </form>
            </div>
            <div>
              <div class="flex" style="justify-content:space-between">
                <h3 style="margin:0" id="rev-heading">Avaliações em destaque</h3>
                <label class="sr-only" for="rev-sort">Ordenar avaliações</label>
                <select id="rev-sort" class="input" style="width:auto;min-height:38px"><option value="util">Mais úteis</option><option value="recente">Mais recentes</option></select>
              </div>
              <div id="rev-list" aria-live="polite"></div>
            </div>
          </div>
        </section>

        <section class="section" aria-labelledby="h-related">
          <div class="section-head"><h2 id="h-related">Quem viu este produto também viu</h2></div>
          ${ui.rail('rail-related', related, { label: 'Produtos relacionados' })}
        </section>
      </div>

      <div class="mobile-buy" aria-label="Compra rápida">
        <div>${u.priceHTML(p.price)}<div class="installments free small">${inst.n}x ${u.money(inst.value)}</div></div>
        <button class="btn btn-primary" type="button" data-buy-now>Comprar</button>
      </div>`;

    function qaItem(x) {
      return `<div class="qa-item"><p>${u.esc(x.q)}</p>${x.a ? `<p class="a">${u.esc(x.a)} <span class="muted small">· ${u.fmtDateShort(x.at)}</span></p>` : `<p class="pending">${icon('clock')} Aguardando resposta do vendedor</p>`}</div>`;
    }

    return {
      title: `${p.title} | Vitrine`,
      html,
      mount(root) {
        document.body.classList.add('has-mobile-buy');
        let curColor = color, curView = 0, starFilter = 0;
        const mainImg = u.$('#main-img', root), mainEl = u.$('#main-img-el', root);

        // ----- Galeria -----
        const setView = i => {
          curView = i;
          mainEl.src = App.img(p, curColor, i);
          mainEl.alt = `${p.title} — ${views[i]}`;
          u.$$('[data-thumb]', root).forEach(b => (Number(b.dataset.thumb) === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
        };
        root.addEventListener('mouseover', e => { const t = e.target.closest('.thumbs [data-thumb]'); if (t) setView(Number(t.dataset.thumb)); });
        // Zoom que acompanha o cursor (desktop)
        mainImg.addEventListener('mousemove', e => {
          if (window.matchMedia('(hover: none)').matches) return;
          const r = mainImg.getBoundingClientRect();
          mainEl.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
          mainImg.classList.add('zoom');
        });
        mainImg.addEventListener('mouseleave', () => mainImg.classList.remove('zoom'));
        // Swipe no celular
        let x0 = null;
        mainImg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
        mainImg.addEventListener('touchend', e => {
          if (x0 == null) return;
          const dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 40) setView((curView + (dx < 0 ? 1 : -1) + 3) % 3);
          x0 = null;
        });

        // ----- Cores (radiogroup navegável por setas) -----
        const setColor = i => {
          curColor = i;
          u.$$('[data-color]', root).forEach(b => {
            const on = Number(b.dataset.color) === i;
            b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
          });
          const lbl = u.$('#color-label strong', root); if (lbl) lbl.textContent = p.c[i].n;
          u.$$('.thumbs img', root).forEach((img, v) => { img.src = App.img(p, i, v); });
          setView(curView);
          history.replaceState(null, '', `${App.productUrl(p)}${i ? '?cor=' + i : ''}`);
        };
        root.addEventListener('keydown', e => {
          const sw = e.target.closest('[data-color]');
          if (!sw || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
          e.preventDefault();
          const n = (curColor + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + p.c.length) % p.c.length;
          setColor(n); u.$(`[data-color="${n}"]`, root).focus();
        });

        // ----- Frete -----
        const renderShip = () => {
          const loc = App.location.get();
          const box = u.$('#ship-calc', root);
          if (!loc) {
            box.innerHTML = `<form class="stack" id="pdp-cep-form" novalidate>
              <div class="field" style="margin:0"><label for="pdp-cep">${icon('truck')} Calcular frete e prazo</label>
              <div class="input-group"><input id="pdp-cep" inputmode="numeric" placeholder="Seu CEP" maxlength="9" autocomplete="postal-code"><button class="btn btn-secondary" type="submit">OK</button></div></div></form>`;
            return;
          }
          const opts = App.shipping.options(loc.cep, p.price, p.express);
          box.innerHTML = `<div class="ship-opts">${opts.map(o => `<div class="ship-opt">${icon(o.id === 'exp' ? 'bolt' : 'truck')}<div>
              <strong class="${o.cost ? '' : 'free'}">${o.cost ? `Chega ${o.days === 1 ? 'amanhã' : 'em ' + o.days + ' dias úteis'} por ${u.money(o.cost)}` : `Chega grátis ${o.days <= 1 ? 'amanhã' : 'até ' + u.fmtDate(o.date, { weekday: 'long', day: 'numeric', month: 'short' })}`}</strong>
              <div class="muted small">${o.name}${!o.cost || o.id === 'exp' ? '' : ` · grátis em compras acima de ${u.money(App.config.freeShippingMin)}`}</div></div></div>`).join('')}</div>
            <div class="small muted">Enviar para <strong>${u.esc(App.location.label())}</strong> · <button class="btn-link small" type="button" data-action="open-cep">Alterar</button></div>`;
        };
        renderShip();
        const offLoc = () => renderShip();
        App.bus.on('change:cep', offLoc);
        root.addEventListener('input', e => { if (e.target.id === 'pdp-cep') e.target.value = u.maskCEP(e.target.value); });

        // ----- Avaliações -----
        const renderReviews = () => {
          const sort = u.$('#rev-sort', root).value;
          let list = App.catalog.reviews(p);
          if (starFilter) list = list.filter(r => r.stars === starFilter);
          list.sort(sort === 'recente' ? (a, b) => b.at - a.at : (a, b) => (b.mine ? 1e9 : b.helpful) - (a.mine ? 1e9 : a.helpful));
          u.$('#rev-heading', root).textContent = starFilter ? `Avaliações com ${starFilter} estrelas` : 'Avaliações em destaque';
          u.$('#rev-list', root).innerHTML = list.length ? list.map(r => {
            const voted = App.catalog.helpful.has(r.id);
            return `<article class="review">
              <div class="review-head"><span class="avatar" aria-hidden="true">${u.initials(r.name)}</span><strong>${u.esc(r.name)}</strong>${ui.stars(r.stars)}<span class="muted small">${u.fmtDateShort(r.at)}</span>${r.verified ? '<span class="verified">Compra verificada</span>' : ''}${r.mine ? '<span class="tag tag-new">Sua avaliação</span>' : ''}</div>
              <h4>${u.esc(r.title)}</h4><p style="margin:0">${u.esc(r.text)}</p>
              ${r.mine ? '' : `<div class="helpful"><button class="chip" type="button" data-helpful="${r.id}" aria-pressed="${voted}">${icon('thumb')} Útil (${r.helpful + (voted ? 1 : 0)})</button></div>`}
            </article>`;
          }).join('') : '<p class="muted mt-2">Nenhuma avaliação com essa nota nos destaques.</p>';
        };
        renderReviews();
        u.$('#rev-sort', root).addEventListener('change', renderReviews);

        // ----- Compre junto -----
        const bundleTotal = () => {
          const el = u.$('#bundle-total', root);
          if (!el) return;
          const sel = u.$$('[data-bundle]', root).filter(c => c.checked);
          el.textContent = u.money(sel.reduce((s, c) => s + Number(c.dataset.price), 0));
          u.$('[data-add-bundle]', root).textContent = sel.length > 1 ? `Adicionar os ${sel.length} ao carrinho` : 'Adicionar ao carrinho';
        };
        bundleTotal();
        root.addEventListener('change', e => { if (e.target.dataset.bundle) bundleTotal(); });

        // ----- Ações (delegação de eventos) -----
        root.addEventListener('click', async e => {
          const t = e.target;
          const thumb = t.closest('[data-thumb]'); if (thumb) setView(Number(thumb.dataset.thumb));
          const sw = t.closest('[data-color]'); if (sw) setColor(Number(sw.dataset.color));
          const qty = () => Number(u.$('#qty-select', root).value);

          if (t.closest('[data-add-pdp]')) {
            App.cart.add(p.id, qty(), curColor);
            ui.showMiniCart(p.id, curColor);
          }
          if (t.closest('[data-buy-now]')) {
            App.cart.add(p.id, qty(), curColor);
            location.hash = '#/checkout';
          }
          if (t.closest('[data-add-bundle]')) {
            const ids = u.$$('[data-bundle]', root).filter(c => c.checked).map(c => Number(c.dataset.bundle));
            ids.forEach(id => App.cart.add(id, 1, 0));
            ui.toast(`${u.plural(ids.length, 'produto adicionado', 'produtos adicionados')} ao carrinho`, { action: 'Ver carrinho', onAction: () => { location.hash = '#/carrinho'; } });
          }
          if (t.closest('[data-share]')) {
            const url = location.href;
            if (navigator.share) { try { await navigator.share({ title: p.title, url }); } catch (err) { /* cancelado */ } }
            else { try { await navigator.clipboard.writeText(url); ui.toast('Link copiado para a área de transferência'); } catch (err) { ui.toast('Copie o link na barra de endereço', { type: 'error' }); } }
          }
          if (t.closest('[data-action="payment-info"]')) {
            ui.toast(`Cartão em até ${inst.n}x sem juros · Pix com 5% OFF (${u.money(u.pix(p.price))}) · Boleto à vista`, { timeout: 7000 });
          }
          const sf = t.closest('[data-star-filter]');
          if (sf) {
            const s = Number(sf.dataset.starFilter);
            starFilter = starFilter === s ? 0 : s;
            u.$$('[data-star-filter]', root).forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.starFilter) === starFilter));
            renderReviews();
          }
          const hp = t.closest('[data-helpful]');
          if (hp) { App.catalog.helpful.toggle(hp.dataset.helpful); renderReviews(); }
          if (t.closest('[data-action="write-review"]')) {
            const f = u.$('#review-form', root);
            f.hidden = !f.hidden;
            if (!f.hidden) u.$('#rv-s5', root).focus();
          }
        });

        root.addEventListener('submit', async e => {
          e.preventDefault();
          const f = e.target;
          if (f.id === 'pdp-cep-form') {
            const inp = u.$('#pdp-cep', f);
            if (!ui.fieldError(inp, u.isCEP(inp.value) ? '' : 'Digite um CEP com 8 números.')) return inp.focus();
            const data = await App.location.lookup(inp.value);
            if (data.notFound) return ui.fieldError(inp, 'CEP não encontrado. Confira os números.');
            App.location.set(data);
          }
          if (f.id === 'qa-form') {
            const inp = u.$('#qa-input', f);
            const v = inp.value.trim();
            if (!ui.fieldError(inp, v.length < 8 ? 'Escreva uma pergunta com pelo menos 8 caracteres.' : '')) return inp.focus();
            App.qa.add(p.id, v);
            inp.value = ''; u.$('#qa-count', root).textContent = '0/200 caracteres · Evite dados pessoais.';
            u.$('#qa-list', root).innerHTML = App.qa.list(p.id).map(qaItem).join('');
            ui.toast('Pergunta enviada! Avisaremos quando o vendedor responder.');
          }
          if (f.id === 'review-form') {
            const stars = Number((u.$('input[name="stars"]:checked', f) || {}).value || 0);
            const title = u.$('#rv-title', f), text = u.$('#rv-text', f);
            if (!stars) { ui.toast('Selecione de 1 a 5 estrelas.', { type: 'error' }); return u.$('#rv-s5', f).focus(); }
            if (!ui.fieldError(text, text.value.trim().length < 10 ? 'Conte um pouco mais (mínimo de 10 caracteres).' : '')) return text.focus();
            const me = App.user.current();
            App.catalog.addReview(p.id, { name: me ? me.name : 'Você', stars, title: title.value.trim() || 'Minha avaliação', text: text.value.trim() });
            f.reset(); f.hidden = true;
            starFilter = 0; renderReviews();
            ui.toast('Obrigado! Sua avaliação foi publicada.');
          }
        });
        root.addEventListener('input', e => {
          if (e.target.id === 'qa-input') u.$('#qa-count', root).textContent = `${e.target.value.length}/200 caracteres · Evite dados pessoais.`;
        });

        return () => { document.body.classList.remove('has-mobile-buy'); App.bus.off && App.bus.off('change:cep', offLoc); };
      }
    };
  };
})(window.App);
