/* ==========================================================================
   store.js — Persistência (LocalStorage) e regras de negócio
   Todas as chaves usam o prefixo "vitrine:" e guardam JSON.
   ========================================================================== */
window.App = window.App || {};

(function (App) {
  'use strict';
  const u = App.u;
  const PREFIX = 'vitrine:';

  // ---------------- Barramento de eventos (padrão publish/subscribe) ----------------
  const listeners = {};
  App.bus = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); },
    emit(evt, data) { (listeners[evt] || []).slice().forEach(fn => fn(data)); }
  };

  // ---------------- Wrapper seguro do LocalStorage ----------------
  // try/catch: o armazenamento pode estar cheio, bloqueado ou indisponível (modo privado)
  const memory = {};
  const db = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return key in memory ? memory[key] : fallback;
      }
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
      catch (e) { console.warn('LocalStorage indisponível; usando memória temporária.', e); }
      App.bus.emit('change:' + key, value);
    },
    remove(key) {
      delete memory[key];
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* ignora */ }
      App.bus.emit('change:' + key, undefined);
    },
    clearAll() {
      try {
        Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
      } catch (e) { /* ignora */ }
    }
  };
  App.db = db;

  // Sincroniza abas abertas: se o carrinho mudar em outra aba, esta também atualiza
  window.addEventListener('storage', e => {
    if (e.key && e.key.startsWith(PREFIX)) App.bus.emit('change:' + e.key.slice(PREFIX.length));
  });

  // ---------------- Carrinho ----------------
  const key = (id, color) => `${id}:${color || 0}`;
  const cart = {
    items: () => db.get('cart', []),
    save: items => db.set('cart', items),
    /** Itens "enriquecidos" com o produto e subtotal da linha */
    lines() {
      return cart.items().map(it => {
        const p = App.getProduct(it.id);
        return p ? { ...it, p, total: p.price * it.qty } : null;
      }).filter(Boolean);
    },
    add(id, qty = 1, color = 0) {
      const p = App.getProduct(id);
      const items = cart.items();
      const k = key(id, color);
      const found = items.find(i => key(i.id, i.color) === k);
      if (found) found.qty = Math.min(p.stock, found.qty + qty);
      else items.unshift({ id: Number(id), color: Number(color) || 0, qty: Math.min(p.stock, qty), addedAt: Date.now() });
      cart.save(items);
      return found ? found.qty : qty;
    },
    setQty(k, qty) {
      const items = cart.items();
      const it = items.find(i => key(i.id, i.color) === k);
      if (!it) return;
      const p = App.getProduct(it.id);
      it.qty = Math.max(1, Math.min(p.stock, qty));
      cart.save(items);
    },
    remove(k) {
      const items = cart.items();
      const idx = items.findIndex(i => key(i.id, i.color) === k);
      const [removed] = idx >= 0 ? items.splice(idx, 1) : [];
      cart.save(items);
      return { removed, idx };
    },
    restore(item, idx) {
      const items = cart.items();
      items.splice(Math.min(idx, items.length), 0, item);
      cart.save(items);
    },
    clear: () => cart.save([]),
    count: () => cart.items().reduce((s, i) => s + i.qty, 0),
    subtotal: () => cart.lines().reduce((s, l) => s + l.total, 0),
    oldSubtotal: () => cart.lines().reduce((s, l) => s + (l.p.old || l.p.price) * l.qty, 0),
    key
  };
  App.cart = cart;

  // "Salvar para depois" (inspirado na Amazon)
  App.saved = {
    items: () => db.get('saved', []),
    add(item) {
      const items = App.saved.items().filter(i => key(i.id, i.color) !== key(item.id, item.color));
      items.unshift({ id: item.id, color: item.color || 0, qty: 1 });
      db.set('saved', items);
    },
    remove(k) { db.set('saved', App.saved.items().filter(i => key(i.id, i.color) !== k)); }
  };

  // ---------------- Favoritos, histórico e buscas recentes ----------------
  App.fav = {
    list: () => db.get('favorites', []),
    has: id => App.fav.list().includes(Number(id)),
    toggle(id) {
      id = Number(id);
      const list = App.fav.list();
      const has = list.includes(id);
      db.set('favorites', has ? list.filter(x => x !== id) : [id, ...list]);
      return !has;
    }
  };

  App.history = {
    list: () => db.get('history', []),
    push(id) {
      id = Number(id);
      db.set('history', [id, ...App.history.list().filter(x => x !== id)].slice(0, 12));
    },
    clear: () => db.set('history', [])
  };

  App.searches = {
    list: () => db.get('searches', []),
    push(term) {
      term = String(term).trim();
      if (!term) return;
      db.set('searches', [term, ...App.searches.list().filter(t => u.norm(t) !== u.norm(term))].slice(0, 6));
    },
    clear: () => db.set('searches', [])
  };

  // ---------------- Usuário (autenticação simulada) ----------------
  App.user = {
    current() {
      const s = db.get('session', null);
      if (!s) return null;
      return db.get('users', []).find(x => x.email === s.email) || null;
    },
    async register({ name, email, password }) {
      email = email.trim().toLowerCase();
      const users = db.get('users', []);
      if (users.some(x => x.email === email)) throw new Error('Já existe uma conta com este e-mail. Tente entrar.');
      users.push({ name: name.trim(), email, pass: await u.hash(password), createdAt: Date.now() });
      db.set('users', users);
      db.set('session', { email, at: Date.now() });
    },
    async login(email, password) {
      email = email.trim().toLowerCase();
      const found = db.get('users', []).find(x => x.email === email);
      if (!found || found.pass !== await u.hash(password)) throw new Error('E-mail ou senha incorretos.');
      db.set('session', { email, at: Date.now() });
    },
    logout: () => db.remove('session'),
    update(data) {
      const users = db.get('users', []);
      const me = App.user.current();
      const idx = users.findIndex(x => x.email === me.email);
      users[idx] = { ...users[idx], ...data };
      db.set('users', users);
    }
  };

  // ---------------- Localização / CEP e frete ----------------
  // Tabela de regiões a partir do 1º dígito do CEP (aproximação didática)
  const REGIONS = {
    0: { name: 'SP (Grande SP)', cost: 12.9, days: 2 }, 1: { name: 'SP (interior)', cost: 14.9, days: 2 },
    2: { name: 'RJ/ES', cost: 16.9, days: 3 }, 3: { name: 'MG', cost: 16.9, days: 3 },
    4: { name: 'BA/SE', cost: 22.9, days: 5 }, 5: { name: 'PE/AL/PB/RN', cost: 24.9, days: 6 },
    6: { name: 'Norte e Ceará', cost: 29.9, days: 8 }, 7: { name: 'Centro-Oeste/TO/RO', cost: 21.9, days: 4 },
    8: { name: 'PR/SC', cost: 18.9, days: 3 }, 9: { name: 'RS', cost: 19.9, days: 4 }
  };

  App.location = {
    get: () => db.get('cep', null),
    set: data => db.set('cep', data),
    label() {
      const l = App.location.get();
      if (!l) return 'Informe seu CEP';
      return l.city ? `${l.city} ${u.maskCEP(l.cep)}` : u.maskCEP(l.cep);
    },
    /** Consulta a API pública ViaCEP (requisição assíncrona com fetch + timeout) */
    async lookup(cep) {
      const d = u.digits(cep);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctrl.signal });
        const json = await res.json();
        if (json.erro) return { cep: d, notFound: true };
        return { cep: d, street: json.logradouro, district: json.bairro, city: json.localidade, uf: json.uf };
      } catch (e) {
        return { cep: d, offline: true }; // sem internet: segue com o CEP digitado
      } finally {
        clearTimeout(timer);
      }
    }
  };

  App.shipping = {
    region: cep => REGIONS[Number(u.digits(cep)[0] || 0)],
    /**
     * Opções de frete para um conjunto de itens.
     * Regra: Econômica grátis a partir de R$ 99; Expressa disponível se todos os itens forem "express".
     */
    options(cep, subtotal, allExpress, coupon) {
      if (!cep || !u.isCEP(cep)) return [];
      const r = App.shipping.region(cep);
      const now = new Date();
      const freeEco = subtotal >= App.config.freeShippingMin || (coupon && coupon.type === 'shipping');
      const opts = [{
        id: 'eco', name: 'Entrega econômica', cost: freeEco ? 0 : r.cost,
        days: r.days + 2, date: u.addBusinessDays(now, r.days + 2)
      }];
      if (allExpress) {
        const fast = Math.max(1, Math.ceil(r.days / 2.5));
        opts.push({
          id: 'exp', name: fast === 1 ? 'Expressa — chega amanhã' : 'Entrega expressa',
          cost: Math.round(r.cost * 1.6 * 10) / 10 - 0.01, days: fast, date: u.addBusinessDays(now, fast)
        });
      }
      return opts;
    }
  };

  // ---------------- Cupons ----------------
  App.coupon = {
    get: () => db.get('coupon', null),
    apply(code, subtotal) {
      code = String(code || '').trim().toUpperCase();
      const c = App.config.coupons[code];
      if (!c) throw new Error('Cupom inválido ou expirado.');
      if (c.min && subtotal < c.min) throw new Error(`Este cupom vale para compras a partir de ${u.money(c.min)}.`);
      db.set('coupon', { code, ...c });
      return { code, ...c };
    },
    remove: () => db.remove('coupon'),
    discount(c, subtotal) {
      if (!c) return 0;
      if (c.min && subtotal < c.min) return 0;
      if (c.type === 'percent') return Math.min(subtotal * c.value / 100, c.max || Infinity);
      if (c.type === 'fixed') return Math.min(c.value, subtotal);
      return 0;
    }
  };

  // ---------------- Pedidos ----------------
  App.STATUS = ['Aguardando pagamento', 'Pagamento aprovado', 'Em separação', 'Em transporte', 'Entregue'];
  App.orders = {
    all: () => db.get('orders', []),
    mine() {
      const me = App.user.current();
      return App.orders.all().filter(o => (me ? o.email === me.email : o.guest));
    },
    get: id => App.orders.all().find(o => o.id === id),
    create(order) {
      const list = App.orders.all();
      const now = Date.now();
      // registra todas as etapas já cumpridas (cartão aprovado já passa por "Aguardando pagamento")
      const history = Array.from({ length: order.status + 1 }, (_, s) => ({ s, at: now }));
      const o = { id: 'VT' + now.toString().slice(-8), createdAt: now, history, ...order };
      list.unshift(o);
      db.set('orders', list);
      return o;
    },
    advance(id) {
      const list = App.orders.all();
      const o = list.find(x => x.id === id);
      if (!o || o.status >= App.STATUS.length - 1) return o;
      o.status++;
      o.history.push({ s: o.status, at: Date.now() });
      db.set('orders', list);
      return o;
    }
  };

  // ---------------- Perguntas (Q&A) e avaliações do usuário ----------------
  App.qa = {
    list(pid) {
      const p = App.getProduct(pid);
      const seed = (p.qa || []).map(([q, a], i) => ({ q, a, at: Date.now() - (i + 2) * 86400000 * 3 }));
      const generic = [
        { q: 'Tem garantia?', a: 'Sim! Garantia do fabricante e 30 dias para devolução grátis pela Vitrine.', at: Date.now() - 86400000 * 12 },
        { q: 'Emite nota fiscal?', a: 'Sim, todos os pedidos são enviados com nota fiscal.', at: Date.now() - 86400000 * 20 }
      ];
      const mine = db.get('qa', {})[pid] || [];
      return [...mine, ...seed, ...generic];
    },
    add(pid, q) {
      const all = db.get('qa', {});
      all[pid] = [{ q, a: '', at: Date.now(), mine: true }, ...(all[pid] || [])];
      db.set('qa', all);
    }
  };

  // ---------------- Catálogo: avaliações simuladas, busca e recomendação ----------------
  const REV = {
    names: ['Ana P.', 'Carlos M.', 'Juliana S.', 'Rafael T.', 'Beatriz L.', 'Marcos V.', 'Fernanda R.', 'Lucas G.', 'Patrícia A.', 'Diego C.', 'Camila N.', 'Thiago B.'],
    5: [['Excelente!', 'Produto excelente, chegou antes do prazo e muito bem embalado.'], ['Superou as expectativas', 'Qualidade muito acima do que eu esperava pelo preço. Recomendo sem medo.'], ['Vale cada centavo', 'Uso todos os dias há um mês e está perfeito. Já indiquei para a família.'], ['Recomendo!', 'Igualzinho ao anúncio. Entrega rápida e atendimento nota 10.']],
    4: [['Muito bom', 'Bom custo-benefício. Só achei a embalagem um pouco simples.'], ['Gostei bastante', 'Atende muito bem. Tiraria uma estrela só porque o manual é confuso.'], ['Boa compra', 'Funciona bem e chegou no prazo. Acabamento bonito.']],
    3: [['Razoável', 'Atendeu ao que eu precisava, nada além disso.'], ['Ok pelo preço', 'Cumpre o prometido, mas esperava um material um pouco melhor.']],
    2: [['Poderia ser melhor', 'Veio com um pequeno defeito, mas a troca foi rápida e sem custo.']],
    1: [['Não gostei', 'Não era o que eu esperava. Pelo menos a devolução foi fácil.']]
  };

  App.catalog = {
    /** Distribuição de estrelas coerente com a nota média (curva em J, típica de e-commerce) */
    distribution(p) {
      const w = [1, 2, 3, 4, 5].map(k => Math.exp(-((k - p.rating - 0.15) ** 2) / (2 * 0.55 ** 2)) + (k === 1 ? 0.03 : 0));
      const sum = w.reduce((a, b) => a + b, 0);
      return w.map(x => Math.round((x / sum) * p.reviews)).reverse(); // [5★, 4★, 3★, 2★, 1★]
    },
    reviews(p) {
      const rnd = u.rng(p.id * 97);
      const dist = App.catalog.distribution(p);
      const out = [];
      for (let i = 0; i < 8; i++) {
        let r = rnd() * p.reviews, star = 5;
        for (let s = 0; s < 5; s++) { r -= dist[s]; if (r <= 0) { star = 5 - s; break; } }
        const pool = REV[star];
        const [title, text] = pool[Math.floor(rnd() * pool.length)];
        out.push({
          id: `${p.id}-${i}`, name: REV.names[Math.floor(rnd() * REV.names.length)], stars: star, title, text,
          at: Date.now() - Math.floor(rnd() * 120 + 1) * 86400000, helpful: Math.floor(rnd() * 60), verified: rnd() > 0.15
        });
      }
      const mine = (db.get('reviews', {})[p.id] || []).map(r => ({ ...r, mine: true }));
      return [...mine, ...out];
    },
    addReview(pid, review) {
      const all = db.get('reviews', {});
      all[pid] = [{ id: u.uid('r'), at: Date.now(), helpful: 0, verified: false, ...review }, ...(all[pid] || [])];
      db.set('reviews', all);
    },
    helpful: {
      has: id => db.get('helpful', []).includes(id),
      toggle(id) {
        const list = db.get('helpful', []);
        const has = list.includes(id);
        db.set('helpful', has ? list.filter(x => x !== id) : [...list, id]);
        return !has;
      }
    },

    /** Pontuação de relevância por termo (título pesa mais que tags) */
    score(p, terms) {
      if (!terms.length) return 1;
      const t = u.norm(p.title), b = u.norm(p.brand), c = u.norm(App.getCategory(p.cat).name), g = u.norm(p.tags);
      let s = 0;
      for (const term of terms) {
        let hit = 0;
        if (t.includes(term)) hit += 3;
        if (b.includes(term)) hit += 2;
        if (c.includes(term)) hit += 1.5;
        if (g.includes(term)) hit += 1;
        if (!hit) return 0; // todos os termos precisam aparecer (busca "E")
        s += hit;
      }
      return s;
    },

    search(q = {}) {
      const terms = u.norm(q.q).split(/\s+/).filter(Boolean);
      let list = App.products.map(p => ({ p, s: App.catalog.score(p, terms) })).filter(x => x.s > 0);
      const base = list; // antes dos filtros (para contar facetas)
      if (q.cat) list = list.filter(x => x.p.cat === q.cat);
      if (q.min) list = list.filter(x => x.p.price >= Number(q.min));
      if (q.max) list = list.filter(x => x.p.price <= Number(q.max));
      if (q.frete) list = list.filter(x => x.p.price >= App.config.freeShippingMin);
      if (q.expresso) list = list.filter(x => x.p.express);
      if (q.aval) list = list.filter(x => x.p.rating >= Number(q.aval));
      if (q.desc) list = list.filter(x => u.pctOff(x.p.old, x.p.price) >= Number(q.desc));
      if (q.marca) { const set = q.marca.split(','); list = list.filter(x => set.includes(x.p.brand)); }
      if (q.oferta) list = list.filter(x => x.p.deal || x.p.badge === 'Oferta do dia');
      const sorters = {
        relevancia: (a, b) => b.s - a.s || b.p.sold - a.p.sold,
        menor: (a, b) => a.p.price - b.p.price,
        maior: (a, b) => b.p.price - a.p.price,
        avaliacao: (a, b) => b.p.rating - a.p.rating || b.p.reviews - a.p.reviews,
        vendidos: (a, b) => b.p.sold - a.p.sold,
        desconto: (a, b) => u.pctOff(b.p.old, b.p.price) - u.pctOff(a.p.old, a.p.price)
      };
      list.sort(sorters[q.ordem] || sorters.relevancia);
      return { results: list.map(x => x.p), base: base.map(x => x.p) };
    },

    /** "Você quis dizer…?" — sugere a palavra do catálogo mais parecida */
    didYouMean(q) {
      const words = new Set();
      App.products.forEach(p => u.norm(p.title + ' ' + p.tags + ' ' + p.brand).split(/[^a-z0-9]+/).forEach(w => w.length > 3 && words.add(w)));
      const terms = u.norm(q).split(/\s+/).filter(Boolean);
      let changed = false;
      const fixed = terms.map(t => {
        if (words.has(t)) return t;
        let best = t, bestD = Infinity;
        words.forEach(w => { const d = u.lev(t, w); if (d < bestD) { bestD = d; best = w; } });
        if (bestD <= Math.max(1, Math.floor(t.length / 3))) { changed = true; return best; }
        return t;
      });
      return changed ? fixed.join(' ') : null;
    },

    /** Recomendação simples baseada no histórico: mesmas categorias, mais bem avaliados */
    recommend(limit = 10) {
      const hist = App.history.list();
      const cats = hist.map(id => App.getProduct(id)?.cat).filter(Boolean);
      if (!cats.length) return [...App.products].sort((a, b) => b.rating * Math.log(b.sold) - a.rating * Math.log(a.sold)).slice(0, limit);
      const weight = c => cats.filter(x => x === c).length;
      return App.products.filter(p => !hist.includes(p.id))
        .sort((a, b) => weight(b.cat) - weight(a.cat) || b.rating - a.rating)
        .slice(0, limit);
    },

    related(p, limit = 10) {
      return App.products.filter(x => x.id !== p.id)
        .map(x => ({ x, s: (x.cat === p.cat ? 3 : 0) + (x.brand === p.brand ? 1 : 0) + (1 - Math.min(1, Math.abs(x.price - p.price) / p.price)) }))
        .sort((a, b) => b.s - a.s).slice(0, limit).map(o => o.x);
    },

    /** "Compre junto": complementos baratos da mesma categoria (ou de categorias afins) */
    bundle(p) {
      const pairs = { eletronicos: 'informatica', informatica: 'eletronicos', games: 'informatica', casa: 'casa', moda: 'esportes', beleza: 'beleza', esportes: 'moda', livros: 'livros' };
      return App.products
        .filter(x => x.id !== p.id && (x.cat === p.cat || x.cat === pairs[p.cat]) && x.price < Math.max(p.price, 300))
        .sort((a, b) => b.sold - a.sold).slice(0, 2);
    },

    /** Fim das ofertas relâmpago: renovam a cada 6 horas (determinístico, igual para todos) */
    dealEnd() {
      const block = 6 * 3600 * 1000;
      return Math.ceil(Date.now() / block) * block;
    }
  };
})(window.App);
