# AUDITORIA-FILIAIS

Módulo **Auditoria Filiais** da Intranet Controladoria, desenvolvido em separado para testes.
Segue o mesmo padrão da Intranet (React + Tailwind + componentes shadcn/ui + ícones lucide,
mesmas cores, fontes e peças de layout), para a integração ser só copiar a pasta do módulo.

## Rodar

```
npm run instalar   # primeira vez
npm run dev        # abre em http://localhost:5173
```

## Estrutura (`frontend/src`)

| Pasta | O que é | Na integração |
|---|---|---|
| `components/AuditoriaFiliais/` | O módulo: telas, papéis de trabalho (PT01–PT12), peças visuais e `armazenamento.ts` | **Vai para a Intranet** |
| `components/ui/`, `lib/utils.ts`, `contexts/TemaContext.tsx`, `index.css`, `tailwind.config.js` | Cópias da Intranet (não editar aqui; manter iguais às de lá) | Descartados (a Intranet já tem) |
| `components/Layout/` | Moldura **só de testes** (menu lateral, barra superior, usuário fixo) | Descartada |

## Integração com a Intranet (quando estiver fluindo)

1. Copiar `components/AuditoriaFiliais/` para `src/components/AuditoriaFiliais/` da Intranet.
2. Em `src/App.tsx` da Intranet: `<Route path="/controladoria/auditoria-filiais/*" element={<AuditoriaFiliaisModulo />} />`, com o guard de permissão.
3. Em `src/modules/registry.ts`: entrada `{ id: 'auditoria-filiais', label: 'Auditoria Filiais', path: '/controladoria/auditoria-filiais', grupo: 'controladoria', ... }`.
4. Trocar `USUARIO_TESTE` pelo usuário da sessão (`useSessaoAtual`).
5. Trocar `armazenamento.ts` (hoje localStorage) por chamadas à API do backend da Intranet.
