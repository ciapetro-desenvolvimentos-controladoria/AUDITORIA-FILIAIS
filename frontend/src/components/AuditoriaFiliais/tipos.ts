export type TipoAuditoria = 'presencial' | 'remota';

export interface AuditoriaFilial {
  id: string;
  /** Nome da filial para exibição (guardado junto para não depender do catálogo). */
  filial: string;
  /** Id da empresa no cadastro da Intranet (tabela `empresas`). */
  empresaId?: string;
  /** CNPJ da filial, com máscara. */
  cnpj?: string;
  /** AAAA-MM */
  mesReferencia: string;
  /** AAAA-MM-DD */
  dataAuditoria: string;
  periodoInicio: string;
  periodoFim: string;
  auditor: string;
  tipo: TipoAuditoria;
  status: string;
  criadaEm: string;
}

/** Situação de um papel de trabalho, lida do que foi salvo nele. */
export type SituacaoPapel = 'nao_iniciado' | 'rascunho' | 'finalizado';

/** Resultado usado no PT01 a PT03 (valor salvo em minúsculas). */
export type Resultado = '' | 'acordo' | 'parcial' | 'desacordo';
