# Viaja

Aplicacao mobile-first de turismo colaborativo construida com Angular 21 e NgRx Signals.

## Tecnologias

- **Angular** 21.1
- **NgRx Signals** para gerenciamento de estado
- **RxJS** para fluxos reativos
- **Bootstrap Icons** para icones
- **WebSocket** para chat em tempo real
- **Vitest** para testes unitarios

## Estrutura do Projeto

```
src/app/
  main/                          # Componente principal (container de paginas)
  pages/
    welcome/                     # Tela de boas-vindas
    login/                       # Tela de login
    registrar/                   # Tela de cadastro
    home/                        # Tela inicial com atividades
    chat/                        # Lista de grupos de chat
    chat-message/                # Tela de conversa individual
  shared/
    components/
      header/                    # Header reutilizavel
      botao-nav/                 # Barra de navegacao inferior
      loading/                   # Indicador de carregamento
    config/
      api.config.ts              # URL base da API e WebSocket
      app.config.ts              # Configuracoes gerais (modo mock)
    enums/
      chat.model.ts              # Interfaces do chat
      home.model.ts              # Interfaces da home
    facade/
      app.facade.ts              # Facade para acesso simplificado ao store
    interceptors/
      auth.interceptor.ts        # Interceptor HTTP para autenticacao Bearer
    mock/
      chat.mock.ts               # Dados mock do chat
      home.mock.ts               # Dados mock da home
    services/
      api/                       # Servico generico de API (login, registro, tours)
      auth/                      # Servico de autenticacao (token JWT)
      chat-message/              # Servico de chat (WebSocket, envio e busca de mensagens)
      dados-cliente/             # Servico de dados do cliente (home)
      navigation/                # Servico de navegacao entre paginas
      request/                   # Servico HTTP base (wrapper do HttpClient)
    store/
      app.store.ts               # Store global com NgRx Signals
```

## Navegacao

A aplicacao usa navegacao baseada em estado (sem Angular Router). O `AppStore` controla a pagina atual e o `MainComponent` renderiza condicionalmente a pagina correspondente.

Paginas disponiveis: `welcome` | `login` | `home` | `chat` | `chat-tour`

## Servicos

### `ChatMessageService`
Servico dedicado para operacoes de chat:
- `buscarPaginaChat()` — lista os grupos de chat disponiveis
- `buscarChat(chatId)` — busca mensagens e dados de um chat especifico
- `enviarMensagem(chatId, conteudo)` — envia mensagem via HTTP
- `enviarPeloWebSocket(chatId, texto)` — envia mensagem via WebSocket
- `conectarWebSocket(url, usuarioAtualId)` — abre conexao WebSocket
- `desconectarWebSocket()` — fecha conexao WebSocket
- `onMensagemRecebida` — observable de mensagens recebidas em tempo real

### `DadosClienteService`
Servico para dados da pagina inicial:
- `getHome()` — busca dados da home (usuario, categorias, atividades)

### `AuthService`
Gerencia o token JWT via localStorage:
- `setToken(token)` / `getToken()` / `clearToken()` / `isAuthenticated()`

### `ApiService`
Chamadas de API para autenticacao e tours:
- `login(payload)` / `register(payload)`
- `createTour(payload)` / `createTourInstance(tourId, payload)` / `getTourInstance(tourId, instanceId)`

## Modo Mock

Para desenvolvimento sem backend, defina `MOCK: true` em `src/app/shared/config/app.config.ts`. Isso faz os servicos retornarem dados mock ao inves de chamar a API.

## Desenvolvimento

```bash
npm install
ng serve
```

Acesse `http://localhost:4200/`.

## Build

```bash
ng build
```

Os artefatos serao gerados em `dist/viaja`.

## Testes

```bash
ng test
```
