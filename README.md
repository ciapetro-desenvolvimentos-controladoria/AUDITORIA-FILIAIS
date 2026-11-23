# AUDITORIA-FILIAIS

Módulo **Auditoria Filiais** da Intranet Controladoria, desenvolvido em separado para testes.
Segue o mesmo padrão da Intranet (React + Tailwind + componentes shadcn/ui + ícones lucide,
mesmas cores, fontes e peças de layout), para a integração ser só copiar a pasta do módulo.

## Rodar

```
npm run instalar   # primeira vez
npm run dev        # abre em http://localhost:5173
```

## Backend de teste

O módulo lê dados reais (ex.: lista de filiais) do **backend da Intranet rodando localmente**
(`localhost:3001`). O Vite deste projeto faz proxy de `/api` para lá, e o login de teste usa o
mesmo usuário e senha da Intranet. Para montar o ambiente:

1. PostgreSQL 16 local com o banco `sistema_gestao_fiscal` restaurado de um backup da produção
   (`npm run banco:copiar-producao -- --arquivo=<pasta do backup>` no repositório da Intranet).
2. `server/.env` da Intranet apontando para esse banco (modelo: `server/.env.example`).
3. `npm run server:dev` no repositório da Intranet.

## Estrutura (`frontend/src`)

| Pasta | O que é | Na integração |
|---|---|---|
| `components/AuditoriaFiliais/` | O módulo: telas, papéis de trabalho (PT01–PT12), peças visuais e `armazenamento.ts` | **Vai para a Intranet** |
| `components/ui/`, `lib/utils.ts`, `contexts/TemaContext.tsx`, `index.css`, `tailwind.config.js` | Cópias da Intranet (não editar aqui; manter iguais às de lá) | Descartados (a Intranet já tem) |
| `components/Layout/` | Moldura **só de testes** (menu lateral, barra superior, login de teste, acesso à API de teste) | Descartada |

## Integração com a Intranet (quando estiver fluindo)

1. Copiar `components/AuditoriaFiliais/` para `src/components/AuditoriaFiliais/` da Intranet.
2. Em `src/App.tsx` da Intranet: `<Route path="/controladoria/auditoria-filiais/*" element={<AuditoriaFiliaisModulo />} />`, com o guard de permissão.
3. Em `src/modules/registry.ts`: entrada `{ id: 'auditoria-filiais', label: 'Auditoria Filiais', path: '/controladoria/auditoria-filiais', grupo: 'controladoria', ... }`.
4. Trocar `usuarioTeste()` (de `Layout/sessaoTeste.ts`) pelo usuário da sessão (`useSessaoAtual`).
5. Trocar `armazenamento.ts` (hoje localStorage) por chamadas à API do backend da Intranet.
6. Em `AuditoriaFiliais/empresas.ts`, trocar o corpo de `listarEmpresas()` por `empresasService.listar()`
   (lista de filiais da tabela `empresas`). `Layout/empresasTeste.ts` é só de teste e é descartado.
