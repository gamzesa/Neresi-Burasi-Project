import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import { distanceKm, findRegion, isPointInRegion, isRegionHit } from "@/lib/game/geo";

const square = (code: string, w: number, s: number, e: number, n: number) => ({
  type: "Feature" as const,
  properties: { code },
  geometry: { type: "Polygon" as const, coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
});

const collection: FeatureCollection<Polygon | MultiPolygon> = {
  type: "FeatureCollection",
  features: [square("AA", 0, 0, 10, 10), square("BB", 20, 20, 30, 30)],
};

describe("distanceKm", () => {
  it("aynı nokta 0", () => {
    expect(distanceKm({ lat: 39, lng: 35 }, { lat: 39, lng: 35 })).toBe(0);
  });

  it("İstanbul - Ankara yaklaşık 350 km", () => {
    const d = distanceKm({ lat: 41.0082, lng: 28.9784 }, { lat: 39.9334, lng: 32.8597 });
    expect(d).toBeGreaterThan(340);
    expect(d).toBeLessThan(360);
  });

  it("ekvatorda 1 derece boylam yaklaşık 111 km", () => {
    const d = distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});

describe("bölge kontrolü", () => {
  it("içerideki noktayı tanır", () => {
    expect(isRegionHit({ lat: 5, lng: 5 }, collection, "code", "AA")).toBe(true);
  });

  it("dışarıdaki noktayı reddeder", () => {
    expect(isRegionHit({ lat: 5, lng: 5 }, collection, "code", "BB")).toBe(false);
  });

  it("bilinmeyen kodda false döner", () => {
    expect(isRegionHit({ lat: 5, lng: 5 }, collection, "code", "ZZ")).toBe(false);
  });

  it("findRegion ve isPointInRegion çalışır", () => {
    const region = findRegion(collection, "code", "BB");
    expect(region).toBeDefined();
    expect(isPointInRegion({ lat: 25, lng: 25 }, region!)).toBe(true);
  });
});
