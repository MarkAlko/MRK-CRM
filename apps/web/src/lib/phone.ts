/**
 * Phone normalization utility – client-side mirror of backend logic.
 * Normalises Israeli phone numbers to +972XXXXXXXXX format.
 */

export function normalizePhone(raw: string): string {
  // Strip everything except digits and leading +
  let cleaned = raw.replace(/[^\d+]/g, '');

  // Handle Israeli local format: 05x -> +9725x
  if (cleaned.startsWith('05')) {
    cleaned = '+972' + cleaned.slice(1);
  }
  // Handle 9725x without +
  else if (cleaned.startsWith('9725') && cleaned.length >= 12) {
    cleaned = '+' + cleaned;
  }
  // Handle +9725x – already normalised
  else if (cleaned.startsWith('+9725')) {
    // already OK
  }
  // Handle 005x (international prefix)
  else if (cleaned.startsWith('005')) {
    cleaned = '+972' + cleaned.slice(3);
  }

  return cleaned;
}

/**
 * Display-friendly format for Israeli phones: 05X-XXX-XXXX
 */
export function formatPhoneDisplay(phone: string): string {
  const normalised = normalizePhone(phone);

  // If it's a valid Israeli mobile (+972 5X XXXXXXX = 13 chars)
  if (normalised.startsWith('+972') && normalised.length === 13) {
    const local = '0' + normalised.slice(4);
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }

  // Fall back to raw display
  return phone;
}

/**
 * Validate that a string looks like a valid Israeli mobile number.
 */
export function isValidIsraeliMobile(phone: string): boolean {
  const normalised = normalizePhone(phone);
  // +972 5X XXXXXXX = 13 digits total starting with +9725
  return /^\+9725\d{8}$/.test(normalised);
}
