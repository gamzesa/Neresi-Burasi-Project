"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/game/geo";
import type { GameMap as GameMapType } from "@/lib/game/scoring";
import { TURKEY_BOUNDS, buildMapStyle } from "./mapStyle";

maplibregl.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");

interface GameMapProps {
  map: GameMapType;
  /** Oyuncunun işaretlediği tahmin. */
  guess: LatLng | null;
  /** Doğru konum; yalnızca sonuç ekranında verilir. */
  answer?: LatLng | null;
  /** Harita dokunmaya kapalıysa (ör. sonuç ekranı) true. */
  disabled?: boolean;
  onGuessChange?: (point: LatLng) => void;
}

const emptyCollection = (): FeatureCollection => ({ type: "FeatureCollection", features: [] });

function pointCollection(p: LatLng | null | undefined): FeatureCollection {
  if (!p) return emptyCollection();
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [p.lng, p.lat] } }],
  };
}

function lineCollection(a: LatLng | null, b: LatLng | null | undefined): FeatureCollection {
  if (!a || !b) return emptyCollection();
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [[a.lng, a.lat], [b.lng, b.lat]] },
      },
    ],
  };
}

export default function GameMap({ map, guess, answer, disabled = false, onGuessChange }: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const handlersRef = useRef({ disabled, onGuessChange });

  useEffect(() => {
    handlersRef.current = { disabled, onGuessChange };
  }, [disabled, onGuessChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle(map, window.location.origin),
      ...(map === "world"
        ? { center: [15, 25] as [number, number], zoom: 1.3, minZoom: 0.8, maxZoom: 8 }
        : { bounds: TURKEY_BOUNDS, fitBoundsOptions: { padding: 12 }, minZoom: 4, maxZoom: 10 }),
      renderWorldCopies: false,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    instance.touchZoomRotate.disableRotation();
    if (map === "turkey") {
      instance.setMaxBounds([
        [TURKEY_BOUNDS[0][0] - 6, TURKEY_BOUNDS[0][1] - 4],
        [TURKEY_BOUNDS[1][0] + 6, TURKEY_BOUNDS[1][1] + 4],
      ]);
    }
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instance.on("click", (e) => {
      const { disabled: isDisabled, onGuessChange: onChange } = handlersRef.current;
      if (isDisabled || !onChange) return;
      onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    mapRef.current = instance;

    return () => {
      instance.remove();
      mapRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;
    const apply = () => {
      const setData = (id: string, data: FeatureCollection) =>
        (instance.getSource(id) as maplibregl.GeoJSONSource | undefined)?.setData(data);
      setData("guess", pointCollection(guess));
      setData("answer", pointCollection(answer));
      setData("link", lineCollection(guess, answer));
    };
    if (instance.isStyleLoaded()) apply();
    else instance.once("load", apply);
  }, [guess, answer, map]);

  return <div ref={containerRef} className="h-full w-full touch-none" />;
}
