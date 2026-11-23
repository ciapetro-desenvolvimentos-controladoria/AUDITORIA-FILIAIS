import { buscarEmpresasTeste } from '@/components/Layout/empresasTeste';

/** Recorte do tipo `Empresa` da Intranet (src/types/index.ts) com só os campos
 * que a auditoria usa. Na integração dá para trocar por `Empresa` direto. */
export interface EmpresaCatalogo {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  tipo: 'Empresa' | 'Matriz' | 'Filial' | 'Holding';
  ativa: boolean;
  controladoraId?: string;
}

/** Opção pronta para o seletor de filial da Nova auditoria. */
export interface OpcaoFilial {
  id: string;
  nome: string;
  cnpj: string;
  rotulo: string;
}

/** Fonte das empresas. Na integração com a Intranet, trocar por
 * `empresasService.listar()` (src/services/empresas.ts), que lê a tabela `empresas`. */
export function listarEmpresas(): Promise<EmpresaCatalogo[]> {
  return buscarEmpresasTeste();
}

/* Regras copiadas de src/utils/empresas.ts da Intranet, para a lista ficar igual
   aos filtros de filial de lá. */

/** Nome da filial; sem nome fantasia, cai para o nome da matriz. */
export function nomeFilialComFallbackMatriz(empresa: EmpresaCatalogo, mapa: Map<string, EmpresaCatalogo>): string {
  if (empresa.nomeFantasia) return empresa.nomeFantasia;
  const matriz = empresa.controladoraId ? mapa.get(empresa.controladoraId) : undefined;
  return matriz?.nomeFantasia || matriz?.razaoSocial || empresa.razaoSocial;
}

/** Número de ordem do CNPJ (0001 = matriz, 0002+ = filiais), como o Sispetro ordena. */
export function numeroOrdemCnpj(cnpj: string): number {
  return Number(cnpj.replace(/\D/g, '').slice(8, 12)) || 0;
}

/** CNPJ com máscara 00.000.000/0000-00. */
export function formatarCnpj(cnpj: string | undefined): string {
  if (!cnpj) return '(vazio)';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Matriz e filiais ativas, na ordem do CNPJ, prontas para o seletor. */
export function opcoesFiliais(empresas: EmpresaCatalogo[]): OpcaoFilial[] {
  const mapa = new Map(empresas.map(e => [e.id, e]));
  return empresas
    .filter(e => e.ativa && (e.tipo === 'Filial' || e.tipo === 'Matriz'))
    .sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial, 'pt-BR') || numeroOrdemCnpj(a.cnpj) - numeroOrdemCnpj(b.cnpj))
    .map(e => {
      const nome = nomeFilialComFallbackMatriz(e, mapa);
      const cnpj = formatarCnpj(e.cnpj);
      return { id: e.id, nome, cnpj, rotulo: `${nome} · ${cnpj}` };
    });
}
