/** Kullanıcı adı olmayan (Google ile yeni girmiş) hesap için onay sözcüğü. */
export const DELETE_CONFIRM_WORD = "SIL";

/** Silmenin onaylanması için yazılması gereken metin: kullanıcı adı, yoksa `DELETE_CONFIRM_WORD`. */
export function expectedDeletionConfirmation(username: string | null): string {
  return username ?? DELETE_CONFIRM_WORD;
}

/** Büyük/küçük harf ve baştaki/sondaki boşluk fark etmez. */
export function isDeletionConfirmed(confirmation: string, username: string | null): boolean {
  return confirmation.trim().toLowerCase() === expectedDeletionConfirmation(username).toLowerCase();
}
