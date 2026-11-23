import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardPlus } from 'lucide-react';
import { CabecalhoPagina } from '@/components/ui/LayoutPagina';
import { usuarioTeste } from '@/components/Layout/sessaoTeste';
import { salvarAuditoria } from './armazenamento';
import { CLASSE_BOTAO_PRIMARIO, CLASSE_BOTAO_SECUNDARIO, Entrada, Grade, Secao, Selecao } from './componentes';
import { listarEmpresas, opcoesFiliais, type EmpresaCatalogo } from './empresas';
import { rotasAuditoria } from './rotas';
import type { AuditoriaFilial, TipoAuditoria } from './tipos';

const dataIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function NovaAuditoria() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaCatalogo[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [mesReferencia, setMesReferencia] = useState('');
  const [dataAuditoria, setDataAuditoria] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [auditor, setAuditor] = useState(() => usuarioTeste().nome);
  const [erroFiliais, setErroFiliais] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoAuditoria>('presencial');

  useEffect(() => {
    let ativo = true;
    listarEmpresas()
      .then(lista => { if (ativo) setEmpresas(lista); })
      .catch((e: unknown) => { if (ativo) setErroFiliais(e instanceof Error ? e.message : 'Erro ao carregar as filiais.'); });
    return () => { ativo = false; };
  }, []);

  const filiais = useMemo(() => opcoesFiliais(empresas), [empresas]);
  const filialEscolhida = filiais.find(f => f.id === empresaId);

  // Ao escolher a data da auditoria: período = 6 meses antes até a data, e o
  // mês de referência é o da data (mesma regra da versão anterior).
  const aoMudarData = (valor: string) => {
    setDataAuditoria(valor);
    if (!valor) return;
    const [ano, mes, dia] = valor.split('-').map(Number);
    setPeriodoInicio(dataIso(new Date(ano, mes - 1 - 6, dia - 10)));
    setPeriodoFim(dataIso(new Date(ano, mes - 1, dia - 10)));
    setMesReferencia(`${ano}-${String(mes).padStart(2, '0')}`);
  };

  const podeCriar = !!filialEscolhida && dataAuditoria !== '';

  const criar = () => {
    if (!filialEscolhida) return;
    const nova: AuditoriaFilial = {
      id: crypto.randomUUID(),
      filial: filialEscolhida.nome,
      empresaId: filialEscolhida.id,
      cnpj: filialEscolhida.cnpj,
      mesReferencia,
      dataAuditoria,
      periodoInicio,
      periodoFim,
      auditor,
      tipo,
      status: 'Em andamento',
      criadaEm: new Date().toISOString(),
    };
    salvarAuditoria(nova);
    navigate(rotasAuditoria.detalhe(nova.id));
  };

  return (
    <div className="space-y-6 p-6 font-sans">
      <CabecalhoPagina
        icone={<ClipboardPlus size={20} />}
        titulo="Nova auditoria"
        subtitulo="Informe os dados iniciais da auditoria."
        setor="controladoria"
      />

      <div className="max-w-3xl space-y-6">
        <Secao numero={1} titulo="Filial e data">
          <Grade colunas={2}>
            <Selecao
              rotulo="Filial"
              valor={empresaId}
              aoMudar={setEmpresaId}
              placeholder={erroFiliais ? 'Não foi possível carregar as filiais' : filiais.length ? 'Selecione a filial...' : 'Carregando filiais...'}
              opcoes={filiais.map(f => ({ valor: f.id, rotulo: f.rotulo }))}
            />
            <Selecao
              rotulo="Tipo de auditoria"
              valor={tipo}
              aoMudar={v => setTipo(v as TipoAuditoria)}
              placeholder=""
              opcoes={[{ valor: 'presencial', rotulo: 'Presencial' }, { valor: 'remota', rotulo: 'Remota' }]}
            />
            <Entrada rotulo="Data da auditoria" type="date" valor={dataAuditoria} aoMudar={aoMudarData} />
            <Entrada rotulo="Mês de referência" type="month" valor={mesReferencia} aoMudar={setMesReferencia} />
          </Grade>
          {erroFiliais && <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">{erroFiliais}</p>}
        </Secao>

        <Secao numero={2} titulo="Período auditado" descricao="Preenchido sozinho com os 6 meses anteriores à data da auditoria; ajuste se precisar.">
          <Grade colunas={2}>
            <Entrada rotulo="Data inicial" type="date" valor={periodoInicio} aoMudar={setPeriodoInicio} />
            <Entrada rotulo="Data final" type="date" valor={periodoFim} aoMudar={setPeriodoFim} />
          </Grade>
        </Secao>

        <Secao numero={3} titulo="Responsável">
          <Entrada rotulo="Auditor" valor={auditor} aoMudar={setAuditor} />
        </Secao>

        <div className="flex justify-end gap-2">
          <Link to={rotasAuditoria.lista()} className={CLASSE_BOTAO_SECUNDARIO}>Cancelar</Link>
          <button type="button" onClick={criar} disabled={!podeCriar} className={CLASSE_BOTAO_PRIMARIO} title={podeCriar ? undefined : 'Informe a filial e a data da auditoria'}>
            Criar auditoria
          </button>
        </div>
      </div>
    </div>
  );
}
