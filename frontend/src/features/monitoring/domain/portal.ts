import type {TemporalLane} from './temporal.ts';
export const portalColors = ['#00c985', '#37bca8', '#16899b', '#779e75', '#b0c86d'];
// Bound the scene, keeping every recorded interval accessible through the timeline.
export function portalWindow(count: number, selected: number) {
  const size = Math.min(9, count);
  const start = Math.max(0, Math.min(count - size, selected - Math.floor(size / 2)));
  return Array.from({length: size}, (_, i) => start + i);
}
export function portalSegments(lanes: TemporalLane[], index: number) {
  const total = lanes.reduce((sum, lane) => sum + (lane.cells[index]?.value ?? 0), 0);
  let angle = Math.PI / 2;
  return lanes.flatMap((lane, color) => {
    const cell = lane.cells[index];
    if (cell?.value == null || cell.value <= 0 || total <= 0) return [];
    const length = cell.value / total * Math.PI * 2;
    const segment = {id: lane.service.id, start: angle, length, color: portalColors[color]!, partial: cell.partial};
    angle += length;
    return [segment];
  });
}
