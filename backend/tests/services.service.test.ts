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

describe("Contrato de coleta de métricas", () => {
    it("valida timestamps, erros externos, métricas inválidas e timeout pela rota HTTP", async () => {
        const { execFileSync } = await import("node:child_process");
        const script = String.raw`
            import assert from 'node:assert/strict';
            const { default: app } = await import('./src/app.ts').then(m => m.default?.default ? m.default : m);
            const nativeFetch = globalThis.fetch;
            let response;
            globalThis.fetch = async () => {
                if (response instanceof Error) throw response;
                return response.clone();
            };
            const server = app.listen(0);
            await new Promise(resolve => server.once('listening', resolve));
            const url = 'http://127.0.0.1:' + server.address().port;
            const metrics = { collection_interval_seconds: 60, metrics: { cpu_percent: 50, memory_gb: 2, disk_gb: 10, network_gb: 1 } };
            try {
                response = Response.json(metrics);
                const started = Date.now();
                let result = await nativeFetch(url + '/metrics/billing-api');
                const body = await result.json();
                assert.equal(result.status, 200);
                assert.deepEqual(body.metrics, metrics.metrics);
                assert.equal(body.collection_interval_seconds, 60);
                assert(Date.parse(body.collectedAt) >= started);
                assert(Date.parse(body.collectedAt) <= Date.now());
                for (const status of [404, 500]) {
                    response = Response.json({ error: status === 404 ? 'service_not_found' : 'metrics_missing' }, { status });
                    result = await nativeFetch(url + '/metrics/billing-api');
                    assert.equal(result.status, status);
                    assert.equal((await result.json()).collectedAt, undefined);
                }
                response = Response.json({ ...metrics, metrics: { ...metrics.metrics, cpu_percent: 101 } });
                result = await nativeFetch(url + '/metrics/billing-api');
                assert.equal(result.status, 502);
                assert.equal((await result.json()).error, 'invalid_metrics');
                response = new Response('invalid json');
                result = await nativeFetch(url + '/metrics/billing-api');
                assert.equal(result.status, 502);
                response = new TypeError('network failure');
                result = await nativeFetch(url + '/metrics/billing-api');
                assert.equal(result.status, 502);
                response = new DOMException('timeout', 'TimeoutError');
                result = await nativeFetch(url + '/metrics/billing-api');
                assert.equal(result.status, 504);
                assert.equal((await result.json()).collectedAt, undefined);
                result = await nativeFetch(url + '/services');
                assert.deepEqual(await result.json(), { services: [], lastUpdatedAt: null });
            } finally {
                globalThis.fetch = nativeFetch;
                await new Promise(resolve => server.close(resolve));
            }
        `;
        execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], {
            cwd: process.cwd(),
            env: { ...process.env, API_METRIC: "https://metrics.unilaunch.org" },
            stdio: "pipe",
            timeout: 20000,
        });
    });
});
