CREATE TABLE IF NOT EXISTS aggregator_services (
    service_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region_code TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE aggregator_services
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS aggregator_metric_samples (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES aggregator_services(service_id),
    collected_at TIMESTAMPTZ NOT NULL,
    collection_interval_seconds NUMERIC NOT NULL,
    cpu_percent NUMERIC NOT NULL,
    memory_gb NUMERIC NOT NULL,
    disk_gb NUMERIC NOT NULL,
    network_gb NUMERIC NOT NULL,
    carbon_intensity_gco2e_per_kwh NUMERIC,
    UNIQUE (service_id, collected_at)
);

CREATE INDEX IF NOT EXISTS aggregator_metric_samples_collected_at_idx
    ON aggregator_metric_samples (collected_at DESC);

CREATE INDEX IF NOT EXISTS aggregator_metric_samples_service_time_idx
    ON aggregator_metric_samples (service_id, collected_at DESC);