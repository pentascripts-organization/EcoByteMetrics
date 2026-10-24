import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createServer } from "vite";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import type { MonitoringSnapshot, MonitoredService } from "../src/features/monitoring/types.ts";

test("integração do frontend: contratos HTTP, análise, telas e navegação", async t => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const vite = await createServer({ root, cacheDir: "node_modules/.vite-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { getMonitoringSnapshot } = await vite.ssrLoadModule("/src/features/monitoring/api/monitoring.ts");
    const { getAnalysis, analysisLink } = await vite.ssrLoadModule("/src/features/monitoring/domain/analysis.ts");
    const at = new Date().toISOString();
    const summary = (id: string) => ({ id, name: "App " + id, location: { country: "Brazil", region: "Sudeste", region_code: "br-sp", city: "Sao Paulo" } });
    const metric = (id: string, overrides = {}) => ({ serviceId: id, updatedAt: at, metrics: { collection_interval_seconds: 30, metrics: { cpu_percent: 10, memory_gb: 1, disk_gb: 2, network_gb: 3 } }, ...overrides });
    const catalog = { regions: [{ code: "br-sp", country: "Brazil", region: "Sudeste", carbon_intensity_gco2e_per_kwh: 85, renewable_share_percent: 70 }] };

    await t.test("aplicação sem coordenadas mantém recursos e emissões; serviço incorreto não vira uma amostra", async child => {
      child.mock.method(globalThis, "fetch", async (input: string) => {
        if (input.endsWith("/services")) return Response.json({ services: [summary("a"), summary("b")], lastUpdatedAt: at });
        if (input.endsWith("/regions")) return Response.json(catalog);
        if (input.endsWith("/metrics/a")) return Response.json(metric("a"));
        if (input.endsWith("/metrics/b")) return Response.json(metric("wrong"));
        throw new Error("URL inesperada: " + input);
      });
      const result = await getMonitoringSnapshot();
      assert.equal(result.services[0].status, "available");
      assert.equal(result.services[0].latitude, undefined);
      assert.ok(result.services[0].emissionsG > 0);
      assert.equal(result.services[1].status, "no-metrics");
      assert.equal(result.history.length, 1);
      assert.match(result.warning, /Localização incompleta/);
    });

    await t.test("falhas parciais de carbono e métricas não impedem a lista; 404 distingue remoção", async child => {
      child.mock.method(globalThis, "fetch", async (input: string) => {
        if (input.endsWith("/services")) return Response.json({ services: [summary("a"), summary("b"), summary("c")], lastUpdatedAt: at });
        if (input.endsWith("/regions")) return new Response("", { status: 503 });
        if (input.endsWith("/metrics/a")) return Response.json(metric("a"));
        if (input.endsWith("/metrics/b")) return Response.json({ error: "metrics_missing" }, { status: 404 });
        if (input.endsWith("/metrics/c")) return Response.json({ error: "service_not_found" }, { status: 404 });
        throw new Error(input);
      });
      const result = await getMonitoringSnapshot();
      assert.deepEqual(result.services.map((service: MonitoredService) => service.status), ["available", "no-metrics", "removed"]);
      assert.equal(result.history[0].emissionsG, null);
      assert.match(result.warning, /Emissões parciais/);
    });

    await t.test("descoberta inválida não apaga ambiente; recursos inválidos não produzem zero fictício", async child => {
      let badDiscovery = true;
      child.mock.method(globalThis, "fetch", async (input: string) => {
        if (input.endsWith("/regions")) return Response.json(catalog);
        if (input.endsWith("/services")) return Response.json(badDiscovery ? { services: [], lastUpdatedAt: null } : { services: [summary("a")], lastUpdatedAt: at });
        return Response.json(metric("a", { metrics: { collection_interval_seconds: 0, metrics: { cpu_percent: 0, memory_gb: 0, disk_gb: 0, network_gb: 0 } } }));
      });
      await assert.rejects(getMonitoringSnapshot(), /não concluiu a descoberta/);
      badDiscovery = false;
      const result = await getMonitoringSnapshot();
      assert.equal(result.services[0].status, "no-metrics");
      assert.equal(result.services[0].energyKwh, null);
      assert.equal(result.history.length, 0);
    });

    await t.test("muitos serviços respeitam o limite de consultas simultâneas e cancelamento", async child => {
      let running = 0, peak = 0;
      child.mock.method(globalThis, "fetch", async (input: string) => {
        if (input.endsWith("/services")) return Response.json({ services: Array.from({ length: 14 }, (_, index) => summary(String(index))), lastUpdatedAt: at });
        if (input.endsWith("/regions")) return Response.json(catalog);
        running++; peak = Math.max(peak, running);
        await new Promise(resolve => setTimeout(resolve, 2));
        running--;
        return Response.json(metric(input.split("/").at(-1)!));
      });
      assert.equal((await getMonitoringSnapshot()).services.length, 14);
      assert.ok(peak <= 6);
      const controller = new AbortController(); controller.abort();
      await assert.rejects(getMonitoringSnapshot(controller.signal), { name: "AbortError" });
    });

    const service: MonitoredService = { id: "a", name: "Billing API", status: "available", country: "Brazil", region: "Sudeste", city: "São Paulo", cpuPercent: 10, memoryGb: 1, diskGb: 2, networkGb: 3, energyKwh: 0.001, emissionsG: 0.085, lastCollectionAt: at };
    const snapshot: MonitoringSnapshot = { services: [service, { ...service, id: "b", name: "Audit", status: "removed" }], regions: [], history: ["a", "b"].map(id => ({ serviceId: id, collectedAt: at, energyKwh: 0.001, emissionsG: 0.085 })), totalEnergyKwh: 0.002, totalEmissionsG: 0.17, lastCollectionAt: at, discoveryUpdatedAt: at, refreshedAt: at };

    await t.test("filtros aplicam a mesma seleção a tabela, totais e histórico; links retêm filtros", () => {
      const analysis = getAnalysis(snapshot, "24h", "?busca=billing&estado=available");
      assert.deepEqual(analysis.services.map((entry: MonitoredService) => entry.id), ["a"]);
      assert.equal(analysis.history.length, 1);
      assert.equal(analysis.totals.energyKwh, 0.001);
      const link = analysisLink("/comparar", "?pais=Brazil&estado=available&busca=billing&periodo=7d&ordem=energy&servico=a&app=a&app=b&app=a");
      const params = new URL(link, "http://localhost").searchParams;
      assert.deepEqual(params.getAll("app"), ["a", "b"]);
      assert.equal(params.get("busca"), "billing");
      assert.equal(params.get("servico"), null);
      assert.equal(getAnalysis(snapshot, "24h", "?ate=2026-02-30T12:00").invalidDate, true);
    });

    const { MemoryRouter } = createRequire(root + "/package.json")("react-router-dom");
    const { MonitoringContext } = await vite.ssrLoadModule("/src/features/monitoring/contexts/MonitoringContext.ts");
    const { AnalysisProvider } = await vite.ssrLoadModule("/src/features/monitoring/providers/AnalysisProvider.tsx");
    const { DashboardPage } = await vite.ssrLoadModule("/src/features/monitoring/pages/DashboardPage.tsx");
    const { HistoryChart } = await vite.ssrLoadModule("/src/features/monitoring/components/HistoryChart.tsx");
    const { RechartsEvolutionChart, EvolutionTooltip } = await vite.ssrLoadModule("/src/features/monitoring/components/RechartsEvolutionChart.tsx");
    const { ComparisonPage } = await vite.ssrLoadModule("/src/features/monitoring/pages/ComparisonPage.tsx");
    const { AppLayout } = await vite.ssrLoadModule("/src/app/layouts/AppLayout.tsx");
    const render = (path: string, page = DashboardPage, changes = {}) => renderToString(h(MemoryRouter, { initialEntries: [path] }, h(MonitoringContext.Provider, { value: { snapshot, period: "24h", loading: false, error: null, refresh: async () => null, setPeriod: () => {}, ...changes } }, h(AnalysisProvider, null, h(page)))));

    await t.test("detalhes mantêm globo à esquerda e conteúdo das três abas à direita", () => {
      for (const [tab, text] of [["resumo", "Impacto nas amostras"], ["recursos", "Recursos da última coleta"], ["evolucao", "Evolução da aplicação"]]) {
        const markup = render("/dashboard?servico=a&detalhe=" + tab).replace(/<!--.*?-->/g, "");
        const panel = markup.indexOf('class="monitoring-service-summary"');
        assert.ok(panel > markup.indexOf('class="monitoring-map"'));
        assert.ok(markup.indexOf(text!) > panel);
        assert.equal((markup.match(/class="monitoring-map"/g) ?? []).length, 1);
        assert.match(markup, /Sem coordenadas/);
      }
      assert.match(render("/dashboard?busca=unknown"), /Nenhuma aplicação nesta seleção/);
      assert.match(render("/dashboard?servico=missing"), /Aplicação não encontrada/);
      assert.match(render("/dashboard", DashboardPage, { error: "Sem conexão" }), /Tentar novamente/);
    });

    await t.test("atualização preserva o texto da consulta anterior até a resposta chegar", () => {
      const status = (markup: string) => markup.match(/<span role="status">(.*?)<\/span>/)?.[1];
      const previous = status(render("/dashboard"));
      assert.match(previous!, /Consulta concluída/);
      assert.equal(status(render("/dashboard", DashboardPage, { loading: true })), previous);
      const firstLoad = render("/dashboard", DashboardPage, { loading: true, snapshot: { ...snapshot, refreshedAt: undefined } });
      assert.match(status(firstLoad)!, /Consultando aplicações/);
    });

    await t.test("os quatro títulos do resumo oferecem ajuda acessível sem exibir os popups inicialmente", () => {
      const markup = render("/dashboard");
      for (const label of ["energia nas amostras", "emissões nas amostras", "cobertura de emissões", "última coleta válida no ambiente"])
        assert.ok(markup.includes('aria-label="Sobre ' + label + '"'));
      assert.equal((markup.match(/class="info-tooltip-trigger"/g) ?? []).length, 4);
      assert.ok(!markup.includes('role="tooltip"'));
    });

    await t.test("evolution reveals only the selected section and keeps optional information out of the chart", () => {
      const markup = render("/dashboard?aba=evolucao").replace(/<!--.*?-->/g, "");
      assert.ok(markup.includes('aria-label="Se\u00e7\u00f5es da evolu\u00e7\u00e3o"'));
      assert.ok(markup.includes('data-engine="recharts"'));
      assert.ok(markup.includes('aria-label="Emiss\u00f5es estimadas ao longo do tempo"'));
      for (const text of ["evolution-details-grid", "evolution-contributors", "evolution-samples", "observation-range"]) assert.ok(!markup.includes(text), text);
      const details = render("/dashboard?aba=evolucao&painel=detalhes");
      assert.match(details, /evolution-details-grid/);
      assert.ok(!details.includes('class="evolution-chart-panel"'));
      assert.match(render("/dashboard?aba=evolucao&painel=historico"), /evolution-history/);
      assert.match(render("/dashboard?aba=evolucao&painel=aplicacoes"), /evolution-contributors/);
      assert.match(render("/dashboard?aba=evolucao&serie=acumulado"), /aria-pressed="true">Acumulado<\/button>/);
      assert.match(render("/dashboard?aba=evolucao&ordem=energy"), /kWh/);
      const empty = render("/dashboard?aba=evolucao", DashboardPage, { snapshot: { ...snapshot, history: [] } });
      assert.match(empty, /Nenhuma amostra neste per\u00edodo/);
      const incomplete = render("/dashboard?aba=evolucao", DashboardPage, { snapshot: { ...snapshot, history: snapshot.history.map(point => ({ ...point, emissionsG: null })) } });
      assert.match(incomplete, /Ainda faltam dados de emiss\u00f5es/);
      assert.match(incomplete, /Visualizar energia/);
      assert.ok(!incomplete.includes("NaN"));
      assert.match(render("/dashboard?servico=a&detalhe=evolucao&painel=aplicacoes"), /evolution-chart-panel/);
    });

    await t.test("Recharts substitui o gráfico manual nos dois modos e preserva zero e unidades", () => {
      const points = [{ timestamp: Date.parse(at), value: 0, gap: true }];
      for (const mode of ["intervals", "cumulative"]) {
        const markup = renderToString(h(HistoryChart, { points, metric: "energy", mode, intervalMs: 30_000, onEnergy: () => {} }));
        const plot = renderToString(h(RechartsEvolutionChart, { data: points, metric: "energy", mode, intervalMs: 30_000, helpId: "chart-help" }));
        assert.match(plot, /recharts-responsive-container/);
        assert.match(plot, /recharts-wrapper/);
        assert.ok(markup.includes('data-chart-mode="' + mode + '"'));
        assert.match(markup, /kWh/);
        assert.ok(!markup.includes("NaN"));
        assert.ok(!markup.includes("evolution-chart-scrubber"));
      }
    });

    await t.test("long lists show five entries per page instead of growing the evolution panel", () => {
      const points = Array.from({ length: 11 }, (_, index) => ({ serviceId: "a", collectedAt: new Date(Date.parse(at) - 600_000 + index * 30_000).toISOString(), energyKwh: .001, emissionsG: .085 }));
      const samples = render("/dashboard?aba=evolucao&painel=coletas", DashboardPage, { snapshot: { ...snapshot, history: points } }).split('class="evolution-samples"')[1]!;
      const body = samples.match(/<tbody>(.*?)<\/tbody>/)?.[1] ?? "";
      assert.equal((body.match(/<tr>/g) ?? []).length, 5);
      assert.match(samples, /de <!-- -->11<!-- --> intervalos/);
      assert.match(samples, /aria-label="Pr\u00f3xima p\u00e1gina de coletas"/);
      const services = Array.from({ length: 8 }, (_, index) => ({ ...service, id: String(index), name: "App " + index }));
      const history = services.map(entry => ({ ...points[0]!, serviceId: entry.id }));
      const apps = render("/dashboard?aba=evolucao&painel=aplicacoes", DashboardPage, { snapshot: { ...snapshot, services, history } }).split('class="evolution-contributors"')[1]!;
      assert.equal((apps.match(/<li>/g) ?? []).length, 5);
      assert.match(apps, /de <!-- -->8<!-- --> aplica/);
    });

    await t.test("lacunas explicam o trecho, respeitam a aplicação e não aumentam a página com uma lista inteira", () => {
      const stamp = (seconds: number) => new Date(Date.parse(at) + seconds * 1000).toISOString();
      const history = [-240, -120, 0].map(second => ({ serviceId: "a", collectedAt: stamp(second), energyKwh: .001, emissionsG: .085 }));
      const collectionEvents = [
        { from: stamp(-230), to: stamp(-150), kind: "tab-hidden" as const },
        { from: stamp(-230), to: stamp(-150), kind: "service-unavailable" as const, serviceIds: ["b"] },
      ];
      const changes = { snapshot: { ...snapshot, history, collectionEvents } };
      const markup = render("/dashboard?servico=a&detalhe=evolucao&painel=lacunas", DashboardPage, changes).replace(/<!--.*?-->/g, "");
      assert.match(markup, /aba estava oculta/);
      assert.ok(!markup.includes("O backend informou aplicação indisponível"));
      assert.match(markup, /não informou o motivo da ausência/);
      assert.match(markup, /Trecho 1 de 2/);
      assert.equal((markup.match(/class="evolution-gap-detail"/g) ?? []).length, 1);
      assert.ok(!markup.includes('class="evolution-chart-panel"'));
      const graph = render("/dashboard?aba=evolucao", DashboardPage, changes);
      assert.ok(!graph.includes('class="evolution-gap-detail"'));
      assert.match(graph, /faixas em âmbar/);
      const noGaps = render("/dashboard?aba=evolucao&painel=lacunas");
      assert.match(noGaps, /Nenhuma lacuna detectada/);
    });

    await t.test("revisar um instante não usa diagnósticos recebidos no futuro", () => {
      const stamp = (seconds: number) => new Date(Date.parse(at) + seconds * 1000).toISOString();
      const past = { ...snapshot, observations: [{ observedAt: at, services: snapshot.services, samples: snapshot.history }], collectionEvents: [
        { from: stamp(-60), to: stamp(-30), kind: "request-failed" as const },
        { from: stamp(-20), to: stamp(30), kind: "tab-hidden" as const },
      ] };
      const analysis = getAnalysis(past, "24h", "?instante=" + encodeURIComponent(at));
      assert.equal(analysis.collectionEvents.length, 1);
      assert.equal(analysis.collectionEvents[0].kind, "request-failed");
    });

    await t.test("tooltips distinguem uma lacuna real de estimativa ausente e mantêm zero válido", () => {
      const tooltip = (point: object) => renderToString(h(EvolutionTooltip, { active: true, payload: [{ payload: point }], seriesLabel: "Energia estimada", unit: "kWh" })).replace(/<!--.*?-->/g, "");
      const missing = tooltip({ timestamp: Date.parse(at), value: null, missing: true, from: Date.parse(at) - 60_000, to: Date.parse(at), reason: "Motivo desconhecido", events: [{ from: at, to: at, kind: "request-failed" }] });
      assert.match(missing, /Trecho sem registros/);
      assert.match(missing, /Motivo desconhecido/);
      assert.match(missing, /consulta ao backend falhou/);
      assert.match(tooltip({ timestamp: Date.parse(at), value: null, reason: "Fator de carbono ausente" }), /Fator de carbono ausente/);
      assert.match(tooltip({ timestamp: Date.parse(at), value: 0 }), /0 kWh/);
    });

    await t.test("comparador exige duas seleções e mostra unidades, período, cobertura e limitação da sessão", () => {
      assert.match(render("/comparar", ComparisonPage), /Selecione pelo menos duas/);
      const markup = render("/comparar?app=a&app=b", ComparisonPage);
      for (const text of ["comparison-table", "Mesmo intervalo de consulta", "Energia (kWh)", "Emissões (g CO₂e)", "Duração somada (s)", "Um total menor não indica maior eficiência"])
        assert.ok(markup.includes(text));
      assert.match(render("/comparar?app=a&app=missing", ComparisonPage), /seleção\(ões\) não está/);
      const layout = render("/comparar?pais=Brazil", AppLayout);
      assert.ok(layout.includes('/dashboard?pais=Brazil'));
      assert.ok(layout.includes('aria-current="page"'));
    });
  } finally {
    await vite.close();
  }
});
