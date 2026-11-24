import { buscarComprasPedagioTeste } from '@/components/Layout/pedagiosTeste';
import type { TomStatus } from '@/components/ui/LayoutPagina';

/** Vale-pedágio comprado (não cancelado), com o resultado da compra na Target e a situação
 * calculada pelo módulo de Pedágios da Intranet (schema `pedagios`). */
export interface ValeCompra {
  id: string;
  numeroVale: string;
  carga: string;
  /** AAAA-MM-DD: data da compra (inclusão do vale). */
  dataInclusao: string;
  dataEmbarque: string | null;
  origem: string | null;
  destino: string | null;
  numeroRota: string | null;
  placa: string | null;
  valor: string | null;
  filial: string | null;
  /** A Target aceitou a compra (comando 1). */
  compraOk: boolean;
  /** A Target aceitou a confirmação (comando 9); na compra dentro do CIOT é a prova da compra. */
  confirmOk: boolean;
  /** 1 aguardando, 2 confirmado, 3 erro na confirmação. */
  statusConfirmacao: number | null;
  mensagemErro: string | null;
  situacao: string | null;
  diagnostico: string | null;
}

/** Vales comprados da filial (código da empresa no Sispetro) no período, inclusive.
 * Hoje (testes) lê o banco de teste da Intranet; na integração, trocar por uma rota da API da
 * Intranet com a consulta de scripts-dev/pedagios-compras-pt08.sql. */
export function buscarComprasPedagio(codEmpresa: number, de: string, ate: string): Promise<ValeCompra[]> {
  return buscarComprasPedagioTeste(codEmpresa, de, ate);
}

/** A compra do vale teve sucesso na Target? (mesma regra da "prova real" do módulo de Pedágios) */
export const compraComSucesso = (v: Pick<ValeCompra, 'compraOk' | 'confirmOk'>) => v.compraOk || v.confirmOk;

export const ROTULO_CONFIRMACAO: Record<number, string> = { 1: 'Aguardando', 2: 'Confirmado', 3: 'Erro na confirmação' };

/** Rótulo e cor das situações do módulo de Pedágios (docs/pedagios/regras-da-auditoria.md). */
export const SITUACAO_PEDAGIO: Record<string, { rotulo: string; tom: TomStatus }> = {
  CONCILIADO: { rotulo: 'Conciliado', tom: 'ok' },
  CANCELADO_CONCILIADO: { rotulo: 'Cancelado e conciliado', tom: 'ok' },
  AGUARDANDO_CONFIRMACAO: { rotulo: 'Aguardando confirmação', tom: 'info' },
  ALERTA: { rotulo: 'Alerta', tom: 'atencao' },
  DIVERGENCIA: { rotulo: 'Divergência', tom: 'erro' },
  PRAZO_VENCIDO: { rotulo: 'Prazo vencido', tom: 'neutro' },
};
