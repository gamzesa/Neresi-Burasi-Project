"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/game/geo";
import type { GameMap as GameMapType } from "@/lib/game/scoring";
import { TURKEY_BOUNDS, WORLD_BOUNDS, buildMapStyle } from "./mapStyle";

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
  const hadAnswerRef = useRef(false);

  useEffect(() => {
    handlersRef.current = { disabled, onGuessChange };
  }, [disabled, onGuessChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle(map, window.location.origin),
      // Varsayılan görünüm haritanın tamamıdır; oyuncu yakınlaştırıp uzaklaştırabilir.
      bounds: map === "world" ? WORLD_BOUNDS : TURKEY_BOUNDS,
      fitBoundsOptions: { padding: 8 },
      minZoom: map === "world" ? 0 : 3,
      maxZoom: map === "world" ? 8 : 10,
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
    // Oyuncu haritaya dokunana kadar, kutu boyutu değiştikçe (ör. pencere yeniden boyutlanınca) tüm harita yeniden sığdırılır.
    let userMoved = false;
    instance.on("movestart", (e) => {
      if ("originalEvent" in e && e.originalEvent) userMoved = true;
    });
    const defaultBounds = map === "world" ? WORLD_BOUNDS : TURKEY_BOUNDS;
    const observer = new ResizeObserver(() => {
      instance.resize();
      if (!userMoved) instance.fitBounds(defaultBounds, { padding: 8, duration: 0 });
    });
    observer.observe(containerRef.current);
    mapRef.current = instance;

    return () => {
      observer.disconnect();
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

    // Sonuç gösterilirken tahmin ve doğru konum birlikte görünür; sonraki soruda tüm harita yeniden görünür.
    const hadAnswer = hadAnswerRef.current;
    hadAnswerRef.current = Boolean(answer);
    if (guess && answer) {
      const bounds = new maplibregl.LngLatBounds([guess.lng, guess.lat], [guess.lng, guess.lat]);
      bounds.extend([answer.lng, answer.lat]);
      instance.fitBounds(bounds, { padding: 90, maxZoom: map === "world" ? 6 : 9, duration: 600 });
    } else if (hadAnswer && !answer) {
      instance.fitBounds(map === "world" ? WORLD_BOUNDS : TURKEY_BOUNDS, { padding: 8, duration: 400 });
    }
  }, [guess, answer, map]);

  return <div ref={containerRef} className="h-full w-full touch-none" />;
}
