
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
    AggregatorService,
    ServiceMetrics,
} from "../src/integrations/metrics-api.js";

import {
    getDiscoveredServices,
    getServicesLastUpdatedAt,
    refreshDiscoveredServices,
    resetServicesFetcher,
    setServicesFetcherForTesting,
    getCollectedServiceMetrics,
    getCollectedMetricsByServiceId,
    refreshServiceMetrics,
    resetMetricsFetcher,
    setMetricsFetcherForTesting,
    resetCarbonRegionsFetcher,
    resetPersistence,
    setCarbonRegionsFetcherForTesting,
    setPersistenceForTesting,
} from "../src/modules/services/services.service.js";

const billingService: AggregatorService = {
    id: "billing-api",
    name: "billing-api",
    location: {
        region_code: "SA-SP",
        country: "Brasil",
        region: "São Paulo",
        city: "São Paulo",
        latitude: -23.55,
        longitude: -46.63,
    },
    metrics_path: "/metrics/billing-api",
};

const checkoutService: AggregatorService = {
    id: "checkout-worker",
    name: "checkout-worker",
    location: {
        region_code: "SA-SP",
        country: "Brasil",
        region: "São Paulo",
        city: "São Paulo",
        latitude: -23.55,
        longitude: -46.63,
    },
    metrics_path: "/metrics/checkout-worker",
};

const billingMetrics: ServiceMetrics = {
    collection_interval_seconds: 30,
    metrics: {
        cpu_percent: 45,
        memory_gb: 2.5,
        disk_gb: 10,
        network_gb: 0.4,
    },
};

const updatedBillingMetrics: ServiceMetrics = {
    collection_interval_seconds: 30,
    metrics: {
        cpu_percent: 60,
        memory_gb: 3,
        disk_gb: 12,
        network_gb: 0.6,
    },
};

const checkoutMetrics: ServiceMetrics = {
    collection_interval_seconds: 30,
    metrics: {
        cpu_percent: 25,
        memory_gb: 1.5,
        disk_gb: 8,
        network_gb: 0.2,
    },
};

beforeEach(() => {
    setPersistenceForTesting(async () => {}, async () => {});
    setCarbonRegionsFetcherForTesting(async () => []);
});

afterEach(() => {
    resetServicesFetcher();
    resetMetricsFetcher();
    resetCarbonRegionsFetcher();
    resetPersistence();
});

describe("Serviço de descoberta de serviços", () => {
    it("armazena os serviços após uma consulta bem-sucedida", async () => {
        setServicesFetcherForTesting(async () => [billingService]);

        await refreshDiscoveredServices();

        assert.deepEqual(getDiscoveredServices(), [billingService]);
        assert.notEqual(getServicesLastUpdatedAt(), null);
    });

    it("atualiza o cache quando um novo serviço aparece", async () => {
        setServicesFetcherForTesting(async () => [billingService]);

        await refreshDiscoveredServices();

        setServicesFetcherForTesting(async () => [
            billingService,
            checkoutService,
        ]);

        await refreshDiscoveredServices();

        assert.deepEqual(getDiscoveredServices(), [
            billingService,
            checkoutService,
        ]);
    });

    it("preserva o último cache válido quando a consulta falha", async () => {
        setServicesFetcherForTesting(async () => [billingService]);

        await refreshDiscoveredServices();

        const previousServices = getDiscoveredServices();
        const previousUpdatedAt = getServicesLastUpdatedAt();

        setServicesFetcherForTesting(async () => {
            throw new Error("Falha simulada na consulta");
        });

        await assert.rejects(refreshDiscoveredServices());

        assert.deepEqual(getDiscoveredServices(), previousServices);
        assert.equal(
            getServicesLastUpdatedAt(),
            previousUpdatedAt
        );
    });
});

describe("Serviço de coleta de métricas", () => {
    it("persiste a amostra com o fator de carbono da região", async () => {
        let persistedSample: {
            serviceId: string;
            metrics: ServiceMetrics;
            carbonIntensity: number | null;
        } | undefined;

        setServicesFetcherForTesting(async () => [billingService]);
        await refreshDiscoveredServices();
        setMetricsFetcherForTesting(async () => billingMetrics);
        setCarbonRegionsFetcherForTesting(async () => [{
            code: "SA-SP",
            carbonIntensity: 85,
        }]);
        setPersistenceForTesting(
            async () => {},
            async (serviceId, metrics, carbonIntensity) => {
                persistedSample = { serviceId, metrics, carbonIntensity };
            }
        );

        await refreshServiceMetrics();

        assert.deepEqual(persistedSample, {
            serviceId: "billing-api",
            metrics: billingMetrics,
            carbonIntensity: 85,
        });
    });

    it("armazena as métricas após uma consulta bem-sucedida", async () => {
        setServicesFetcherForTesting(async () => [billingService]);
        await refreshDiscoveredServices();

        setMetricsFetcherForTesting(async () => billingMetrics);
        await refreshServiceMetrics();

        const result = getCollectedMetricsByServiceId("billing-api");

        assert.ok(result);
        assert.equal(result.serviceId, "billing-api");
        assert.deepEqual(result.metrics, billingMetrics);
        assert.notEqual(result.updatedAt, "");
    });

    it("atualiza o cache quando novas métricas são coletadas", async () => {
        setServicesFetcherForTesting(async () => [billingService]);
        await refreshDiscoveredServices();

        setMetricsFetcherForTesting(async () => billingMetrics);
        await refreshServiceMetrics();

        setMetricsFetcherForTesting(
            async () => updatedBillingMetrics
        );
        await refreshServiceMetrics();

        const result = getCollectedMetricsByServiceId("billing-api");

        assert.ok(result);
        assert.deepEqual(result.metrics, updatedBillingMetrics);
    });

    it("preserva métricas válidas e continua a coleta quando um serviço falha", async () => {
        setServicesFetcherForTesting(async () => [
            billingService,
            checkoutService,
        ]);
        await refreshDiscoveredServices();

        // Primeira coleta: os dois serviços funcionam.
        setMetricsFetcherForTesting(async (serviceId) => {
            if (serviceId === "billing-api") {
                return billingMetrics;
            }

            return checkoutMetrics;
        });

        await refreshServiceMetrics();

        const previousBilling =
            getCollectedMetricsByServiceId("billing-api");

        assert.ok(previousBilling);

        // Segunda coleta: billing falha, checkout continua funcionando.
        setMetricsFetcherForTesting(async (serviceId) => {
            if (serviceId === "billing-api") {
                throw new Error("Falha simulada no billing-api");
            }

            return updatedBillingMetrics;
        });

        await refreshServiceMetrics();

        const currentBilling =
            getCollectedMetricsByServiceId("billing-api");

        const currentCheckout =
            getCollectedMetricsByServiceId("checkout-worker");

        // O serviço que falhou mantém as métricas anteriores.
        assert.ok(currentBilling);
        assert.deepEqual(
            currentBilling.metrics,
            previousBilling.metrics
        );

        // A falha do primeiro serviço não impede a atualização do segundo.
        assert.ok(currentCheckout);
        assert.deepEqual(
            currentCheckout.metrics,
            updatedBillingMetrics
        );

        // Os registros coletados continuam disponíveis.
        assert.ok(getCollectedServiceMetrics().length >= 2);
    });
});
