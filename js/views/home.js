/* ==========================================================================
   views/home.js — Página inicial
   Seções: carrossel de destaques, benefícios, categorias, ofertas relâmpago,
   vistos recentemente, mais vendidos, banners e recomendações.
   ========================================================================== */
window.App = window.App || {};
App.views = App.views || {};

(function (App) {
  'use strict';
  const u = App.u, ui = App.ui, icon = ui.icon;

  const SLIDES = [
    { cls: 'slide-1', kicker: 'Black Friday Vitrine', title: 'Até 40% OFF em eletrônicos', text: 'Smartphones, fones e TVs com frete grátis e parcelamento em até 10x sem juros.', cta: 'Ver ofertas', href: '#/ofertas', art: [1, 6] },
    { cls: 'slide-2', kicker: 'Semana Gamer', title: 'Seu setup completo com desconto', text: 'Consoles, controles, headsets e cadeiras. Entrega expressa para todo o Brasil.', cta: 'Explorar games', href: '#/categoria/games', art: [15, 16] },
    { cls: 'slide-3', kicker: 'Casa e Cozinha', title: 'Air fryer a partir de R$ 399', text: 'Eletroportáteis mais vendidos com até 33% OFF e 5% extra pagando no Pix.', cta: 'Comprar agora', href: '#/categoria/casa', art: [18, 19] },
    { cls: 'slide-4', kicker: 'Pague com Pix', title: '5% de desconto em todo o site', text: 'Aprovação na hora e seu pedido sai mais rápido. Use também o cupom BEMVINDO10.', cta: 'Aproveitar', href: '#/busca?ordem=desconto', art: [27, 30] }
  ];

  App.views.home = () => {
    const P = App.products;
    const deals = P.filter(p => p.deal).sort((a, b) => b.deal.claimed - a.deal.claimed);
    const best = [...P].sort((a, b) => b.sold - a.sold).slice(0, 12);
    const recent = App.history.list().map(App.getProduct).filter(Boolean);
    const recs = App.catalog.recommend(10);

    const html = `
      <h1 class="sr-only">Vitrine — ofertas e destaques</h1>
      <section class="hero" aria-roledescription="carrossel" aria-label="Destaques da loja">
        <div class="hero-track" id="hero-track">
          ${SLIDES.map((s, i) => `
            <div class="hero-slide ${s.cls}" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${SLIDES.length}: ${s.title}" ${i ? 'aria-hidden="true"' : ''}>
              <div class="container">
                <div>
                  <span class="hero-kicker">${icon('bolt', 'i-fill')} ${s.kicker}</span>
                  <p class="hero-title">${s.title}</p>
                  <p>${s.text}</p>
                  <a class="btn btn-lg" href="${s.href}" ${i ? 'tabindex="-1"' : ''}>${s.cta} ${icon('right')}</a>
                </div>
                <div class="hero-art" aria-hidden="true">${s.art.map(id => `<img src="${App.art(App.getProduct(id))}" alt="" width="250" height="250" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('')}</div>
              </div>
            </div>`).join('')}
        </div>
        <div class="hero-controls">
          <button class="hero-arrow" type="button" data-hero="-1" aria-label="Slide anterior">${icon('left')}</button>
          <div class="hero-dots">${SLIDES.map((s, i) => `<button type="button" data-hero-go="${i}" aria-label="Ir para o slide ${i + 1}" ${i ? '' : 'aria-current="true"'}></button>`).join('')}</div>
          <button class="hero-arrow" type="button" data-hero="1" aria-label="Próximo slide">${icon('right')}</button>
          <button class="hero-pause" type="button" data-hero-pause aria-label="Pausar rotação automática" aria-pressed="false">
            <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>
          </button>
        </div>
      </section>

      <div class="container">
        <section class="benefits" aria-label="Vantagens de comprar na Vitrine">
          <div class="benefit">${icon('truck')}<div><strong>Frete grátis</strong><span>acima de ${u.money(App.config.freeShippingMin)}</span></div></div>
          <div class="benefit">${icon('card')}<div><strong>Até ${App.config.maxInstallments}x sem juros</strong><span>no cartão de crédito</span></div></div>
          <div class="benefit">${icon('pix')}<div><strong>5% OFF no Pix</strong><span>aprovação imediata</span></div></div>
          <div class="benefit">${icon('return')}<div><strong>Devolução grátis</strong><span>em até 30 dias</span></div></div>
          <div class="benefit">${icon('shield')}<div><strong>Compra garantida</strong><span>ou seu dinheiro de volta</span></div></div>
        </section>

        <section class="section" aria-labelledby="h-cats">
          <div class="section-head"><h2 id="h-cats">Navegue por categorias</h2></div>
          <div class="cat-grid">
            ${App.categories.map(c => `<a class="cat-tile" href="#/categoria/${c.slug}"><img src="${App.img(App.getProduct(c.cover))}" alt="" width="96" height="96" loading="lazy">${c.name}</a>`).join('')}
          </div>
        </section>

        <section class="section" aria-labelledby="h-deals">
          <div class="section-head">
            <h2 id="h-deals"><span style="color:var(--deal)">${icon('bolt', 'i-fill')}</span> Ofertas relâmpago</h2>
            ${ui.countdown(App.catalog.dealEnd())}
            <a class="link-more" href="#/ofertas">Ver todas ${icon('right')}</a>
          </div>
          ${ui.rail('rail-deals', deals, { deal: true, label: 'Ofertas relâmpago' })}
        </section>

        ${recent.length ? `
        <section class="section" aria-labelledby="h-recent">
          <div class="section-head">
            <h2 id="h-recent">${icon('history')} Continue de onde parou</h2>
            <button class="link-more btn-link" type="button" data-action="clear-history">Limpar histórico</button>
          </div>
          ${ui.rail('rail-recent', recent, { label: 'Vistos recentemente' })}
        </section>` : ''}

        <section class="section" aria-labelledby="h-best">
          <div class="section-head">
            <h2 id="h-best">Mais vendidos</h2>
            <a class="link-more" href="#/busca?ordem=vendidos">Ver mais ${icon('right')}</a>
          </div>
          ${ui.rail('rail-best', best, { label: 'Mais vendidos' })}
        </section>

        <section class="section promo-grid" aria-label="Campanhas">
          <a class="promo promo-a" href="#/categoria/informatica">
            <div><h3>Volta às aulas tech</h3><p>Notebooks, monitores e periféricos com até 31% OFF.</p><span class="btn btn-sm">Conferir ${icon('right')}</span></div>
            <img src="${App.art(App.getProduct(9))}" alt="" width="150" height="150" loading="lazy">
          </a>
          <a class="promo promo-b" href="#/categoria/esportes">
            <div><h3>Bora se mexer</h3><p>Tudo para o treino em casa e ao ar livre.</p><span class="btn btn-sm">Conferir ${icon('right')}</span></div>
            <img src="${App.art(App.getProduct(23))}" alt="" width="150" height="150" loading="lazy">
          </a>
        </section>

        <section class="section" aria-labelledby="h-recs">
          <div class="section-head">
            <h2 id="h-recs">${recent.length ? 'Inspirado no seu histórico' : 'Recomendados para você'}</h2>
          </div>
          ${ui.grid(recs)}
        </section>
      </div>`;

    return { title: 'Vitrine — Tudo o que você procura, num só lugar', html, mount: mountHero };
  };

  /** Carrossel: autoplay que pausa no hover/foco, botão de pausa (WCAG 2.2.2), swipe no toque */
  function mountHero(root) {
    const track = u.$('#hero-track', root);
    if (!track) return;
    const slides = u.$$('.hero-slide', track);
    const dots = u.$$('[data-hero-go]', root);
    const pauseBtn = u.$('[data-hero-pause]', root);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idx = 0, timer = null, paused = reduce, hover = false;

    const go = i => {
      idx = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((s, j) => {
        s.setAttribute('aria-hidden', j !== idx);
        u.$$('a', s).forEach(a => (j === idx ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
      });
      dots.forEach((d, j) => (j === idx ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    };
    const play = () => { clearInterval(timer); if (!paused && !hover) timer = setInterval(() => go(idx + 1), 6000); };

    const setPaused = state => {
      paused = state;
      pauseBtn.setAttribute('aria-pressed', paused);
      pauseBtn.setAttribute('aria-label', paused ? 'Retomar rotação automática' : 'Pausar rotação automática');
      pauseBtn.innerHTML = paused
        ? '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>'
        : '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>';
    };

    root.addEventListener('click', e => {
      const b = e.target.closest('[data-hero],[data-hero-go],[data-hero-pause]');
      if (!b) return;
      if (b.dataset.hero) go(idx + Number(b.dataset.hero));
      if (b.dataset.heroGo) go(Number(b.dataset.heroGo));
      if (b.hasAttribute('data-hero-pause')) setPaused(!paused);
      play();
    });
    const hero = track.parentElement;
    hero.addEventListener('mouseenter', () => { hover = true; play(); });
    hero.addEventListener('mouseleave', () => { hover = false; play(); });
    hero.addEventListener('focusin', () => { hover = true; play(); });
    hero.addEventListener('focusout', () => { hover = false; play(); });

    // Gesto de deslizar (swipe) em telas de toque
    let x0 = null;
    track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      x0 = null; play();
    });
    if (reduce) setPaused(true);
    play();
    return () => clearInterval(timer);
  }
})(window.App);
