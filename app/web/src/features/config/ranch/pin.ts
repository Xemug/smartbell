export interface Pin {
  latitude: number;
  longitude: number;
}

/** Guadalajara: where the map opens before a ranch has a pin. */
export const DEFAULT_CENTER: [number, number] = [20.6597, -103.3496];

/** Six decimals is about 10 cm: enough for a ranch, and stable across a save and reload. */
export const roundPin = (pin: Pin): Pin => ({
  latitude: Math.round(pin.latitude * 1e6) / 1e6,
  longitude: Math.round(pin.longitude * 1e6) / 1e6,
});
