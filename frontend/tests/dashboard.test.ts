import { test } from "node:test";
import assert from "node:assert/strict";
import { applicationImpacts, collectionSeries, filterApplications, groupServiceLocations, serviceLocationPeers } from "../src/features/monitoring/domain/dashboard.ts";
import { mergeCollectionHistory } from "../src/features/monitoring/domain/history.ts";
import type { CollectionPoint, MonitoredService } from "../src/features/monitoring/types.ts";

const service = (id: string, extra: Partial<MonitoredService> = {}): MonitoredService => ({
  id, name: id, status: "available", country: "Brazil", city: "São Paulo", region: "Sudeste",
  cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null, energyKwh: null, emissionsG: null, ...extra,
});
const sample = (serviceId: string, second: number, emissionsG: number | null, energyKwh = 0.001): CollectionPoint => ({
  serviceId, collectedAt: new Date(Date.UTC(2026, 9, 21, 12, 0, second)).toISOString(),
  energyKwh, emissionsG, intervalSeconds: 30,
});

test("removed applications stay last for both metrics and return to ranking when available", () => {
  const services = [service("removed", { status: "removed" }), service("active"), service("missing"), service("removed-low", { status: "removed" })];
  const history = [sample("removed", 0, 100, 100), sample("active", 0, 1, 1), sample("removed-low", 0, 2, 2)];
  for (const metric of ["emissions", "energy"] as const) {
    assert.deepEqual(applicationImpacts(services, history, metric).map(entry => entry.service.id), ["active", "missing", "removed", "removed-low"]);
    const restored = services.map(entry => entry.id === "removed" ? { ...entry, status: "available" as const } : entry);
    assert.equal(applicationImpacts(restored, history, metric)[0]!.service.id, "removed");
  }
});

test("opening any application preserves all peers at its location", () => {
  const locations = [
    { country: "Canada", city: "Toronto", latitude: 43.6532, longitude: -79.3832 },
    { country: "United States", city: "Ashburn", latitude: 39.0438, longitude: -77.4874 },
    { country: "Brazil", city: "Sao Paulo", latitude: -23.5505, longitude: -46.6333 },
    { country: "Ireland", city: "Dublin", latitude: 53.3498, longitude: -6.2603 },
  ];
  const services = locations.flatMap((location, i) => [service(i + "a", location), service(i + "b", location)]);
  services.push(service("removed", { ...locations[0], status: "removed" }));
  for (const selected of services.filter(entry => entry.status !== "removed")) {
    const peers = serviceLocationPeers(services, selected);
    assert.equal(peers.length, 2);
    assert.ok(peers.some(peer => peer.id === selected.id));
    assert.ok(peers.every(peer => peer.city === selected.city));
    assert.equal(groupServiceLocations(peers)[0]!.count, 2);
  }
  const unknown = service("unknown");
  assert.deepEqual(serviceLocationPeers([unknown], unknown), [unknown]);
});

test("busca ignora acentos e permite combinar localização e estado", () => {
  const services = [service("billing"), service("audit", { status: "stale", country: "Ireland", city: "Dublin" })];
  assert.deepEqual(filterApplications(services, "sao paulo", "").map(value => value.id), ["billing"]);
  assert.deepEqual(filterApplications(services, "IRELAND", "stale").map(value => value.id), ["audit"]);
  assert.equal(filterApplications(services, "IRELAND", "available").length, 0);
});

test("serviços na mesma coordenada são agrupados e exibem o estado mais urgente", () => {
  const groups = groupServiceLocations([
    service("billing", { latitude: -23.55, longitude: -46.63 }),
    service("fraud", { latitude: -23.55, longitude: -46.63, status: "unavailable" }),
    service("removed", { latitude: -23.55, longitude: -46.63, status: "removed" }),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0]!.count, 2);
  assert.equal(groups[0]!.color, "#f43e48");
  assert.deepEqual(groups[0]!.services.map(value => value.id), ["billing", "fraud"]);
});

test("coordenadas ausentes ou inválidas não geram pontos; a busca mantém os serviços", () => {
  const services = [
    service("missing"), service("invalid", { latitude: NaN, longitude: 0 }),
    service("outside", { latitude: 100, longitude: 0 }),
    service("origin", { latitude: 0, longitude: 0 }),
  ];
  assert.deepEqual(groupServiceLocations(services).map(value => value.services[0]!.id), ["origin"]);
  assert.equal(filterApplications(services, "", "").length, 4);
});

test("ordenação soma amostras únicas e mantém zero válido antes de valores ausentes", () => {
  const point = sample("high", 0, 2);
  const ranked = applicationImpacts([service("missing"), service("zero"), service("high")],
    [point, point, sample("high", 30, 3), sample("zero", 0, 0)], "emissions");
  assert.deepEqual(ranked.map(value => [value.service.id, value.value]), [["high", 5], ["zero", 0], ["missing", null]]);
});

test("emissões incompletas não aparentam ser uma aplicação de baixo impacto", () => {
  const points = [sample("partial", 0, 1), sample("partial", 30, null)];
  const ranked = applicationImpacts([service("partial")], points, "emissions");
  assert.equal(ranked[0]!.value, null);
  assert.equal(ranked[0]!.summary.emissionCount, 1);
  assert.equal(applicationImpacts([service("partial")], points, "energy")[0]!.value, 0.002);
});

test("recuperar o fator completa a amostra sem duplicar energia", () => {
  const incomplete = sample("a", 0, null);
  const history = mergeCollectionHistory([incomplete], [{ ...incomplete, emissionsG: 2 }]);
  assert.equal(history.length, 1);
  assert.equal(history[0]!.emissionsG, 2);
  assert.equal(applicationImpacts([service("a")], history, "energy")[0]!.value, 0.001);
});

test("evolução acumulada reúne serviços no mesmo horário sem duplicar cache", () => {
  const a = sample("a", 0, 2), b = sample("b", 0, 3), later = sample("a", 30, 4);
  const points = collectionSeries([later, b, a, a], "emissions", true);
  assert.deepEqual(points.map(value => value.value), [5, 9]);
  assert.ok(points[1]!.timestamp > points[0]!.timestamp);
});

test("evolução individual preserva ausência e interrompe a linha em lacunas", () => {
  const points = collectionSeries([sample("a", 0, 1), sample("a", 30, null), sample("a", 60, 2), sample("a", 300, 3)], "emissions");
  assert.deepEqual(points.map(value => value.value), [1, null, 2, 3]);
  assert.equal(points[2]!.gap, true);
  assert.equal(points[3]!.gap, true);
});
