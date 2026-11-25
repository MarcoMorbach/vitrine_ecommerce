/* ==========================================================================
   views/cart.js — Carrinho
   Quantidade, remover com "Desfazer", salvar para depois, frete grátis
   progressivo, cupom de desconto, cálculo de frete e resumo fixo.
   ========================================================================== */
window.App = window.App || {};
App.views = App.views || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui, icon = ui.icon;

  /** Totais do pedido — reutilizado no checkout */
  App.totals = (shipCost = null) => {
    const lines = App.cart.lines();
    const subtotal = App.cart.subtotal();
    const coupon = App.coupon.get();
    const discount = App.coupon.discount(coupon, subtotal);
    const loc = App.location.get();
    const allExpress = lines.length > 0 && lines.every(l => l.p.express);
    const opts = loc ? App.shipping.options(loc.cep, subtotal, allExpress, coupon) : [];
    const ship = shipCost != null ? shipCost : (opts[0] ? opts[0].cost : null);
    const total = Math.max(0, subtotal - discount + (ship || 0));
    return { lines, subtotal, coupon, discount, ship, total, opts, loc, allExpress, savings: App.cart.oldSubtotal() - subtotal };
  };

  App.views.cart = () => {
    const t = App.totals();
    const saved = App.saved.items().map(s => ({ ...s, p: App.getProduct(s.id) })).filter(s => s.p);

    const savedHTML = saved.length ? `
      <section class="panel mt-2" aria-labelledby="h-saved">
        <h2 id="h-saved">Salvos para depois (${saved.length})</h2>
        ${saved.map(s => {
          const k = App.cart.key(s.id, s.color);
          return `<div class="cart-item">
            <a href="${App.productUrl(s.p)}"><img src="${App.img(s.p, s.color)}" alt="" width="112" height="112" loading="lazy"></a>
            <div><h3><a href="${App.productUrl(s.p)}">${u.esc(s.p.title)}</a></h3>
              <div class="item-actions"><button class="btn-link" type="button" data-move-cart="${k}">Mover para o carrinho</button><button class="btn-link btn-danger-link" type="button" data-remove-saved="${k}">Excluir</button></div></div>
            <div class="item-price"><strong>${u.money(s.p.price)}</strong></div>
          </div>`;
        }).join('')}
      </section>` : '';

    if (!t.lines.length) {
      const recent = App.history.list().map(App.getProduct).filter(Boolean);
      return {
        title: 'Carrinho | Vitrine',
        html: `<div class="container page-title">
          <div class="panel">${ui.empty({ icon: 'cart', title: 'Seu carrinho está vazio', text: 'Que tal aproveitar as ofertas do dia? Itens que você adicionar aparecem aqui.', action: '<a class="btn btn-primary" href="#/ofertas">Ver ofertas do dia</a>' })}</div>
          ${savedHTML}
          ${recent.length ? `<section class="section"><h2>Vistos recentemente</h2>${ui.rail('rail-cart-recent', recent)}</section>` : ''}
        </div>`
      };
    }

    const html = `
      <div class="container page-title">
        <h1>Carrinho <span class="muted" style="font-weight:400;font-size:1rem">(${u.plural(App.cart.count(), 'item', 'itens')})</span></h1>
        <div class="cart-layout">
          <div>
            <section class="panel" aria-label="Itens do carrinho">
              ${ui.shipMeter(t.subtotal)}
              <div class="mt-1">
                ${t.lines.map(l => {
                  const k = App.cart.key(l.id, l.color);
                  const off = u.pctOff(l.p.old, l.p.price);
                  return `<div class="cart-item" data-line="${k}">
                    <a href="${App.productUrl(l.p)}${l.color ? '?cor=' + l.color : ''}"><img src="${App.img(l.p, l.color)}" alt="" width="112" height="112"></a>
                    <div>
                      <h3><a href="${App.productUrl(l.p)}${l.color ? '?cor=' + l.color : ''}">${u.esc(l.p.title)}</a></h3>
                      <div class="item-meta">
                        ${l.p.c.length > 1 ? `<span>Cor: ${u.esc(l.p.c[l.color].n)}</span>` : ''}
                        <span class="${l.p.stock < 15 ? 'stock low' : 'ship-free'}" style="${l.p.stock < 15 ? 'color:var(--deal);font-weight:600' : ''}">${l.p.stock < 15 ? `Restam ${l.p.stock} em estoque` : 'Em estoque'}</span>
                        ${l.p.express ? `<span class="ship-express">${icon('bolt')} Chega amanhã</span>` : ''}
                      </div>
                      <div class="item-actions">
                        ${ui.qty(k, l.qty, Math.min(l.p.stock, 10))}
                        <button class="btn-link" type="button" data-save-later="${k}">Salvar para depois</button>
                        <button class="btn-link btn-danger-link" type="button" data-remove="${k}">${icon('trash')} Excluir</button>
                      </div>
                    </div>
                    <div class="item-price">
                      ${off ? `<span class="off small">-${off}%</span>` : ''}
                      <strong>${u.money(l.total)}</strong>
                      ${l.qty > 1 ? `<span class="muted small">${u.money(l.p.price)} cada</span>` : ''}
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </section>
            ${savedHTML}
          </div>

          <aside class="panel summary" aria-labelledby="h-summary">
            <h2 id="h-summary" style="margin:0">Resumo da compra</h2>
            <div class="summary-row"><span>Produtos (${App.cart.count()})</span><span>${u.money(t.subtotal)}</span></div>
            <div class="summary-row"><span>Frete</span>${t.ship == null
              ? `<button class="btn-link" type="button" data-action="open-cep">Calcular</button>`
              : `<span class="${t.ship ? '' : 'free'}">${t.ship ? u.money(t.ship) : 'Grátis'}</span>`}</div>
            ${t.loc ? `<div class="muted small" style="margin-top:-6px">Para ${u.esc(App.location.label())} · <button class="btn-link small" type="button" data-action="open-cep">alterar</button></div>` : ''}
            ${t.discount ? `<div class="summary-row"><span>Cupom ${u.esc(t.coupon.code)}</span><span class="free">− ${u.money(t.discount)}</span></div>` : ''}
            ${t.coupon && t.coupon.type === 'shipping' ? `<div class="summary-row"><span>Cupom ${u.esc(t.coupon.code)}</span><span class="free">Frete grátis</span></div>` : ''}

            ${t.coupon
              ? `<div class="alert alert-success">${icon('tag')}<span>Cupom <strong>${u.esc(t.coupon.code)}</strong> aplicado: ${u.esc(t.coupon.label)}. <button class="btn-link small" type="button" data-remove-coupon>Remover</button></span></div>`
              : `<form class="coupon-form" id="coupon-form" novalidate>
                  <label class="sr-only" for="coupon">Cupom de desconto</label>
                  <input id="coupon" placeholder="Cupom de desconto" autocomplete="off" aria-describedby="coupon-hint">
                  <button class="btn btn-ghost" type="submit">Aplicar</button>
                </form>
                <small class="muted" id="coupon-hint">Para testar: BEMVINDO10, FRETEGRATIS ou VITRINE50</small>`}

            <div class="summary-row total"><span>Total</span><span>${u.money(t.total)}</span></div>
            <div class="muted small" style="margin-top:-6px;text-align:right">ou <strong>${u.money(u.pix(t.total))}</strong> no Pix · até ${u.installments(t.total).n}x sem juros</div>
            ${t.savings > 0 ? `<div class="alert alert-success">${icon('tag')}<span>Você está economizando <strong>${u.money(t.savings + t.discount)}</strong> nesta compra.</span></div>` : ''}
            <a class="btn btn-primary btn-lg btn-block" href="#/checkout">Continuar a compra</a>
            <a class="btn btn-ghost btn-block" href="#/">Escolher mais produtos</a>
            <p class="secure-note">${icon('lock')} Compra segura · Seus dados são protegidos</p>
          </aside>
        </div>

        <section class="section" aria-labelledby="h-cart-recs">
          <h2 id="h-cart-recs">Aproveite e leve também</h2>
          ${ui.rail('rail-cart-recs', App.catalog.recommend(10).filter(p => !t.lines.some(l => l.id === p.id)), { label: 'Sugestões' })}
        </section>
      </div>`;

    return {
      title: `Carrinho (${App.cart.count()}) | Vitrine`,
      html,
      mount(root) {
        const rerender = () => App.router.render(true);
        root.addEventListener('click', e => {
          const t = e.target;
          const q = t.closest('[data-qty]');
          if (q) {
            const it = App.cart.items().find(i => App.cart.key(i.id, i.color) === q.dataset.qty);
            if (it) { App.cart.setQty(q.dataset.qty, it.qty + Number(q.dataset.delta)); rerender(); ui.announce(`Quantidade atualizada para ${it.qty + Number(q.dataset.delta)}`); }
          }
          const rm = t.closest('[data-remove]');
          if (rm) {
            const { removed, idx } = App.cart.remove(rm.dataset.remove);
            rerender();
            const p = App.getProduct(removed.id);
            ui.toast(`“${u.esc(p.title.split(' ').slice(0, 4).join(' '))}…” removido do carrinho`, {
              action: 'Desfazer', onAction: () => { App.cart.restore(removed, idx); rerender(); }
            });
          }
          const sl = t.closest('[data-save-later]');
          if (sl) {
            const { removed } = App.cart.remove(sl.dataset.saveLater);
            App.saved.add(removed);
            rerender(); ui.toast('Item salvo para depois');
          }
          const mv = t.closest('[data-move-cart]');
          if (mv) {
            const [id, color] = mv.dataset.moveCart.split(':').map(Number);
            App.saved.remove(mv.dataset.moveCart);
            App.cart.add(id, 1, color);
            rerender(); ui.toast('Item movido para o carrinho');
          }
          const rs = t.closest('[data-remove-saved]');
          if (rs) { App.saved.remove(rs.dataset.removeSaved); rerender(); }
          if (t.closest('[data-remove-coupon]')) { App.coupon.remove(); rerender(); }
        });
        const cf = u.$('#coupon-form', root);
        if (cf) cf.addEventListener('submit', e => {
          e.preventDefault();
          const inp = u.$('#coupon', cf);
          try {
            const c = App.coupon.apply(inp.value, App.cart.subtotal());
            rerender(); ui.toast(`Cupom ${c.code} aplicado!`);
          } catch (err) {
            ui.fieldError(inp, err.message);
            if (!inp.closest('.field')) { ui.toast(err.message, { type: 'error' }); }
            inp.focus();
          }
        });
        const offCep = () => rerender();
        App.bus.on('change:cep', offCep);
        return () => App.bus.off('change:cep', offCep);
      }
    };
  };
})(window.App);
