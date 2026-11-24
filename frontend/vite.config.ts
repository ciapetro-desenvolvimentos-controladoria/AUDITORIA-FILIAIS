import path from 'node:path'
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** SÓ NO `npm run dev` (ambiente de testes): GET /sispetro-teste/pt03-populacao?cnpj=&de=&ate=
 * roda scripts-dev/sispetro-populacao-pt03.ps1, que LÊ o Sispetro pelo ODBC somente leitura
 * dos coletores (só funciona no servidor interno que alcança o Sispetro). Na integração, esta
 * consulta vira um coletor com fila na Intranet; o build de produção não leva esta rota. */
function sispetroTeste(): Plugin {
  const script = path.resolve(__dirname, '../scripts-dev/sispetro-populacao-pt03.ps1')
  return {
    name: 'sispetro-teste',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/sispetro-teste/pt03-populacao', (req, res) => {
        const params = new URL(req.url ?? '', 'http://localhost').searchParams
        const cnpj = (params.get('cnpj') ?? '').replace(/\D/g, '')
        const de = params.get('de') ?? ''
        const ate = params.get('ate') ?? ''
        const responder = (status: number, corpo: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo))
        }
        if (!/^\d{14}$/.test(cnpj) || !/^\d{4}-\d{2}-\d{2}$/.test(de) || !/^\d{4}-\d{2}-\d{2}$/.test(ate)) {
          responder(400, { message: 'Informe o CNPJ da filial e as datas inicial e final.' })
          return
        }
        execFile(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Cnpj', cnpj, '-De', de, '-Ate', ate],
          { encoding: 'utf8', timeout: 180_000, maxBuffer: 64 * 1024 * 1024, windowsHide: true },
          (erro, stdout, stderr) => {
            if (erro) {
              // Primeira linha do erro do PowerShell (sem a pilha), para mostrar na tela.
              const motivo = (stderr || erro.message).split(/\r?\n/).find(l => l.trim()) ?? 'Erro ao consultar o Sispetro.'
              responder(502, { message: `Sispetro: ${motivo.replace(/^.*?\.ps1\s*:\s*/, '').trim()}` })
              return
            }
            responder(200, stdout)
          },
        )
      })
    },
  }
}

/** SÓ NO `npm run dev`: GET /intranet-teste/pt08-compras?cod=&de=&ate= roda
 * scripts-dev/pedagios-compras-pt08.sql com o psql no banco de TESTE da Intranet (a conexão vem do
 * DATABASE_URL de <INTRANET_DIR>/server/.env). Na integração, vira uma rota da API da Intranet.
 * PG_BIN = pasta do psql (sem ela, usa o psql do PATH). */
function intranetTeste(): Plugin {
  const sql = path.resolve(__dirname, '../scripts-dev/pedagios-compras-pt08.sql')
  const intranet = process.env.INTRANET_DIR || path.resolve(__dirname, '../../INTRANET-CONTROLADORIA')
  const psql = process.env.PG_BIN ? path.join(process.env.PG_BIN, 'psql') : 'psql'
  return {
    name: 'intranet-teste',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/intranet-teste/pt08-compras', (req, res) => {
        const params = new URL(req.url ?? '', 'http://localhost').searchParams
        const cod = params.get('cod') ?? ''
        const de = params.get('de') ?? ''
        const ate = params.get('ate') ?? ''
        const responder = (status: number, corpo: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo))
        }
        if (!/^\d{1,4}$/.test(cod) || !/^\d{4}-\d{2}-\d{2}$/.test(de) || !/^\d{4}-\d{2}-\d{2}$/.test(ate)) {
          responder(400, { message: 'Informe o código da empresa e as datas inicial e final.' })
          return
        }
        let url: string | undefined
        try {
          const env = readFileSync(path.join(intranet, 'server', '.env'), 'utf8')
          url = env.split(/\r?\n/).find(l => l.startsWith('DATABASE_URL='))?.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '')
        } catch { /* sem .env */ }
        if (!url) {
          responder(500, { message: `Banco de teste da Intranet não configurado (DATABASE_URL em ${path.join(intranet, 'server', '.env')}).` })
          return
        }
        execFile(
          psql,
          ['-X', '-At', '-v', 'ON_ERROR_STOP=1', '-v', `cod=${cod}`, '-v', `de=${de}`, '-v', `ate=${ate}`, '-f', sql, url],
          { encoding: 'utf8', timeout: 60_000, maxBuffer: 64 * 1024 * 1024, windowsHide: true, env: { ...process.env, PGCLIENTENCODING: 'UTF8' } },
          (erro, stdout, stderr) => {
            if (erro) {
              const motivo = (stderr || erro.message).split(/\r?\n/).find(l => l.trim()) ?? 'Erro ao consultar o banco de teste.'
              responder(502, { message: `Banco de teste: ${motivo.replace(/postgres(ql)?:\/\/[^\s]+/gi, '***')}` })
              return
            }
            responder(200, stdout.trim() || '[]')
          },
        )
      })
    },
  }
}

// Alias @/* -> src/* (padrão shadcn/ui), igual à Intranet Controladoria.
export default defineConfig({
  plugins: [react(), sispetroTeste(), intranetTeste()],
  // /api vai para o backend de teste da Intranet (mesmo proxy que a Intranet usa em dev).
  // Porta e backend configuráveis (servidor compartilhado: cada pessoa usa as suas portas),
  // ex.: PORTA_DEV=5174 e BACKEND_URL=http://localhost:3002. Sem as variáveis: 5173 -> 3001.
  server: {
    port: Number(process.env.PORTA_DEV) || 5173,
    strictPort: true,
    proxy: {
      '/api': process.env.BACKEND_URL || 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
