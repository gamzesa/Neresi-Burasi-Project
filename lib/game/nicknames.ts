/**
 * Sıralamadaki adlar serbest metin değildir: iki sözcük listesinden ve bir sayıdan üretilir
 * ("Cesur Kartal 42"). İstemci yalnızca liste sıra numaralarını gönderir; adı sunucu kurar.
 */
export const ADJECTIVES = [
  "Cesur", "Hızlı", "Akıllı", "Neşeli", "Meraklı", "Sakin", "Kurnaz", "Mutlu", "Güçlü", "Çevik",
  "Yetenekli", "Tatlı", "Sessiz", "Parlak", "Usta", "Şanslı", "Gezgin", "Atılgan", "Dikkatli", "Yaratıcı",
  "Cesaretli", "Zarif", "Sabırlı", "Eğlenceli", "Dürüst", "Kararlı", "Bilge", "Enerjik", "Mavi", "Yeşil",
] as const;

export const NOUNS = [
  "Kartal", "Kaplan", "Panda", "Kaşif", "Pusula", "Şahin", "Yunus", "Kelebek", "Penguen", "Ceylan",
  "Tilki", "Aslan", "Baykuş", "Leylek", "Martı", "Bulut", "Rüzgâr", "Dağcı", "Denizci", "Atlas",
  "Globus", "Yolcu", "Vaşak", "Kuğu", "Zürafa", "Ahtapot", "Sincap", "Lama", "Deve", "Kanguru",
] as const;

export const MAX_NAME_NUMBER = 99;

export interface NameParts {
  adjective: number;
  noun: number;
  number: number;
}

export function isValidNameParts(parts: NameParts): boolean {
  const inRange = (value: number, size: number) => Number.isInteger(value) && value >= 0 && value < size;
  return (
    inRange(parts.adjective, ADJECTIVES.length) &&
    inRange(parts.noun, NOUNS.length) &&
    inRange(parts.number, MAX_NAME_NUMBER + 1)
  );
}

export function buildNickname(parts: NameParts): string {
  if (!isValidNameParts(parts)) throw new RangeError("Geçersiz ad parçaları");
  return `${ADJECTIVES[parts.adjective]} ${NOUNS[parts.noun]} ${parts.number}`;
}

export function randomNameParts(rand: () => number = Math.random): NameParts {
  return {
    adjective: Math.floor(rand() * ADJECTIVES.length),
    noun: Math.floor(rand() * NOUNS.length),
    number: Math.floor(rand() * (MAX_NAME_NUMBER + 1)),
  };
}
