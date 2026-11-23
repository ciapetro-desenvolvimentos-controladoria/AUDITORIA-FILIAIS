/* Sessão SÓ para os testes isolados. Login de verdade no backend de teste da
   Intranet (POST /api/auth/login), guardado em sessionStorage['usuario_logado']
   no MESMO formato da Intranet (usuário + token), para o módulo já funcionar
   igual quando for integrado. Na Intranet, quem cuida disso é o login dela
   (useSessaoAtual + src/lib/api.ts); este arquivo não vai para lá. */

const CHAVE = 'usuario_logado';

export interface SessaoTeste {
  id: string;
  nome: string;
  login: string;
  papel: string;
  token: string;
}

export function lerSessao(): SessaoTeste | null {
  try {
    const raw = sessionStorage.getItem(CHAVE);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<SessaoTeste>;
    return s.token ? (s as SessaoTeste) : null;
  } catch {
    return null;
  }
}

export function sair(): void {
  try { sessionStorage.removeItem(CHAVE); } catch { /* sem sessão */ }
}

export async function entrar(login: string, senha: string): Promise<SessaoTeste> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, senha }),
  });
  const corpo = await res.json().catch(() => ({})) as { token?: string; usuario?: Omit<SessaoTeste, 'token'>; message?: string };
  if (!res.ok || !corpo.token || !corpo.usuario) {
    throw new Error(corpo.message ?? (res.status >= 500 ? 'Backend de teste fora do ar (localhost:3001).' : `Erro ${res.status} ao entrar.`));
  }
  const sessao: SessaoTeste = { ...corpo.usuario, token: corpo.token };
  sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
  return sessao;
}

/** GET autenticado na API de teste (equivale ao `api.get` da Intranet). */
export async function apiGet<T>(caminho: string): Promise<T> {
  const sessao = lerSessao();
  const res = await fetch(`/api${caminho}`, {
    headers: sessao ? { Authorization: `Bearer ${sessao.token}` } : {},
  });
  const renovado = res.headers.get('X-Token-Renovado');
  if (renovado && sessao) sessionStorage.setItem(CHAVE, JSON.stringify({ ...sessao, token: renovado }));
  if (res.status === 401) {
    sair();
    window.location.href = '/login';
    throw new Error('Sessão expirada. Entre novamente.');
  }
  if (!res.ok) {
    const corpo = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(corpo.message ?? `Erro ${res.status} em ${caminho}`);
  }
  return res.json() as Promise<T>;
}

/** Usuário da sessão de teste (nome e papel), com valores neutros sem login. */
export function usuarioTeste(): { nome: string; papel: string } {
  const s = lerSessao();
  return { nome: s?.nome ?? '', papel: s?.papel ?? '' };
}
