import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Briefcase, ChevronRight, ClipboardCheck, Home, Moon, PanelLeft, Sun } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTema } from '@/contexts/TemaContext';
import { BASE_AUDITORIA_FILIAIS } from '@/components/AuditoriaFiliais/rotas';
import { USUARIO_TESTE } from './sessaoTeste';

/* ─────────────────────────────────────────────────────────────────────────────
   Moldura SÓ PARA TESTES isolados. Imita o visual da Intranet (menu lateral
   azul-marinho com filete amarelo, barra superior com breadcrumb), sem login,
   busca ou permissões. Na integração esta pasta (components/Layout) é
   descartada: o módulo passa a rodar dentro do LayoutPrincipal da Intranet.
   ───────────────────────────────────────────────────────────────────────────── */

function ItemMenu({ to, icone: Icone, rotulo, compacto, subitem }: {
  to: string; icone: typeof Home; rotulo: string; compacto: boolean; subitem?: boolean;
}) {
  return (
    <NavLink
      to={to}
      title={compacto ? rotulo : undefined}
      className={({ isActive }) => cn(
        'relative flex items-center gap-2.5 rounded-lg px-2 text-sidebar-foreground/85 outline-none transition-colors hover:bg-sidebar-accent/70 hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        subitem ? 'h-8 text-[12.5px]' : 'h-9 text-[13px]',
        compacto && 'justify-center',
        isActive && 'bg-sidebar-accent font-semibold text-white',
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && !compacto && <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-marca-amarelo" aria-hidden="true" />}
          <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className={compacto ? 'sr-only' : 'truncate'}>{rotulo}</span>
        </>
      )}
    </NavLink>
  );
}

export function LayoutTeste() {
  const [compacto, setCompacto] = useState(false);
  const { tema, toggleTema } = useTema();
  const { pathname } = useLocation();
  const noModulo = pathname.startsWith(BASE_AUDITORIA_FILIAIS);

  return (
    <div className="flex h-screen bg-slate-50 font-sans dark:bg-slate-900">
      {/* Menu lateral */}
      <aside className={cn('relative flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200', compacto ? 'w-16' : 'w-64')}>
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-[3px] bg-marca-amarelo/90 shadow-[0_0_14px_rgba(250,204,21,0.45)]" aria-hidden="true" />

        <div className="flex flex-col gap-3 px-3 pb-2 pt-4">
          <Link to={BASE_AUDITORIA_FILIAIS} className="flex h-14 items-center justify-center" aria-label="Ciapetro, ir para o início">
            {compacto
              ? <img src="/favicon.png" alt="" className="h-9 w-9 object-contain" />
              : <img src="/logo.png" alt="Ciapetro" className="h-14 w-auto max-w-[12rem] object-contain" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }} />}
          </Link>
          <div className="mx-2 h-px bg-gradient-to-r from-transparent via-marca-amarelo/60 to-transparent" aria-hidden="true" />
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-2 py-1">
          {/* Grupo Controladoria, como ficará na Intranet */}
          {!compacto && (
            <div className="rounded-xl bg-white/[0.035] ring-1 ring-inset ring-white/[0.05]">
              <div className="flex h-9 items-center gap-2.5 px-2 text-[13px] font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-marca-amarelo/15 text-marca-amarelo">
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">Controladoria</span>
                <ChevronRight className="h-3.5 w-3.5 rotate-90 text-sidebar-foreground/80" />
              </div>
              <div className="mb-1.5 ml-[1.15rem] mt-0.5 border-l border-sidebar-foreground/15 pl-2 pr-1">
                <ItemMenu to={BASE_AUDITORIA_FILIAIS} icone={ClipboardCheck} rotulo="Auditoria Filiais" compacto={false} subitem />
              </div>
            </div>
          )}
          {compacto && <ItemMenu to={BASE_AUDITORIA_FILIAIS} icone={ClipboardCheck} rotulo="Auditoria Filiais" compacto />}
        </nav>

        <div className="space-y-2 px-2 pb-3">
          <div className="mx-1 h-px bg-sidebar-border" />
          <button
            type="button"
            onClick={toggleTema}
            className={cn('flex w-full items-center gap-2.5 rounded-xl text-left transition-colors', compacto ? 'justify-center p-1 hover:bg-sidebar-accent' : 'border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-2 hover:bg-sidebar-accent')}
            title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-marca-amarelo/80 bg-sidebar-accent text-xs font-black text-white">
              {USUARIO_TESTE.nome.split(' ').map(p => p[0]).slice(0, 2).join('')}
            </span>
            {!compacto && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold leading-tight text-white">{USUARIO_TESTE.nome}</span>
                  <span className="text-[10px] font-bold text-sidebar-foreground/70">{USUARIO_TESTE.papel}</span>
                </span>
                {tema === 'dark' ? <Sun className="h-4 w-4 text-sidebar-foreground/70" /> : <Moon className="h-4 w-4 text-sidebar-foreground/70" />}
              </>
            )}
          </button>
          {!compacto && (
            <p className="text-center text-[10px] font-medium tracking-wide text-sidebar-foreground/60">
              Desenvolvido por <span className="font-bold text-marca-amarelo">Controladoria</span>
              <span className="ml-1 font-mono text-sidebar-foreground/50">· ambiente de testes</span>
            </p>
          )}
        </div>
      </aside>

      {/* Área de conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col bg-slate-50/80 dark:bg-slate-900">
        <header className="sticky top-0 z-20 flex h-11 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setCompacto(c => !c)}
            aria-label="Recolher ou expandir o menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <PanelLeft size={17} />
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          <nav aria-label="Você está em" className="min-w-0 flex-1">
            {noModulo && (
              <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
                <li className="hidden truncate text-slate-500 dark:text-slate-400 sm:block">Controladoria</li>
                <li className="hidden text-slate-300 dark:text-slate-600 sm:block" aria-hidden="true"><ChevronRight size={13} /></li>
                <li className="truncate font-semibold text-slate-800 dark:text-slate-100">
                  <Link to={BASE_AUDITORIA_FILIAIS}>Auditoria Filiais</Link>
                </li>
              </ol>
            )}
          </nav>
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
            Testes
          </span>
        </header>
        <main className="custom-scrollbar relative min-h-0 min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
