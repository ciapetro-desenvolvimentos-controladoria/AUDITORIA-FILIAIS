import { NavLink } from 'react-router-dom';
import { LayoutGrid, ListChecks } from 'lucide-react';
import { rotasAuditoria } from './rotas';

/** Abas do módulo dentro do cabeçalho (mesmo estilo das abas da Auditoria de
 * Pedágios na Intranet). Na Intranet o módulo é um item só no menu lateral,
 * então a navegação interna fica aqui. */
const ABAS = [
  { to: rotasAuditoria.painel(), rotulo: 'Painel', icone: LayoutGrid, fim: true },
  { to: rotasAuditoria.lista(), rotulo: 'Auditorias', icone: ListChecks, fim: false },
];

export function NavegacaoModulo() {
  return (
    <nav className="-mb-2 flex flex-wrap gap-1">
      {ABAS.map(({ to, rotulo, icone: Icone, fim }) => (
        <NavLink
          key={to}
          to={to}
          end={fim}
          className={({ isActive }) => `flex items-center gap-2 border-b-2 px-3.5 pb-2.5 pt-1.5 text-sm font-bold transition-colors ${
            isActive
              ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Icone size={15} /> {rotulo}
        </NavLink>
      ))}
    </nav>
  );
}
