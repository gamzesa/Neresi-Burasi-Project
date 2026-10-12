// Oyuncunun oda anahtarını tarayıcıda saklar (sayfa yenilenince odaya geri dönebilsin diye).
// Tarayıcı depolamasına bağımlılık burada izole tutulur; mobil uygulamada başka bir depoyla değiştirilebilir.

const PREFIX = "neresi-oda:";

export function saveRoomToken(code: string, playerToken: string): void {
  try {
    window.localStorage.setItem(PREFIX + code, playerToken);
  } catch {
    // Depolama kapalıysa (gizli sekme vb.) oyun yine oynanır; yalnızca yenilemede oda kaybolur.
  }
}

export function loadRoomToken(code: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + code);
  } catch {
    return null;
  }
}

export function clearRoomToken(code: string): void {
  try {
    window.localStorage.removeItem(PREFIX + code);
  } catch {
    // yok say
  }
}
