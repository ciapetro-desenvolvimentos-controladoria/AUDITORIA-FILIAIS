/** Caminho base do módulo. Já é o mesmo que ele vai ter dentro da Intranet
 * (grupo Controladoria), pra integração ser só copiar a pasta e registrar. */
export const BASE_AUDITORIA_FILIAIS = '/controladoria/auditoria-filiais';

export const rotasAuditoria = {
  painel: () => BASE_AUDITORIA_FILIAIS,
  lista: () => `${BASE_AUDITORIA_FILIAIS}/auditorias`,
  nova: () => `${BASE_AUDITORIA_FILIAIS}/auditorias/nova`,
  detalhe: (id: string) => `${BASE_AUDITORIA_FILIAIS}/auditorias/${id}`,
  papel: (id: string, numero: number) => `${BASE_AUDITORIA_FILIAIS}/auditorias/${id}/pt/${String(numero).padStart(2, '0')}`,
};
