import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { BASE_AUDITORIA_FILIAIS } from '@/components/AuditoriaFiliais/rotas';
import { CLASSE_BOTAO_PRIMARIO, Entrada } from '@/components/AuditoriaFiliais/componentes';
import { entrar, lerSessao } from './sessaoTeste';

/** Login SÓ do ambiente de testes: usa o mesmo login/senha da Intranet, contra o
 * backend de teste (localhost:3001). Na integração é descartado. */
export function LoginTeste() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (lerSessao()) return <Navigate to={BASE_AUDITORIA_FILIAIS} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(login, senha);
      navigate(BASE_AUDITORIA_FILIAIS, { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans dark:bg-slate-900">
      <form onSubmit={enviar} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="space-y-1">
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">Auditoria Filiais</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ambiente de testes. Entre com o seu login da Intranet.
          </p>
        </div>
        <Entrada rotulo="Login" valor={login} aoMudar={setLogin} autoComplete="username" autoFocus />
        <Entrada rotulo="Senha" type="password" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
        {erro && <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">{erro}</p>}
        <button type="submit" disabled={enviando || !login || !senha} className={`${CLASSE_BOTAO_PRIMARIO} w-full`}>
          <LogIn size={15} /> {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
