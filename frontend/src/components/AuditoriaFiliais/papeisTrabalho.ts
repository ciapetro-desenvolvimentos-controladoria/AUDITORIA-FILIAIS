export interface PapelTrabalho {
  numero: number;
  nome: string;
}

export const PAPEIS_TRABALHO: PapelTrabalho[] = [
  { numero: 1, nome: 'Conferência Caixa Financeiro' },
  { numero: 2, nome: 'Formulário de Segurança' },
  { numero: 3, nome: 'Amostragem Canhotos NF' },
  { numero: 4, nome: 'Conferência Celulares' },
  { numero: 5, nome: 'Conferência Estoque Lacres' },
  { numero: 6, nome: 'Conferência Estoque Aditivo' },
  { numero: 7, nome: 'Conferência Posição OC' },
  { numero: 8, nome: 'Conferência Pedágio' },
  { numero: 9, nome: 'Verificação Usuário' },
  { numero: 10, nome: 'Faltas de Produto' },
  { numero: 11, nome: 'Emissão de MDF-e' },
  { numero: 12, nome: 'Conferência E-mail Corporativo' },
];

export const codigoPapel = (numero: number) => `PT ${String(numero).padStart(2, '0')}`;

export const papelPorNumero = (numero: number) => PAPEIS_TRABALHO.find(p => p.numero === numero);
