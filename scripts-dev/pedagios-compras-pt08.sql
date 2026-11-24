-- PT08 - vales-pedágio COMPRADOS (não cancelados) de uma filial num período, com o resultado
-- da compra na Target e a situação que o módulo de Pedágios da Intranet já calculou.
--
-- Banco: o da INTRANET (schema pedagios, alimentado pelo ColetorPedagios.ps1). Nos testes, o
-- `npm run dev` roda isto com o psql no banco de teste (vite.config.ts, rota
-- /intranet-teste/pt08-compras). Na integração, vira uma rota da API da Intranet.
--
-- Variáveis (psql -v): cod = código da empresa no Sispetro; de / ate = AAAA-MM-DD (inclusive),
-- pela data de inclusão do vale (data da compra).
--
-- Compra com sucesso = a Target aceitou a compra (comando 1) ou, na compra dentro do CIOT, a
-- confirmação (comando 9), como na "prova real" do módulo (server/src/lib/pedagios/prova.ts).
-- status_confirmacao: 1 aguardando, 2 confirmado, 3 erro na confirmação.
SELECT COALESCE(json_agg(x ORDER BY x."dataInclusao", x."numeroVale"), '[]'::json)
FROM (
  SELECT
    v.id::text                                  AS id,
    v.numero_vale::text                         AS "numeroVale",
    v.seq_carga::text                           AS carga,
    to_char(v.data_inclusao, 'YYYY-MM-DD')      AS "dataInclusao",
    to_char(v.data_embarque, 'YYYY-MM-DD')      AS "dataEmbarque",
    v.cidade_origem                             AS origem,
    v.cidade_destino                            AS destino,
    v.numero_rota::text                         AS "numeroRota",
    v.placa                                     AS placa,
    v.valor_total::text                         AS valor,
    v.empresa_nome                              AS filial,
    COALESCE(t.compra_ok, false)                AS "compraOk",
    COALESCE(t.confirm_ok, false)               AS "confirmOk",
    v.status_confirmacao                        AS "statusConfirmacao",
    t.mensagem_erro                             AS "mensagemErro",
    a.situacao                                  AS situacao,
    a.diagnostico                               AS diagnostico
  FROM pedagios.vales v
  LEFT JOIN pedagios.vale_target t ON t.vale_id = v.id
  LEFT JOIN pedagios.auditoria_vales a ON a.vale_id = v.id
  WHERE v.cod_empresa = :cod
    AND NOT v.cancelado
    AND v.data_inclusao >= :'de'::date
    AND v.data_inclusao < (:'ate'::date + 1)
) x;
