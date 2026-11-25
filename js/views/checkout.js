/* ==========================================================================
   views/checkout.js — Finalização da compra em 4 etapas
   1. Endereço (autopreenchido pela API ViaCEP)  2. Entrega  3. Pagamento  4. Revisão
   A etapa fica na URL (#/checkout?etapa=2): o botão "voltar" do navegador funciona.
   O rascunho é salvo no LocalStorage: recarregar a página não perde o que foi digitado.
   Segurança: o número completo do cartão NUNCA é salvo — só bandeira e 4 últimos dígitos.
   ========================================================================== */
window.App = window.App || {};
App.views = App.views || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui, icon = ui.icon;
  const STEPS = ['Endereço', 'Entrega', 'Pagamento', 'Revisão'];
  let cardMemory = {}; // dados sensíveis do cartão: apenas em memória, nunca no LocalStorage

  const draft = {
    get: () => App.db.get('checkout', { addr: {}, ship: 'eco', pay: 'pix', inst: 1 }),
    set: d => App.db.set('checkout', d)
  };

  App.views.checkout = ({ query }) => {
    if (!App.cart.count()) {
      return { title: 'Checkout | Vitrine', html: `<div class="container page-title"><div class="panel">${ui.empty({ icon: 'cart', title: 'Seu carrinho está vazio', text: 'Adicione produtos para finalizar a compra.', action: '<a class="btn btn-primary" href="#/">Ir às compras</a>' })}</div></div>` };
    }
    const d = draft.get();
    const lastAddr = App.db.get('address', null);
    if (lastAddr && !d.addr.street) d.addr = { ...lastAddr };
    const me = App.user.current();
    const loc = App.location.get();
    if (me) { d.addr.name = d.addr.name || me.name; d.addr.email = me.email; }
    if (loc && !d.addr.cep) Object.assign(d.addr, { cep: loc.cep, street: loc.street || '', district: loc.district || '', city: loc.city || '', uf: loc.uf || '' });

    // Etapa máxima liberada (não deixa pular etapas sem preencher)
    const addrOk = validAddr(d.addr).ok;
    const maxStep = !addrOk ? 1 : !d.ship ? 2 : !d.payOk ? 3 : 4;
    const step = Math.min(Math.max(1, Number(query.etapa) || 1), maxStep);

    const t = App.totals();
    const opts = App.shipping.options(d.addr.cep, t.subtotal, t.allExpress, t.coupon);
    const shipOpt = opts.find(o => o.id === d.ship) || opts[0];
    if (shipOpt) d.ship = shipOpt.id;
    const shipCost = shipOpt ? shipOpt.cost : 0;
    const base = t.subtotal - t.discount;
    const pixOff = d.pay === 'pix' ? base * App.config.pixDiscount : 0;
    const total = Math.max(0, base - pixOff + shipCost);
    const pixTotal = Math.max(0, base * (1 - App.config.pixDiscount) + shipCost);

    const body = [null, stepAddress, stepShipping, stepPayment, stepReview][step]({ d, me, opts, shipOpt, total, base, t, pixTotal });

    const html = `
      <div class="container page-title">
        <h1>${icon('lock')} Finalizar compra</h1>
        <ol class="stepper" aria-label="Etapas da compra">
          ${STEPS.map((s, i) => `<li class="${i + 1 < step ? 'done' : i + 1 === step ? 'current' : ''}" ${i + 1 === step ? 'aria-current="step"' : ''}><span>${s}</span></li>`).join('')}
        </ol>
        <div class="cart-layout">
          <section class="panel checkout-step" aria-labelledby="step-title">${body}</section>
          <aside class="panel summary" aria-labelledby="h-sum">
            <h2 id="h-sum" style="margin:0">Resumo</h2>
            <div class="mini-list">${t.lines.map(l => `<div class="mini-line"><img src="${App.img(l.p, l.color)}" alt="" width="52" height="52"><span>${u.esc(l.p.title.split(' ').slice(0, 6).join(' '))}… <span class="muted">x${l.qty}</span></span><strong>${u.money(l.total)}</strong></div>`).join('')}</div>
            <div class="summary-row"><span>Produtos</span><span>${u.money(t.subtotal)}</span></div>
            ${t.discount ? `<div class="summary-row"><span>Cupom ${u.esc(t.coupon.code)}</span><span class="free">− ${u.money(t.discount)}</span></div>` : ''}
            ${pixOff ? `<div class="summary-row"><span>Desconto Pix (5%)</span><span class="free">− ${u.money(pixOff)}</span></div>` : ''}
            <div class="summary-row"><span>Frete</span><span class="${shipOpt && !shipCost ? 'free' : ''}">${shipOpt ? (shipCost ? u.money(shipCost) : 'Grátis') : '—'}</span></div>
            <div class="summary-row total"><span>Total</span><span>${u.money(total)}</span></div>
            ${d.pay === 'card' && d.inst > 1 ? `<div class="muted small text-right">${d.inst}x de ${u.money(total / d.inst)} sem juros</div>` : ''}
            <p class="secure-note">${icon('shield')} Ambiente seguro · Protótipo: nenhum pagamento é real</p>
          </aside>
        </div>
      </div>`;

    return {
      title: `${STEPS[step - 1]} — Finalizar compra | Vitrine`,
      html,
      mount(root) {
        const go = n => { location.hash = `#/checkout?etapa=${n}`; };
        const save = () => draft.set(d);

        // Máscaras em tempo real
        root.addEventListener('input', e => {
          const el = e.target;
          if (el.id === 'a-cep') el.value = u.maskCEP(el.value);
          if (el.id === 'a-phone') el.value = u.maskPhone(el.value);
          if (el.id === 'a-cpf') el.value = u.maskCPF(el.value);
          if (el.id === 'c-number') {
            el.value = u.maskCard(el.value);
            const brand = u.cardBrand(el.value);
            u.$('#cp-num', root).textContent = el.value || '•••• •••• •••• ••••';
            u.$('#cp-brand', root).textContent = brand || 'Cartão';
            u.$('#c-brand-hint', root).textContent = brand ? `Bandeira: ${brand}` : '';
          }
          if (el.id === 'c-name') u.$('#cp-name', root).textContent = el.value.toUpperCase() || 'NOME IMPRESSO';
          if (el.id === 'c-exp') { el.value = u.maskExpiry(el.value); u.$('#cp-exp', root).textContent = el.value || 'MM/AA'; }
          if (el.id === 'c-cvv') el.value = u.digits(el.value).slice(0, 4);
        });

        // Busca de endereço pelo CEP (ViaCEP) ao completar 8 dígitos
        const cepInput = u.$('#a-cep', root);
        if (cepInput) {
          const fill = async () => {
            if (!u.isCEP(cepInput.value)) return;
            const status = u.$('#cep-status', root);
            status.textContent = 'Buscando endereço…';
            const data = await App.location.lookup(cepInput.value);
            if (data.notFound) { ui.fieldError(cepInput, 'CEP não encontrado. Confira os números.'); status.textContent = ''; return; }
            ui.fieldError(cepInput, '');
            if (data.offline) { status.textContent = 'Sem conexão com o serviço de CEP: preencha o endereço manualmente.'; return; }
            ['street', 'district', 'city', 'uf'].forEach(k => { const f = u.$('#a-' + k, root); if (f && data[k]) f.value = data[k]; });
            status.textContent = `Endereço encontrado: ${data.city}/${data.uf}`;
            App.location.set(data);
            u.$('#a-number', root).focus();
          };
          cepInput.addEventListener('input', () => { if (u.digits(cepInput.value).length === 8) fill(); });
        }

        // Troca de forma de pagamento sem recarregar a página
        root.addEventListener('change', e => {
          if (e.target.name === 'pay') {
            d.pay = e.target.value; d.payOk = false; save();
            App.router.render(true);
          }
          if (e.target.name === 'ship') { d.ship = e.target.value; save(); App.router.render(true); }
          if (e.target.id === 'c-inst') { d.inst = Number(e.target.value); save(); }
        });

        root.addEventListener('click', e => {
          const b = e.target.closest('[data-step]');
          if (b) go(Number(b.dataset.step));
        });

        root.addEventListener('submit', e => {
          e.preventDefault();
          const f = e.target;
          if (f.id === 'form-addr') {
            const a = {};
            ['name', 'email', 'phone', 'cpf', 'cep', 'street', 'number', 'comp', 'district', 'city', 'uf'].forEach(k => { const el = u.$('#a-' + k, f); if (el) a[k] = el.value.trim(); });
            const v = validAddr(a);
            Object.entries(v.errors).forEach(([k, msg]) => { const el = u.$('#a-' + k, f); if (el) ui.fieldError(el, msg); });
            ['name', 'email', 'phone', 'cpf', 'cep', 'street', 'number', 'district', 'city', 'uf'].forEach(k => { if (!v.errors[k]) { const el = u.$('#a-' + k, f); if (el) ui.fieldError(el, ''); } });
            if (!v.ok) {
              const first = u.$('[aria-invalid="true"]', f);
              first && first.focus();
              ui.announce(`Corrija ${u.plural(Object.keys(v.errors).length, 'campo', 'campos')} destacados.`);
              return;
            }
            a.cep = u.digits(a.cep);
            d.addr = a; save();
            if (!App.location.get() || App.location.get().cep !== a.cep) App.location.set({ cep: a.cep, city: a.city, uf: a.uf, street: a.street, district: a.district });
            go(2);
          }
          if (f.id === 'form-ship') { save(); go(3); }
          if (f.id === 'form-pay') {
            if (d.pay === 'card') {
              const num = u.$('#c-number', f), name = u.$('#c-name', f), exp = u.$('#c-exp', f), cvv = u.$('#c-cvv', f);
              const ok = [
                ui.fieldError(num, u.luhn(num.value) ? '' : 'Número de cartão inválido. Confira os dígitos.'),
                ui.fieldError(name, name.value.trim().split(/\s+/).length >= 2 ? '' : 'Digite o nome como está no cartão.'),
                ui.fieldError(exp, u.isExpiryValid(exp.value) ? '' : 'Validade inválida ou cartão vencido.'),
                ui.fieldError(cvv, /^\d{3,4}$/.test(cvv.value) ? '' : 'O código tem 3 ou 4 números.')
              ];
              if (ok.includes(false)) { u.$('[aria-invalid="true"]', f).focus(); return; }
              cardMemory = { brand: u.cardBrand(num.value) || 'Cartão', last4: u.digits(num.value).slice(-4), name: name.value.trim() };
              d.card = { brand: cardMemory.brand, last4: cardMemory.last4 };
              d.inst = Number(u.$('#c-inst', f).value);
            }
            d.payOk = true; save(); go(4);
          }
          if (f.id === 'form-review') {
            const accept = u.$('#accept', f);
            if (!accept.checked) { ui.toast('Confirme que leu os termos para finalizar.', { type: 'error' }); accept.focus(); return; }
            const order = App.orders.create({
              email: d.addr.email.toLowerCase(), guest: !me, name: d.addr.name,
              items: t.lines.map(l => ({ id: l.id, color: l.color, qty: l.qty, price: l.p.price, title: l.p.title })),
              address: d.addr,
              ship: { name: shipOpt.name, cost: shipCost, date: shipOpt.date },
              payment: { method: d.pay, inst: d.pay === 'card' ? d.inst : 1, brand: d.card && d.card.brand, last4: d.card && d.card.last4 },
              totals: { subtotal: t.subtotal, discount: t.discount, coupon: t.coupon && t.coupon.code, pix: pixOff, ship: shipCost, total },
              status: d.pay === 'card' ? 1 : 0
            });
            App.db.set('address', d.addr); // lembra o endereço para a próxima compra
            App.cart.clear(); App.coupon.remove(); App.db.remove('checkout'); cardMemory = {};
            location.hash = `#/pedido/${order.id}?novo=1`;
          }
        });
      }
    };
  };

  function validAddr(a) {
    const e = {};
    if (!a.name || a.name.trim().split(/\s+/).length < 2) e.name = 'Informe nome e sobrenome.';
    if (!u.isEmail(a.email || '')) e.email = 'Informe um e-mail válido (ex.: nome@email.com).';
    if (u.digits(a.phone).length < 10) e.phone = 'Informe um telefone com DDD.';
    if (a.cpf && !u.isCPF(a.cpf)) e.cpf = 'CPF inválido. Confira os números.';
    if (!u.isCEP(a.cep || '')) e.cep = 'O CEP tem 8 números.';
    if (!a.street) e.street = 'Informe a rua.';
    if (!a.number) e.number = 'Informe o número (ou S/N).';
    if (!a.district) e.district = 'Informe o bairro.';
    if (!a.city) e.city = 'Informe a cidade.';
    if (!/^[A-Za-z]{2}$/.test(a.uf || '')) e.uf = 'UF com 2 letras.';
    return { ok: !Object.keys(e).length, errors: e };
  }

  const fld = (id, label, val, attrs = '', help = '') => `
    <div class="field"><label for="a-${id}">${label}</label>
      <input id="a-${id}" value="${u.esc(val || '')}" ${attrs}>
      ${help ? `<small class="help" id="a-${id}-help">${help}</small>` : ''}
    </div>`;

  function stepAddress({ d, me }) {
    const a = d.addr;
    return `
      <h2 id="step-title">${icon('pin')} Onde você quer receber?</h2>
      ${me ? '' : `<div class="alert alert-info">${icon('user')}<span>Já tem conta? <a href="#/conta?voltar=checkout">Entre</a> para preencher mais rápido. Ou continue como visitante.</span></div>`}
      <form id="form-addr" class="mt-2" novalidate>
        <div class="field-row">
          ${fld('name', 'Nome completo', a.name, 'autocomplete="name" required')}
          ${fld('email', 'E-mail', a.email, `type="email" autocomplete="email" required ${me ? 'readonly' : ''}`, 'Enviaremos a confirmação do pedido.')}
        </div>
        <div class="field-row">
          ${fld('phone', 'Celular com DDD', a.phone, 'type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 91234-5678" required')}
          ${fld('cpf', 'CPF <span class="muted small">(opcional)</span>', a.cpf, 'inputmode="numeric" placeholder="000.000.000-00"', 'Para emissão da nota fiscal.')}
        </div>
        <div class="field-row">
          <div class="field"><label for="a-cep">CEP</label>
            <input id="a-cep" value="${u.esc(u.maskCEP(a.cep || ''))}" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" required aria-describedby="cep-status">
            <small class="help" id="cep-status" aria-live="polite">Preenchemos o endereço automaticamente.</small>
          </div>
          ${fld('street', 'Rua / Avenida', a.street, 'autocomplete="address-line1" required')}
        </div>
        <div class="field-row">
          ${fld('number', 'Número', a.number, 'inputmode="numeric" required')}
          ${fld('comp', 'Complemento <span class="muted small">(opcional)</span>', a.comp, 'autocomplete="address-line2" placeholder="Apto, bloco…"')}
        </div>
        <div class="field-row">
          ${fld('district', 'Bairro', a.district, 'required')}
          ${fld('city', 'Cidade', a.city, 'autocomplete="address-level2" required')}
          ${fld('uf', 'UF', a.uf, 'maxlength="2" autocomplete="address-level1" style="text-transform:uppercase" required')}
        </div>
        <div class="step-actions">
          <a class="btn btn-ghost" href="#/carrinho">${icon('left')} Voltar ao carrinho</a>
          <button class="btn btn-primary btn-lg" type="submit">Continuar ${icon('right')}</button>
        </div>
      </form>`;
  }

  function stepShipping({ d, opts }) {
    const a = d.addr;
    return `
      <h2 id="step-title">${icon('truck')} Escolha a forma de entrega</h2>
      <p class="muted">Entregar em: <strong>${u.esc(a.street)}, ${u.esc(a.number)}${a.comp ? ' - ' + u.esc(a.comp) : ''} — ${u.esc(a.city)}/${u.esc(a.uf.toUpperCase())}</strong> · <button class="btn-link" type="button" data-step="1">Alterar</button></p>
      <form id="form-ship" novalidate>
        <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Opções de entrega</legend>
        ${opts.map(o => `
          <label class="option-card">
            <input type="radio" name="ship" value="${o.id}" ${d.ship === o.id ? 'checked' : ''}>
            ${icon(o.id === 'exp' ? 'bolt' : 'truck')}
            <span class="opt-body"><strong>${o.name}</strong><span class="muted small">Chega ${o.days <= 1 ? 'amanhã' : 'até ' + u.fmtDate(o.date)}</span></span>
            <span class="opt-side ${o.cost ? '' : 'free'}">${o.cost ? u.money(o.cost) : 'Grátis'}</span>
          </label>`).join('')}
        </fieldset>
        ${opts.length < 2 ? `<p class="muted small mt-1">${icon('info')} Entrega expressa disponível apenas quando todos os itens têm o selo “Chega amanhã”.</p>` : ''}
        <div class="step-actions">
          <button class="btn btn-ghost" type="button" data-step="1">${icon('left')} Voltar</button>
          <button class="btn btn-primary btn-lg" type="submit">Continuar ${icon('right')}</button>
        </div>
      </form>`;
  }

  function stepPayment({ d, total, base, pixTotal }) {
    const inst = u.installments(total);
    const c = cardMemory;
    return `
      <h2 id="step-title">${icon('card')} Como você prefere pagar?</h2>
      <form id="form-pay" novalidate>
        <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Forma de pagamento</legend>
          <label class="option-card"><input type="radio" name="pay" value="pix" ${d.pay === 'pix' ? 'checked' : ''}>${icon('pix')}
            <span class="opt-body"><strong>Pix</strong><span class="muted small">Aprovação imediata · <span class="off">5% de desconto</span></span></span>
            <span class="opt-side free">${u.money(pixTotal)}</span></label>
          <label class="option-card"><input type="radio" name="pay" value="card" ${d.pay === 'card' ? 'checked' : ''}>${icon('card')}
            <span class="opt-body"><strong>Cartão de crédito</strong><span class="muted small">Em até ${inst.n}x sem juros</span></span></label>
          <label class="option-card"><input type="radio" name="pay" value="boleto" ${d.pay === 'boleto' ? 'checked' : ''}>${icon('barcode')}
            <span class="opt-body"><strong>Boleto bancário</strong><span class="muted small">Aprovação em até 2 dias úteis após o pagamento</span></span></label>
        </fieldset>

        ${d.pay === 'card' ? `
          <div class="mt-3">
            <div class="card-preview" aria-hidden="true">
              <div class="cp-top"><span class="chip-ic"></span><span id="cp-brand">${u.esc(c.brand || 'Cartão')}</span></div>
              <div class="cp-num" id="cp-num">${c.last4 ? '•••• •••• •••• ' + c.last4 : '•••• •••• •••• ••••'}</div>
              <div class="cp-bottom"><span id="cp-name">${u.esc((c.name || 'Nome impresso').toUpperCase())}</span><span id="cp-exp">MM/AA</span></div>
            </div>
            <div class="field"><label for="c-number">Número do cartão</label>
              <input id="c-number" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="23" aria-describedby="c-brand-hint c-test">
              <small class="help" id="c-brand-hint" aria-live="polite"></small>
              <small class="help" id="c-test">Para testar use 4111 1111 1111 1111 (cartão fictício de teste).</small>
            </div>
            <div class="field"><label for="c-name">Nome impresso no cartão</label><input id="c-name" autocomplete="cc-name" value="${u.esc(c.name || '')}"></div>
            <div class="field-row">
              <div class="field"><label for="c-exp">Validade</label><input id="c-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"></div>
              <div class="field"><label for="c-cvv">Código de segurança (CVV)</label><input id="c-cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div>
            </div>
            <div class="field"><label for="c-inst">Parcelas</label>
              <select id="c-inst">${Array.from({ length: inst.n }, (_, i) => `<option value="${i + 1}" ${d.inst === i + 1 ? 'selected' : ''}>${i + 1}x de ${u.money(total / (i + 1))} sem juros</option>`).join('')}</select>
            </div>
            <p class="muted small">${icon('lock')} Por segurança, o número completo do cartão não é armazenado.</p>
          </div>` : ''}
        ${d.pay === 'pix' ? `<div class="alert alert-success mt-2">${icon('pix')}<span>O QR Code e o código “copia e cola” aparecem após finalizar. Você economiza <strong>${u.money(base * App.config.pixDiscount)}</strong>.</span></div>` : ''}
        ${d.pay === 'boleto' ? `<div class="alert alert-warning mt-2">${icon('info')}<span>O boleto vence em 3 dias úteis. O prazo de entrega começa a contar após a compensação.</span></div>` : ''}

        <div class="step-actions">
          <button class="btn btn-ghost" type="button" data-step="2">${icon('left')} Voltar</button>
          <button class="btn btn-primary btn-lg" type="submit">Revisar pedido ${icon('right')}</button>
        </div>
      </form>`;
  }

  function stepReview({ d, shipOpt, total }) {
    const a = d.addr;
    const payLabel = d.pay === 'pix' ? 'Pix (5% de desconto)' : d.pay === 'boleto' ? 'Boleto bancário' : `${u.esc(d.card.brand)} final ${u.esc(d.card.last4)} · ${d.inst}x de ${u.money(total / d.inst)} sem juros`;
    return `
      <h2 id="step-title">${icon('check')} Revise e confirme</h2>
      <div class="review-block"><div><strong>Entrega para ${u.esc(a.name)}</strong><p>${u.esc(a.street)}, ${u.esc(a.number)}${a.comp ? ' - ' + u.esc(a.comp) : ''} · ${u.esc(a.district)} · ${u.esc(a.city)}/${u.esc(a.uf.toUpperCase())} · CEP ${u.maskCEP(a.cep)}</p><p>${u.esc(a.email)} · ${u.esc(a.phone)}</p></div><button class="btn-link" type="button" data-step="1">Alterar</button></div>
      <div class="review-block"><div><strong>${u.esc(shipOpt.name)}</strong><p>Chega ${shipOpt.days <= 1 ? 'amanhã' : 'até ' + u.fmtDate(shipOpt.date)} · ${shipOpt.cost ? u.money(shipOpt.cost) : 'Grátis'}</p></div><button class="btn-link" type="button" data-step="2">Alterar</button></div>
      <div class="review-block"><div><strong>Pagamento</strong><p>${payLabel}</p></div><button class="btn-link" type="button" data-step="3">Alterar</button></div>
      <form id="form-review" class="mt-2" novalidate>
        <label class="check"><input type="checkbox" id="accept"> Li e concordo que este é um protótipo e nenhuma cobrança real será feita.</label>
        <div class="step-actions">
          <button class="btn btn-ghost" type="button" data-step="3">${icon('left')} Voltar</button>
          <button class="btn btn-primary btn-lg" type="submit">${icon('lock')} Confirmar compra · ${u.money(total)}</button>
        </div>
      </form>`;
  }
})(window.App);
