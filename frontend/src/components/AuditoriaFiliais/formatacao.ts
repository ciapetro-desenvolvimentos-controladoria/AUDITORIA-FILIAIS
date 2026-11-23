/** AAAA-MM-DD -> DD/MM/AAAA */
export function formatarData(data: string | null | undefined) {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return dia ? `${dia}/${mes}/${ano}` : data;
}

/** AAAA-MM -> "setembro de 2026" */
export function formatarMes(mesReferencia: string | null | undefined) {
  if (!mesReferencia) return '-';
  const [ano, mes] = mesReferencia.split('-');
  return new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/** AAAA-MM -> "Set/2026" */
export function formatarMesCurto(mesReferencia: string | null | undefined) {
  if (!mesReferencia) return '-';
  const [ano, mes] = mesReferencia.split('-');
  const nome = new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)}/${ano}`;
}

export function formatarMoeda(valor: number | string | null | undefined) {
  if (valor === '' || valor === null || valor === undefined) return '-';
  const n = Number(valor);
  if (Number.isNaN(n)) return '-';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
