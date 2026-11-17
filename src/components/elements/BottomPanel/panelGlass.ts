export type PanelGlass = {
  enabled: boolean;
  blur: number;
  androidReduction: number;
  veil: number;
};

const PANEL_GLASS: PanelGlass = {
  enabled: true,
  blur: 30,
  androidReduction: 4,
  veil: 0.8,
};

export default PANEL_GLASS;
