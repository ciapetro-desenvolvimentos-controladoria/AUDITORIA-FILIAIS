import type { AuditoriaFilial, SituacaoPapel } from './tipos';
import { PAPEIS_TRABALHO } from './papeisTrabalho';

/* ─────────────────────────────────────────────────────────────────────────────
   Único ponto que lê e grava os dados do módulo. Hoje usa o localStorage do
   navegador (mesmas chaves da versão anterior, então o que já foi salvo
   continua aparecendo). Na integração com a Intranet, só este arquivo troca
   para chamadas à API (services/ da Intranet); as telas não mudam.
   ───────────────────────────────────────────────────────────────────────────── */

const chaveAuditoria = (id: string) => `auditoria_${id}`;
const chavePapel = (id: string, numero: number) => `auditoria_${id}_pt${String(numero).padStart(2, '0')}`;
/** auditoria_<uuid> sem sufixo de papel de trabalho. */
const PADRAO_CHAVE_AUDITORIA = /^auditoria_[0-9a-f-]{36}$/i;

function lerJson<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

function gravarJson(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* navegador sem storage: segue sem gravar */
  }
}

export function listarAuditorias(): AuditoriaFilial[] {
  const lista: AuditoriaFilial[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (!chave || !PADRAO_CHAVE_AUDITORIA.test(chave)) continue;
      const a = lerJson<AuditoriaFilial>(chave);
      if (a?.id) lista.push(a);
    }
  } catch {
    /* sem storage */
  }
  return lista.sort((a, b) => (b.criadaEm ?? '').localeCompare(a.criadaEm ?? ''));
}

export function obterAuditoria(id: string): AuditoriaFilial | null {
  return lerJson<AuditoriaFilial>(chaveAuditoria(id));
}

export function salvarAuditoria(auditoria: AuditoriaFilial) {
  gravarJson(chaveAuditoria(auditoria.id), auditoria);
}

export function obterPapel<T>(id: string, numero: number): T | null {
  return lerJson<T>(chavePapel(id, numero));
}

export function salvarPapel(id: string, numero: number, dados: unknown) {
  gravarJson(chavePapel(id, numero), dados);
}

export function situacaoPapel(id: string, numero: number): SituacaoPapel {
  const dados = lerJson<{ status?: string }>(chavePapel(id, numero));
  if (!dados) return 'nao_iniciado';
  return dados.status === 'finalizado' ? 'finalizado' : 'rascunho';
}

/** Quantos papéis de trabalho já foram finalizados nesta auditoria. */
export function progressoAuditoria(id: string) {
  const finalizados = PAPEIS_TRABALHO.filter(p => situacaoPapel(id, p.numero) === 'finalizado').length;
  return { finalizados, total: PAPEIS_TRABALHO.length };
}
