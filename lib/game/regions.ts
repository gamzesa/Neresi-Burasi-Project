import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { isRegionHit, type LatLng } from "./geo";
import type { GameMap } from "./scoring";

type RegionCollection = FeatureCollection<Polygon | MultiPolygon>;

// Sunucudaki bölge kontrolü sadeleştirilmemiş sınırları kullanır; bu dosyalar istemciye gönderilmez.
const FILES: Record<GameMap, string> = {
  world: "world-countries.full.geojson",
  turkey: "turkey-provinces.full.geojson",
};

const cache = new Map<GameMap, RegionCollection>();

function getRegions(map: GameMap): RegionCollection {
  let regions = cache.get(map);
  if (!regions) {
    regions = JSON.parse(readFileSync(path.join(process.cwd(), "data", "geo", FILES[map]), "utf8")) as RegionCollection;
    cache.set(map, regions);
  }
  return regions;
}

export function checkRegionHit(map: GameMap, point: LatLng, regionCode: string): boolean {
  return isRegionHit(point, getRegions(map), "code", regionCode);
}
