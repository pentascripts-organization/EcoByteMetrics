import pool from "../../db/connection.js";
import type {
    AggregatorService,
    ServiceMetrics
} from "../../integrations/metrics-api.js";

export async function persistAggregatorServices(
    services: AggregatorService[]
): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("UPDATE aggregator_services SET is_active = FALSE");
        for (const service of services) {
            await client.query(
                `INSERT INTO aggregator_services (
          service_id, name, region_code, country, region, city,
          latitude, longitude, is_active, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
        ON CONFLICT (service_id) DO UPDATE SET
          name = EXCLUDED.name,
          region_code = EXCLUDED.region_code,
          country = EXCLUDED.country,
          region = EXCLUDED.region,
          city = EXCLUDED.city,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          is_active = TRUE,
          updated_at = NOW()`,
                [
                    service.id,
                    service.name,
                    service.location.region_code,
                    service.location.country,
                    service.location.region,
                    service.location.city,
                    service.location.latitude,
                    service.location.longitude
                ]
            );
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function persistMetricSample(
    serviceId: string,
    metrics: ServiceMetrics,
    carbonIntensity: number | null,
    collectedAt: Date
): Promise<void> {
    await pool.query(
        `INSERT INTO aggregator_metric_samples (
      service_id, collected_at, collection_interval_seconds,
      cpu_percent, memory_gb, disk_gb, network_gb,
      carbon_intensity_gco2e_per_kwh
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (service_id, collected_at) DO UPDATE SET
      collection_interval_seconds = EXCLUDED.collection_interval_seconds,
      cpu_percent = EXCLUDED.cpu_percent,
      memory_gb = EXCLUDED.memory_gb,
      disk_gb = EXCLUDED.disk_gb,
      network_gb = EXCLUDED.network_gb,
      carbon_intensity_gco2e_per_kwh = EXCLUDED.carbon_intensity_gco2e_per_kwh`,
        [
            serviceId,
            collectedAt,
            metrics.collection_interval_seconds,
            metrics.metrics.cpu_percent,
            metrics.metrics.memory_gb,
            metrics.metrics.disk_gb,
            metrics.metrics.network_gb,
            carbonIntensity
        ]
    );
}

const SAMPLE_IMPACT_QUERY = `
    WITH sample_energy AS (
        SELECT
            sample.service_id,
            sample.collection_interval_seconds,
            sample.collected_at,
            sample.carbon_intensity_gco2e_per_kwh,
            (
                (sample.cpu_percent / 100.0 * 100) +
                (sample.memory_gb * 0.375) +
                (sample.disk_gb * 0.01) +
                (sample.network_gb * 0.02)
            ) * sample.collection_interval_seconds / 3600000.0 AS consumption_kwh
        FROM aggregator_metric_samples sample
        JOIN aggregator_services service ON service.service_id = sample.service_id
        WHERE service.is_active = TRUE
    ),
    sample_impact AS (
        SELECT
            service_id,
            collected_at,
            consumption_kwh,
            consumption_kwh * carbon_intensity_gco2e_per_kwh AS emissions_co2e
        FROM sample_energy
    )
`;

export async function getStatisticsSummaryQuery() {
    const result = await pool.query(
        `${SAMPLE_IMPACT_QUERY}
      SELECT
        (SELECT COUNT(*)::int FROM aggregator_services WHERE is_active = TRUE) AS "totalServicos",
        COALESCE(SUM(consumption_kwh), 0)::float8 AS "consumoTotalKwh",
        COALESCE(SUM(emissions_co2e), 0)::float8 AS "emissaoTotalCo2e",
        MAX(collected_at) AS "dataHoraUltimaAtualizacao"
      FROM sample_impact`
    );
    return result.rows[0];
}

export async function getServicesRankingQuery(
    period: string,
    orderBy: "kwh" | "co2e"
) {
    const sortColumn = orderBy === "kwh" ? '"consumoKwh"' : '"emissaoCo2e"';
    const result = await pool.query(
        `${SAMPLE_IMPACT_QUERY}
      SELECT
        service.service_id AS id,
        service.name AS nome,
        COALESCE(SUM(impact.consumption_kwh), 0)::float8 AS "consumoKwh",
        COALESCE(SUM(impact.emissions_co2e), 0)::float8 AS "emissaoCo2e"
      FROM aggregator_services service
      LEFT JOIN sample_impact impact
        ON impact.service_id = service.service_id
        AND impact.collected_at >= NOW() - $1::interval
      WHERE service.is_active = TRUE
      GROUP BY service.service_id, service.name
      ORDER BY ${sortColumn} DESC, nome ASC`,
        [period]
    );
    return result.rows;
}
