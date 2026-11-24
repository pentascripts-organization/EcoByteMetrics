import pool from "../../db/connection.js";

export interface GlobalStatistics {
  total_consumption_kwh: number;
  total_co2e_kg: number | null;
  total_co2e_g: number | null;
  active_services: number;
  unavailable_services: number;
  total_services: number;
}
export type EnergyPeriod = "week" | "month" | "year";
export interface EnergyComparisonParams {
  ids: number[];
  start: string;
  end: string;
  period: EnergyPeriod;
}

export interface EnergyChartRecord {
  id_service: number;
  name_service: string;
  bucket_start: Date;
  bucket_end: Date;
  sample_count: number;
  energy_kwh: number | null;
  emissions_gco2e: number | null;
}

export class StatisticRepository {
  private readonly sampleImpactQuery = `
        WITH sample_energy AS (
            SELECT
                m.id_service AS service_id,
                m.date_houry AS collected_at,
                m.colletion_interval_metric AS collection_interval_seconds,

                m.carbon_intensity AS carbon_intensity_gco2e_per_kwh,

                (
                    (m.cpu_metric / 100.0 * 120) +
                    (m.ram_metric * 0.375) +
                    (m.hd_metric * 0.01) +
                    (m.network_metric * 0.02)
                ) * m.colletion_interval_metric / 3600000.0
                    AS consumption_kwh

            FROM Metrics AS m

            INNER JOIN Services AS s
                ON s.id_service = m.id_service

            WHERE s.active_service = TRUE
        ),

        sample_impact AS (
            SELECT
                service_id,
                collected_at,
                consumption_kwh,
                consumption_kwh *
                    carbon_intensity_gco2e_per_kwh / 1000.0
                    AS emissions_co2e_kg
            FROM sample_energy
        )
    `;

  async getStatisticsSummaryQuery() {
    const result = await pool.query(`
            ${this.sampleImpactQuery}

            SELECT
                (
                    SELECT COUNT(*)::int
                    FROM Services
                    WHERE active_service = TRUE
                ) AS "totalServicos",

                COALESCE(
                    SUM(consumption_kwh), 0
                )::float8 AS "consumoTotalKwh",

                CASE
                    WHEN COUNT(emissions_co2e_kg) < COUNT(*)
                    THEN NULL
                    ELSE SUM(emissions_co2e_kg)
                END::float8 AS "emissaoTotalCo2eKg",

                CASE
                    WHEN COUNT(emissions_co2e_kg) < COUNT(*)
                    THEN NULL
                    ELSE SUM(emissions_co2e_kg) * 1000
                END::float8 AS "emissaoTotalCo2eG",

                COUNT(*)::int AS "sampleCount",

                COUNT(emissions_co2e_kg)::int
                    AS "coveredEmissionSamples",

                (
                    SELECT MAX(date_houry)
                    FROM Metrics
                ) AS "dataHoraUltimaAtualizacao"

            FROM sample_impact;
        `);

    return result.rows[0];
  }

  async getServicesRankingQuery(
    start: string,
    end: string,
    orderBy: "kwh" | "co2e",
  ) {
    const sortColumn = orderBy === "kwh" ? '"consumoKwh"' : '"emissaoCo2eKg"';

    const result = await pool.query(
      `
        ${this.sampleImpactQuery}

        SELECT
            s.id_service AS id,
            s.name_service AS nome,

            COALESCE(
                SUM(i.consumption_kwh), 0
            )::float8 AS "consumoKwh",

            CASE
                WHEN COUNT(i.collected_at) = 0
                    OR COUNT(i.emissions_co2e_kg) < COUNT(i.collected_at)
                THEN NULL
                ELSE SUM(i.emissions_co2e_kg)
            END::float8 AS "emissaoCo2eKg",

            COUNT(i.collected_at)::int AS "sampleCount",

            COUNT(i.emissions_co2e_kg)::int
                AS "coveredEmissionSamples"

        FROM Services AS s

        LEFT JOIN sample_impact AS i
            ON i.service_id = s.id_service
            AND i.collected_at >= $1::timestamptz
            AND i.collected_at < $2::timestamptz

        WHERE s.active_service = TRUE

        GROUP BY
            s.id_service,
            s.name_service

        ORDER BY
            ${sortColumn} DESC NULLS LAST,
            nome ASC;
        `,
      [start, end],
    );

    return result.rows;
  }

