export type GlassSettings = {
  enabled?: boolean;
  blur: number;
  androidReduction: number;
  veil: number;
};

export type SceneGlass = GlassSettings & {
  height?: number;
  feather: number;
  fadeFloor: number;
  fadeLead?: number;
  fadeCurve: number;
};

export const BLUR_ENABLED = false;

export const DEFAULT_GLASS: GlassSettings = {
  enabled: true,
  blur: 30,
  androidReduction: 4,
  veil: 0.8,
};

export const DEFAULT_SCENE_GLASS: SceneGlass = {
  ...DEFAULT_GLASS,
  veil: 0.5,
  feather: 64,
  fadeFloor: 0.25,
  fadeCurve: 2,
};

export const glassWith = (...layers: (Partial<GlassSettings> | undefined)[]): GlassSettings =>
  Object.assign({}, DEFAULT_GLASS, ...layers);
