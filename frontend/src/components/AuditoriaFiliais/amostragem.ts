/* ─────────────────────────────────────────────────────────────────────────────
   Amostragem do PT03 (canhotos das notas de venda). Só regra, sem tela.

   Da população de notas de venda do período, sorteia 15 com modalidade Retira (R)
   e 15 com Entrega (E). Se uma modalidade não tem 15, usa todas as que tem e
   completa com a outra; se a população inteira não chega a 30, usa todas e avisa.

   O sorteio usa uma "semente" gravada junto com a amostra: com a mesma população
   e a mesma semente, o resultado é sempre o mesmo, o que permite reproduzir e
   comprovar o sorteio depois.
   ───────────────────────────────────────────────────────────────────────────── */

export type Modalidade = 'R' | 'E';

/** Nota de venda da população (como vem do Sispetro). */
export interface NotaVenda {
  sequencial: string;
  numeroNf: string;
  serie: string;
  /** AAAA-MM-DD */
  dataNf: string;
  /** 'R' = Retira, 'E' = Entrega (NotaFiscal.RetiraEntrega). */
  modalidade: string;
  cliente: string;
  valor: string;
  chaveAcesso: string;
}

export interface NotaSorteada extends NotaVenda {
  modalidade: Modalidade;
  /** Entrou para completar a falta da outra modalidade. */
  complemento: boolean;
}

export interface ResultadoSorteio {
  notas: NotaSorteada[];
  avisos: string[];
  populacao: { retira: number; entrega: number; outras: number; total: number };
  semente: number;
  /** Tamanho desejado da amostra (2 × por modalidade). */
  meta: number;
}

export const NOTAS_POR_MODALIDADE = 15;

export const ROTULO_MODALIDADE: Record<Modalidade, string> = { R: 'Retira', E: 'Entrega' };

/** Semente nova para um sorteio (inteiro de 32 bits). */
export function novaSemente(): number {
  const valores = new Uint32Array(1);
  crypto.getRandomValues(valores);
  return valores[0];
}

/** Gerador pseudoaleatório com semente (mulberry32): rápido e reproduzível. */
function gerador(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Embaralhamento de Fisher-Yates (cópia; não mexe na lista original). */
function embaralhar<T>(lista: T[], aleatorio: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Sorteio simples de até `quantidade` itens, reproduzível pela semente. A lista deve vir
 * em ordem estável (a mesma ordem + a mesma semente = o mesmo sorteio). */
export function sortearItens<T>(lista: T[], quantidade: number, semente: number): T[] {
  return embaralhar(lista, gerador(semente)).slice(0, quantidade);
}

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`;

export function sortearAmostra(populacao: NotaVenda[], semente: number, porModalidade = NOTAS_POR_MODALIDADE): ResultadoSorteio {
  const aleatorio = gerador(semente);
  // Ordem estável antes de embaralhar, para a semente reproduzir o mesmo sorteio.
  const ordenada = [...populacao].sort((a, b) =>
    a.dataNf.localeCompare(b.dataNf) || Number(a.numeroNf) - Number(b.numeroNf) || Number(a.sequencial) - Number(b.sequencial));
  const retira = embaralhar(ordenada.filter(n => n.modalidade === 'R'), aleatorio);
  const entrega = embaralhar(ordenada.filter(n => n.modalidade === 'E'), aleatorio);
  const outras = populacao.length - retira.length - entrega.length;
  const meta = porModalidade * 2;

  const baseR = Math.min(porModalidade, retira.length);
  const baseE = Math.min(porModalidade, entrega.length);
  // O que faltou numa modalidade é completado com o que sobrou da outra.
  const extraE = Math.min(porModalidade - baseR, entrega.length - baseE);
  const extraR = Math.min(porModalidade - baseE, retira.length - baseR);

  const marcar = (lista: NotaVenda[], modalidade: Modalidade, complemento: boolean): NotaSorteada[] =>
    lista.map(n => ({ ...n, modalidade, complemento }));

  const notas = [
    ...marcar(retira.slice(0, baseR), 'R', false),
    ...marcar(retira.slice(baseR, baseR + extraR), 'R', true),
    ...marcar(entrega.slice(0, baseE), 'E', false),
    ...marcar(entrega.slice(baseE, baseE + extraE), 'E', true),
  ];

  const avisos: string[] = [];
  const total = retira.length + entrega.length;
  if (total === 0) {
    avisos.push('Não há notas de venda Retira ou Entrega no período: nenhuma nota foi sorteada.');
  } else {
    const quantas = (n: number) => (n === 0 ? 'nenhuma nota' : `só ${plural(n, 'nota', 'notas')}`);
    if (retira.length < porModalidade) {
      avisos.push(`Retira: ${quantas(retira.length)} no período (mínimo ${porModalidade}).`
        + (extraE > 0 ? ` Completada com ${plural(extraE, 'nota', 'notas')} de Entrega.` : ''));
    }
    if (entrega.length < porModalidade) {
      avisos.push(`Entrega: ${quantas(entrega.length)} no período (mínimo ${porModalidade}).`
        + (extraR > 0 ? ` Completada com ${plural(extraR, 'nota', 'notas')} de Retira.` : ''));
    }
    if (notas.length < meta) {
      avisos.push(`Não há dados mínimos: a população tem só ${plural(total, 'nota', 'notas')} de venda, todas foram usadas, e a amostra ficou com ${notas.length} de ${meta}.`);
    }
  }
  if (outras > 0) {
    avisos.push(`${plural(outras, 'nota de venda ficou', 'notas de venda ficaram')} fora do sorteio por não ter modalidade Retira/Entrega no Sispetro.`);
  }

  return { notas, avisos, populacao: { retira: retira.length, entrega: entrega.length, outras, total: populacao.length }, semente, meta };
}
