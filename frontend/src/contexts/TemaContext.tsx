import React, { createContext, useCallback, useContext, useLayoutEffect, useState, useSyncExternalStore } from 'react';

type Tema = 'light' | 'dark';
/** 'system' = segue o tema do Windows/navegador (prefers-color-scheme). */
export type ModoTema = Tema | 'system';

interface TemaContextValue {
  /** Tema efetivamente aplicado agora. */
  tema: Tema;
  /** O que o usuário escolheu (pode ser 'system'). */
  modo: ModoTema;
  toggleTema: () => void;
  /** persistir=false: só nesta tela, sem gravar no navegador. */
  setModo: (modo: ModoTema, persistir?: boolean) => void;
}

const TemaContext = createContext<TemaContextValue>({
  tema: 'light', modo: 'light', toggleTema: () => {}, setModo: () => {},
});

const CHAVE = 'tema_sistema';
const QUERY_ESCURO = '(prefers-color-scheme: dark)';

function assinarSistema(aoMudar: () => void) {
  const mql = window.matchMedia(QUERY_ESCURO);
  mql.addEventListener('change', aoMudar);
  return () => mql.removeEventListener('change', aoMudar);
}

function lerModoSalvo(): ModoTema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === 'dark' || salvo === 'light' || salvo === 'system') return salvo;
  } catch { /* storage indisponível */ }
  // Escuro é o padrão de quem nunca escolheu (pedido do Pedro, 2026-09-24);
  // quem já escolheu Claro continua no Claro.
  return 'dark';
}

export const TemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modo, setModoEstado] = useState<ModoTema>(lerModoSalvo);
  const sistemaEscuro = useSyncExternalStore(
    assinarSistema,
    () => window.matchMedia(QUERY_ESCURO).matches,
    () => true,
  );
  const tema: Tema = modo === 'system' ? (sistemaEscuro ? 'dark' : 'light') : modo;

  // Garante sincronia DOM↔estado (inclusive quando o Windows troca de tema
  // com o modo 'system' ativo).
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
  }, [tema]);

  const setModo = useCallback((novo: ModoTema, persistir = true) => {
    if (persistir) try { localStorage.setItem(CHAVE, novo); } catch { /* segue */ }
    setModoEstado(novo);
  }, []);

  const toggleTema = useCallback(() => {
    const next: Tema = tema === 'light' ? 'dark' : 'light';
    // Aplica imediatamente (síncrono) antes do próximo render.
    document.documentElement.classList.toggle('dark', next === 'dark');
    setModo(next);
  }, [tema, setModo]);

  return (
    <TemaContext.Provider value={{ tema, modo, toggleTema, setModo }}>
      {children}
    </TemaContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTema = () => useContext(TemaContext);
