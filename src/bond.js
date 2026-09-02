/** Karakter bağı — sektördeki collection meter'in CITV hali.
 * Sayı yok. 8 tema simgesi dolunca karakter toplar.
 */
export const BOND_MAX = 8;

export function nextBond(prev, themes) {
  const n = (prev || 0) + Math.max(0, themes || 0);
  if (n < BOND_MAX) return { bond: n, collect: false };
  return { bond: n % BOND_MAX, collect: true };
}

export function holdKeys(grid, extra) {
  if (!extra || !grid) return [];
  const keys = [];
  for (let c = 0; c < grid.length; c++) {
    const col = grid[c] || [];
    for (let r = 0; r < col.length; r++) {
      if (col[r] === "⭐") keys.push(`${c}:${r}`);
    }
  }
  return keys;
}
