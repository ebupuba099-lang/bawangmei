import type { HeadTailCombo, LotteryDraw, HitRecord } from './types';

/** Mulberry32 种子随机数生成器 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
export interface HeadTailPick {
  first: number;
  fourth: number;
  key: string; // e.g. "4x6" = first=4, fourth=6
  pattern: string; // e.g. "4xx6" = display format
  id: string; // e.g. "4x6" = same as key
}

// 日期种子：精确到"日"，同一天内种子不变
export function getDateSeed(): number {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return dateStr.split('-').reduce(
    (acc, part) => (acc * 31 + parseInt(part, 10)) | 0,
    0,
  );
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 根据日期生成当天的种子（北京时区） */
export function getDateSeed(date: Date = new Date()): number {
  const beijingDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
  );
  const y = beijingDate.getFullYear();
  const m = beijingDate.getMonth() + 1;
  const d = beijingDate.getDate();
  return y * 10000 + m * 100 + d;
}

/** 生成 43 组不重复的头尾组合 */
export function generateCombos(seed: number): HeadTailCombo[] {
  const rng = mulberry32(seed);
  const combos: HeadTailCombo[] = [];
  const used = new Set<string>();

  // 头尾组合: head 0-9 (第一位), tail 0-9 (第四位)
  // 理论上共 100 种组合，从中选 43 组
  while (combos.length < 43) {
    const head = Math.floor(rng() * 10);
    const tail = Math.floor(rng() * 10);
    const key = `${head}-${tail}`;
    if (!used.has(key)) {
      used.add(key);
      combos.push({
        label: `${head}xx${tail}`,
        head,
        tail,
        hit: false,
      });
    }
  }

  return combos;
}

/** 命中判定：首位（第1位）== head **且** 第4位 == tail */
export function checkHit(
  combo: HeadTailCombo,
  numbers: string
): boolean {
  if (numbers.length < 4) return false;
  const first = parseInt(numbers[0], 10);
  const fourth = parseInt(numbers[3], 10);
  return first === combo.head && fourth === combo.tail;
}

/** 从开奖号码中找出所有命中的组合 */
export function findHits(
  combos: HeadTailCombo[],
  draw: LotteryDraw
): { combo: HeadTailCombo; record: HitRecord }[] {
  const results: { combo: HeadTailCombo; record: HitRecord }[] = [];
  for (const combo of combos) {
    if (checkHit(combo, draw.numbers)) {
      results.push({
        combo,
        record: {
          issue: draw.issue,
          combo: combo.label,
          numbers: draw.numbers,
          time: draw.time,
        },
      });
    }
  }
  return results;
}

/** 将组合列表布局为 5 列网格（按行填充） */
export function layoutGrid(combos: HeadTailCombo[]): HeadTailCombo[][] {
  const rows: HeadTailCombo[][] = [];
  const cols = 5;
  for (let i = 0; i < combos.length; i += cols) {
    rows.push(combos.slice(i, i + cols));
  }
  return rows;
}

/** localStorage 操作工具 */
const STORAGE_KEYS = {
  picks: 'sssc_picks_v3',
  history: 'sssc_history_v3',
} as const;

export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage 满时静默失败
  }
}

export function loadPicks(): HeadTailCombo[] | null {
  return loadFromStorage<HeadTailCombo[]>(STORAGE_KEYS.picks);
}

export function savePicks(combos: HeadTailCombo[]): void {
  saveToStorage(STORAGE_KEYS.picks, combos);
}

export function loadHistory(): HitRecord[] | null {
  return loadFromStorage<HitRecord[]>(STORAGE_KEYS.history);
}

export function saveHistory(records: HitRecord[]): void {
  saveToStorage(STORAGE_KEYS.history, records);
}

/** 更新 combo 的命中状态并保存 */
export function updateCombosWithHits(
  combos: HeadTailCombo[],
  draw: LotteryDraw
): HeadTailCombo[] {
  return combos.map((combo) => ({
    ...combo,
    hit: checkHit(combo, draw.numbers),
  }));
}

/** 合并新的命中记录（去重，最多20条） */
export function mergeHitRecords(
  existing: HitRecord[],
  newRecords: HitRecord[]
): HitRecord[] {
  const seen = new Set(existing.map((r) => `${r.issue}-${r.combo}`));
  const combined = [...existing];
  for (const record of newRecords) {
    const key = `${record.issue}-${record.combo}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.unshift(record);
    }
  }
  return combined.slice(0, 20);
}
// 生成 N 组随机头尾（mulberry32 日期种子）
export function generatePicks(total: number, seed: number): HeadTailPick[] {
  const rand = mulberry32(seed);
  const pool: HeadTailPick[] = [];
  for (let first = 0; first <= 9; first++) {
    for (let fourth = 0; fourth <= 9; fourth++) {
      const key = `${first}x${fourth}`;
      pool.push({ first, fourth, key, pattern: `${first}xx${fourth}`, id: key });
    }
  }
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return shuffled
    .slice(0, total)
    .sort((a, b) => a.first - b.first || a.fourth - b.fourth);
}

// 判断某注是否命中某期（第 1 位 = first，第 4 位 = fourth）
export function matchPick(
  pick: HeadTailPick,
  issue: { digits: number[] },
): boolean {
  return pick.first === issue.digits[0] && pick.fourth === issue.digits[3];
}
