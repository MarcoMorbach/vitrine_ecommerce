/* ==========================================================================
   data.js — Catálogo do protótipo (simula a resposta de uma API de produtos)
   Em um sistema real estes dados viriam de um back-end (ex.: GET /api/produtos).
   ========================================================================== */
window.App = window.App || {};

(function (App) {
  'use strict';

  /** Regras de negócio globais da loja */
  App.config = {
    storeName: 'Vitrine',
    freeShippingMin: 99,      // frete grátis a partir deste valor
    pixDiscount: 0.05,        // 5% de desconto no Pix
    maxInstallments: 10,      // parcelas sem juros
    minInstallment: 20,       // valor mínimo de cada parcela
    coupons: {
      BEMVINDO10: { type: 'percent', value: 10, max: 100, label: '10% OFF (até R$ 100)' },
      FRETEGRATIS: { type: 'shipping', value: 0, label: 'Frete grátis' },
      VITRINE50: { type: 'fixed', value: 50, min: 500, label: 'R$ 50 OFF em compras acima de R$ 500' }
    }
  };

  App.categories = [
    { slug: 'eletronicos', name: 'Eletrônicos', cover: 1 },
    { slug: 'informatica', name: 'Informática', cover: 9 },
    { slug: 'games', name: 'Games', cover: 15 },
    { slug: 'casa', name: 'Casa e Cozinha', cover: 18 },
    { slug: 'moda', name: 'Moda', cover: 23 },
    { slug: 'beleza', name: 'Beleza', cover: 27 },
    { slug: 'esportes', name: 'Esportes', cover: 33 },
    { slug: 'livros', name: 'Livros', cover: 34 }
  ];

  App.sellers = {
    vitrine: { name: 'Vitrine Oficial', level: 5, medal: 'Loja oficial', sales: '+100 mil vendas', since: 2018 },
    tech: { name: 'TechMundo', level: 5, medal: 'Vendedor Platinum', sales: '+25 mil vendas', since: 2019 },
    casa: { name: 'Casa & Cia', level: 4, medal: 'Vendedor Gold', sales: '+8 mil vendas', since: 2020 },
    esporte: { name: 'Esporte Total', level: 4, medal: '', sales: '+5 mil vendas', since: 2021 },
    moda: { name: 'Forma Store', level: 5, medal: 'Loja oficial', sales: '+40 mil vendas', since: 2017 },
    livros: { name: 'Livraria Página', level: 3, medal: '', sales: '+1 mil vendas', since: 2023 }
  };

  // c = cores disponíveis (n = nome, h = hexadecimal). A 1ª é a padrão.
  App.products = [
    // ---------------- Eletrônicos ----------------
    { id: 1, cat: 'eletronicos', art: 'phone', brand: 'Nexo', seller: 'tech',
      title: 'Smartphone Nexo X12 128GB 8GB RAM Tela 6,5" AMOLED Câmera 64MP',
      price: 1899, old: 2499, rating: 4.7, reviews: 2143, sold: 12500, stock: 34, express: true, badge: 'Mais vendido',
      deal: { claimed: 72 },
      c: [{ n: 'Grafite', h: '#3b4152' }, { n: 'Azul', h: '#3a6ea5' }, { n: 'Verde', h: '#4f7c5a' }],
      tags: 'celular telefone android 5g smartphone',
      desc: 'O Nexo X12 combina tela AMOLED de 6,5" com 120 Hz, bateria de 5.000 mAh e câmera principal de 64 MP. Ideal para quem quer desempenho de topo sem pagar preço de topo.',
      feats: ['Tela AMOLED 6,5" 120 Hz', 'Bateria de 5.000 mAh com carga rápida 33 W', 'Câmera tripla 64 MP + 8 MP + 2 MP', '5G e NFC para pagamento por aproximação', 'Leitor de digital na tela'],
      specs: { Armazenamento: '128 GB', 'Memória RAM': '8 GB', Tela: '6,5" AMOLED 120 Hz', Bateria: '5.000 mAh', Sistema: 'Android 15', Garantia: '12 meses' },
      qa: [['Vem com carregador?', 'Sim! Acompanha carregador de 33 W e cabo USB-C.'], ['Aceita dois chips?', 'Sim, é dual chip (2 nano SIM) ou 1 chip + cartão de memória.']] },

    { id: 2, cat: 'eletronicos', art: 'earbuds', brand: 'Sonora', seller: 'tech',
      title: 'Fone de Ouvido Bluetooth Sonora Air Pro com Cancelamento de Ruído',
      price: 299.9, old: 449.9, rating: 4.6, reviews: 5320, sold: 31000, stock: 120, express: true, badge: 'Mais vendido',
      deal: { claimed: 85 },
      c: [{ n: 'Branco', h: '#e9ecf2' }, { n: 'Preto', h: '#2b2f3a' }],
      tags: 'fone earbuds tws bluetooth sem fio audio',
      desc: 'Fones true wireless com cancelamento ativo de ruído, até 30 horas de bateria com o estojo e resistência a suor (IPX5).',
      feats: ['Cancelamento ativo de ruído (ANC)', 'Até 30 h de bateria com o estojo', 'Resistente a água e suor IPX5', 'Controles por toque', 'Bluetooth 5.3 de baixa latência'],
      specs: { Conexão: 'Bluetooth 5.3', Bateria: '6 h (fone) + 24 h (estojo)', Proteção: 'IPX5', Carregamento: 'USB-C', Garantia: '12 meses' },
      qa: [['Funciona com iPhone?', 'Funciona com qualquer celular com Bluetooth, Android ou iOS.']] },

    { id: 3, cat: 'eletronicos', art: 'watch', brand: 'Pulse', seller: 'tech',
      title: 'Smartwatch Pulse Fit 3 com GPS, Monitor Cardíaco e Oxímetro',
      price: 549, old: 799, rating: 4.5, reviews: 1288, sold: 6400, stock: 48, express: true,
      c: [{ n: 'Preto', h: '#2b2f3a' }, { n: 'Rosa', h: '#d77a8f' }, { n: 'Azul-marinho', h: '#2c4a7a' }],
      tags: 'relogio smartwatch inteligente fitness corrida',
      desc: 'Acompanhe treinos com GPS integrado, frequência cardíaca 24 h, oxigenação do sangue e mais de 100 modos esportivos.',
      feats: ['GPS integrado', 'Monitor cardíaco e SpO2', 'Mais de 100 modos esportivos', 'Bateria de até 10 dias', 'Resistente à água 5 ATM'],
      specs: { Tela: '1,43" AMOLED', Bateria: 'até 10 dias', 'Resistência': '5 ATM', Compatibilidade: 'Android e iOS', Garantia: '12 meses' } },

    { id: 4, cat: 'eletronicos', art: 'speaker', brand: 'Sonora', seller: 'vitrine',
      title: "Caixa de Som Bluetooth Sonora Boom 20W à Prova d'Água",
      price: 229.9, old: 299.9, rating: 4.8, reviews: 3410, sold: 18200, stock: 76, express: true,
      c: [{ n: 'Azul', h: '#2f6fd6' }, { n: 'Vermelho', h: '#d64545' }, { n: 'Preto', h: '#2b2f3a' }],
      tags: 'caixa som speaker bluetooth portatil musica',
      desc: 'Som potente de 20 W, graves reforçados e proteção IP67: pode levar para a piscina ou a praia sem medo.',
      feats: ['20 W de potência', 'À prova d’água IP67', '12 horas de bateria', 'Conecte duas caixas em estéreo', 'Microfone para chamadas'],
      specs: { 'Potência': '20 W RMS', Bateria: '12 h', 'Proteção': 'IP67', Peso: '540 g', Garantia: '12 meses' } },

    { id: 5, cat: 'eletronicos', art: 'tablet', brand: 'Nexo', seller: 'tech',
      title: 'Tablet Nexo Tab 10" 64GB Wi-Fi 4GB RAM com Capa',
      price: 1199, old: 1499, rating: 4.4, reviews: 812, sold: 3100, stock: 22, express: false,
      c: [{ n: 'Cinza', h: '#6b7280' }, { n: 'Azul', h: '#3a6ea5' }],
      tags: 'tablet ipad estudo leitura android',
      desc: 'Tela de 10 polegadas para estudar, ler e assistir. Acompanha capa protetora e tem bateria para o dia todo.',
      feats: ['Tela 10" Full HD', '64 GB expansível até 1 TB', 'Bateria de 7.000 mAh', 'Capa protetora inclusa', 'Modo infantil com controle parental'],
      specs: { Tela: '10" Full HD', Armazenamento: '64 GB', 'Memória RAM': '4 GB', Conectividade: 'Wi-Fi', Garantia: '12 meses' } },

    { id: 6, cat: 'eletronicos', art: 'headphones', brand: 'Sonora', seller: 'vitrine',
      title: 'Headphone Sonora Studio Over-Ear Bluetooth com Graves Profundos',
      price: 399.9, old: 599, rating: 4.6, reviews: 1950, sold: 7800, stock: 41, express: true,
      deal: { claimed: 41 },
      c: [{ n: 'Preto', h: '#2b2f3a' }, { n: 'Bege', h: '#c8b59a' }],
      tags: 'fone headphone over ear bluetooth audio musica',
      desc: 'Almofadas macias, 40 horas de bateria e drivers de 40 mm para um som rico em detalhes.',
      feats: ['Drivers de 40 mm', 'Até 40 h de bateria', 'Dobrável, com estojo', 'Entrada P2 para uso com fio', 'Carga rápida: 10 min = 5 h'],
      specs: { Tipo: 'Over-ear', Bateria: '40 h', Conexão: 'Bluetooth 5.2 e P2', Peso: '250 g', Garantia: '12 meses' } },

    { id: 7, cat: 'eletronicos', art: 'camera', brand: 'Lumen', seller: 'tech',
      title: 'Câmera Digital Lumen Z50 Mirrorless 24MP Vídeo 4K com Lente 15-45mm',
      price: 3299, old: 3899, rating: 4.8, reviews: 402, sold: 950, stock: 9, express: false, badge: 'Lançamento',
      c: [{ n: 'Laranja', h: '#e0803a' }],
      tags: 'camera fotografica mirrorless video 4k foto',
      desc: 'Sensor APS-C de 24 MP, vídeo 4K e foco automático rápido. Perfeita para criadores de conteúdo.',
      feats: ['Sensor APS-C 24 MP', 'Vídeo 4K 30p', 'Tela articulada touch', 'Wi-Fi e Bluetooth', 'Lente 15-45 mm inclusa'],
      specs: { Sensor: 'APS-C 24 MP', 'Vídeo': '4K 30 fps', Tela: '3" articulada', Peso: '450 g', Garantia: '12 meses' } },

    { id: 8, cat: 'eletronicos', art: 'tv', brand: 'Lumen', seller: 'vitrine',
      title: 'Smart TV Lumen 50" 4K UHD HDR com Wi-Fi e Comando de Voz',
      price: 2399, old: 2999, rating: 4.7, reviews: 2760, sold: 9100, stock: 18, express: false, badge: 'Oferta do dia',
      deal: { claimed: 63 },
      c: [{ n: 'Preto', h: '#3b4152' }],
      tags: 'tv televisao smart tv 4k 50 polegadas',
      desc: 'Imagem 4K com HDR10, apps de streaming pré-instalados e controle remoto com comando de voz.',
      feats: ['Resolução 4K UHD com HDR10', 'Apps de streaming pré-instalados', 'Comando de voz', '3 entradas HDMI e 2 USB', 'Bordas ultrafinas'],
      specs: { Tela: '50" LED 4K', HDR: 'HDR10', Entradas: '3x HDMI, 2x USB', Conectividade: 'Wi-Fi e Bluetooth', Garantia: '12 meses' } },

    // ---------------- Informática ----------------
    { id: 9, cat: 'informatica', art: 'laptop', brand: 'Atlas', seller: 'tech',
      title: 'Notebook Atlas Pro 14" Intel Core i7 16GB SSD 512GB Tela Full HD',
      price: 4599, old: 5499, rating: 4.7, reviews: 980, sold: 4300, stock: 15, express: true, badge: 'Mais vendido',
      c: [{ n: 'Prata', h: '#9aa3b2' }, { n: 'Grafite', h: '#3b4152' }],
      tags: 'notebook laptop computador intel i7 ssd trabalho estudo',
      desc: 'Leve (1,3 kg), rápido e com bateria para 12 horas. Um notebook pensado para trabalho, estudo e programação.',
      feats: ['Intel Core i7 de 13ª geração', '16 GB de RAM DDR5', 'SSD NVMe de 512 GB', 'Tela 14" Full HD antirreflexo', 'Apenas 1,3 kg'],
      specs: { Processador: 'Intel Core i7', 'Memória RAM': '16 GB', Armazenamento: 'SSD 512 GB', Tela: '14" Full HD IPS', Sistema: 'Windows 11', Garantia: '12 meses' },
      qa: [['Dá para aumentar a memória?', 'Sim, possui um slot livre e suporta até 32 GB.']] },

    { id: 10, cat: 'informatica', art: 'mouse', brand: 'Voltix', seller: 'tech',
      title: 'Mouse Sem Fio Voltix Ergo 4000 DPI Silencioso Recarregável',
      price: 89.9, old: 129.9, rating: 4.5, reviews: 4100, sold: 22000, stock: 200, express: true,
      c: [{ n: 'Preto', h: '#2b2f3a' }, { n: 'Lilás', h: '#9b8cf0' }, { n: 'Branco', h: '#e9ecf2' }],
      tags: 'mouse sem fio wireless computador escritorio',
      desc: 'Design ergonômico, cliques silenciosos e bateria recarregável que dura até 70 dias.',
      feats: ['Até 4000 DPI ajustável', 'Clique silencioso', 'Recarregável via USB-C', 'Conexão 2,4 GHz e Bluetooth', 'Compatível com Windows, macOS e Linux'],
      specs: { DPI: '800 a 4000', Bateria: 'até 70 dias', Conexão: '2,4 GHz + Bluetooth', Peso: '85 g', Garantia: '6 meses' } },

    { id: 11, cat: 'informatica', art: 'keyboard', brand: 'Voltix', seller: 'tech',
      title: 'Teclado Mecânico Voltix K87 RGB Switch Blue ABNT2',
      price: 249.9, old: 329.9, rating: 4.7, reviews: 2630, sold: 9800, stock: 57, express: true,
      deal: { claimed: 38 },
      c: [{ n: 'Preto', h: '#2b2f3a' }, { n: 'Branco', h: '#e9ecf2' }],
      tags: 'teclado mecanico rgb gamer abnt2 computador',
      desc: 'Switches mecânicos Blue com resposta tátil, iluminação RGB personalizável e layout ABNT2 com Ç.',
      feats: ['Switches mecânicos Blue', 'Iluminação RGB com 18 efeitos', 'Layout ABNT2 (com Ç)', 'Anti-ghosting em todas as teclas', 'Cabo USB-C removível'],
      specs: { Switch: 'Blue (tátil e clicky)', Layout: 'ABNT2 TKL', 'Iluminação': 'RGB', Conexão: 'USB-C', Garantia: '12 meses' } },

    { id: 12, cat: 'informatica', art: 'monitor', brand: 'Atlas', seller: 'vitrine',
      title: 'Monitor Atlas 27" Full HD IPS 75Hz Bordas Finas HDMI',
      price: 1099, old: 1399, rating: 4.6, reviews: 1520, sold: 5200, stock: 26, express: false,
      c: [{ n: 'Preto', h: '#3b4152' }],
      tags: 'monitor tela 27 polegadas computador ips',
      desc: 'Painel IPS de 27" com cores fiéis, 75 Hz e modo de luz azul reduzida para longas jornadas.',
      feats: ['Painel IPS 27" Full HD', 'Taxa de 75 Hz', 'Modo de luz azul reduzida', 'Entradas HDMI e VGA', 'Compatível com suporte VESA'],
      specs: { Tela: '27" IPS', 'Resolução': '1920 x 1080', 'Taxa de atualização': '75 Hz', Entradas: 'HDMI, VGA', Garantia: '12 meses' } },

    { id: 13, cat: 'informatica', art: 'ssd', brand: 'Voltix', seller: 'tech',
      title: 'SSD Externo Portátil Voltix 1TB USB-C 1050MB/s',
      price: 499, old: 699, rating: 4.8, reviews: 870, sold: 3600, stock: 64, express: true,
      c: [{ n: 'Azul', h: '#2f6fd6' }, { n: 'Cinza', h: '#6b7280' }],
      tags: 'ssd hd externo armazenamento backup usb',
      desc: 'Transfira um filme de 4K em segundos. Compacto, resistente a quedas e com criptografia por hardware.',
      feats: ['Até 1050 MB/s', '1 TB de capacidade', 'Resistente a quedas de 2 m', 'USB-C e cabo USB-A inclusos', 'Criptografia AES 256 bits'],
      specs: { Capacidade: '1 TB', Velocidade: 'até 1050 MB/s', Interface: 'USB 3.2 Gen 2', Peso: '58 g', Garantia: '36 meses' } },

    // ---------------- Games ----------------
    { id: 14, cat: 'games', art: 'console', brand: 'Kairos', seller: 'vitrine',
      title: 'Console Kairos One 1TB 4K + 1 Controle Sem Fio',
      price: 3499, old: 3999, rating: 4.9, reviews: 3890, sold: 11200, stock: 12, express: true, badge: 'Mais vendido',
      c: [{ n: 'Preto', h: '#2b2f3a' }],
      tags: 'console videogame jogos 4k game',
      desc: 'Jogos em 4K a até 120 fps, SSD ultrarrápido de 1 TB e controle sem fio com resposta tátil.',
      feats: ['Jogos em 4K até 120 fps', 'SSD de 1 TB', 'Retrocompatibilidade', 'Controle com vibração tátil', 'Wi-Fi 6'],
      specs: { Armazenamento: 'SSD 1 TB', 'Resolução': 'até 4K', 'Taxa de quadros': 'até 120 fps', 'Mídia': 'Digital', Garantia: '12 meses' } },

    { id: 15, cat: 'games', art: 'gamepad', brand: 'Kairos', seller: 'vitrine',
      title: 'Controle Sem Fio Kairos Pro com Vibração e Bateria Recarregável',
      price: 349.9, old: 429.9, rating: 4.7, reviews: 2210, sold: 8700, stock: 80, express: true,
      deal: { claimed: 57 },
      c: [{ n: 'Branco', h: '#e9ecf2' }, { n: 'Roxo', h: '#6d5dfc' }, { n: 'Vermelho', h: '#d64545' }],
      tags: 'controle joystick gamepad videogame pc',
      desc: 'Pegada confortável, gatilhos adaptáveis e até 40 horas de bateria. Compatível com console, PC e celular.',
      feats: ['Gatilhos adaptáveis', 'Até 40 h de bateria', 'Compatível com PC e celular', 'Entrada P2 para fone', 'Botões traseiros programáveis'],
      specs: { Conexão: 'Bluetooth e USB-C', Bateria: '40 h', Compatibilidade: 'Kairos One, PC, Android', Peso: '280 g', Garantia: '12 meses' } },

    { id: 16, cat: 'games', art: 'headset', brand: 'Voltix', seller: 'tech',
      title: 'Headset Gamer Voltix Storm Som Surround 7.1 com Microfone',
      price: 279.9, old: 399.9, rating: 4.5, reviews: 1730, sold: 6900, stock: 45, express: true,
      c: [{ n: 'Preto/Verde', h: '#3ba55c' }, { n: 'Preto/Roxo', h: '#7c5cff' }],
      tags: 'headset fone gamer microfone 7.1 jogos',
      desc: 'Som surround 7.1 para ouvir cada passo do adversário e microfone com cancelamento de ruído.',
      feats: ['Som surround virtual 7.1', 'Microfone removível com redução de ruído', 'Almofadas em espuma viscoelástica', 'Iluminação RGB', 'Compatível com PC e consoles'],
      specs: { Drivers: '50 mm', Conexão: 'USB e P2', Microfone: 'Removível', Cabo: '2 m', Garantia: '12 meses' } },

    { id: 17, cat: 'games', art: 'chair', brand: 'Kairos', seller: 'casa',
      title: 'Cadeira Gamer Kairos Throne Reclinável 180° com Almofadas',
      price: 1199, old: 1599, rating: 4.4, reviews: 640, sold: 2100, stock: 14, express: false,
      c: [{ n: 'Roxo', h: '#6d5dfc' }, { n: 'Vermelho', h: '#d64545' }, { n: 'Azul', h: '#2f6fd6' }],
      tags: 'cadeira gamer escritorio ergonomica',
      desc: 'Encosto reclinável até 180°, almofadas lombar e de pescoço e estrutura que suporta até 150 kg.',
      feats: ['Reclina até 180°', 'Almofadas lombar e cervical', 'Suporta até 150 kg', 'Braços reguláveis 2D', 'Rodízios silenciosos'],
      specs: { Material: 'Couro sintético', 'Carga máxima': '150 kg', 'Reclinação': '90° a 180°', Altura: 'regulável', Garantia: '12 meses' } },

    // ---------------- Casa e Cozinha ----------------
    { id: 18, cat: 'casa', art: 'airfryer', brand: 'Brisa', seller: 'casa',
      title: 'Fritadeira Elétrica Air Fryer Brisa 4,5L Digital 1500W',
      price: 399.9, old: 599.9, rating: 4.8, reviews: 8920, sold: 45000, stock: 150, express: true, badge: 'Mais vendido',
      deal: { claimed: 91 },
      c: [{ n: 'Preta', h: '#2b2f3a' }, { n: 'Branca', h: '#e9ecf2' }],
      tags: 'air fryer fritadeira airfryer cozinha eletrodomestico',
      desc: 'Prepare refeições crocantes sem óleo. Painel digital com 8 receitas pré-programadas e cesto antiaderente.',
      feats: ['Capacidade de 4,5 litros', 'Painel digital touch', '8 programas automáticos', 'Cesto antiaderente removível', 'Desligamento automático'],
      specs: { Capacidade: '4,5 L', 'Potência': '1500 W', Voltagem: '127 V ou 220 V', Temperatura: '80 °C a 200 °C', Garantia: '12 meses' },
      qa: [['É 110 ou 220?', 'Temos as duas voltagens. Escolha a sua na finalização da compra.']] },

    { id: 19, cat: 'casa', art: 'coffee', brand: 'Brisa', seller: 'casa',
      title: 'Cafeteira Espresso Brisa 15 Bar com Vaporizador de Leite',
      price: 649, old: 899, rating: 4.6, reviews: 1340, sold: 4700, stock: 30, express: true,
      c: [{ n: 'Inox', h: '#9aa3b2' }, { n: 'Vermelha', h: '#c84141' }],
      tags: 'cafeteira espresso cafe cappuccino cozinha',
      desc: 'Café espresso de verdade em casa: bomba de 15 bar, vaporizador para cappuccinos e reservatório de 1,2 L.',
      feats: ['Pressão de 15 bar', 'Vaporizador de leite', 'Reservatório removível de 1,2 L', 'Aquecedor de xícaras', 'Aceita café moído e sachês'],
      specs: { 'Pressão': '15 bar', 'Potência': '1350 W', Reservatório: '1,2 L', Material: 'Aço inox', Garantia: '12 meses' } },

    { id: 20, cat: 'casa', art: 'blender', brand: 'Brisa', seller: 'casa',
      title: 'Liquidificador Brisa Turbo 1200W 12 Velocidades Jarra 3L',
      price: 189.9, old: 259.9, rating: 4.5, reviews: 2980, sold: 14000, stock: 95, express: true,
      c: [{ n: 'Frutas vermelhas', h: '#c2416b' }, { n: 'Verde', h: '#5aa469' }],
      tags: 'liquidificador cozinha vitamina suco eletrodomestico',
      desc: 'Motor de 1200 W que tritura gelo com facilidade, 12 velocidades e jarra de 3 litros com filtro.',
      feats: ['1200 W de potência', '12 velocidades + pulsar', 'Jarra de 3 L com filtro', 'Lâminas de aço inox', 'Base antiderrapante'],
      specs: { 'Potência': '1200 W', Jarra: '3 L', Velocidades: '12 + pulsar', Voltagem: '127 V ou 220 V', Garantia: '12 meses' } },

    { id: 21, cat: 'casa', art: 'pans', brand: 'Terra', seller: 'casa',
      title: 'Jogo de Panelas Terra Antiaderente Cerâmica 5 Peças',
      price: 329.9, old: 499.9, rating: 4.7, reviews: 1870, sold: 7300, stock: 52, express: false,
      deal: { claimed: 48 },
      c: [{ n: 'Terracota', h: '#c8643b' }, { n: 'Grafite', h: '#4b5263' }],
      tags: 'panela jogo de panelas cozinha antiaderente',
      desc: 'Revestimento cerâmico livre de PFOA, cabos que não esquentam e tampas de vidro. Serve para fogão de indução.',
      feats: ['5 peças com tampas de vidro', 'Revestimento cerâmico sem PFOA', 'Compatível com indução', 'Cabos frios ao toque', 'Pode ir à lava-louças'],
      specs: { Material: 'Alumínio com cerâmica', 'Peças': '5', 'Indução': 'Sim', 'Lava-louças': 'Sim', Garantia: '24 meses' } },

    { id: 22, cat: 'casa', art: 'robot', brand: 'Brisa', seller: 'vitrine',
      title: 'Aspirador Robô Brisa Smart Wi-Fi Mapeamento e Passa Pano',
      price: 1299, old: 1799, rating: 4.4, reviews: 930, sold: 2800, stock: 19, express: true, badge: 'Lançamento',
      c: [{ n: 'Branco', h: '#e9ecf2' }, { n: 'Preto', h: '#2b2f3a' }],
      tags: 'aspirador robo limpeza casa inteligente',
      desc: 'Mapeia a casa com sensor a laser, aspira e passa pano. Controle tudo pelo app ou por comando de voz.',
      feats: ['Mapeamento a laser (LiDAR)', 'Aspira e passa pano', 'Controle por app e voz', 'Volta sozinho para a base', 'Até 150 min de autonomia'],
      specs: { 'Sucção': '2700 Pa', Autonomia: '150 min', 'Reservatório': '450 ml', Conectividade: 'Wi-Fi', Garantia: '12 meses' } },

    // ---------------- Moda ----------------
    { id: 23, cat: 'moda', art: 'sneaker', brand: 'Forma', seller: 'moda',
      title: 'Tênis Forma Run Leve Unissex para Corrida e Caminhada',
      price: 279.9, old: 399.9, rating: 4.6, reviews: 3560, sold: 19500, stock: 88, express: true,
      deal: { claimed: 66 },
      c: [{ n: 'Azul', h: '#2f6fd6' }, { n: 'Coral', h: '#f06a4f' }, { n: 'Preto', h: '#2b2f3a' }],
      tags: 'tenis calcado corrida caminhada academia sapato',
      desc: 'Entressola com amortecimento responsivo e cabedal em tecido respirável. Pesa apenas 230 g.',
      feats: ['Amortecimento responsivo', 'Cabedal em mesh respirável', 'Apenas 230 g', 'Solado de borracha antiderrapante', 'Palmilha removível'],
      specs: { Material: 'Mesh e EVA', Peso: '230 g', 'Numeração': '34 ao 44', Indicado: 'Corrida e caminhada', Garantia: '3 meses' } },

    { id: 24, cat: 'moda', art: 'tshirt', brand: 'Forma', seller: 'moda',
      title: 'Camiseta Forma Basic 100% Algodão Gola Careca',
      price: 59.9, old: 79.9, rating: 4.5, reviews: 6240, sold: 52000, stock: 300, express: true,
      c: [{ n: 'Verde-oliva', h: '#6b7d4f' }, { n: 'Branca', h: '#f1f2f4' }, { n: 'Azul-marinho', h: '#2c3e66' }, { n: 'Terracota', h: '#c8643b' }],
      tags: 'camiseta camisa roupa algodao basica',
      desc: 'Malha 100% algodão penteado, toque macio e caimento regular. A peça coringa do guarda-roupa.',
      feats: ['100% algodão penteado', 'Modelagem regular', 'Costura reforçada', 'Não desbota', 'Tamanhos P ao GG'],
      specs: { Tecido: '100% algodão', Gramatura: '160 g/m²', Tamanhos: 'P, M, G, GG', Lavagem: 'Máquina', Garantia: '30 dias' } },

    { id: 25, cat: 'moda', art: 'backpack', brand: 'Atlas', seller: 'moda',
      title: 'Mochila Atlas Urban para Notebook 15,6" Impermeável com USB',
      price: 189.9, old: 249.9, rating: 4.7, reviews: 2470, sold: 11800, stock: 70, express: true,
      c: [{ n: 'Cinza', h: '#5b6475' }, { n: 'Azul', h: '#2c4a7a' }, { n: 'Verde', h: '#4f7c5a' }],
      tags: 'mochila bolsa notebook escola trabalho viagem',
      desc: 'Compartimento acolchoado para notebook de até 15,6", tecido impermeável e saída USB para carregar o celular.',
      feats: ['Cabe notebook de até 15,6"', 'Tecido impermeável', 'Saída USB externa', 'Bolso antifurto nas costas', 'Alças acolchoadas'],
      specs: { Capacidade: '25 L', Material: 'Poliéster impermeável', 'Dimensões': '46 x 31 x 15 cm', Peso: '780 g', Garantia: '6 meses' } },

    { id: 26, cat: 'moda', art: 'sunglasses', brand: 'Forma', seller: 'moda',
      title: 'Óculos de Sol Forma Aviador Polarizado com Proteção UV400',
      price: 159.9, old: 229.9, rating: 4.4, reviews: 990, sold: 4100, stock: 60, express: true,
      c: [{ n: 'Dourado/Verde', h: '#b8942f' }, { n: 'Preto', h: '#2b2f3a' }],
      tags: 'oculos sol aviador acessorio uv',
      desc: 'Lentes polarizadas que reduzem reflexos e proteção UV400. Acompanha estojo e flanela.',
      feats: ['Lentes polarizadas', 'Proteção UV400', 'Armação em metal leve', 'Estojo e flanela inclusos', 'Unissex'],
      specs: { Lente: 'Polarizada UV400', 'Armação': 'Metal', Formato: 'Aviador', 'Gênero': 'Unissex', Garantia: '3 meses' } },

    // ---------------- Beleza ----------------
    { id: 27, cat: 'beleza', art: 'perfume', brand: 'Lumen', seller: 'vitrine',
      title: 'Perfume Lumen Essence Eau de Parfum 100ml',
      price: 289.9, old: 359.9, rating: 4.8, reviews: 1620, sold: 6600, stock: 40, express: true,
      c: [{ n: 'Âmbar', h: '#d99a3d' }, { n: 'Rosé', h: '#d77a8f' }],
      tags: 'perfume fragrancia beleza presente',
      desc: 'Fragrância amadeirada com notas de baunilha e âmbar. Alta fixação, ideal para presentear.',
      feats: ['Eau de Parfum: alta fixação', 'Notas de âmbar, baunilha e bergamota', 'Frasco de 100 ml', 'Embalagem para presente', 'Vegano e cruelty-free'],
      specs: { Volume: '100 ml', 'Concentração': 'Eau de Parfum', 'Família': 'Amadeirada', 'Fixação': 'Alta', Garantia: 'Lacrado' } },

    { id: 28, cat: 'beleza', art: 'hairdryer', brand: 'Brisa', seller: 'casa',
      title: 'Secador de Cabelo Brisa Pro 2100W com Íons e Difusor',
      price: 219.9, old: 299.9, rating: 4.6, reviews: 2740, sold: 10200, stock: 66, express: true,
      c: [{ n: 'Rosa', h: '#d77a8f' }, { n: 'Preto', h: '#2b2f3a' }],
      tags: 'secador cabelo beleza ions',
      desc: 'Tecnologia de íons que reduz o frizz, 3 temperaturas, 2 velocidades e jato de ar frio.',
      feats: ['2100 W de potência', 'Tecnologia de íons anti-frizz', '3 temperaturas e 2 velocidades', 'Difusor e bocal concentrador', 'Cabo de 1,8 m'],
      specs: { 'Potência': '2100 W', Temperaturas: '3', Velocidades: '2', Voltagem: '127 V ou 220 V', Garantia: '12 meses' } },

    { id: 29, cat: 'beleza', art: 'skincare', brand: 'Terra', seller: 'vitrine',
      title: 'Kit Skincare Terra Vitamina C: Sérum, Hidratante e Gel de Limpeza',
      price: 139.9, old: 189.9, rating: 4.7, reviews: 3120, sold: 15600, stock: 110, express: true,
      deal: { claimed: 54 },
      c: [{ n: 'Laranja', h: '#f0a040' }],
      tags: 'skincare pele beleza vitamina c serum hidratante',
      desc: 'Rotina completa com vitamina C para uniformizar o tom da pele. Fórmulas veganas, testadas dermatologicamente.',
      feats: ['Sérum com 10% de vitamina C', 'Hidratante com ácido hialurônico', 'Gel de limpeza suave', 'Vegano e cruelty-free', 'Para todos os tipos de pele'],
      specs: { Itens: '3', 'Tipo de pele': 'Todos', 'Fórmula': 'Vegana', Testado: 'Dermatologicamente', Validade: '24 meses' } },

    // ---------------- Esportes ----------------
    { id: 30, cat: 'esportes', art: 'bottle', brand: 'Terra', seller: 'esporte',
      title: 'Garrafa Térmica Terra Inox 1L Mantém Gelado por 24h',
      price: 99.9, old: 139.9, rating: 4.8, reviews: 4410, sold: 27000, stock: 140, express: true,
      c: [{ n: 'Verde', h: '#4f9a6e' }, { n: 'Azul', h: '#2f6fd6' }, { n: 'Rosa', h: '#d77a8f' }, { n: 'Preta', h: '#2b2f3a' }],
      tags: 'garrafa termica agua academia inox squeeze',
      desc: 'Parede dupla a vácuo: bebidas geladas por 24 h ou quentes por 12 h. Não transpira e não vaza.',
      feats: ['Gelado por 24 h, quente por 12 h', 'Aço inox 304', 'Livre de BPA', 'Tampa à prova de vazamento', 'Alça para transporte'],
      specs: { Capacidade: '1 L', Material: 'Aço inox 304', 'Térmica': 'Sim', Peso: '420 g', Garantia: '12 meses' } },

    { id: 31, cat: 'esportes', art: 'dumbbell', brand: 'Forma', seller: 'esporte',
      title: 'Par de Halteres Forma 5kg Emborrachados',
      price: 149.9, old: 199.9, rating: 4.7, reviews: 1180, sold: 5900, stock: 35, express: false,
      c: [{ n: 'Preto/Roxo', h: '#6d5dfc' }],
      tags: 'halter peso musculacao academia treino',
      desc: 'Par de halteres de 5 kg com revestimento emborrachado que protege o piso e pegada antiderrapante.',
      feats: ['Par (2 x 5 kg)', 'Revestimento emborrachado', 'Pegada ergonômica', 'Não risca o piso', 'Ideal para treino em casa'],
      specs: { Peso: '2 x 5 kg', Material: 'Ferro emborrachado', 'Empunhadura': 'Antiderrapante', Uso: 'Doméstico', Garantia: '6 meses' } },

    { id: 32, cat: 'esportes', art: 'yogamat', brand: 'Forma', seller: 'esporte',
      title: 'Tapete de Yoga Forma Antiderrapante 6mm com Alça',
      price: 89.9, old: 129.9, rating: 4.6, reviews: 1950, sold: 9400, stock: 90, express: true,
      c: [{ n: 'Lavanda', h: '#8f7ee6' }, { n: 'Verde-água', h: '#4fb3a5' }],
      tags: 'tapete yoga pilates exercicio colchonete',
      desc: 'Espessura de 6 mm para proteger as articulações, superfície antiderrapante dos dois lados e alça para levar.',
      feats: ['6 mm de espessura', 'Antiderrapante dupla face', 'Material TPE ecológico', 'Alça de transporte', 'Fácil de limpar'],
      specs: { 'Dimensões': '183 x 61 cm', Espessura: '6 mm', Material: 'TPE', Peso: '900 g', Garantia: '3 meses' } },

    { id: 33, cat: 'esportes', art: 'bike', brand: 'Atlas', seller: 'esporte',
      title: 'Bicicleta Aro 29 Atlas Trail 21 Marchas Freio a Disco',
      price: 1499, old: 1999, rating: 4.5, reviews: 720, sold: 2300, stock: 8, express: false, badge: 'Oferta do dia',
      c: [{ n: 'Verde', h: '#3ba55c' }, { n: 'Vermelha', h: '#d64545' }],
      tags: 'bicicleta bike mtb aro 29 ciclismo',
      desc: 'Quadro em alumínio, 21 marchas e freios a disco mecânicos. Pronta para trilhas e para a cidade.',
      feats: ['Quadro em alumínio', '21 marchas', 'Freios a disco', 'Suspensão dianteira', 'Aro 29 de parede dupla'],
      specs: { Aro: '29', Quadro: 'Alumínio 17"', Marchas: '21', Freio: 'A disco mecânico', Garantia: '12 meses (quadro: vitalícia)' } },

    // ---------------- Livros ----------------
    { id: 34, cat: 'livros', art: 'book', brand: 'Editora Página', seller: 'livros', label: ['UX na', 'Prática'],
      title: 'Livro UX na Prática: Guia de Design Centrado no Usuário',
      price: 79.9, old: 99.9, rating: 4.9, reviews: 860, sold: 4200, stock: 55, express: true,
      c: [{ n: 'Capa comum', h: '#6d5dfc' }],
      tags: 'livro ux ui design ihc usabilidade',
      desc: 'Do mapa de empatia ao teste de usabilidade: métodos práticos de UX com exemplos reais e exercícios.',
      feats: ['320 páginas', 'Exemplos reais de produtos digitais', 'Exercícios ao fim de cada capítulo', 'Heurísticas de Nielsen explicadas', 'Edição 2026'],
      specs: { 'Páginas': '320', Idioma: 'Português', Editora: 'Página', Acabamento: 'Brochura', Ano: '2026' } },

    { id: 35, cat: 'livros', art: 'book', brand: 'Editora Página', seller: 'livros', label: ['JavaScript', 'Moderno'],
      title: 'Livro JavaScript Moderno do Zero: Da Lógica ao Front-end',
      price: 89.9, old: 119.9, rating: 4.8, reviews: 1240, sold: 6100, stock: 70, express: true,
      c: [{ n: 'Capa comum', h: '#e2b93b' }],
      tags: 'livro javascript programacao front-end web html css',
      desc: 'Aprenda JavaScript do básico ao avançado: DOM, eventos, fetch, LocalStorage e projetos práticos.',
      feats: ['416 páginas', 'Projetos práticos passo a passo', 'DOM, eventos e LocalStorage', 'Código-fonte disponível on-line', 'Edição 2026'],
      specs: { 'Páginas': '416', Idioma: 'Português', Editora: 'Página', Acabamento: 'Brochura', Ano: '2026' } }
  ];

  // ---------------- Helpers de catálogo ----------------
  const byId = new Map(App.products.map(p => [p.id, p]));

  App.getProduct = id => byId.get(Number(id));
  App.getCategory = slug => App.categories.find(c => c.slug === slug);

  /** Caminho da imagem do produto: cor (índice) e vista (0 = frente, 1 = detalhe, 2 = ângulo) */
  App.img = (p, color = 0, view = 0) => `assets/img/produtos/${p.id}-${color}-${view}.svg`;
  App.art = p => `assets/img/art/${p.id}.svg`;

  App.slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

  App.productUrl = p => `#/produto/${p.id}/${App.slugify(p.title)}`;
})(window.App);
