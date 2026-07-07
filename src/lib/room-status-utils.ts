/**
 * Utility functions shared across room-status page components.
 * Extracted for testability.
 */

const BULAN_NAMES: Record<string, string> = {
  '1': 'Jan', '01': 'Jan',
  '2': 'Feb', '02': 'Feb',
  '3': 'Mar', '03': 'Mar',
  '4': 'Apr', '04': 'Apr',
  '5': 'May', '05': 'May',
  '6': 'Jun', '06': 'Jun',
  '7': 'Jul', '07': 'Jul',
  '8': 'Aug', '08': 'Aug',
  '9': 'Sep', '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
}

/**
 * Formats a date string from "d/m/yyyy" or "yyyy-mm-dd" into "dd-Mon-yyyy".
 * e.g. "18/6/2025" → "18-Jun-2025"
 */
export function formatBulan(val: string): string {
  if (!val) return val;
  // val is usually "d/m/yyyy" or "dd/mm/yyyy"
  const parts = val.split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1];
    const y = parts[2];
    return `${d}-${BULAN_NAMES[m] ?? m}-${y}`;
  }
  // Fallback if it's yyyy-mm-dd
  const partsDash = val.split('-');
  if (partsDash.length >= 2) {
    const yyyy = partsDash[0];
    const mm = partsDash[1];
    const dd = partsDash[2] || '';
    return dd ? `${dd}-${BULAN_NAMES[mm] ?? mm}-${yyyy}` : `${BULAN_NAMES[mm] ?? mm}-${yyyy}`;
  }
  return val;
}

/**
 * Builds phone filter options from rows, grouping by last 4 digits.
 */
export function buildPhoneOptions(rows: Array<{ nomor_telp?: string }>): Array<{ label: string; value: string }> {
  const phoneMap = new Map<string, string>()
  rows.forEach((r) => {
    const telp = (r.nomor_telp || '').replace(/\D/g, '')
    if (telp.length >= 4) {
      const last4 = telp.slice(-4)
      if (!phoneMap.has(last4)) {
        phoneMap.set(last4, r.nomor_telp || '')
      }
    }
  })
  const phoneOpts: Array<{ label: string; value: string }> = [{ label: 'Semua No Telp', value: 'ALL' }]
  phoneMap.forEach((fullPhone, last4) => {
    phoneOpts.push({ label: `****${last4} (${fullPhone})`, value: last4 })
  })
  return phoneOpts
}

/**
 * Determines auto-fill value for status_book based on durasi string.
 */
export function autoFillStatusBook(durasi: string, existingStatusBook?: string): string {
  if (existingStatusBook) return existingStatusBook;
  const lower = (durasi || '').toLowerCase();
  if (lower.includes('malam')) return 'SOLD';
  if (lower.includes('transit')) return 'BOOKED';
  return '';
}
