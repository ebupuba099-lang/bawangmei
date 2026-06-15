import type { LotteryDraw } from './types';

/** 获取 basePath（兼容 GitHub Pages 子路径） */
function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  const match = path.match(/^(\/[^/]+)/);
  return match?.[1] ?? '';
}

/** 从静态 JSON 文件获取数据（生产环境主路径） */
async function fetchFromStaticFile(): Promise<LotteryDraw[] | null> {
  const base = getBasePath();
  try {
    const res = await fetch(`${base}/data/lottery_data.json?t=${Date.now()}`);
    if (!res.ok) return null;
    const data: LotteryDraw[] = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/** 从体彩官方 API 获取最新开奖数据 */
async function fetchFromSporttery(): Promise<LotteryDraw[] | null> {
  try {
    const url = 'https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=350133&provinceId=0&pageSize=20&is11=0';
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();

    // 体彩 API 响应格式: { value: { list: [{ lotteryDrawNum, lotteryDrawResult, lotteryDrawTime }] } }
    const list = json?.value?.list as Array<{ lotteryDrawNum: string; lotteryDrawResult: string; lotteryDrawTime: string }> | undefined;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((d) => ({
        issue: d.lotteryDrawNum,
        numbers: d.lotteryDrawResult?.replace(/\s+/g, '') ?? '',
        time: d.lotteryDrawTime,
      }));
    }
    return null;
  } catch {
    return null;
  }
}

/** 从灰鸟 API 获取开奖数据（备选） */
async function fetchFromHuiniao(): Promise<LotteryDraw[] | null> {
  try {
    const url = 'http://api.huiniao.top/interface/home/lotteryHistory?type=plw&page=1&limit=20';
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();

    // 灰鸟 API 实际响应格式: { code: 1, info: "成功", data: { data: { list: [{ code, one, two, three, four, five, open_time }] } } }
    if (json?.code === 1) {
      const list = json?.data?.data?.list as Array<{
        code: string;
        one: string;
        two: string;
        three: string;
        four: string;
        five: string;
        open_time: string;
      }> | undefined;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((d) => ({
          issue: d.code,
          numbers: `${d.one}${d.two}${d.three}${d.four}${d.five}`,
          time: d.open_time,
        }));
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 获取开奖数据（三保险策略）
 * 生产环境: 静态 JSON → Sporttery 官方 API → 灰鸟 API
 */
export async function fetchLotteryData(): Promise<{
  draws: LotteryDraw[];
  source: string;
}> {
  // 1. 静态文件（GitHub Pages Actions 定时更新）
  const staticData = await fetchFromStaticFile();
  if (staticData && staticData.length > 0) {
    return { draws: staticData, source: 'static' };
  }

  // 2. 体彩官方 API
  const sportteryData = await fetchFromSporttery();
  if (sportteryData && sportteryData.length > 0) {
    return { draws: sportteryData, source: 'sporttery' };
  }

  // 3. 灰鸟 API（容灾）
  const huiniaoData = await fetchFromHuiniao();
  if (huiniaoData && huiniaoData.length > 0) {
    return { draws: huiniaoData, source: 'huiniao' };
  }

  // 4. 全部失败
  return { draws: [], source: 'none' };
}

/** 从 draw 的 time 字段提取日期 */
export function getDrawDate(timeStr: string): Date {
  try {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) return date;
    return new Date();
  } catch {
    return new Date();
  }
}

/** 格式化开奖时间显示 */
export function formatDrawTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return timeStr;
  }
}

/** 获取最近的期号 */
export function getTodayDrawIssue(draws: LotteryDraw[]): LotteryDraw | null {
  if (draws.length === 0) return null;
  return draws[0];
}

/** 格式化期号 */
export function formatIssueNumber(issue: string): string {
  return `${issue}期`;
}