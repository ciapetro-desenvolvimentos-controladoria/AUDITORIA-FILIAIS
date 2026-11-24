import type { ValeCompra } from '@/components/AuditoriaFiliais/pedagios';

/** Vales comprados lidos do banco de TESTE da Intranet: rota do `npm run dev` (vite.config.ts)
 * que roda scripts-dev/pedagios-compras-pt08.sql com o psql. Na Intranet, vira uma rota da API.
 * Este arquivo não vai para lá. */
export async function buscarComprasPedagioTeste(codEmpresa: number, de: string, ate: string): Promise<ValeCompra[]> {
  const params = new URLSearchParams({ cod: String(codEmpresa), de, ate });
  const res = await fetch(`/intranet-teste/pt08-compras?${params}`);
  const corpo = await res.json().catch(() => null) as ValeCompra[] | { message?: string } | null;
  if (!res.ok || !Array.isArray(corpo)) {
    throw new Error((corpo && !Array.isArray(corpo) && corpo.message) || `Erro ${res.status} ao buscar os vales-pedágio.`);
  }
  return corpo;
}
