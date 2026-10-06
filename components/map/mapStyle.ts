import type { FilterSpecification, StyleSpecification } from "maplibre-gl";
import type { GameMap } from "@/lib/game/scoring";

/** Harita renkleri (koyu tema). Arayüz renkleriyle uyumludur: bkz. app/globals.css. */
const COLORS = {
  water: "#050b16",
  land: "#16304d",
  border: "#38587d",
  hoverFill: "#2c6aa3",
  hoverLine: "#a9d6ff",
  label: "#dbe7f5",
  labelHalo: "#07121f",
  continent: "#8fa9c7",
  link: "#fbbf24",
  guess: "#fb7185",
  answer: "#34d399",
  markerStroke: "#ffffff",
};

const REGULAR = ["Noto Sans Regular"];
const MEDIUM = ["Noto Sans Medium"];

/** Varsayılan görünüm: dünya haritasının tamamı (Antarktika'nın büyük kısmı hariç) görünür. */
export const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-170, -58],
  [180, 84],
];

export const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [25.6, 35.7],
  [44.9, 42.2],
];

export const HOVER_LAYERS = ["areas-hover-fill", "areas-hover-line"] as const;

/** Yalnızca verilen koda sahip bölgeyi seçen süzgeç; boş kod hiçbir bölgeyle eşleşmez (vurgu kapalı). */
export function hoverFilter(code: string): FilterSpecification {
  return ["==", ["get", "code"], code];
}

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
        id: "areas-hover-fill",
        type: "fill",
        source: "areas",
        filter: hoverFilter(""),
        paint: { "fill-color": COLORS.hoverFill },
      },
      {
        id: "areas-line",
        type: "line",
        source: "areas",
        paint: { "line-color": COLORS.border, "line-width": map === "world" ? 0.6 : 0.9 },
      },
      {
        id: "areas-hover-line",
        type: "line",
        source: "areas",
        filter: hoverFilter(""),
        paint: { "line-color": COLORS.hoverLine, "line-width": 1.6 },
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
        paint: { "text-color": COLORS.label, "text-halo-color": COLORS.labelHalo, "text-halo-width": 1.4 },
      },
    );
  }

  common.layers.push(
    {
      id: "link-line",
      type: "line",
      source: "link",
      paint: { "line-color": COLORS.link, "line-width": 2.5, "line-dasharray": [2, 2] },
    },
    {
      id: "answer-point",
      type: "circle",
      source: "answer",
      paint: {
        "circle-radius": 9,
        "circle-color": COLORS.answer,
        "circle-stroke-color": COLORS.markerStroke,
        "circle-stroke-width": 3,
      },
    },
    {
      id: "guess-point",
      type: "circle",
      source: "guess",
      paint: {
        "circle-radius": 9,
        "circle-color": COLORS.guess,
        "circle-stroke-color": COLORS.markerStroke,
        "circle-stroke-width": 3,
      },
    },
  );

  return common;
}
