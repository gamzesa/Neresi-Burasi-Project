import { booleanPointInPolygon, distance, point } from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export interface LatLng {
  lat: number;
  lng: number;
}

export type RegionFeature = Feature<Polygon | MultiPolygon>;

/** İki koordinat arası büyük daire (haversine) mesafesi, km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  return distance(point([a.lng, a.lat]), point([b.lng, b.lat]), { units: "kilometers" });
}

export function isPointInRegion(p: LatLng, region: RegionFeature): boolean {
  return booleanPointInPolygon(point([p.lng, p.lat]), region);
}

/** Verilen kodla eşleşen bölgeyi bulur; kod, `codeProperty` özelliğinde aranır. */
export function findRegion(
  collection: FeatureCollection<Polygon | MultiPolygon>,
  codeProperty: string,
  regionCode: string,
): RegionFeature | undefined {
  return collection.features.find((f) => f.properties?.[codeProperty] === regionCode);
}

/** Tahmin, doğru bölgenin (ülke/il) içinde mi? */
export function isRegionHit(
  guess: LatLng,
  collection: FeatureCollection<Polygon | MultiPolygon>,
  codeProperty: string,
  regionCode: string,
): boolean {
  const region = findRegion(collection, codeProperty, regionCode);
  return region ? isPointInRegion(guess, region) : false;
}
