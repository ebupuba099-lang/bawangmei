import type { HeadTailCombo, LotteryDraw, HitRecord } from './types';

/** Mulberry32 种子随机数生成器 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
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