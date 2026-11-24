<#
  PT03 - população de notas de VENDA de uma filial num período (SÓ PARA O AMBIENTE DE TESTES).

  Só LÊ o Sispetro, com o mesmo ODBC (usuário somente leitura) do coletor do Robô Fiscal
  (C:\ColetorRoboFiscal\coletor.config.json, ou a variável SISPETRO_CONFIG). Quem chama é o
  `npm run dev` deste projeto (vite.config.ts, rota /sispetro-teste/pt03-populacao).
  Na integração com a Intranet, esta mesma consulta vira um coletor com fila, no padrão
  dos coletores da Intranet (coletor-sispetro/), porque a VPS não alcança o Sispetro.

  Venda = TipoPedido 'VD', saída (ES 'S'), NF-e modelo 55, não cancelada.
  Modalidade = NotaFiscal.RetiraEntrega: 'R' = Retira, 'E' = Entrega.
  Data = DataNF (emissão), de -De até -Ate, as duas inclusive.

  Uso: powershell -NoProfile -File sispetro-populacao-pt03.ps1 -Cnpj 01466091003133 -De 2026-05-01 -Ate 2026-10-31
  Saída: JSON (UTF-8) no stdout.
#>
param(
  [Parameter(Mandatory)][ValidatePattern('^\d{14}$')][string]$Cnpj,
  [Parameter(Mandatory)][ValidatePattern('^\d{4}-\d{2}-\d{2}$')][string]$De,
  [Parameter(Mandatory)][ValidatePattern('^\d{4}-\d{2}-\d{2}$')][string]$Ate,
  [string]$Config = $(if ($env:SISPETRO_CONFIG) { $env:SISPETRO_CONFIG } else { 'C:\ColetorRoboFiscal\coletor.config.json' })
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Inv = [System.Globalization.CultureInfo]::InvariantCulture

if (-not (Test-Path $Config)) { throw "Configuração do Sispetro não encontrada: $Config" }
$cfg = Get-Content $Config -Raw -Encoding UTF8 | ConvertFrom-Json

$dataDe = [datetime]::ParseExact($De, 'yyyy-MM-dd', $Inv)
$dataAte = [datetime]::ParseExact($Ate, 'yyyy-MM-dd', $Inv)
if ($dataAte -lt $dataDe) { throw 'A data final é anterior à data inicial.' }

function Texto($v) {
  if ($v -is [System.DBNull] -or $null -eq $v) { return '' }
  if ($v -is [datetime]) { return $v.ToString('yyyy-MM-dd', $Inv) }
  if ($v -is [decimal] -or $v -is [double] -or $v -is [single]) { return ([decimal]$v).ToString($Inv) }
  return ([string]::Format($Inv, '{0}', $v)).Trim()
}

function Consultar($con, [string]$sql, [object[]]$parametros) {
  $cmd = $con.CreateCommand()
  $cmd.CommandText = $sql
  $cmd.CommandTimeout = 120
  foreach ($p in $parametros) { [void]$cmd.Parameters.AddWithValue('?', $p) }
  $leitor = $cmd.ExecuteReader()
  $linhas = New-Object System.Collections.Generic.List[object]
  try {
    while ($leitor.Read()) {
      $l = [ordered]@{}
      for ($i = 0; $i -lt $leitor.FieldCount; $i++) { $l[$leitor.GetName($i)] = Texto $leitor.GetValue($i) }
      $linhas.Add([pscustomobject]$l)
    }
  } finally { $leitor.Close() }
  return ,$linhas
}

$CNPJ_SEM_MASCARA = "REPLACE(REPLACE(REPLACE(emp.CGC, '.', ''), '/', ''), '-', '')"

$con = New-Object System.Data.Odbc.OdbcConnection $cfg.odbc
$con.Open()
try {
  $filial = Consultar $con "SELECT emp.CODEMPRESA AS codEmpresa, emp.NomeUsual AS nome, emp.CGC AS cnpj FROM dba.empresas emp WHERE $CNPJ_SEM_MASCARA = ?" @($Cnpj)
  if ($filial.Count -eq 0) { throw "Filial com CNPJ $Cnpj não encontrada no Sispetro." }

  $notas = Consultar $con "SELECT n.Sequencial AS sequencial, n.NumeroNF AS numeroNf, n.Serie AS serie,
      DATEFORMAT(n.DataNF, 'yyyy-mm-dd') AS dataNf, TRIM(n.RetiraEntrega) AS modalidade,
      n.RzSocialEnt AS cliente, n.ValNF AS valor, n.ChaveAcesso AS chaveAcesso
    FROM dba.NotaFiscal n
    WHERE n.CodEmpresa = ? AND n.DataNF >= ? AND n.DataNF < ?
      AND n.cancelada = 0 AND n.TipoPedido = 'VD' AND n.ES = 'S' AND n.Modelo = 55
    ORDER BY n.DataNF, n.NumeroNF, n.Sequencial" @([int]$filial[0].codEmpresa, $dataDe, $dataAte.AddDays(1))

  $saida = [ordered]@{
    filial = $filial[0]
    de = $De
    ate = $Ate
    consultadoEm = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss', $Inv)
    # .ToArray(), não @(): no PowerShell 5.1, @() de uma List dentro do literal dá "Argument types do not match"
    notas = $notas.ToArray()
  }
  [Console]::Out.Write((ConvertTo-Json -InputObject $saida -Depth 4 -Compress))
} finally {
  $con.Close()
}
