/**
 * Types for the Magnetism Educational App
 */

export type TabType = 'magnets' | 'inseparability' | 'induction' | 'iron-filings' | 'earth';

export interface Magnet {
  id: string;
  x: number; // in pixels
  y: number;
  length: number;
  width: number;
  angle: number; // in degrees: 0 means North right, South left; 180 means North left, South right
  strength: number;
}

export interface VectorProbe {
  x: number;
  y: number;
  active: boolean;
  bx: number;
  by: number;
  magnitude: number;
  angleDeg: number;
}

export interface CompassInstance {
  id: string;
  x: number;
  y: number;
  angle: number; // angle the needle points towards (degrees)
}

export interface EarthPoint {
  name: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  description: string;
}
