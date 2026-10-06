import { notFound } from "next/navigation";
import MapPreview from "@/components/game/MapPreview";
import { mapSchema } from "@/lib/validation";

export default async function PlayPage({ params }: { params: Promise<{ map: string }> }) {
  const parsed = mapSchema.safeParse((await params).map);
  if (!parsed.success) notFound();
  return <MapPreview map={parsed.data} />;
}