  async getCalculationEmissionQuery(
    start: string,
    end: string,
  ): Promise<GlobalStatistics> {
    const query = `
            WITH service_status AS (
                SELECT
                    COUNT(*) FILTER (
                        WHERE active_service = TRUE
                    ) AS active_services,

                    COUNT(*) FILTER (
                        WHERE active_service = FALSE
                    ) AS unavailable_services,

                    COUNT(*) AS total_services

                FROM services
            ),

            individual_consumption AS (
                SELECT
                    m.id_service,
                    m.date_houry,

                    (
                        (
                            (m.cpu_metric / 100.0 * 120) +
                            (m.ram_metric * 0.375) +
                            (m.hd_metric * 0.01) +
                            (m.network_metric * 0.02)
                        ) * m.colletion_interval_metric / 3600000.0
                    ) AS consumption_kwh,

                    m.carbon_intensity AS carbon_intensity

                FROM metrics m

                INNER JOIN services s
                    ON s.id_service = m.id_service

                WHERE s.active_service = TRUE
                    AND m.date_houry >= $1::timestamptz
                    AND m.date_houry < $2::timestamptz
                )

                SELECT
                    COALESCE(
                        SUM(ic.consumption_kwh),
                        0
                    )::float8 AS total_consumption_kwh,

                    CASE
                        WHEN COUNT(ic.date_houry) = 0
                            OR COUNT(ic.carbon_intensity) < COUNT(ic.date_houry)
                        THEN NULL
                        ELSE SUM(
                            ic.consumption_kwh * ic.carbon_intensity / 1000.0
                        )
                    END AS total_co2e_kg,

                    CASE
                        WHEN COUNT(ic.date_houry) = 0
                            OR COUNT(ic.carbon_intensity) < COUNT(ic.date_houry)
                        THEN NULL
                        ELSE SUM(
                            ic.consumption_kwh * ic.carbon_intensity
                        )
                    END AS total_co2e_g,

                    ss.active_services,
                    ss.unavailable_services,
                    ss.total_services

                FROM service_status ss

                LEFT JOIN individual_consumption ic
                    ON TRUE

                GROUP BY
                    ss.active_services,
                    ss.unavailable_services,
                    ss.total_services;
            `;

    const result = await pool.query(query, [start, end]);

    const row = result.rows[0];

    return {
      total_consumption_kwh: Number(row.total_consumption_kwh),

      total_co2e_kg:
        row.total_co2e_kg == null ? null : Number(row.total_co2e_kg),

      total_co2e_g: row.total_co2e_g == null ? null : Number(row.total_co2e_g),

      active_services: Number(row.active_services),
      unavailable_services: Number(row.unavailable_services),
      total_services: Number(row.total_services),
    };
  }

