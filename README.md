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
    registrar/                   # Tela de cadastro (viajante ou guia)
    home/                        # Tela inicial com atividades
    chat/                        # Lista de grupos de chat
    chat-message/                # Tela de conversa individual
    perfil/                      # Dados da conta, atalhos por papel e sair
    passeio/                     # Detalhe do passeio e pedido de vaga
    minhas-solicitacoes/         # Reservas do viajante
    meus-passeios/               # Painel do guia: passeios, publicar e tirar do ar
    passeio-form/                # Criar e editar passeio
    passeio-gestao/              # Datas, vagas, pedidos e chat do grupo
  shared/
    components/
      header/                    # Header reutilizavel
      botao-nav/                 # Barra de navegacao inferior
      loading/                   # Indicador de carregamento
    config/
      api.config.ts              # URL base da API (vem de src/environments)
      app.config.ts              # Configuracoes gerais (modo mock)
      permissions.config.ts      # Quais papeis abrem cada pagina
      tour.config.ts             # Textos de status, UFs e formatos
    enums/
      chat.model.ts              # Interfaces do chat
      home.model.ts              # Interfaces da home
      tour.model.ts              # Interfaces de passeio, data e pedido
      user.model.ts              # Papel do usuario, login e perfil
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
      tour/                      # Servico de passeios, datas e pedidos
    store/
      app.store.ts               # Store global com NgRx Signals
src/environments/
  environment.ts                 # URL da API de producao
  environment.development.ts     # URL da API local (usada pelo ng serve)
```

## Navegacao

A aplicacao usa navegacao baseada em estado (sem Angular Router). O `AppStore` controla a pagina atual e o `MainComponent` renderiza condicionalmente a pagina correspondente.

Paginas disponiveis: `welcome` | `login` | `registrar` | `home` | `chat` | `chat-tour` | `perfil` | `passeio` | `minhas-solicitacoes` | `meus-passeios` | `passeio-form` | `passeio-gestao`

## Papeis e permissoes

O login devolve o papel do usuario, e o store guarda esse papel na sessao. Toda troca de pagina passa por `resolveAllowedPage` (`shared/config/permissions.config.ts`):

- sem login, so abrem `welcome`, `login` e `registrar`; o resto manda para o login;
- `meus-passeios`: guia e admin;
- `passeio-form` e `passeio-gestao`: so guia;
- `minhas-solicitacoes`: so viajante;
- as demais paginas abrem para qualquer conta logada.

Quem nao tem permissao volta para a home. O backend confere as mesmas regras em cada rota, entao esconder um botao nunca e a unica protecao.

O guia so mexe nos proprios passeios. O admin ve todos e pode tirar qualquer um do ar, mas nao edita passeio de outra pessoa.

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
Chamadas de API para autenticacao e chat:
- `login(payload)` / `register(payload)`
- `startChat(tourInstanceId)` abre o chat do grupo de uma data

### `TourService`
Passeios, datas e pedidos de vaga:
- `listarPasseiosGerenciados()` / `buscarPasseio(tourId)`
- `criarPasseio(payload)` / `editarPasseio(tourId, payload)` / `publicarPasseio(tourId, published)`
- `criarData(tourId, payload)` / `editarData(tourId, instanceId, payload)`
- `listarSolicitacoesDaData(instanceId)` / `responderSolicitacao(requestId, status)`
- `solicitarVaga(instanceId, message)` / `listarMinhasSolicitacoes()`

## Modo Mock

Para desenvolvimento sem backend, defina `MOCK: true` em `src/app/shared/config/app.config.ts`. Isso faz os servicos retornarem dados mock ao inves de chamar a API.

## Desenvolvimento

A versao que esta funcionando fica na branch `staging`.

```bash
npm install
ng serve
```

Acesse `http://localhost:4200/`. O `ng serve` chama a API em `http://localhost:5000`, entao suba o backend antes. No `viaja_flaskapp` da para rodar tudo local, sem nenhuma chave:

```bash
npx supabase start
bash scripts/secrets.sh local
python run.py --local
```

Contas de teste, todas com a senha `viaja123`: `guia@viaja.local`, `viajante@viaja.local` e `admin@viaja.local`.

As chaves de producao ficam no backend, nunca no front. O README do `viaja_flaskapp` explica como pedir acesso a elas.

## Build

```bash
ng build
```

Os artefatos serao gerados em `dist/viaja`. O build de producao usa a URL de `src/environments/environment.ts`.

## Testes

```bash
ng test
```
