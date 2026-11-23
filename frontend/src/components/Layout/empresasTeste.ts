import type { EmpresaCatalogo } from '@/components/AuditoriaFiliais/empresas';
import { apiGet } from './sessaoTeste';

/** Empresas do backend de TESTE da Intranet (localhost:3001, banco restaurado do
 * backup da produção). Na Intranet, a mesma chamada é `empresasService.listar()`
 * (src/services/empresas.ts). Este arquivo não vai para lá. */
export function buscarEmpresasTeste(): Promise<EmpresaCatalogo[]> {
  return apiGet<EmpresaCatalogo[]>('/empresas');
}
