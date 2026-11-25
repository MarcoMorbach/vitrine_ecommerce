/* ==========================================================================
   utils.js — Funções utilitárias puras (formatação, máscaras, validação)
   ========================================================================== */
window.App = window.App || {};

(function (App) {
  'use strict';

  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const NUM = new Intl.NumberFormat('pt-BR');

  const u = {
    /** R$ 1.234,56 */
    money: v => BRL.format(Math.round(v * 100) / 100),

    /** Preço em destaque no estilo das grandes lojas: "R$ 1.899" + centavos sobrescritos */
    priceHTML(v) {
      const [int, cents] = (Math.round(v * 100) / 100).toFixed(2).split('.');
      return `<span class="price" aria-label="${u.money(v)}"><span class="cur" aria-hidden="true">R$</span><span aria-hidden="true">${NUM.format(Number(int))}</span>${cents !== '00' ? `<sup aria-hidden="true">${cents}</sup>` : ''}</span>`;
    },

    num: v => NUM.format(v),

    /** "+12 mil vendidos" */
    soldLabel(n) {
      if (n >= 1000) return `+${NUM.format(Math.floor(n / 1000))} mil vendidos`;
      if (n >= 100) return `+${Math.floor(n / 100) * 100} vendidos`;
      return `${n} vendidos`;
    },

    pctOff: (old, price) => (old && old > price ? Math.round((1 - price / old) * 100) : 0),

    /** Parcelamento sem juros respeitando a parcela mínima */
    installments(price) {
      const { maxInstallments, minInstallment } = App.config;
      const n = Math.max(1, Math.min(maxInstallments, Math.floor(price / minInstallment)));
      return { n, value: price / n };
    },

    pix: price => price * (1 - App.config.pixDiscount),

    /** Escapa HTML para evitar XSS ao exibir textos digitados pelo usuário */
    esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    /** Normaliza texto para busca: minúsculas e sem acentos */
    norm: s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(),

    debounce(fn, ms = 200) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    },

    $: (sel, root = document) => root.querySelector(sel),
    $$: (sel, root = document) => Array.from(root.querySelectorAll(sel)),

    /** Gerador pseudoaleatório determinístico (mesma semente = mesmos dados) */
    rng(seed) {
      let a = seed >>> 0;
      return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    uid: (prefix = '') => prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase(),

    /** Soma dias úteis (pula sábado e domingo) */
    addBusinessDays(date, days) {
      const d = new Date(date);
      let added = 0;
      while (added < days) {
        d.setDate(d.getDate() + 1);
        const w = d.getDay();
        if (w !== 0 && w !== 6) added++;
      }
      return d;
    },

    fmtDate: (d, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat('pt-BR', opts).format(new Date(d)),
    fmtDateShort: d => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)),
    fmtDateTime: d => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)),

    /** Converte query string em objeto e vice-versa */
    parseQuery(qs) {
      const o = {};
      new URLSearchParams(qs || '').forEach((v, k) => { o[k] = v; });
      return o;
    },
    toQuery(obj) {
      const p = new URLSearchParams();
      Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null && v !== false) p.set(k, v); });
      const s = p.toString();
      return s ? '?' + s : '';
    },

    // ---------------- Máscaras de entrada (ajudam a evitar erros — heurística de prevenção) ----------------
    digits: s => String(s || '').replace(/\D/g, ''),
    maskCEP: s => u.digits(s).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
    maskCPF: s => u.digits(s).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    maskPhone(s) {
      const d = u.digits(s).slice(0, 11);
      if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
      return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    },
    maskCard: s => u.digits(s).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '),
    maskExpiry: s => u.digits(s).slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'),

    // ---------------- Validações ----------------
    isEmail: s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim()),
    isCEP: s => u.digits(s).length === 8,

    isCPF(s) {
      const d = u.digits(s);
      if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
      const calc = len => {
        let sum = 0;
        for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
        const r = (sum * 10) % 11;
        return r === 10 ? 0 : r;
      };
      return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
    },

    /** Algoritmo de Luhn: valida o dígito verificador de cartões */
    luhn(num) {
      const d = u.digits(num);
      if (d.length < 13) return false;
      let sum = 0, dbl = false;
      for (let i = d.length - 1; i >= 0; i--) {
        let n = Number(d[i]);
        if (dbl) { n *= 2; if (n > 9) n -= 9; }
        sum += n; dbl = !dbl;
      }
      return sum % 10 === 0;
    },

    cardBrand(num) {
      const d = u.digits(num);
      if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return 'Elo';
      if (/^606282|^3841/.test(d)) return 'Hipercard';
      if (/^3[47]/.test(d)) return 'Amex';
      if (/^4/.test(d)) return 'Visa';
      if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
      return '';
    },

    isExpiryValid(mmYY) {
      const m = /^(\d{2})\/(\d{2})$/.exec(mmYY || '');
      if (!m) return false;
      const month = Number(m[1]), year = 2000 + Number(m[2]);
      if (month < 1 || month > 12) return false;
      const end = new Date(year, month, 1);
      return end > new Date();
    },

    /** Distância de Levenshtein — usada no "Você quis dizer?" */
    lev(a, b) {
      const m = a.length, n = b.length;
      if (!m) return n; if (!n) return m;
      let prev = Array.from({ length: n + 1 }, (_, i) => i);
      for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
      }
      return prev[n];
    },

    /** Hash de senha. Em produção a senha NUNCA ficaria no navegador; aqui é só demonstração. */
    async hash(text) {
      try {
        if (window.crypto && crypto.subtle) {
          const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('vitrine:' + text));
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      } catch (e) { /* cai no hash simples abaixo */ }
      let h = 2166136261;
      for (const ch of 'vitrine:' + text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
      return 'fnv' + (h >>> 0).toString(16);
    },

    initials: name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    plural: (n, one, many) => `${u.num(n)} ${n === 1 ? one : many}`
  };

  App.u = u;
})(window.App);
