/* ==========================================================================
   views/pages.js — Ofertas do dia, Central de ajuda e página 404
   ========================================================================== */
window.App = window.App || {};
App.views = App.views || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui, icon = ui.icon;

  App.views.offers = ({ query }) => {
    const min = Number(query.desc) || 0;
    const deals = App.products.filter(p => u.pctOff(p.old, p.price) >= Math.max(min, 1))
      .sort((a, b) => (b.deal ? 1 : 0) - (a.deal ? 1 : 0) || u.pctOff(b.old, b.price) - u.pctOff(a.old, a.price));
    const flash = App.products.filter(p => p.deal);
    return {
      title: 'Ofertas do dia | Vitrine',
      html: `<div class="container page-title">
        <div class="section-head"><h1 style="margin:0">${icon('bolt', 'i-fill')} Ofertas do dia</h1>${ui.countdown(App.catalog.dealEnd(), 'Relâmpago termina em')}</div>
        <section class="section" aria-labelledby="h-flash">
          <h2 id="h-flash">Relâmpago — estoque limitado</h2>
          ${ui.rail('rail-flash', flash, { deal: true, label: 'Ofertas relâmpago' })}
        </section>
        <section aria-labelledby="h-all">
          <div class="section-head"><h2 id="h-all">Todas as ofertas</h2>
            <div class="flex" role="group" aria-label="Filtrar por desconto">
              ${[0, 20, 30, 40].map(d => `<a class="chip ${min === d ? 'active' : ''}" href="#/ofertas${d ? '?desc=' + d : ''}" ${min === d ? 'aria-current="true"' : ''}>${d ? `${d}% OFF ou mais` : 'Todas'}</a>`).join('')}
            </div>
          </div>
          ${ui.grid(deals)}
        </section>
      </div>`
    };
  };

  App.views.help = () => ({
    title: 'Central de ajuda | Vitrine',
    html: `<div class="container page-title">
      <h1>${icon('help')} Central de ajuda</h1>
      <div class="cart-layout">
        <section class="panel" aria-label="Perguntas frequentes">
          <details class="faq" id="como-comprar" open><summary>Como faço uma compra?</summary><div>Encontre o produto pela busca ou pelas categorias, escolha cor e quantidade e clique em <strong>Comprar agora</strong> ou <strong>Adicionar ao carrinho</strong>. No carrinho, clique em <strong>Continuar a compra</strong> e siga as 4 etapas: endereço, entrega, pagamento e revisão.</div></details>
          <details class="faq" id="entrega"><summary>Qual o prazo de entrega e quanto custa o frete?</summary><div>Informe seu CEP no topo da página para ver prazos e valores exatos. O frete é <strong>grátis acima de ${u.money(App.config.freeShippingMin)}</strong>. Produtos com o selo <strong>Chega amanhã</strong> têm entrega expressa.</div></details>
          <details class="faq" id="pagamento"><summary>Quais são as formas de pagamento?</summary><div><strong>Pix</strong> com 5% de desconto e aprovação imediata, <strong>cartão de crédito</strong> em até ${App.config.maxInstallments}x sem juros e <strong>boleto bancário</strong>.</div></details>
          <details class="faq" id="cupons"><summary>Como uso um cupom de desconto?</summary><div>No carrinho, digite o código no campo <strong>Cupom de desconto</strong> e clique em Aplicar. Para testar o protótipo: <strong>BEMVINDO10</strong>, <strong>FRETEGRATIS</strong> e <strong>VITRINE50</strong>.</div></details>
          <details class="faq" id="trocas"><summary>Como funcionam trocas e devoluções?</summary><div>Você tem <strong>30 dias</strong> após o recebimento para devolver grátis, sem precisar justificar. Acesse <a href="#/pedidos">Seus pedidos</a> e escolha o item.</div></details>
          <details class="faq" id="prototipo"><summary>Sobre este protótipo</summary><div>
            A Vitrine é um projeto acadêmico de e-commerce inspirado nas boas práticas de grandes marketplaces. Ela funciona 100% no navegador:
            <ul class="feats mt-1">
              <li><strong>HTML5</strong> semântico e acessível (landmarks, ARIA, formulários rotulados);</li>
              <li><strong>CSS3</strong> com variáveis (design tokens), Grid, Flexbox, tema claro/escuro e layout responsivo;</li>
              <li><strong>JavaScript</strong> puro (sem frameworks) com roteamento por hash (SPA);</li>
              <li><strong>LocalStorage</strong> para carrinho, favoritos, histórico, contas e pedidos;</li>
              <li>API pública <strong>ViaCEP</strong> para preencher o endereço;</li>
              <li>Hospedagem estática no <strong>GitHub Pages</strong>.</li>
            </ul>
            Nenhuma compra é real e nenhum dado sai do seu navegador.</div></details>
        </section>
        <aside class="panel summary" aria-label="Atalhos">
          <h2 style="margin:0">Atalhos</h2>
          <a class="account-tile" href="#/pedidos">${icon('package')}<div><strong>Seus pedidos</strong><span>Acompanhar entrega</span></div></a>
          <a class="account-tile" href="#/conta">${icon('user')}<div><strong>Sua conta</strong><span>Entrar ou cadastrar</span></div></a>
          <div class="alert alert-info">${icon('info')}<span>Dica: pressione <kbd>/</kbd> em qualquer página para ir direto à busca.</span></div>
        </aside>
      </div>
    </div>`,
    mount() {
      // Abre a pergunta indicada na URL (#/ajuda#trocas)
      const anchor = location.hash.split('#')[2];
      const el = anchor && document.getElementById(anchor);
      if (el) { el.open = true; setTimeout(() => el.scrollIntoView({ block: 'start' }), 50); }
    }
  });

  App.views.notFound = () => ({
    title: 'Página não encontrada | Vitrine',
    html: `<div class="container page-title"><div class="panel">${ui.empty({ icon: 'search', title: 'Página não encontrada', text: 'O endereço pode estar errado ou o produto não existe mais. Que tal buscar o que você procura?', action: '<a class="btn btn-primary" href="#/">Voltar para o início</a>' })}</div></div>`
  });
})(window.App);
