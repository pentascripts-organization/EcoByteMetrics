import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import type { AggregatorService } from "../src/integrations/metrics-api.js";

import {
    getDiscoveredServices,
    getServicesLastUpdatedAt,
    refreshDiscoveredServices,
    resetServicesFetcher,
    setServicesFetcherForTesting,
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

afterEach(() => {
    resetServicesFetcher();
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