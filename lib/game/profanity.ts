const BLOCKED_WORDS = [
  "amk", "aq", "sik", "sikik", "siktir", "sikerim", "orospu", "oruspu", "piç", "pic",
  "yarrak", "yarak", "göt", "got", "gotveren", "amcık", "amcik", "ibne", "puşt", "pust",
  "kahpe", "fahişe", "fahise", "şerefsiz", "serefsiz", "gerizekalı", "gerizekali",
  "salak", "aptal", "mal", "bok", "fuck", "shit", "bitch", "asshole", "dick", "pussy",
  "nigger", "nigga", "cunt",
];

const CHAR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", $: "s",
};

function normalize(text: string): string {
  return text
    .replace(/İ/g, "i")
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü01345@$]/g, (c) => CHAR_MAP[c] ?? c)
    .replace(/[^a-z]/g, "");
}

const NORMALIZED_BLOCKED = BLOCKED_WORDS.map(normalize);

/** Kısa kelimeler yalnızca tam eşleşmede, uzun olanlar içerik olarak aranır (yanlış pozitifi azaltmak için). */
const SUBSTRING_MIN_LENGTH = 4;

export function containsProfanity(text: string): boolean {
  const normalized = normalize(text);
  return NORMALIZED_BLOCKED.some((word) =>
    word.length >= SUBSTRING_MIN_LENGTH ? normalized.includes(word) : normalized === word,
  );
}
