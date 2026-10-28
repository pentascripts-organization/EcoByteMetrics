export function dashboardLocation(search: string, { metric, serviceId }: { metric?: "energy" | "emissions"; serviceId?: string } = {}) {
  const params = new URLSearchParams(search);
  if (metric) {
    params.set("ordem", metric);
    params.set("aba", "evolucao");
    params.delete("servico");
    params.delete("detalhe");
  }
  if (serviceId) params.set("servico", serviceId);
  return "/dashboard" + (params.size ? "?" + params : "");
}
