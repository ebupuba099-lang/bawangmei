/** 时时彩单期开奖数据 */
export interface LotteryDraw {
  /** 期号 */
  issue: string;
  /** 开奖号码（5位数字字符串，每位0-9） */
  numbers: string;
  /** 开奖时间 ISO 字符串 */
  time: string;
}

/** API 返回的开奖数据结构 */
export interface LotteryApiResponse {
  code: number;
  message: string;
  data: LotteryDraw[];
}

/** 一组头尾组合 */
export interface HeadTailCombo {
  /** 组合标识，如 "1xx5" */
  label: string;
  /** 头（第一位） */
  head: number;
  /** 尾（第四位） */
  tail: number;
  /** 是否命中 */
  hit: boolean;
}

/** 命中的历史记录 */
export interface HitRecord {
  /** 期号 */
  issue: string;
  /** 组合 */
  combo: string;
  /** 开奖号码 */
  numbers: string;
  /** 时间 */
  time: string;
}

/** 页面状态 */
export interface LotteryState {
  /** 当前日期种子 */
  seed: number;
  /** 43 组头尾组合 */
  combos: HeadTailCombo[];
  /** 当前期数据 */
  currentDraw: LotteryDraw | null;
  /** 往期数据 */
  historyDraws: LotteryDraw[];
  /** 历史命中记录 */
  hitRecords: HitRecord[];
  /** 连爆次数 */
  streak: number;
  /** 连续未中期数 */
  noHitStreak: number;
  /** 加载状态 */
  loading: boolean;
  /** 数据是否可用 */
  dataAvailable: boolean;
  /** 错误信息 */
  error: string | null;
  /** 翻牌动画进度 */
  revealIndex: number;
  /** 是否正在翻牌动画中 */
  revealing: boolean;
}