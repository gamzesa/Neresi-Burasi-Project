/** Giriş sonrası yönlendirme adresi yalnızca sitenin içindeki bir yol olabilir (açık yönlendirme saldırısını önler). */
export function safeNextPath(value: string | undefined | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
