export type Coordinates = { latitude: number; longitude: number };

export function getValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): Coordinates | null {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return { latitude, longitude };
}

export function isValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return getValidCoordinates(latitude, longitude) !== null;
}
