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

Aplicacao mobile-first de turismo colaborativo construida com Angular 21 e NgRx Signals.

## Tecnologias

- **Angular** 21.1
- **NgRx Signals** para gerenciamento de estado
- **RxJS** para fluxos reativos
- **Bootstrap Icons** para icones
- **WebSocket** para chat em tempo real
- **Leaflet** para os mapas
- **Vitest** para testes unitarios

## Estrutura do Projeto

```
src/app/
  main/                          # Componente principal (container de paginas)
  app.routes.ts                  # Endereco de cada pagina
  pages/
    welcome/                     # Tela de boas-vindas
    login/                       # Tela de login
    registrar/                   # Tela de cadastro
    esqueci-senha/               # Pedir o link para trocar a senha
    redefinir-senha/             # Trocar a senha pelo link
    home/                        # Tela inicial com atividades
    buscar/ resultados/          # Busca e resultados com filtros
    passeio/ passeio-form/       # Pagina e formulario do passeio
    passeio-gestao/              # Datas, vagas e pedidos do passeio
    evento/ evento-form/         # Pagina e formulario do evento
    meus-passeios/ meus-eventos/ # Listas do guia e do produtor
    painel/                      # Area do guia: pedidos e agenda
    analise/                     # Fila de eventos para o admin aprovar
    viagens/ minhas-solicitacoes/# Reservas e pedidos do viajante
    favoritos/ avisos/           # Passeios salvos e notificacoes
    perfil/ perfil-editar/       # Perfil e edicao
    perfil-publico/              # Perfil que os outros veem
    chat/                        # Lista de grupos de chat
    chat-message/                # Tela de conversa individual
  shared/
    components/                  # Header, barra de navegacao, mapa, cards e outros
    config/
      api.config.ts              # URL base da API e WebSocket
      app.config.ts              # Configuracoes gerais (modo mock)
      permissions.config.ts      # Quais papeis abrem cada pagina
    enums/                       # Interfaces dos dados
    facade/
      app.facade.ts              # Facade para acesso simplificado ao store
    guards/                      # Pagina aberta e formulario com mudancas
    interceptors/                # Token, cache, conexao e sessao
    mock/
      chat.mock.ts               # Dados mock do chat
      home.mock.ts               # Dados mock da home
    services/                    # Um servico por assunto (api, auth, chat, tour, evento, busca...)
    store/
      app.store.ts               # Store global com NgRx Signals
```

## Navegacao

A aplicacao usa o Angular Router: cada pagina tem seu endereco em `app.routes.ts`. O `AppStore` guarda a pagina atual e o `MainComponent` renderiza a pagina correspondente.

## Servicos

### `ChatMessageService`
Servico dedicado para operacoes de chat:
- `buscarPaginaChat()` — lista os grupos de chat disponiveis
- `buscarChat(chatId)` — busca mensagens e dados de um chat especifico
- `enviarMensagem(chatId, conteudo)` — envia mensagem via HTTP
- `enviarPeloWebSocket(chatId, texto, clientId)` — envia mensagem via WebSocket
- `enviarLocalizacao(chatId, lat, lon)` / `desligarLocalizacao(chatId)` — localizacao ao vivo no mapa do grupo
- `conectarWebSocket(url, chatId)` — abre conexao WebSocket
- `desconectarWebSocket()` — fecha conexao WebSocket
- `onMensagemRecebida` — observable de mensagens recebidas em tempo real

### `DadosClienteService`
Servico para dados da pagina inicial e do perfil:
- `getHome()` — busca dados da home (usuario, categorias, atividades)
- `getPerfil()` / `atualizarPerfil(dados)` / `enviarFoto(foto)` / `removerFoto()`

### `AuthService`
Gerencia o token JWT via localStorage:
- `setToken(token)` / `getToken()` / `clearToken()` / `isAuthenticated()` / `sair()`

### `ApiService`
Chamadas de API para autenticacao e chat:
- `login(payload)` / `register(payload, foto)`
- `esqueciSenha(email)` / `redefinirSenha(codigo, password)`
- `startChat(tourInstanceId)`

## Modo Mock

Para desenvolvimento sem backend, defina `MOCK: true` em `src/app/shared/config/app.config.ts`. Isso faz os servicos retornarem dados mock ao inves de chamar a API.

## Desenvolvimento

```bash
npm install
ng serve
```

Acesse `http://localhost:4200/`. Com `MOCK: false`, suba antes o [viaja_flaskapp](https://github.com/ViajaAPP/viaja_flaskapp/tree/staging#readme).

## Build

```bash
ng build
```

Os artefatos serao gerados em `dist/viaja`.

## Testes

```bash
ng test
```
