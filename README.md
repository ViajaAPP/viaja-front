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
    esqueci-senha/               # Pedir o link para trocar a senha
    redefinir-senha/             # Escolher a senha nova pelo link do e-mail
    buscar/                      # Busca de passeios e destinos
    resultados/                  # Resultado da busca, com filtros
    passeio/                     # Página do passeio: fotos, mapa, avaliações e reserva
    painel/                      # Passeios do guia: pedidos, agenda, anúncios e arquivados
    viagens/                     # Reservas de quem vai aos passeios
    favoritos/                   # Passeios salvos
    avisos/                      # Notificações
    perfil/                      # Perfil e atalhos da conta
    perfil-editar/               # Editar foto, nome e senha
    meus-passeios/               # Lista de passeios do guia
    passeio-form/                # Criar e editar passeio
    passeio-gestao/              # Datas, vagas e pedidos de um passeio
  shared/
    components/
      header/                    # Header reutilizavel
      botao-nav/                 # Barra de navegacao inferior
      loading/                   # Indicador de carregamento
    config/
      api.config.ts              # URL base da API (vem de src/environments)
      app.config.ts              # Configuracoes gerais (modo mock)
      permissions.config.ts      # Quais papéis abrem cada página
      tour.config.ts             # Textos de status, UFs e formatos
    enums/
      chat.model.ts              # Interfaces do chat
      home.model.ts              # Interfaces da home
      tour.model.ts              # Interfaces de passeio, data e pedido
      user.model.ts              # Papel do usuário, login e perfil
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
      tour/                      # Passeios, datas e pedidos
    store/
      app.store.ts               # Store global com NgRx Signals
src/environments/
  environment.ts                 # Endereço da API em produção
  environment.development.ts     # Endereço da API local, usado pelo ng serve
```

## Navegacao

A aplicacao usa navegacao baseada em estado (sem Angular Router). O `AppStore` controla a pagina atual e o `MainComponent` renderiza condicionalmente a pagina correspondente.

Hoje cada página também tem o seu endereço (`/inicio`, `/passeio/12`, `/reservas`...), definido em `app.routes.ts`. Assim dá para atualizar a página, voltar pelo navegador e mandar o link de um passeio para alguém. O `paginaGuard` avisa o `AppStore` qual página abriu, então o resto do app continua funcionando do mesmo jeito.

## Quem pode abrir cada página

Quem decide é o `resolveAllowedPage`, em `shared/config/permissions.config.ts`.

- Sem login, você só vê as boas-vindas, o login, o cadastro e a recuperação de senha. Qualquer outro endereço leva para o login.
- A área de Passeios (pedidos, agenda e anúncios) e a criação de passeio são do guia.
- O resto abre para qualquer pessoa logada.

Se a pessoa não tem permissão, ela volta para o início. O backend confere as mesmas regras em todas as rotas. Esconder um botão no front nunca é a única proteção.

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

### Os outros serviços

Cada assunto do app tem o seu serviço em `shared/services`, e o nome da pasta já diz do que ele cuida:

- `tour`: passeios, datas e pedidos de vaga;
- `busca`: sugestões e resultados da busca;
- `painel`: a área de Passeios do guia;
- `avisos`: notificações e o número no sininho;
- `favorito`: os passeios salvos;
- `locais` e `localizacao`: busca de endereço no mapa e a localização do celular;
- `cidades`: sugestões de cidade;
- `feedback`: as mensagens de confirmação e os avisos que aparecem embaixo da tela;
- `layout`: lembra se o menu do computador está aberto ou fechado.

## Endereço, mapa e "mais perto"

- O front nunca fala direto com serviços de fora. Busca de endereço, cidades e distância passam sempre pelo backend, que guarda as respostas em cache.
- O mapa usa Leaflet com o OpenStreetMap, e não precisa de chave. O botão "Ver como chegar" abre o Google Maps, e o do Uber já abre com o destino preenchido.
- O "mais perto" pede a localização do navegador. Se a pessoa negar, a tela explica como liberar.
- O navegador só libera a localização em `http://localhost` ou em `https`. Se você abrir o app pelo IP da rede local, o "mais perto" sempre vai mostrar a mensagem de erro.

## Cache

Para não ficar carregando toda vez que alguém troca de página, o `cache.interceptor.ts` guarda as respostas por um tempo:

- até 15 segundos, a página abre com o que já estava guardado, sem chamar a API;
- até 10 minutos, abre com o que estava guardado e busca a versão nova por trás;
- qualquer mudança (reservar, salvar, responder um pedido) limpa o cache inteiro. Sair da conta também limpa.

O contador de avisos e o login nunca passam pelo cache.

## Modo Mock

Para desenvolvimento sem backend, defina `MOCK: true` em `src/app/shared/config/app.config.ts`. Isso faz os servicos retornarem dados mock ao inves de chamar a API.

## Desenvolvimento

### O que você precisa ter

- Node.js 20.19 ou mais novo. O Angular 21 não roda nas versões antigas.
- Git.
- O backend `viaja_flaskapp` rodando, na sua máquina ou em produção.

### Passo a passo

A versão que está funcionando fica na branch `staging`.

```bash
git clone https://github.com/ViajaAPP/viaja-front.git
cd viaja-front
git checkout staging
npm install
npm start
```

Depois é só abrir `http://localhost:4200/`. O front procura a API em `http://localhost:5000`, então suba o backend antes. Dá para rodar o backend todo na sua máquina, sem chave nenhuma. Na pasta do `viaja_flaskapp`:

```bash
npx supabase start
bash scripts/secrets.sh local
python run.py --local
```

Para entrar, use uma das contas de teste. A senha de todas é `viaja123`:

- `guia@viaja.local`: a Fabi, que é guia e tem passeios publicados;
- `viajante@viaja.local`: o Tito, que reserva passeios;
- `admin@viaja.local`: quem modera.

As chaves de produção ficam só no backend, nunca no front. Se você quiser ver o app com os dados de produção, suba o backend com as chaves de produção. O README do `viaja_flaskapp` explica como pedir acesso a elas. O front continua apontando para `http://localhost:5000` do mesmo jeito.

## Responsividade

Toda tela precisa funcionar bem no celular, no tablet e no computador, inclusive a área do guia. Comece sempre pelo celular e acrescente o resto por cima, sem estragar o que já funciona nele.

- Os tamanhos de tela ficam em `src/styles/_responsivo.scss`: tablet a partir de 768px e computador a partir de 1024px.
- Em qualquer `.scss`, coloque `@use 'responsivo' as *;` no topo e use `a-partir-do-tablet`, `a-partir-do-pc` e `conteudo-centralizado`.
- No computador, a barra de baixo vira um menu na lateral, que abre e fecha. O app lembra como você deixou.
- Evite margem em porcentagem para afastar blocos na vertical. Ela é calculada pela largura da tela e, no computador, abre buracos enormes.

## Build

```bash
ng build
```

Os artefatos serao gerados em `dist/viaja`. O build de produção usa o endereço da API que está em `src/environments/environment.ts`.

## Publicar no Render

O `render.yaml` já deixa o front pronto para virar um site estático no Render, de graça. Ele faz o build e manda qualquer endereço para o `index.html`, para o link de um passeio abrir direto. Ainda não publicamos: falta registrar o domínio `viaja-app.com.br`.

## Testes

```bash
ng test
```