  async getEnergyCalculationUnitService(nome_service: string) {
    const query = `
    SELECT DISTINCT ON (s.id_service)
      s.id_service,
      s.name_service,
      s.active_service,
      m.id_metric,
      m.date_houry,

      -- Potência da CPU (W)
      (m.cpu_metric / 100.0) * 120 AS cpu_power_w,

      -- Potência da memória (W)
      m.ram_metric * 0.375 AS ram_power_w,

      -- Potência do disco (W)
      m.hd_metric * 0.01 AS disk_power_w,

      -- Potência da rede (W)
      m.network_metric * 0.02 AS network_power_w,

      -- Potência total (W)
      (
        (m.cpu_metric / 100.0) * 120 +
        (m.ram_metric * 0.375) +
        (m.hd_metric * 0.01) +
        (m.network_metric * 0.02)
      ) AS total_power_w,

      -- Consumo energético (kWh)
      (
        (
          (m.cpu_metric / 100.0) * 120 +
          (m.ram_metric * 0.375) +
          (m.hd_metric * 0.01) +
          (m.network_metric * 0.02)
        ) * m.colletion_interval_metric
      ) / 3600000.0 AS consumption_kwh,

      -- Intensidade de carbono registrada na própria amostra
      m.carbon_intensity AS intesity_co2e_kwh_carbon,

      -- Emissão de CO2e (kg)
      (
        (
          (
            (m.cpu_metric / 100.0) * 120 +
            (m.ram_metric * 0.375) +
            (m.hd_metric * 0.01) +
            (m.network_metric * 0.02)
          ) * m.colletion_interval_metric
        ) / 3600000.0
        * m.carbon_intensity
      ) / 1000.0 AS co2e_kg

    FROM Services s

    INNER JOIN Metrics m
      ON s.id_service = m.id_service

    WHERE s.name_service = $1

    ORDER BY
      s.id_service,
      m.date_houry DESC,
      m.id_metric DESC;
  `;

    const result = await pool.query(query, [nome_service]);

    return result.rows[0];
  }

  async getEnergyCalculation() {
    const result = await pool.query(`
    SELECT DISTINCT ON (s.id_service)
      s.id_service,
      s.name_service,
      s.active_service,
      m.id_metric,
      m.date_houry,

      -- Potência da CPU (W)
      (m.cpu_metric / 100.0) * 120 AS cpu_power_w,

      -- Potência da memória (W)
      m.ram_metric * 0.375 AS ram_power_w,

      -- Potência do disco (W)
      m.hd_metric * 0.01 AS disk_power_w,

      -- Potência da rede (W)
      m.network_metric * 0.02 AS network_power_w,

      -- Potência total (W)
      (
        (m.cpu_metric / 100.0) * 120 +
        (m.ram_metric * 0.375) +
        (m.hd_metric * 0.01) +
        (m.network_metric * 0.02)
      ) AS total_power_w,

      -- Consumo energético (kWh)
      (
        (
          (m.cpu_metric / 100.0) * 120 +
          (m.ram_metric * 0.375) +
          (m.hd_metric * 0.01) +
          (m.network_metric * 0.02)
        ) * m.colletion_interval_metric
      ) / 3600000.0 AS consumption_kwh,

      -- Intensidade de carbono registrada na própria amostra
      m.carbon_intensity AS intesity_co2e_kwh_carbon,

      -- Emissão de CO2e (kg)
      (
        (
          (
            (m.cpu_metric / 100.0) * 120 +
            (m.ram_metric * 0.375) +
            (m.hd_metric * 0.01) +
            (m.network_metric * 0.02)
          ) * m.colletion_interval_metric
        ) / 3600000.0
        * m.carbon_intensity
      ) / 1000.0 AS co2e_kg

    FROM Services s

    INNER JOIN Metrics m
      ON s.id_service = m.id_service

    ORDER BY
      s.id_service,
      m.date_houry DESC,
      m.id_metric DESC;
  `);

    return result.rows;
  }

