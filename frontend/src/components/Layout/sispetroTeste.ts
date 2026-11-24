import type { PopulacaoVendas } from '@/components/AuditoriaFiliais/sispetro';

/** Consulta de TESTE ao Sispetro: rota do `npm run dev` (vite.config.ts) que roda
 * scripts-dev/sispetro-populacao-pt03.ps1 neste servidor interno. Na Intranet,
 * vira um pedido para o coletor (fila). Este arquivo não vai para lá. */
export async function buscarPopulacaoVendasTeste(cnpj: string, de: string, ate: string): Promise<PopulacaoVendas> {
  const params = new URLSearchParams({ cnpj: cnpj.replace(/\D/g, ''), de, ate });
  const res = await fetch(`/sispetro-teste/pt03-populacao?${params}`);
  const corpo = await res.json().catch(() => ({})) as PopulacaoVendas & { message?: string };
  if (!res.ok) throw new Error(corpo.message ?? `Erro ${res.status} ao consultar o Sispetro.`);
  return corpo;
}
