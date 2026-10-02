<p align="center">
  <img src="src/app/pages/welcome/logo.png" width="180" alt="Viajá">
</p>

<h3 align="center">Turismo com quem conhece o lugar</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/NgRx-Signals-BA2BD2?logo=ngrx&logoColor=white" alt="NgRx Signals">
  <img src="https://img.shields.io/badge/RxJS-7.8-B7178C?logo=reactivex&logoColor=white" alt="RxJS">
  <img src="https://img.shields.io/badge/Sass-estilos-CC6699?logo=sass&logoColor=white" alt="Sass">
  <img src="https://img.shields.io/badge/Leaflet-mapa-199900?logo=leaflet&logoColor=white" alt="Leaflet">
  <img src="https://img.shields.io/badge/Vitest-testes-6E9F18?logo=vitest&logoColor=white" alt="Vitest">
</p>

O Viajá conecta os serviços de turismo de um lugar: os passeios dos guias, os eventos dos produtores, as reservas e o chat de cada grupo. Este é o app, pensado primeiro para o celular. A API fica no [viaja_flaskapp](https://github.com/ViajaAPP/viaja_flaskapp).

A versão que está valendo fica na branch `staging`.

---

## O que você precisa ter

| Programa | Para quê |
| --- | --- |
| [Node.js](https://nodejs.org/) 20.19 ou mais novo | o Angular 21 não roda nas versões antigas |
| [Git](https://git-scm.com/downloads) | baixar o projeto |

---

## Rodar na sua máquina

### 1. Clone o projeto

```bash
git clone https://github.com/ViajaAPP/viaja-front.git
cd viaja-front
git checkout staging
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Escolha de onde vêm os dados

| Modo | Como ligar | Precisa do back? |
| --- | --- | --- |
| Mock | `MOCK: true` em `src/app/shared/config/app.config.ts` | Não. Os dados vêm de `src/app/shared/mock` |
| Local | `MOCK: false` e o back rodando com `python run.py --local` | Sim, com o banco na sua máquina |
| Produção | `MOCK: false` e o back rodando com `python run.py` | Sim, com o banco de produção |

O mock é o jeito mais rápido de ver as telas. Para usar o app de verdade, suba o back antes seguindo o [README do viaja_flaskapp](https://github.com/ViajaAPP/viaja_flaskapp/tree/staging#readme).

### 4. Suba o app

```bash
npm start
```

### Deu certo?

Abra [http://localhost:4200](http://localhost:4200). Se aparecer a tela de boas-vindas, está rodando.

Para entrar, use uma das contas de teste do modo local. A senha de todas é `viaja123`:

| E-mail | Quem é |
| --- | --- |
| `guia@viaja.local` | a Fabi, guia com passeios publicados |
| `viajante@viaja.local` | o Tito, que reserva passeios |
| `produtor@viaja.local` | a Lia, que cadastra eventos |
| `admin@viaja.local` | quem modera e aprova os eventos |

---

## Quando algo dá errado

| O que aparece | O que fazer |
| --- | --- |
| `The Angular CLI requires a minimum Node.js version` | Atualize o Node para a 20.19 ou mais nova. |
| `Port 4200 is already in use` | Já tem um `npm start` aberto. Feche o outro terminal ou use `npm start -- --port 4300`. |
| O login não responde | O back não está rodando. Confira se [http://localhost:5000/docs](http://localhost:5000/docs) abre. |
| O "mais perto" sempre dá erro | O navegador só libera a localização em `localhost` ou `https`. Pelo IP da rede não funciona. |

---

## Como o app funciona

- **Navegação.** Cada página tem o seu endereço (`/inicio`, `/passeio/12`, `/reservas`), definido em `app.routes.ts`. Dá para atualizar, voltar pelo navegador e mandar o link de um passeio. O `AppStore` sabe sempre qual página está aberta.
- **Permissões.** O `resolveAllowedPage`, em `shared/config/permissions.config.ts`, decide quem abre cada página. Sem login, só as boas-vindas, o login, o cadastro e a recuperação de senha. A área de Passeios é do guia, criar evento é do produtor e a análise dos eventos é do admin. O back confere as mesmas regras, então esconder um botão nunca é a única proteção.
- **Endereço e mapa.** O front nunca fala direto com serviços de fora: endereço, cidades e distância passam pelo back. O mapa usa Leaflet com o OpenStreetMap, e o "Ver como chegar" abre o Google Maps ou o Uber.
- **Cache.** As respostas ficam guardadas por até 10 minutos, e qualquer mudança (reservar, salvar, responder um pedido) limpa tudo. O contador de avisos e o login nunca passam pelo cache.

## Responsividade

Toda tela precisa funcionar no celular, no tablet e no computador, inclusive a área do guia. Comece pelo celular e acrescente o resto por cima.

- Os tamanhos ficam em `src/styles/_responsivo.scss`: tablet a partir de 768px e computador a partir de 1024px.
- Em qualquer `.scss`, coloque `@use 'responsivo' as *;` no topo e use `a-partir-do-tablet`, `a-partir-do-pc` e `conteudo-centralizado`.
- No computador, a barra de baixo vira um menu na lateral.
- Evite margem em porcentagem para afastar blocos na vertical, porque no computador ela abre buracos enormes.

## Como o projeto está organizado

```text
src/
├── app/
│   ├── pages/              uma pasta por tela
│   └── shared/
│       ├── components/     peças reaproveitadas (header, mapa, cartões...)
│       ├── config/         API, modo mock e permissões
│       ├── interceptors/   login, sessão, conexão e cache
│       ├── mock/           dados do modo mock
│       ├── services/       um serviço por assunto (passeio, busca, avisos...)
│       └── store/          estado global com NgRx Signals
├── environments/           endereço da API no local e na produção
└── styles/                 estilos globais e tamanhos de tela
```

## Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm test` | roda os testes |
| `npm run build` | gera a versão de produção em `dist/viaja`, apontando para a API de `src/environments/environment.ts` |

O `render.yaml` já deixa o app pronto para virar um site estático no Render. Ainda não publicamos, porque falta registrar o domínio `viaja-app.com.br`.

## Grupo

Daniel Ferreira Pinheiro da Silva, Érika Maria de Sousa, Giovanna Nassar Lara Santos, Marcos Rebouças Duarte da Silva e Sophia Verardo de Araújo.
