# Vitrine — Protótipo de E-commerce

Protótipo acadêmico de loja virtual inspirado nas boas práticas da **Amazon** e do **Mercado Livre**, feito apenas com **HTML5, CSS3, JavaScript puro e LocalStorage** e hospedado no **GitHub Pages**.

> Nenhuma compra é real e nenhum dado sai do navegador.

## Funcionalidades

| Área | O que tem |
| --- | --- |
| Cabeçalho | Busca com categorias e sugestões em tempo real (teclado: setas, Enter, Esc, atalho `/`), CEP de entrega, conta, pedidos, favoritos e carrinho com contador |
| Página inicial | Carrossel acessível (pausa, swipe), benefícios, categorias, ofertas relâmpago com contagem regressiva, "Continue de onde parou", mais vendidos e recomendações pelo histórico |
| Busca | Filtros com contagem (frete grátis, chega amanhã, categoria, preço, avaliação, desconto, marca), chips de filtros ativos, ordenação, grade/lista e "Você quis dizer?" |
| Produto | Galeria com zoom e swipe, cores, preço com parcelas e Pix, frete por CEP, Comprar agora, vendedor com reputação, Compre junto, ficha técnica, perguntas e respostas, avaliações com histograma |
| Carrinho | Quantidade, excluir com **Desfazer**, salvar para depois, barra de frete grátis, cupons (`BEMVINDO10`, `FRETEGRATIS`, `VITRINE50`) |
| Checkout | 4 etapas (endereço via **ViaCEP**, entrega, pagamento Pix/cartão/boleto, revisão), máscaras e validação (CPF, Luhn) |
| Pós-compra | Confirmação, QR Code Pix ilustrativo, boleto, linha do tempo do pedido, histórico e "Comprar novamente" |
| Conta | Cadastro e login simulados (senha guardada só como hash SHA-256), favoritos, tema claro/escuro |

## Estrutura

```
vitrine-ecommerce/
├── index.html            # página única (SPA) com cabeçalho, rodapé e diálogos
├── .nojekyll             # pede ao GitHub Pages para servir os arquivos sem processar
├── manifest.webmanifest  # nome/ícone ao "instalar" no celular
├── css/styles.css        # design system (tokens), componentes, tema escuro e responsivo
├── js/
│   ├── utils.js          # formatação, máscaras, validações
│   ├── data.js           # catálogo (simula uma API)
│   ├── store.js          # LocalStorage + regras de negócio (carrinho, frete, cupons, pedidos)
│   ├── ui.js             # componentes reutilizáveis (card, toast, mini-carrinho…)
│   ├── app.js            # roteador por hash, busca, tema, eventos globais
│   └── views/            # uma tela por arquivo
└── assets/img/           # ilustrações SVG dos produtos
```

## Rodar no computador

Não precisa instalar nada: dê **dois cliques no `index.html`**.

Opcional (simula um servidor, como no GitHub Pages):

```bash
npx serve .
```

ou

```bash
python -m http.server 8000
```

## Publicar no GitHub Pages (sem Node.js)

1. Crie uma conta em github.com e clique em **New repository**. Nome sugerido: `vitrine-ecommerce`. Marque **Public**.
2. Envie os arquivos. Pelo navegador: **Add file › Upload files**, arraste **o conteúdo** da pasta (o `index.html` precisa ficar na raiz) e clique em **Commit changes**.
   Pelo terminal:

   ```bash
   git init
   ```

   ```bash
   git add .
   ```

   ```bash
   git commit -m "Primeira versão da Vitrine"
   ```

   ```bash
   git branch -M main
   ```

   ```bash
   git remote add origin https://github.com/SEU-USUARIO/vitrine-ecommerce.git
   ```

   ```bash
   git push -u origin main
   ```

3. No repositório, abra **Settings › Pages**. Em **Build and deployment**, escolha **Source: Deploy from a branch**, **Branch: main** e pasta **/ (root)**. Clique em **Save**.
4. Aguarde 1 a 2 minutos. O endereço aparece no topo da página: `https://SEU-USUARIO.github.io/vitrine-ecommerce/`.
5. Para atualizar: faça um novo commit/push (ou novo upload). O GitHub publica de novo sozinho.

### Preciso de Node.js?

**Não.** O GitHub Pages serve arquivos estáticos (HTML, CSS, JS, imagens) e o site não tem etapa de build. Node.js seria útil apenas para extras opcionais: servidor local (`npx serve`), minificação de arquivos ou um back-end real (que o GitHub Pages não executa).
