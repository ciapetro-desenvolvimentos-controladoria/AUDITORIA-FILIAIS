import { buscarPopulacaoVendasTeste } from '@/components/Layout/sispetroTeste';
import type { NotaVenda } from './amostragem';

/** Notas de venda de uma filial num período, lidas do Sispetro.
 * Venda = TipoPedido 'VD', saída, NF-e modelo 55, não cancelada; data = emissão (DataNF). */
export interface PopulacaoVendas {
  filial: { codEmpresa: string; nome: string; cnpj: string };
  /** AAAA-MM-DD, inclusive. */
  de: string;
  ate: string;
  consultadoEm: string;
  notas: NotaVenda[];
}

/** Fonte da população. Hoje (testes) consulta o Sispetro por este servidor interno;
 * na integração com a Intranet, trocar por um pedido ao coletor (a VPS não alcança o
 * Sispetro). A consulta SQL está em scripts-dev/sispetro-populacao-pt03.ps1. */
export function buscarPopulacaoVendas(cnpj: string, de: string, ate: string): Promise<PopulacaoVendas> {
  return buscarPopulacaoVendasTeste(cnpj, de, ate);
}
