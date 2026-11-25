/* ==========================================================================
   views/account.js — Conta (entrar/cadastrar), pedidos, detalhe do pedido e favoritos
   ========================================================================== */
window.App = window.App || {};
App.views = App.views || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui, icon = ui.icon;

  // ---------------- Conta ----------------
  App.views.account = ({ query }) => {
    const me = App.user.current();
    if (me) {
      const orders = App.orders.mine();
      return {
        title: 'Minha conta | Vitrine',
        html: `<div class="container page-title">
          <div class="flex" style="justify-content:space-between">
            <h1 style="margin:0">Olá, ${u.esc(me.name.split(' ')[0])}!</h1>
            <button class="btn btn-ghost btn-sm" type="button" data-logout>${icon('logout')} Sair</button>
          </div>
          <p class="muted">${u.esc(me.email)} · cliente desde ${u.fmtDateShort(me.createdAt)}</p>
          <div class="account-grid mt-2">
            <a class="account-tile" href="#/pedidos">${icon('package')}<div><strong>Seus pedidos</strong><span>${u.plural(orders.length, 'pedido', 'pedidos')} · acompanhe a entrega</span></div></a>
            <a class="account-tile" href="#/favoritos">${icon('heart')}<div><strong>Favoritos</strong><span>${u.plural(App.fav.list().length, 'produto salvo', 'produtos salvos')}</span></div></a>
            <a class="account-tile" href="#/carrinho">${icon('cart')}<div><strong>Carrinho</strong><span>${u.plural(App.cart.count(), 'item', 'itens')}</span></div></a>
            <button class="account-tile" type="button" data-action="open-cep" style="text-align:left;font:inherit">${icon('pin')}<div><strong>Endereço de entrega</strong><span>${u.esc(App.location.label())}</span></div></button>
            <a class="account-tile" href="#/ajuda">${icon('help')}<div><strong>Central de ajuda</strong><span>Trocas, prazos e pagamentos</span></div></a>
          </div>
          <section class="panel mt-3" aria-labelledby="h-data">
            <h2 id="h-data">Dados deste protótipo</h2>
            <p class="muted">Tudo o que você faz aqui (carrinho, favoritos, pedidos, conta) fica salvo no <strong>LocalStorage</strong> deste navegador. Nada é enviado para servidores.</p>
            <button class="btn btn-ghost" type="button" data-reset>${icon('trash')} Apagar todos os dados do protótipo</button>
          </section>
        </div>`,
        mount(root) {
          root.addEventListener('click', e => {
            if (e.target.closest('[data-logout]')) { App.user.logout(); ui.toast('Você saiu da sua conta.'); App.router.render(true); }
            if (e.target.closest('[data-reset]') && confirm('Apagar carrinho, favoritos, pedidos e contas salvos neste navegador?')) {
              App.db.clearAll(); ui.toast('Dados apagados.'); location.hash = '#/';
              App.bus.emit('change:cart'); App.bus.emit('change:favorites'); App.bus.emit('change:session'); App.bus.emit('change:cep');
            }
          });
        }
      };
    }

    const tab = query.aba === 'cadastro' ? 'cadastro' : 'entrar';
    const back = query.voltar ? `#/${query.voltar}` : '#/conta';
    return {
      title: (tab === 'cadastro' ? 'Criar conta' : 'Entrar') + ' | Vitrine',
      html: `<div class="container">
        <div class="auth-wrap panel">
          <div class="tabs" role="tablist" aria-label="Acesso">
            <button role="tab" id="t-in" aria-selected="${tab === 'entrar'}" aria-controls="p-in" data-tab="entrar" ${tab === 'entrar' ? '' : 'tabindex="-1"'}>Entrar</button>
            <button role="tab" id="t-up" aria-selected="${tab === 'cadastro'}" aria-controls="p-up" data-tab="cadastro" ${tab === 'cadastro' ? '' : 'tabindex="-1"'}>Criar conta</button>
          </div>
          <div role="tabpanel" id="p-in" aria-labelledby="t-in" ${tab === 'entrar' ? '' : 'hidden'}>
            <h1 style="font-size:1.3rem">Acesse sua conta</h1>
            <form id="form-login" novalidate>
              <div class="field"><label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="username" required></div>
              <div class="field"><label for="l-pass">Senha</label>
                <div class="password-wrap"><input id="l-pass" type="password" autocomplete="current-password" required>
                <button class="icon-btn" type="button" data-toggle-pass="l-pass" aria-label="Mostrar senha" aria-pressed="false">${icon('eye')}</button></div></div>
              <div class="alert alert-warning hide" id="login-error" role="alert"></div>
              <button class="btn btn-primary btn-lg btn-block mt-1" type="submit">Entrar</button>
            </form>
            <p class="muted small mt-2">Novo por aqui? <button class="btn-link" type="button" data-tab="cadastro">Crie sua conta grátis</button></p>
          </div>
          <div role="tabpanel" id="p-up" aria-labelledby="t-up" ${tab === 'cadastro' ? '' : 'hidden'}>
            <h1 style="font-size:1.3rem">Crie sua conta</h1>
            <form id="form-register" novalidate>
              <div class="field"><label for="r-name">Nome completo</label><input id="r-name" autocomplete="name" required></div>
              <div class="field"><label for="r-email">E-mail</label><input id="r-email" type="email" autocomplete="email" required></div>
              <div class="field"><label for="r-pass">Senha</label>
                <div class="password-wrap"><input id="r-pass" type="password" autocomplete="new-password" required aria-describedby="r-pass-help">
                <button class="icon-btn" type="button" data-toggle-pass="r-pass" aria-label="Mostrar senha" aria-pressed="false">${icon('eye')}</button></div>
                <div class="strength" aria-hidden="true"><span id="r-strength"></span></div>
                <small class="help" id="r-pass-help">Mínimo de 8 caracteres, com letras e números.</small></div>
              <button class="btn btn-primary btn-lg btn-block" type="submit">Criar conta</button>
              <p class="muted small mt-1">${icon('info')} Protótipo: a senha é guardada apenas como hash (SHA-256) no seu navegador.</p>
            </form>
          </div>
        </div>
      </div>`,
      mount(root) {
        root.addEventListener('click', e => {
          const tb = e.target.closest('[data-tab]');
          if (tb) { location.hash = '#/conta' + u.toQuery({ aba: tb.dataset.tab === 'cadastro' ? 'cadastro' : '', voltar: query.voltar }); }
          const tp = e.target.closest('[data-toggle-pass]');
          if (tp) {
            const inp = u.$('#' + tp.dataset.togglePass, root);
            const show = inp.type === 'password';
            inp.type = show ? 'text' : 'password';
            tp.setAttribute('aria-pressed', show);
            tp.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
          }
        });
        // Setas do teclado entre as abas (padrão WAI-ARIA Tabs)
        root.addEventListener('keydown', e => {
          if (e.target.getAttribute('role') === 'tab' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
            location.hash = '#/conta' + u.toQuery({ aba: tab === 'entrar' ? 'cadastro' : '', voltar: query.voltar });
          }
        });
        root.addEventListener('input', e => {
          if (e.target.id === 'r-pass') {
            const v = e.target.value;
            const score = [v.length >= 8, /[a-z]/i.test(v) && /\d/.test(v), /[^a-z0-9]/i.test(v), v.length >= 12].filter(Boolean).length;
            const bar = u.$('#r-strength', root);
            bar.style.width = `${score * 25}%`;
            bar.style.background = ['#c62a1d', '#c62a1d', '#f79009', '#84cc16', '#12b76a'][score];
            u.$('#r-pass-help', root).textContent = ['Mínimo de 8 caracteres, com letras e números.', 'Senha fraca', 'Senha razoável', 'Senha boa', 'Senha forte'][score];
          }
        });
        root.addEventListener('submit', async e => {
          e.preventDefault();
          const f = e.target;
          if (f.id === 'form-login') {
            const em = u.$('#l-email', f), pw = u.$('#l-pass', f);
            const ok = [ui.fieldError(em, u.isEmail(em.value) ? '' : 'Informe um e-mail válido.'), ui.fieldError(pw, pw.value ? '' : 'Informe sua senha.')];
            if (ok.includes(false)) return u.$('[aria-invalid="true"]', f).focus();
            try {
              await App.user.login(em.value, pw.value);
              ui.toast(`Bem-vindo(a) de volta, ${u.esc(App.user.current().name.split(' ')[0])}!`);
              location.hash = back;
            } catch (err) {
              const box = u.$('#login-error', f);
              box.innerHTML = `${icon('info')}<span>${err.message} <button class="btn-link small" type="button" data-tab="cadastro">Criar conta</button></span>`;
              box.classList.remove('hide');
            }
          }
          if (f.id === 'form-register') {
            const nm = u.$('#r-name', f), em = u.$('#r-email', f), pw = u.$('#r-pass', f);
            const ok = [
              ui.fieldError(nm, nm.value.trim().split(/\s+/).length >= 2 ? '' : 'Informe nome e sobrenome.'),
              ui.fieldError(em, u.isEmail(em.value) ? '' : 'Informe um e-mail válido (ex.: nome@email.com).'),
              ui.fieldError(pw, pw.value.length >= 8 && /[a-z]/i.test(pw.value) && /\d/.test(pw.value) ? '' : 'A senha precisa de 8+ caracteres com letras e números.')
            ];
            if (ok.includes(false)) return u.$('[aria-invalid="true"]', f).focus();
            try {
              await App.user.register({ name: nm.value, email: em.value, password: pw.value });
              ui.toast('Conta criada com sucesso!');
              location.hash = back;
            } catch (err) { ui.fieldError(em, err.message); em.focus(); }
          }
        });
      }
    };
  };

  // ---------------- Lista de pedidos ----------------
  const statusClass = s => (s === 0 ? 'status-wait' : s >= 3 ? 'status-ship' : 'status-ok');

  App.views.orders = () => {
    const me = App.user.current();
    const list = App.orders.mine();
    return {
      title: 'Seus pedidos | Vitrine',
      html: `<div class="container page-title">
        <h1>Seus pedidos</h1>
        ${!me ? `<div class="alert alert-info">${icon('info')}<span>Mostrando pedidos feitos como visitante neste navegador. <a href="#/conta?voltar=pedidos">Entre na sua conta</a> para ver os pedidos dela.</span></div>` : ''}
        ${list.length ? `<div class="stack mt-2">${list.map(o => `
          <article class="panel order-card" aria-label="Pedido ${o.id}">
            <div class="order-head">
              <div>Pedido realizado<strong>${u.fmtDateShort(o.createdAt)}</strong></div>
              <div>Total<strong>${u.money(o.totals.total)}</strong></div>
              <div>Enviar para<strong>${u.esc(o.name)}</strong></div>
              <div style="margin-left:auto">Pedido nº<strong>${o.id}</strong></div>
            </div>
            <div class="flex" style="justify-content:space-between;align-items:flex-start">
              <div class="stack">
                <span class="status ${statusClass(o.status)}">${App.STATUS[o.status]}</span>
                <div class="order-thumbs">${o.items.map(it => { const p = App.getProduct(it.id); return p ? `<a href="${App.productUrl(p)}" title="${u.esc(p.title)}"><img src="${App.img(p, it.color)}" alt="${u.esc(p.title)}" width="64" height="64" loading="lazy"></a>` : ''; }).join('')}</div>
              </div>
              <div class="stack" style="min-width:200px">
                <a class="btn btn-primary btn-sm" href="#/pedido/${o.id}">Ver detalhes do pedido</a>
                <button class="btn btn-ghost btn-sm" type="button" data-rebuy="${o.id}">Comprar novamente</button>
              </div>
            </div>
          </article>`).join('')}</div>`
        : `<div class="panel">${ui.empty({ icon: 'package', title: 'Você ainda não fez pedidos', text: 'Quando você comprar algo, poderá acompanhar a entrega por aqui.', action: '<a class="btn btn-primary" href="#/ofertas">Ver ofertas</a>' })}</div>`}
      </div>`,
      mount(root) {
        root.addEventListener('click', e => {
          const rb = e.target.closest('[data-rebuy]');
          if (rb) {
            App.orders.get(rb.dataset.rebuy).items.forEach(it => App.cart.add(it.id, it.qty, it.color));
            ui.toast('Itens adicionados ao carrinho', { action: 'Ver carrinho', onAction: () => { location.hash = '#/carrinho'; } });
          }
        });
      }
    };
  };

  // ---------------- Detalhe / confirmação do pedido ----------------
  /** QR Code ILUSTRATIVO (padrão determinístico, não é um Pix válido) */
  function fakeQR(seed) {
    const rnd = u.rng([...seed].reduce((a, c) => a + c.charCodeAt(0), 0));
    const n = 25; let rects = '';
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#111"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#111"/>`;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inFinder && rnd() > 0.52) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#111"/>`;
    }
    return `<svg class="qr" viewBox="0 0 ${n} ${n}" role="img" aria-label="QR Code ilustrativo do Pix" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/>${rects}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
  }

  App.views.order = ({ params, query }) => {
    const o = App.orders.get(params.id);
    if (!o) return App.views.notFound();
    const isNew = query.novo === '1';
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136vitrine-prototipo-${o.id.toLowerCase()}5204000053039865406${o.totals.total.toFixed(2)}5802BR5907VITRINE6009SAO PAULO`;
    const boleto = `34191.79001 01043.510047 91020.150008 8 ${String(Math.round(o.totals.total * 100)).padStart(10, '0')}`;
    const hist = s => o.history.find(h => h.s === s);
    const firstName = u.esc(o.name.split(' ')[0]);

    return {
      title: `Pedido ${o.id} | Vitrine`,
      html: `<div class="container">
        ${isNew ? `<div class="success-hero"><div class="success-icon">${icon('check')}</div>
          <h1>${o.status === 0 ? `Pedido reservado, ${firstName}!` : `Compra confirmada, ${firstName}!`}</h1>
          <p class="muted">Pedido nº <strong>${o.id}</strong> · enviamos os detalhes para ${u.esc(o.email)}.</p></div>`
        : `${ui.breadcrumb([{ label: 'Início', href: '#/' }, { label: 'Seus pedidos', href: '#/pedidos' }, { label: 'Pedido ' + o.id }])}<h1>Pedido nº ${o.id}</h1>`}

        <div class="cart-layout mt-2">
          <div class="stack">
            ${o.status === 0 && o.payment.method === 'pix' ? `
              <section class="panel" aria-labelledby="h-pix">
                <h2 id="h-pix">${icon('pix')} Pague com Pix para confirmar</h2>
                <div class="pix-box">
                  ${fakeQR(o.id)}
                  <div class="stack">
                    <p style="margin:0">Abra o app do seu banco, escolha <strong>Pix › Pagar com QR Code</strong> ou use o código abaixo.</p>
                    <div class="code-box"><label class="sr-only" for="pix-code">Código Pix copia e cola</label><input id="pix-code" readonly value="${pixCode}"><button class="btn btn-secondary" type="button" data-copy="pix-code">${icon('copy')} Copiar</button></div>
                    <p class="muted small" style="margin:0">${ui.countdown(o.createdAt + 30 * 60000, 'O código expira em')}</p>
                    <button class="btn btn-primary" type="button" data-simulate-pay>${icon('check')} Simular pagamento aprovado</button>
                  </div>
                </div>
              </section>` : ''}
            ${o.status === 0 && o.payment.method === 'boleto' ? `
              <section class="panel" aria-labelledby="h-bol">
                <h2 id="h-bol">${icon('barcode')} Pague o boleto até ${u.fmtDate(u.addBusinessDays(o.createdAt, 3), { day: '2-digit', month: 'long' })}</h2>
                <div class="code-box"><label class="sr-only" for="bol-code">Linha digitável</label><input id="bol-code" readonly value="${boleto}"><button class="btn btn-secondary" type="button" data-copy="bol-code">${icon('copy')} Copiar</button></div>
                <div class="flex mt-2"><button class="btn btn-ghost" type="button" onclick="window.print()">Imprimir boleto</button><button class="btn btn-primary" type="button" data-simulate-pay>Simular pagamento</button></div>
              </section>` : ''}

            <section class="panel" aria-labelledby="h-track">
              <div class="flex" style="justify-content:space-between"><h2 id="h-track" style="margin:0">Acompanhe seu pedido</h2><span class="status ${statusClass(o.status)}">${App.STATUS[o.status]}</span></div>
              <ol class="timeline mt-2">
                ${App.STATUS.map((s, i) => `<li class="${i < o.status ? 'done' : i === o.status ? 'current done' : ''}" ${i === o.status ? 'aria-current="step"' : ''}><div><strong>${s}</strong><span>${hist(i) ? u.fmtDateTime(hist(i).at) : i === App.STATUS.length - 1 ? 'Previsão: ' + u.fmtDate(o.ship.date) : 'Pendente'}</span></div></li>`).join('')}
              </ol>
              ${o.status > 0 && o.status < App.STATUS.length - 1 ? `<button class="btn btn-ghost btn-sm no-print" type="button" data-advance>Simular próxima etapa (demonstração)</button>` : ''}
            </section>

            <section class="panel" aria-labelledby="h-items">
              <h2 id="h-items">Itens do pedido</h2>
              ${o.items.map(it => { const p = App.getProduct(it.id); return `<div class="cart-item">
                <img src="${App.img(p, it.color)}" alt="" width="112" height="112" loading="lazy">
                <div><h3><a href="${App.productUrl(p)}">${u.esc(it.title)}</a></h3><div class="item-meta">${p.c.length > 1 ? `<span>Cor: ${u.esc(p.c[it.color].n)}</span>` : ''}<span>Quantidade: ${it.qty}</span></div>
                ${o.status === App.STATUS.length - 1 ? `<div class="item-actions"><a class="btn btn-secondary btn-sm" href="${App.productUrl(p)}#avaliacoes">Avaliar produto</a></div>` : ''}</div>
                <div class="item-price"><strong>${u.money(it.price * it.qty)}</strong></div></div>`; }).join('')}
            </section>
          </div>

          <aside class="panel summary" aria-labelledby="h-osum">
            <h2 id="h-osum" style="margin:0">Resumo</h2>
            <div class="summary-row"><span>Produtos</span><span>${u.money(o.totals.subtotal)}</span></div>
            ${o.totals.discount ? `<div class="summary-row"><span>Cupom ${u.esc(o.totals.coupon)}</span><span class="free">− ${u.money(o.totals.discount)}</span></div>` : ''}
            ${o.totals.pix ? `<div class="summary-row"><span>Desconto Pix</span><span class="free">− ${u.money(o.totals.pix)}</span></div>` : ''}
            <div class="summary-row"><span>Frete</span><span class="${o.totals.ship ? '' : 'free'}">${o.totals.ship ? u.money(o.totals.ship) : 'Grátis'}</span></div>
            <div class="summary-row total"><span>Total</span><span>${u.money(o.totals.total)}</span></div>
            <div class="review-block" style="border:0;padding:0"><div><strong>Pagamento</strong><p>${o.payment.method === 'pix' ? 'Pix' : o.payment.method === 'boleto' ? 'Boleto bancário' : `${u.esc(o.payment.brand)} final ${u.esc(o.payment.last4)} · ${o.payment.inst}x`}</p></div></div>
            <div class="review-block" style="border:0;padding:0"><div><strong>Entrega</strong><p>${u.esc(o.address.street)}, ${u.esc(o.address.number)} · ${u.esc(o.address.city)}/${u.esc(o.address.uf.toUpperCase())}</p><p>${u.esc(o.ship.name)}</p></div></div>
            <a class="btn btn-ghost btn-block no-print" href="#/pedidos">Ver todos os pedidos</a>
            <a class="btn btn-primary btn-block no-print" href="#/">Continuar comprando</a>
          </aside>
        </div>
      </div>`,
      mount(root) {
        root.addEventListener('click', async e => {
          const cp = e.target.closest('[data-copy]');
          if (cp) {
            const inp = u.$('#' + cp.dataset.copy, root);
            try { await navigator.clipboard.writeText(inp.value); } catch (err) { inp.select(); document.execCommand && document.execCommand('copy'); }
            ui.toast('Código copiado!');
          }
          if (e.target.closest('[data-simulate-pay]')) { App.orders.advance(o.id); ui.toast('Pagamento aprovado! Seu pedido já está sendo preparado.'); App.router.render(true); }
          if (e.target.closest('[data-advance]')) { App.orders.advance(o.id); App.router.render(true); }
        });
      }
    };
  };

  // ---------------- Favoritos ----------------
  App.views.favorites = () => {
    const list = App.fav.list().map(App.getProduct).filter(Boolean);
    return {
      title: 'Favoritos | Vitrine',
      html: `<div class="container page-title">
        <h1>${icon('heart')} Favoritos <span class="muted" style="font-weight:400;font-size:1rem">(${list.length})</span></h1>
        ${list.length ? ui.grid(list) : `<div class="panel">${ui.empty({ icon: 'heart', title: 'Sua lista de favoritos está vazia', text: 'Toque no coração dos produtos para salvá-los aqui e comparar depois.', action: '<a class="btn btn-primary" href="#/busca?ordem=vendidos">Ver mais vendidos</a>' })}</div>`}
      </div>`,
      mount() {
        const re = () => App.router.render(true);
        App.bus.on('change:favorites', re);
        return () => App.bus.off('change:favorites', re);
      }
    };
  };
})(window.App);