  async getMetricCompare(
    param: EnergyComparisonParams,
  ): Promise<EnergyChartRecord[]> {
    const sql = `
    WITH selected_services AS (
      SELECT
        id_service,
        name_service
      FROM services
      WHERE id_service = ANY($1::int[])
    ),

    -- 1. Busca as métricas do período e a última amostra anterior.
    samples AS (
      SELECT
        m.id_service,
        m.date_houry,
        m.colletion_interval_metric,
        m.cpu_metric,
        m.ram_metric,
        m.hd_metric,
        m.network_metric,
        m.carbon_intensity
      FROM metrics m
      INNER JOIN selected_services s
        ON s.id_service = m.id_service
      WHERE m.date_houry >= $2::timestamptz
        AND m.date_houry < $3::timestamptz

      UNION ALL

      SELECT
        previous.id_service,
        previous.date_houry,
        previous.colletion_interval_metric,
        previous.cpu_metric,
        previous.ram_metric,
        previous.hd_metric,
        previous.network_metric,
        previous.carbon_intensity
      FROM selected_services s
      CROSS JOIN LATERAL (
        SELECT
          m.id_service,
          m.date_houry,
          m.colletion_interval_metric,
          m.cpu_metric,
          m.ram_metric,
          m.hd_metric,
          m.network_metric,
          m.carbon_intensity
        FROM metrics m
        WHERE m.id_service = s.id_service
          AND m.date_houry < $2::timestamptz
        ORDER BY m.date_houry DESC
        LIMIT 1
      ) previous
    ),

    -- 2. Identifica a próxima amostra de cada serviço.
    samples_with_next AS (
      SELECT
        *,
        LEAD(date_houry) OVER (
          PARTITION BY id_service
          ORDER BY date_houry
        ) AS next_date
      FROM samples
    ),

    -- 3. Define o intervalo efetivo de cada amostra.
    intervals AS (
      SELECT
        *,
        GREATEST(
          date_houry,
          $2::timestamptz
        ) AS effective_start,

        LEAST(
            COALESCE(
                next_date,
                date_houry +
                    (colletion_interval_metric * INTERVAL '1 second')
            ),
            date_houry +
                (colletion_interval_metric * INTERVAL '1 second'),
            $3::timestamptz
        ) AS effective_end
      FROM samples_with_next
    ),

    -- 4. Calcula a duração efetiva.
    intervals_with_duration AS (
      SELECT
        *,
        GREATEST(
          0,
          EXTRACT(
            EPOCH FROM (
              effective_end - effective_start
            )
          )
        ) AS duration_seconds
      FROM intervals
    ),

    -- 5. Calcula a potência total estimada em Watts.
    power_calculation AS (
      SELECT
        *,
        (
          (cpu_metric / 100.0 * 120) +
          (ram_metric * 0.375) +
          (hd_metric * 0.01) +
          (network_metric * 0.02)
        ) AS total_power_watts
      FROM intervals_with_duration
    ),

    -- 6. Calcula a energia em kWh.
    energy_calculation AS (
      SELECT
        *,
        (
          total_power_watts
          * duration_seconds
          / 3600000.0
        ) AS energy_kwh
      FROM power_calculation
    ),

    -- 7. Calcula as emissões em gramas de CO2 equivalente.
    emission_calculation AS (
      SELECT
        *,
        (
          energy_kwh * carbon_intensity
        ) AS emissions_gco2e
      FROM energy_calculation
    ),

    -- 8. Define o agrupamento de acordo com o período.
    bucketed AS (
      SELECT
        id_service,
        date_houry,
        energy_kwh,
        emissions_gco2e,

        CASE
          -- WEEK: agrupamento por dia.
          WHEN $4 = 'week' THEN
            DATE_TRUNC(
              'day',
              effective_start AT TIME ZONE 'UTC'
            ) AT TIME ZONE 'UTC'

          -- MONTH: blocos consecutivos de 7 dias.
          WHEN $4 = 'month' THEN
            $2::timestamptz
            +
            FLOOR(
              EXTRACT(
                EPOCH FROM (
                  effective_start - $2::timestamptz
                )
              ) / 604800
            )::integer * INTERVAL '7 days'

          -- YEAR: agrupamento por mês calendário.
          WHEN $4 = 'year' THEN
            DATE_TRUNC(
              'month',
              effective_start AT TIME ZONE 'UTC'
            ) AT TIME ZONE 'UTC'
        END AS bucket_key

      FROM emission_calculation
      WHERE duration_seconds > 0
    ),

    -- 9. Agrega energia, emissões e amostras.
    aggregated AS (
      SELECT
        id_service,
        bucket_key,

        COUNT(DISTINCT date_houry)::integer AS sample_count,

        SUM(energy_kwh) AS energy_kwh,

        CASE
          WHEN COUNT(emissions_gco2e) < COUNT(*)
          THEN NULL
          ELSE SUM(emissions_gco2e)
        END AS emissions_gco2e

      FROM bucketed
      GROUP BY
        id_service,
        bucket_key
    ),

    -- 10. Define os limites dos agrupamentos.
    bucket_bounds AS (
      SELECT
        CASE
          WHEN $4 = 'week' THEN
            DATE_TRUNC(
              'day',
              $2::timestamptz AT TIME ZONE 'UTC'
            ) AT TIME ZONE 'UTC'

          WHEN $4 = 'month' THEN
            $2::timestamptz

          WHEN $4 = 'year' THEN
            DATE_TRUNC(
              'month',
              $2::timestamptz AT TIME ZONE 'UTC'
            ) AT TIME ZONE 'UTC'
        END AS first_bucket,

        CASE
          WHEN $4 = 'week' THEN
            DATE_TRUNC(
              'day',
              (
                $3::timestamptz - INTERVAL '1 microsecond'
              ) AT TIME ZONE 'UTC'
            ) AT TIME ZONE 'UTC'

          WHEN $4 = 'month' THEN
            $2::timestamptz
            +
            FLOOR(
              EXTRACT(
                EPOCH FROM (
                  $3::timestamptz
                  - INTERVAL '1 microsecond'
                  - $2::timestamptz
                )
              ) / 604800
            )::integer * INTERVAL '7 days'

          WHEN $4 = 'year' THEN
            DATE_TRUNC(
              'month',
              (
                $3::timestamptz - INTERVAL '1 microsecond'
              ) AT TIME ZONE 'UTC'
            ) AT TIME ZONE 'UTC'
        END AS last_bucket,

        CASE
          WHEN $4 = 'week' THEN INTERVAL '1 day'
          WHEN $4 = 'month' THEN INTERVAL '7 days'
          WHEN $4 = 'year' THEN INTERVAL '1 month'
        END AS bucket_interval
    ),

    -- 11. Gera todos os agrupamentos.
    bucket_series AS (
      SELECT
        gs.bucket_key,

        GREATEST(
          gs.bucket_key,
          $2::timestamptz
        ) AS bucket_start,

        LEAST(
          gs.bucket_key + bb.bucket_interval,
          $3::timestamptz
        ) AS bucket_end

      FROM bucket_bounds bb

      CROSS JOIN LATERAL GENERATE_SERIES(
        bb.first_bucket,
        bb.last_bucket,
        bb.bucket_interval
      ) AS gs(bucket_key)
    ),

    -- 12. Garante que todos os serviços tenham os mesmos agrupamentos.
    final_data AS (
      SELECT
        s.id_service,
        s.name_service,
        b.bucket_key,
        b.bucket_start,
        b.bucket_end,

        COALESCE(
          a.sample_count,
          0
        )::integer AS sample_count,

        a.energy_kwh,
        a.emissions_gco2e

      FROM selected_services s

      CROSS JOIN bucket_series b

      LEFT JOIN aggregated a
        ON a.id_service = s.id_service
        AND a.bucket_key = b.bucket_key
    )

    -- 13. Resultado final.
    SELECT
      id_service,
      name_service,
      bucket_start,
      bucket_end,
      sample_count,
      energy_kwh,
      emissions_gco2e

    FROM final_data

    ORDER BY
      bucket_start,
      id_service;
  `;

    const { rows } = await pool.query(sql, [
      param.ids,
      param.start,
      param.end,
      param.period,
    ]);

    return rows.map((row) => ({
      id_service: Number(row.id_service),
      name_service: row.name_service,
      bucket_start: row.bucket_start,
      bucket_end: row.bucket_end,
      sample_count: Number(row.sample_count),
      energy_kwh: row.energy_kwh == null ? null : Number(row.energy_kwh),
      emissions_gco2e:
        row.emissions_gco2e == null ? null : Number(row.emissions_gco2e),
    }));
  }
}
