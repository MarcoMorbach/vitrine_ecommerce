/* ==========================================================================
   ui.js — Componentes de interface reutilizáveis (geram HTML) e feedback
   ========================================================================== */
window.App = window.App || {};

(function (App) {
  'use strict';
  const u = App.u;

  const icon = (name, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const ui = {
    icon,

    stars(rating, size) {
      let h = '';
      for (let i = 1; i <= 5; i++) {
        if (rating >= i - 0.25) h += icon('star', 'i-fill');
        else if (rating >= i - 0.75) h += `<span class="stars-half">${icon('star', 'i-fill off')}${icon('star', 'i-fill front')}</span>`;
        else h += icon('star', 'i-fill off');
      }
      return `<span class="stars" ${size ? `style="--s:${size}"` : ''} role="img" aria-label="Nota ${String(rating).replace('.', ',')} de 5">${h}</span>`;
    },

    rating(p) {
      return `<span class="rating"><strong>${String(p.rating).replace('.', ',')}</strong>${ui.stars(p.rating)}<span>(${u.num(p.reviews)})</span></span>`;
    },

    tags(p) {
      const t = [];
      const off = u.pctOff(p.old, p.price);
      if (p.badge === 'Mais vendido') t.push('<span class="tag tag-best">Mais vendido</span>');
      if (p.badge === 'Oferta do dia') t.push('<span class="tag tag-deal">Oferta do dia</span>');
      if (p.badge === 'Lançamento') t.push('<span class="tag tag-new">Lançamento</span>');
      if (p.deal && p.badge !== 'Oferta do dia') t.push(`<span class="tag tag-deal">${icon('bolt', 'i-fill')} Relâmpago</span>`);
      if (!t.length && off >= 30) t.push(`<span class="tag tag-deal">-${off}%</span>`);
      return t.slice(0, 1).join(''); // uma etiqueta por card: menos ruído visual
    },

    shippingLine(p) {
      const parts = [];
      if (p.price >= App.config.freeShippingMin) parts.push(`<span class="ship-free">${icon('truck')} Frete grátis</span>`);
      if (p.express) parts.push(`<span class="ship-express">${icon('bolt')} Chega amanhã</span>`);
      return parts.join(' ');
    },

    favButton(p) {
      const on = App.fav.has(p.id);
      return `<button class="fav-btn" type="button" data-fav="${p.id}" aria-pressed="${on}" aria-label="${on ? 'Remover dos' : 'Adicionar aos'} favoritos: ${u.esc(p.title)}">${icon('heart')}</button>`;
    },

    /** Card de produto — informações na ordem de decisão: imagem, título, nota, preço, parcelas, frete */
    card(p, opts = {}) {
      const off = u.pctOff(p.old, p.price);
      const inst = u.installments(p.price);
      const url = App.productUrl(p);
      return `
      <article class="card" aria-label="${u.esc(p.title)}">
        <div class="card-tags">${ui.tags(p)}</div>
        ${ui.favButton(p)}
        <a class="card-media" href="${url}" tabindex="-1" aria-hidden="true">
          <img src="${App.img(p)}" alt="" width="400" height="400" loading="lazy" decoding="async">
        </a>
        <div class="card-body">
          <span class="card-brand">${u.esc(p.brand)}</span>
          <h3 class="card-title"><a href="${url}">${u.esc(p.title)}</a></h3>
          ${ui.rating(p)}
          <div>${p.old ? `<span class="price-old" aria-label="Preço anterior ${u.money(p.old)}">${u.money(p.old)}</span>` : ''}</div>
          <div class="price-row">${u.priceHTML(p.price)}${off ? `<span class="off">${off}% OFF</span>` : ''}</div>
          <span class="installments ${inst.n > 1 ? 'free' : ''}">${inst.n > 1 ? `em ${inst.n}x ${u.money(inst.value)} sem juros` : `${u.money(u.pix(p.price))} no Pix`}</span>
          <div>${ui.shippingLine(p)}</div>
          ${opts.deal && p.deal ? `<div class="card-deal"><div class="progress" role="progressbar" aria-valuenow="${p.deal.claimed}" aria-valuemin="0" aria-valuemax="100" aria-label="Oferta ${p.deal.claimed}% vendida"><span style="width:${p.deal.claimed}%"></span></div><div class="progress-label">${p.deal.claimed}% vendido</div></div>` : ''}
          ${opts.noAdd ? '' : `<div class="card-actions"><button class="btn btn-secondary btn-block btn-sm" type="button" data-add-cart="${p.id}">${icon('cart')} Adicionar</button></div>`}
        </div>
      </article>`;
    },

    grid: (list, opts) => `<div class="grid-products${opts && opts.list ? ' as-list' : ''}">${list.map(p => ui.card(p, opts)).join('')}</div>`,

    /** Trilho horizontal acessível com rolagem por botões, toque ou teclado */
    rail(id, list, opts = {}) {
      return `<div class="rail-wrap">
        <button class="rail-btn prev" type="button" data-rail="${id}" data-dir="-1" aria-label="Ver anteriores">${icon('left')}</button>
        <div class="rail" id="${id}" tabindex="0" role="region" aria-label="${u.esc(opts.label || 'Lista de produtos')}">${list.map(p => ui.card(p, opts)).join('')}</div>
        <button class="rail-btn next" type="button" data-rail="${id}" data-dir="1" aria-label="Ver próximos">${icon('right')}</button>
      </div>`;
    },

    initRails(root = document) {
      u.$$('.rail', root).forEach(rail => {
        const wrap = rail.parentElement;
        const prev = u.$('.prev', wrap), next = u.$('.next', wrap);
        const update = () => {
          prev.disabled = rail.scrollLeft <= 4;
          next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
        };
        rail.addEventListener('scroll', u.debounce(update, 60), { passive: true });
        update();
      });
    },

    empty({ icon: ic = 'search', title, text, action = '' }) {
      return `<div class="empty"><div class="empty-icon">${icon(ic)}</div><h2>${title}</h2>${text ? `<p>${text}</p>` : ''}${action}</div>`;
    },

    breadcrumb(items) {
      return `<nav class="breadcrumb" aria-label="Você está em">${items.map((it, i) => i < items.length - 1
        ? `<a href="${it.href}">${u.esc(it.label)}</a>${icon('right')}`
        : `<span aria-current="page">${u.esc(it.label)}</span>`).join('')}</nav>`;
    },

    countdown(end, label = 'Termina em') {
      return `<span class="countdown">${icon('clock')} ${label} <time data-countdown="${end}" aria-live="off"></time></span>`;
    },

    tickCountdowns() {
      u.$$('[data-countdown]').forEach(el => {
        let ms = Math.max(0, Number(el.dataset.countdown) - Date.now());
        const h = Math.floor(ms / 3600000); ms -= h * 3600000;
        const m = Math.floor(ms / 60000); ms -= m * 60000;
        const s = Math.floor(ms / 1000);
        const p = n => String(n).padStart(2, '0');
        el.innerHTML = `<span>${p(h)}</span>:<span>${p(m)}</span>:<span>${p(s)}</span>`;
        el.setAttribute('datetime', `PT${h}H${m}M${s}S`);
      });
    },

    // ---------------- Feedback ----------------
    /** Toast com ação opcional (ex.: "Desfazer") — heurística de controle e liberdade do usuário */
    toast(msg, { action, onAction, type = 'ok', timeout = 5000 } = {}) {
      const box = u.$('#toasts');
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `${icon(type === 'error' ? 'info' : 'check')}<p>${msg}</p>${action ? `<button type="button">${action}</button>` : ''}`;
      box.appendChild(el);
      const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
      if (action) u.$('button', el).addEventListener('click', () => { onAction && onAction(); close(); });
      setTimeout(close, timeout);
      while (box.children.length > 3) box.firstChild.remove();
    },

    announce(msg) {
      const a = u.$('#announcer');
      a.textContent = '';
      setTimeout(() => { a.textContent = msg; }, 50);
    },

    openDialog(id) {
      const d = document.getElementById(id);
      if (!d.open) d.showModal();
      return d;
    },
    closeDialogs() { u.$$('dialog[open]').forEach(d => d.close()); },

    /** Painel lateral "Adicionado ao carrinho" com frete grátis e atalhos */
    showMiniCart(id, color = 0) {
      const p = App.getProduct(id);
      const sub = App.cart.subtotal();
      const min = App.config.freeShippingMin;
      const body = u.$('#cart-drawer-body');
      body.innerHTML = `
        <div class="mini-item">
          <img src="${App.img(p, color)}" alt="" width="72" height="72">
          <div><p>${u.esc(p.title)}</p>${p.c.length > 1 ? `<p class="muted small">Cor: ${u.esc(p.c[color].n)}</p>` : ''}<p><strong>${u.money(p.price)}</strong></p></div>
        </div>
        <div class="mini-summary">
          ${ui.shipMeter(sub)}
          <div class="summary-row"><span>Subtotal (${u.plural(App.cart.count(), 'item', 'itens')})</span><strong>${u.money(sub)}</strong></div>
          <a href="#/checkout" class="btn btn-primary btn-block" data-action="close-dialog">Fechar pedido</a>
          <a href="#/carrinho" class="btn btn-ghost btn-block" data-action="close-dialog">Ver carrinho</a>
          <button type="button" class="btn btn-link" data-action="close-dialog">Continuar comprando</button>
        </div>
        ${sub < min ? `<div class="section container"><h3 class="small">Complete com e ganhe frete grátis</h3>${ui.grid(App.products.filter(x => x.price < 130 && x.id !== p.id).slice(0, 2), { noAdd: false })}</div>` : ''}`;
      ui.openDialog('cart-drawer');
    },

    /** Medidor "Faltam R$ X para frete grátis" (inspirado no Mercado Livre) */
    shipMeter(sub) {
      const min = App.config.freeShippingMin;
      const pct = Math.min(100, (sub / min) * 100);
      const msg = sub >= min
        ? `${icon('truck')} <span><strong>Você ganhou frete grátis!</strong></span>`
        : `<span>Faltam <strong>${u.money(min - sub)}</strong> para ganhar <strong>frete grátis</strong></span>`;
      return `<div class="ship-meter"><div class="flex">${msg}</div><div class="progress" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso para frete grátis"><span style="width:${pct}%"></span></div></div>`;
    },

    qty(k, qty, max) {
      return `<div class="qty" role="group" aria-label="Quantidade">
        <button type="button" data-qty="${k}" data-delta="-1" aria-label="Diminuir quantidade" ${qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
        <output aria-live="polite">${qty}</output>
        <button type="button" data-qty="${k}" data-delta="1" aria-label="Aumentar quantidade" ${qty >= max ? 'disabled' : ''}>${icon('plus')}</button>
      </div>`;
    },

    /** Exibe/limpa erro de validação em um campo (ARIA: aria-invalid + aria-describedby) */
    fieldError(input, msg) {
      const id = input.id + '-error';
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('small');
        el.id = id; el.className = 'error'; el.setAttribute('role', 'alert');
        input.closest('.field')?.appendChild(el);
        const prev = input.getAttribute('aria-describedby');
        input.setAttribute('aria-describedby', prev ? `${prev} ${id}` : id);
      }
      el.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    },

    /** Atualiza contadores do cabeçalho (carrinho, favoritos, saudação, CEP) */
    refreshHeader() {
      const count = App.cart.count();
      const badge = u.$('#cart-count');
      if (badge.textContent !== String(count)) {
        badge.textContent = count;
        badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
      }
      u.$('#cart-link').setAttribute('aria-label', `Carrinho, ${u.plural(count, 'item', 'itens')}`);
      const favs = App.fav.list().length;
      const fb = u.$('#fav-count');
      fb.hidden = !favs; fb.textContent = favs;
      const me = App.user.current();
      const greet = me ? `Olá, ${u.esc(me.name.split(' ')[0])}` : 'Olá, faça seu login';
      u.$('#account-greet').innerHTML = greet;
      u.$('#menu-greet').innerHTML = greet;
      u.$('#cep-label').textContent = App.location.label();
    }
  };

  App.ui = ui;
})(window.App);
