import type { StyleSpecification } from "maplibre-gl";
import type { GameMap } from "@/lib/game/scoring";

const COLORS = {
  water: "#cde6f2",
  land: "#f3ecd8",
  border: "#8f9aa6",
  label: "#2b3440",
  labelHalo: "#fdfaf0",
  continent: "#5d6b7a",
};

const REGULAR = ["Noto Sans Regular"];
const MEDIUM = ["Noto Sans Medium"];

export const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [25.6, 35.7],
  [44.9, 42.2],
];

/** Altlık harita yoktur: yalnızca arka plan + GeoJSON dolgu/çizgi (+ dünya için etiket) katmanları. */
export function buildMapStyle(map: GameMap, assetBase: string): StyleSpecification {
  const geo = `${assetBase}/geo`;
  const common: StyleSpecification = {
    version: 8,
    glyphs: `${geo}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      areas: {
        type: "geojson",
        data: `${geo}/${map === "world" ? "world-countries" : "turkey-provinces"}.geojson`,
      },
      guess: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      answer: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      link: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": COLORS.water } },
      { id: "areas-fill", type: "fill", source: "areas", paint: { "fill-color": COLORS.land } },
      {
        id: "areas-line",
        type: "line",
        source: "areas",
        paint: { "line-color": COLORS.border, "line-width": map === "world" ? 0.6 : 0.9 },
      },
    ],
  };

  if (map === "world") {
    common.sources["labels"] = { type: "geojson", data: `${geo}/world-labels.geojson` };
    common.sources["continents"] = { type: "geojson", data: `${geo}/world-continents.geojson` };
    common.layers.push(
      {
        id: "continent-labels",
        type: "symbol",
        source: "continents",
        maxzoom: 3,
        layout: {
          "text-field": ["get", "name"],
          "text-font": MEDIUM,
          "text-size": 15,
          "text-transform": "uppercase",
          "text-letter-spacing": 0.15,
        },
        paint: { "text-color": COLORS.continent, "text-halo-color": COLORS.labelHalo, "text-halo-width": 1.5 },
      },
      {
        id: "country-labels",
        type: "symbol",
        source: "labels",
        minzoom: 1.5,
        layout: {
          "text-field": ["get", "name"],
          "text-font": REGULAR,
          "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 6, 14],
          "text-max-width": 7,
          "symbol-sort-key": ["get", "minZoom"],
        },
        paint: { "text-color": COLORS.label, "text-halo-color": COLORS.labelHalo, "text-halo-width": 1.2 },
      },
    );
  }

  common.layers.push(
    {
      id: "link-line",
      type: "line",
      source: "link",
      paint: { "line-color": "#d9480f", "line-width": 2.5, "line-dasharray": [2, 2] },
    },
    {
      id: "answer-point",
      type: "circle",
      source: "answer",
      paint: { "circle-radius": 9, "circle-color": "#2f9e44", "circle-stroke-color": "#fff", "circle-stroke-width": 3 },
    },
    {
      id: "guess-point",
      type: "circle",
      source: "guess",
      paint: { "circle-radius": 9, "circle-color": "#e03131", "circle-stroke-color": "#fff", "circle-stroke-width": 3 },
    },
  );

  return common;
}
