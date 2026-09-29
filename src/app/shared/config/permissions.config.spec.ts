import { canAccessPage, resolveAllowedPage } from './permissions.config';

describe('permissions.config', () => {
  it('libera as páginas públicas sem login', () => {
    expect(canAccessPage('welcome', null)).toBe(true);
    expect(canAccessPage('registrar', null)).toBe(true);
  });

  it('manda para o login quem não entrou', () => {
    expect(resolveAllowedPage('home', null)).toBe('login');
    expect(resolveAllowedPage('meus-passeios', null)).toBe('login');
  });

  it('deixa o guia gerenciar passeios', () => {
    expect(resolveAllowedPage('meus-passeios', 'GUIDE')).toBe('meus-passeios');
    expect(resolveAllowedPage('passeio-form', 'GUIDE')).toBe('passeio-form');
    expect(resolveAllowedPage('passeio-gestao', 'GUIDE')).toBe('passeio-gestao');
  });

  it('não deixa o viajante entrar no painel do guia', () => {
    expect(resolveAllowedPage('meus-passeios', 'TOURIST')).toBe('home');
    expect(resolveAllowedPage('passeio-form', 'TOURIST')).toBe('home');
    expect(resolveAllowedPage('passeio-gestao', 'TOURIST')).toBe('home');
  });

  it('dá ao admin só a moderação da lista de passeios', () => {
    expect(resolveAllowedPage('meus-passeios', 'ADMIN')).toBe('meus-passeios');
    expect(resolveAllowedPage('passeio-form', 'ADMIN')).toBe('home');
  });

  it('reserva a lista de reservas ao viajante', () => {
    expect(resolveAllowedPage('minhas-solicitacoes', 'TOURIST')).toBe('minhas-solicitacoes');
    expect(resolveAllowedPage('minhas-solicitacoes', 'GUIDE')).toBe('home');
  });

  it('deixa qualquer conta ver o detalhe do passeio', () => {
    expect(resolveAllowedPage('passeio', 'TOURIST')).toBe('passeio');
    expect(resolveAllowedPage('passeio', 'EVENT_PROMOTER')).toBe('passeio');
  });
});
