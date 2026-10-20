// Coeficientes do modelo em W e W/GB.
export function estimateEnergy(
  cpu: number,
  memory: number,
  disk: number,
  network: number,
  seconds: number,
) {
  return (
    (((cpu / 100) * 100 + memory * 0.375 + disk * 0.01 + network * 0.02) *
      (seconds / 3600)) /
    1000
  );
}
