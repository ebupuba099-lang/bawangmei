'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import LotteryCard from '@/components/LotteryCard';
import type { DrawHistoryItem } from '@/components/LotteryCard';
import { fetchLotteryData, getDrawDate } from '@/lib/data';
import {
  generateCombos,
  getDateSeed,
  findHits,
} from '@/lib/lottery';
import type { HeadTailCombo, LotteryDraw } from '@/lib/types';

const MAX_HISTORY = 20;
const STREAK_HIT_THRESHOLD = 3;
const STREAK_MISS_THRESHOLD = 5;

/** 计算该期历史的命中状态（用当天独立种子，固定计算结果） */
function computeHistoryItems(draws: LotteryDraw[]): DrawHistoryItem[] {
  return draws.map((draw) => {
    const drawDate = getDrawDate(draw.time);
    const daySeed = getDateSeed(drawDate);
    const dayCombos = generateCombos(daySeed);
    const hits = findHits(dayCombos, draw);
    return {
      issue: draw.issue,
      numbers: draw.numbers,
      time: draw.time,
      hasHit: hits.length > 0,
    };
  });
}

/** 从历史列表计算连爆状态 */
function computeStreaks(items: DrawHistoryItem[]): {
  streak: number;
  noHitStreak: number;
} {
  let streak = 0;
  let noHitStreak = 0;

  for (const item of items) {
    if (item.hasHit) {
      streak++;
    } else {
      break;
    }
  }

  for (const item of items) {
    if (!item.hasHit) {
      noHitStreak++;
    } else {
      break; // 一旦遇到中，连无终止
    }
  }

  return { streak, noHitStreak };
}

export default function HomePage() {
  // ---- 状态 ----
  const [combos, setCombos] = useState<HeadTailCombo[]>([]);
  const [currentDraw, setCurrentDraw] = useState<LotteryDraw | null>(null);
  const [historyItems, setHistoryItems] = useState<DrawHistoryItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [noHitStreak, setNoHitStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);

  // ---- 初始化组合（当天固定种子） ----
  const initCombos = useCallback(() => {
    const todaySeed = getDateSeed();
    const newCombos = generateCombos(todaySeed);
    setCombos(newCombos);
  }, []);

  // ---- 获取开奖数据 ----
  const fetchDraws = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { draws } = await fetchLotteryData();
      const recentDraws = draws.slice(0, MAX_HISTORY);

      if (recentDraws.length === 0) {
        setError('数据源不可用');
        initCombos();
        setHistoryItems([]);
        setStreak(0);
        setNoHitStreak(0);
      } else {
        const latest = recentDraws[0];
        setCurrentDraw(latest);

        // 用当天种子生成当日组合
        const todaySeed = getDateSeed();
        const newCombos = generateCombos(todaySeed);
        setCombos(newCombos);

        // ★ 历史命中用每期独立种子，一次性算好固定下来
        const items = computeHistoryItems(recentDraws);
        setHistoryItems(items);

        // ★ 连爆也从预计算的历史结果推断
        const { streak: s, noHitStreak: ns } = computeStreaks(items);
        setStreak(s);
        setNoHitStreak(ns);
      }
    } catch {
      setError('数据获取失败');
      initCombos();
    } finally {
      setLoading(false);
    }
  }, [initCombos]);

  // ---- 页面初始化 ----
  useEffect(() => {
    fetchDraws();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 复制功能 ----
  const handleCopy = useCallback(() => {
    if (combos.length === 0) return;

    const comboStr = combos.map((c) => `${c.head}xx${c.tail}`).join(' ');
    const text = `霸王梅 · ${currentDraw ? parseInt(currentDraw.issue) + 1 : ''}期 · 43组头尾\n${comboStr}`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }, [combos, currentDraw]);

  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  // ---- 保存图片 ----
  const handleSaveImage = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setSavingImage(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const card = document.getElementById('lottery-card');
      if (!card) throw new Error('卡片元素未找到');

      const canvas = await html2canvas(card, {
        width: 888,
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FCF5E2',
        onclone: (doc: Document) => {
          const allElements = doc.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            if (el instanceof HTMLElement) {
              const cs = doc.defaultView?.getComputedStyle(el);
              if (cs) {
                if (cs.backgroundColor?.includes('oklch') || cs.backgroundColor?.includes('lab(')) {
                  el.style.backgroundColor = '#FCF5E2';
                }
                if (cs.color?.includes('oklch') || cs.color?.includes('lab(')) {
                  el.style.color = '#5A3E2B';
                }
                if (cs.borderColor?.includes('oklch') || cs.borderColor?.includes('lab(')) {
                  el.style.borderColor = '#7A5D4A';
                }
              }
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import html2canvas from 'html2canvas';

import { Button } from '@/components/ui/button';
import { type NormalizedIssue, fetchLotteryData, fetchIssueByCode } from '@/lib/lottery-server';
import { generatePicks, getDateSeed, matchPick, type HeadTailPick } from '@/lib/lottery';

// ===== 设计 token（与参考图同色系） =====
const COLORS = {
  bg: '#f1e8df',
  cardBg: '#f1e8df',
  border: '#7A5D4A',
  borderSoft: '#B59A7A',
  text: '#5A3E2B',
  textMuted: '#7A7A7A',
  highlight: '#C45A43',
  hitBg: '#F8D9CF',
  barPink: '#E9D5D8',
  barGray: '#BAB8B6',
  mint: '#D6E5D8',
  // xx 数字与正常数字同色同字重（用户要求"不要弱化"）
  xx: '#5A3E2B',
  cardGridLine: '#B59A7A',
} as const;

const TOTAL_PICKS = 43;
const STORAGE_KEY = 'sssc_picks_v3';
const HISTORY_KEY = 'sssc_history_v3';

const kaitiFamily = "'STKaiti','KaiTi','Songti SC','SimSun',serif";
const monoFamily =
  "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Source Han Sans SC',monospace";

type HistoryEntry = {
  picks: HeadTailPick[];
  issue: NormalizedIssue;
  hit: boolean;
  hitKeys: string[];
  savedAt: number;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS standalone uses navigator.standalone, others use display-mode
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  );
}

export default function Home() {
  // ===== State =====
  const [mounted, setMounted] = useState(false);
  const [picks, setPicks] = useState<HeadTailPick[]>([]);
  const [issues, setIssues] = useState<NormalizedIssue[]>([]);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [headerLoaded, setHeaderLoaded] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const headerImgRef = useRef<HTMLImageElement | null>(null);

  // ===== Effects =====
  useEffect(() => {
    setMounted(true);
  }, []);

  // 计算卡片缩放比例，让 888px 宽的卡片适配手机视口
  useEffect(() => {
    if (!mounted) return;
    const CARD_W = 888;
    const updateScale = () => {
      const vw = window.innerWidth;
      // 手机端（视口 < 900px）缩放卡片，桌面端保持原始大小
      if (vw < CARD_W + 20) {
        setCardScale((vw - 16) / CARD_W); // 左右各留 8px 边距
      } else {
        setCardScale(1);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [mounted]);

  // 预加载页头图片，确保 html-to-image 截图时图片已就绪
  useEffect(() => {
    if (!mounted) return;
    const img = new Image();
    img.onload = () => setHeaderLoaded(true);
    img.onerror = () => setHeaderLoaded(true); // 即使失败也继续，避免阻塞
    img.src = 'ss.jpg';
  }, [mounted]);

  // 首次挂载：拉取本期期号 + 从 localStorage 读取历史
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: HeadTailPick[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === TOTAL_PICKS) {
          setPicks(parsed);
        }
      }
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) {
        const parsed: HistoryEntry[] = JSON.parse(hist);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {
      // ignore
    }
  }, [mounted]);

  // 若 localStorage 还没有 picks，立刻生成（日期种子，同一天不变）
  useEffect(() => {
    if (!mounted) return;
    if (picks.length === 0) {
      const seed = getDateSeed();
      const next = generatePicks(TOTAL_PICKS, seed);
      setPicks(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  }, [mounted, picks.length]);

  // 拉取开奖数据：优先尝试静态JSON文件（GitHub Pages），兜底API路由（Dev）
  const loadIssues = useCallback(async () => {
    setLoadingIssue(true);
    setIssueError(null);
    try {
      // 尝试静态 JSON 文件（与 Python 脚本输出的路径一致）
      let res = await fetch('./data/lottery_data.json').catch(() => null);
      if (!res || !res.ok) {
        // 兜底：开发环境走 API 路由
        res = await fetch('/api/lottery?count=10');
      }
      if (!res.ok) throw new Error('数据源不可用');
      const json = (await res.json()) as { data: NormalizedIssue[] };
      if (!json.data || json.data.length === 0) {
        throw new Error('数据为空');
      }
      setIssues(json.data);
    } catch (err) {
      setIssueError(
        err instanceof Error ? err.message : '开奖数据获取失败，稍后重试'
      );
    } finally {
      setLoadingIssue(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void loadIssues();
  }, [mounted, loadIssues]);

  // ===== 当 issues 更新时，自动填充历史条目 =====
  useEffect(() => {
    if (!mounted || issues.length === 0 || picks.length === 0) return;
    setHistory((prev) => {
      const existingIssues = new Set(prev.map((h) => h.issue.issue));
      const newEntries: HistoryEntry[] = [];
      for (let i = 0; i < Math.min(issues.length, 8); i++) {
        const iss = issues[i];
        if (existingIssues.has(iss.issue)) continue;
        const matched = picks.filter((p) => matchPick(p, iss));
        newEntries.push({
          picks,
          issue: iss,
          hit: matched.length > 0,
          hitKeys: matched.map((m) => m.key),
          savedAt: Date.now(),
        });
      }
      if (newEntries.length === 0) return prev;
      return [...newEntries, ...prev].slice(0, 20);
    });
  }, [mounted, issues, picks]);

  // ===== 历史数据持久化到 localStorage =====
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* ignore */
    }
  }, [mounted, history]);

  // ===== Derived =====
  const lastIssue = issues[0];
  const lastIssueResult = useMemo(() => {
    if (!lastIssue || picks.length === 0) return null;
    const matched = picks.filter((p) => matchPick(p, lastIssue));
    return {
      issue: lastIssue,
      matched,
      hit: matched.length > 0,
      hitKeys: matched.map((m) => m.key),
    };
  }, [lastIssue, picks]);

  // 历史命中统计（每组 pick 在历史里中过几次）
  const hitStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of history) {
      for (const k of h.hitKeys) {
        map.set(k, (map.get(k) || 0) + 1);
      }
    }
    return map;
  }, [history]);

  // 连胜/连败：从最近一期起累加连续命中/未中
  const streak = useMemo(() => {
    if (issues.length === 0 || picks.length === 0) {
      return { kind: "none" as const, count: 0 };
    }
    const seq: boolean[] = issues.map((iss) => {
      const key = `${iss.digits[0]}${iss.digits[3]}`;
      return picks.some((p) => p.key === key);
    });
    const first = seq[0];
    let count = 0;
    for (const s of seq) {
      if (s === first) count++;
      else break;
    }
    if (count >= 3) {
      return { kind: first ? ("hot" as const) : ("cold" as const), count };
    }
    return { kind: "none" as const, count: 0 };
  }, [issues, picks]);

  // 连错 ≥5 期时清空历史记录
  useEffect(() => {
    if (streak.kind === 'cold' && streak.count >= 5) {
      setHistory([]);
      try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
    }
  }, [streak]);

  // ===== 渲染卡片为 PNG（参考神仙连方案：克隆节点 + html2canvas） =====
  // html2canvas 的 CSS 解析器不支持 Tailwind CSS 4 的 lab()/oklch()/lch() 颜色函数。
  // 本函数在截图前彻底清理所有现代颜色函数，确保 html2canvas 不崩溃。
  const renderCardToCanvas = useCallback(async (): Promise<Blob> => {
    if (!cardRef.current) throw new Error('卡片未挂载');
    const el = cardRef.current;

    // 1. 等待页头图片完全加载
    if (headerImgRef.current && !headerImgRef.current.complete) {
      await new Promise<void>((resolve) => {
        const img = headerImgRef.current!;
        const onDone = () => { img.onload = null; img.onerror = null; resolve(); };
        img.onload = onDone;
        img.onerror = onDone;
        setTimeout(onDone, 3000);
      });
    }

    // 2. 克隆节点插入可视区域顶部（left -9999px 会导致部分浏览器跳过布局计算，
    //    造成截图变形。改为临时插入左上角，截图后立即移除）
    const clone = el.cloneNode(true) as HTMLDivElement;
    clone.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:888px',
      'min-width:888px',
      'height:auto',
      'overflow:visible',
      'z-index:99999',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(clone);

    // 3. 等待克隆元素中的图片加载
    const cloneImages = clone.querySelectorAll('img');
    await Promise.all(
      Array.from(cloneImages).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const onDone = () => { img.onload = null; img.onerror = null; resolve(); };
          img.onload = onDone;
          img.onerror = onDone;
          setTimeout(onDone, 5000);
        });
      })
    );

    // 4. 等两帧让浏览器完成布局
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    // ===== 现代 CSS 颜色函数清理（html2canvas CSS 解析器不支持 lab/oklch/lch） =====
    // 核心思路：html2canvas 从 CSSStyleSheet（解析后的 CSSOM）中读取颜色值。
    // 只修改 textContent 不会更新 CSSOM，必须用 replaceChild 创建新 <style> 来触发重新解析。
    const MODERN_COLOR_RE = /(?:lab|oklch|lch|color-mix)\(/;
    const replaceFn = (text: string): string =>
      text
        .replace(/lab\([^)]+\)/g, '#F7EED6')
        .replace(/oklch\([^)]+\)/g, '#F7EED6')
        .replace(/lch\([^)]+\)/g, '#F7EED6')
        .replace(/color-mix\([^)]+\)/g, '#F7EED6');

    try {
      // 5. html2canvas 截图（onclone 中彻底清理现代颜色函数）
      const canvas = await html2canvas(clone, {
        backgroundColor: '#F7EED6',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: 888,
        windowWidth: 888,
        onclone: (doc: Document) => {
          // 关键修复：将 <style> 元素替换为已清理现代颜色的新元素，
          // 这样浏览器/html2canvas 的 CSSOM 将只包含 hex 颜色，避免解析失败
          doc.querySelectorAll('style').forEach((tag) => {
            const text = tag.textContent || '';
            if (!MODERN_COLOR_RE.test(text)) return;
            const newTag = doc.createElement('style');
            newTag.textContent = replaceFn(text);
            tag.parentNode?.replaceChild(newTag, tag);
          });

          // 处理 <link rel="stylesheet">：fetch 源码 → 清理 → 转 <style>
          doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
            const href = (link as HTMLLinkElement).href;
            if (!href) return;
            // 只处理同源样式表
            try {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', href, false);
              xhr.send();
              if (xhr.status === 200 && MODERN_COLOR_RE.test(xhr.responseText)) {
                const newTag = doc.createElement('style');
                newTag.textContent = replaceFn(xhr.responseText);
                link.parentNode?.replaceChild(newTag, link);
              }
            } catch {
              // 跨域或加载失败，跳过（html2canvas 会自行处理）
            }
          });

          // 打平行内样式（用 querySelectorAll 代替递归函数，避免 Terser 重命名冲突）
          // ⚠️ 不要定义命名函数！否则 Terser 会把外层函数和 onclone 的 doc 参数
          // 都压缩成 'A'，导致命名冲突 → 崩溃
          const bodyEl = doc.body;
          const bodyStyle = bodyEl.getAttribute('style') || '';
          if (MODERN_COLOR_RE.test(bodyStyle)) {
            bodyEl.setAttribute('style', replaceFn(bodyStyle));
          }
          bodyEl.querySelectorAll('*').forEach((el) => {
            const s = el.getAttribute('style') || '';
            if (MODERN_COLOR_RE.test(s)) {
              el.setAttribute('style', replaceFn(s));
            }
          });
        },
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Canvas toBlob 失败');

      if (
        navigator.share &&
        navigator.canShare({ files: [new File([blob], 'image.png', { type: 'image/png' })] })
      ) {
        await navigator.share({
          files: [new File([blob], `霸王梅_${currentDraw?.issue ?? 'unknown'}.png`, { type: 'image/png' })],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `霸王梅_${currentDraw?.issue ?? 'unknown'}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('保存图片失败:', err);
    } finally {
      setSavingImage(false);
    }
  }, [currentDraw]);

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#F7EED6' }}
    >
      {/* 左侧边栏 */}
      <Sidebar
        onCopy={handleCopy}
        onSaveImage={handleSaveImage}
        loading={loading}
        savingImage={savingImage}
      />

      {/* 主区域 */}
      <div className="flex-1 flex items-start justify-center py-6">
        <LotteryCard
          combos={combos}
          currentDraw={currentDraw}
          historyItems={historyItems}
          streak={streak}
          noHitStreak={noHitStreak}
          error={error}
        />
      </div>
    </div>
  );
}
      // 6. 转 Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
      });
      return blob;
    } finally {
      // 7. 清理克隆节点
      if (clone.parentNode) clone.parentNode.removeChild(clone);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    setShareStatus('生成图片中…');
    // 让 UI 先刷新提示文字，再执行阻塞渲染
    await new Promise((r) => setTimeout(r, 50));
    try {
      const blob = await renderCardToCanvas();
      if (!blob) throw new Error('render failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `霸王梅-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareStatus('已下载');
      setTimeout(() => setShareStatus(null), 1800);
    } catch (err) {
      setShareStatus(err instanceof Error ? `失败: ${err.message}` : '失败');
      setTimeout(() => setShareStatus(null), 2200);
    }
  }, [renderCardToCanvas]);

  const handleShare = useCallback(async () => {
    setShareStatus('生成图片中…');
    await new Promise((r) => setTimeout(r, 50));
    try {
      const blob = await renderCardToCanvas();
      if (!blob) throw new Error('render failed');

      // 尝试分享图片文件（iOS Safari / Chrome Android 支持）
      const file = new File([blob], `霸王梅-${Date.now()}.png`, {
        type: 'image/png',
      });
      const fileData: ShareData = {
        files: [file],
        title: '霸王梅 · 头尾参考',
        text: '排列五 · 43组头尾',
      };

      // 优先尝试文件分享
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare(fileData) &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share(fileData);
        setShareStatus('已调起分享面板');
      }
      // 降级：纯文本分享（部分 Android 浏览器不支持文件分享但支持文本分享）
      else if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        const textData: ShareData = {
          title: '霸王梅 · 头尾参考',
          text: '排列五 · 43组头尾参考',
          url: typeof window !== 'undefined' ? window.location.href : '',
        };
        await navigator.share(textData);
        setShareStatus('已调起分享面板');
      }
      // 最终降级：下载图片
      else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `霸王梅-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setShareStatus('已下载图片');
      }
      setTimeout(() => setShareStatus(null), 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (/abort|cancel/i.test(msg)) {
        setShareStatus(null);
        return;
      }
      setShareStatus(err instanceof Error ? `失败: ${msg}` : '失败');
      setTimeout(() => setShareStatus(null), 2200);
    }
  }, [renderCardToCanvas]);

  const onShareClick = useCallback(() => {
    // 移动端（iOS + Android）优先使用 navigator.share 调起系统分享面板
    // 桌面端走下载
    const isMobile =
      isIos() ||
      isStandalone() ||
      (typeof navigator !== 'undefined' &&
        /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    if (isMobile) {
      void handleShare();
    } else {
      void handleDownload();
    }
  }, [handleShare, handleDownload]);

  // ===== 复制功能：复制 43 组头尾 + 期号到剪贴板 =====
  const handleCopy = useCallback(async () => {
    if (picks.length === 0) return;
    const periodText = lastIssueResult ? `${Number(lastIssueResult.issue.issue) + 1}期` : '最新期';
    const pickText = picks.map((p) => p.pattern).join(' ');
    const header = `霸王梅 · ${periodText} · 43组头尾`;
    const fullText = `${header}\n${pickText}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        // Fallback: textarea + execCommand
        const ta = document.createElement('textarea');
        ta.value = fullText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyStatus('已复制');
    } catch {
      setCopyStatus('复制失败');
    }
    setTimeout(() => setCopyStatus(null), 1800);
  }, [picks, lastIssueResult]);

  // ===== 每晚 21:40 自动刷新开奖数据 =====
  useEffect(() => {
    if (!mounted) return;

    // 计算距离下一个北京时间 21:40 的毫秒数
    function msUntil2140(): number {
      const now = new Date();
      const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const target = new Date(Date.UTC(
        bjNow.getUTCFullYear(),
        bjNow.getUTCMonth(),
        bjNow.getUTCDate(),
        13, // 21:40 BJT = 13:40 UTC
        40,
        0,
        0,
      ));
      // 如果今天 21:40 已过，推到明天
      if (target.getTime() <= now.getTime()) {
        target.setUTCDate(target.getUTCDate() + 1);
      }
      return target.getTime() - now.getTime();
    }

    const delay = msUntil2140();
    const timer = setTimeout(() => {
      void loadIssues();
      // 之后每 24 小时刷新一次
      const daily = setInterval(() => void loadIssues(), 24 * 60 * 60 * 1000);
      // 存储 interval id 以便清理
      dailyRef.current = daily;
    }, delay);

    return () => clearTimeout(timer);
  }, [mounted, loadIssues]);

  

  const dailyRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理 daily interval
  useEffect(() => {
    return () => {
      if (dailyRef.current) clearInterval(dailyRef.current);
    };
  }, []);

  // ===== 渲染 =====
  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: COLORS.bg, color: COLORS.text }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 sm:flex-row sm:px-6 sm:py-10">
        {/* ===== 左侧：功能区 ===== */}
        <aside className="flex w-full shrink-0 flex-col gap-4 sm:w-48 sm:pt-2">
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              style={{
                backgroundColor: COLORS.highlight,
                color: '#FFFFFF',
                fontFamily: kaitiFamily,
                borderRadius: 4,
              }}
              onClick={onShareClick}
              disabled={!mounted || picks.length === 0}
            >
              保存图片分享
            </Button>
            <Button
              variant="outline"
              className="w-full"
              style={{
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardBg,
                color: COLORS.text,
                fontFamily: kaitiFamily,
                borderRadius: 4,
              }}
              onClick={handleCopy}
              disabled={!mounted || picks.length === 0}
            >
              {copyStatus ?? '复制'}
            </Button>
          </div>

          {shareStatus && (
            <div
              className="rounded border px-3 py-2 text-center text-sm"
              style={{
                borderColor: COLORS.borderSoft,
                backgroundColor: COLORS.bg,
                color: COLORS.text,
                fontFamily: kaitiFamily,
              }}
            >
              {shareStatus}
            </div>
          )}
        </aside>

        {/* ===== 右侧：预览区（固定宽度 888px 保证截图比例与电脑端一致） ===== */}
        <div className="flex min-w-0 flex-1 justify-center overflow-hidden">
        <div
          style={{
            width: 888,
            transform: cardScale < 1 ? `scale(${cardScale})` : undefined,
            transformOrigin: 'top center',
            // 缩放后容器实际占用高度 = 内容高度 × scale
            marginBottom: cardScale < 1 ? `-${(1 - cardScale) * 100}%` : undefined,
          }}
        >
        <div ref={cardRef} className="flex flex-col items-stretch" style={{ width: 888, minWidth: 888, flexShrink: 0 }}>
          {/* 预览区页头图片 */}
          <div className="relative w-full" style={{ aspectRatio: '1536 / 450', backgroundColor: '#F7EED6' }}>
            <img
              ref={headerImgRef}
              src="ss.jpg"
              alt="霸王梅 预览区页头"
              className="block h-full w-full select-none rounded-t-md object-cover"
              draggable={false}
              onLoad={() => setHeaderLoaded(true)}
              onError={() => setHeaderLoaded(true)}
              style={{ display: 'block' }}
            />
          </div>

          {/* 卡片 */}
          <section
            className="relative w-full overflow-hidden shadow-sm"
            style={{
              backgroundColor: COLORS.cardBg,
              borderColor: COLORS.border,
            }}
          >
            {/* 头部区：期号 + 状态标签 */}
            <header className="px-4 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
              <div className="mx-auto flex max-w-md items-center justify-center gap-3">
                <span className="h-px flex-1" style={{ backgroundColor: COLORS.border, opacity: 0.6 }} />
                <span
                  className="text-2xl font-bold sm:text-3xl"
                  style={{ color: COLORS.text, fontFamily: kaitiFamily }}
                >
                  {loadingIssue && '加载中…'}
                  {!loadingIssue && issueError && issueError}
                  {!loadingIssue && !issueError && lastIssueResult && `${Number(lastIssueResult.issue.issue) + 1}期`}
                </span>
                <span className="h-px flex-1" style={{ backgroundColor: COLORS.border, opacity: 0.6 }} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {streak.kind === 'hot' && (
                  <span
                    className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-xl font-extrabold shadow-lg sm:text-2xl"
                    style={{
                      backgroundColor: COLORS.highlight,
                      color: '#FFFFFF',
                      fontFamily: kaitiFamily,
                      letterSpacing: '0.1em',
                      boxShadow: '0 4px 12px rgba(196, 90, 67, 0.4)',
                      border: '2px solid #FFFFFF',
                    }}
                  >
                    <span className="text-2xl sm:text-3xl">🔥</span>
                    连爆{streak.count}期
                  </span>
                )}
                {streak.kind === 'cold' && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-5 py-2.5 text-lg shadow-md sm:text-xl"
                    style={{
                      backgroundColor: COLORS.borderSoft,
                      color: '#FFFFFF',
                      fontFamily: kaitiFamily,
                      letterSpacing: '0.1em',
                    }}
                  >
                    最近数据不稳，谨慎参考
                  </span>
                )}
              </div>
            </header>

            {/* 43 组头尾 */}
            <section className="px-4 pb-4 sm:px-8 sm:pb-5">
              <div className="grid grid-cols-5 gap-x-2 gap-y-1 text-center sm:gap-x-3 sm:gap-y-2">
                {picks.map((p) => {
                  const isCurrentHit =
                    lastIssueResult?.matched.some((m) => m.id === p.id) ?? false;
                  const pastHit = hitStats.get(p.key) || 0;
                  const d0 = p.pattern[0];
                  const d3 = p.pattern[3];
                  return (
                    <div
                      key={p.id}
                      className="relative inline-flex items-baseline justify-center rounded py-1.5"
                      style={{
                        fontFamily: monoFamily,
                        backgroundColor: 'transparent',
                      }}
                      title={pastHit > 0 ? `历史命中 ${pastHit} 次` : undefined}
                    >
                      <span
                        className="text-xl font-bold sm:text-2xl"
                        style={{ color: COLORS.text }}
                      >
                        {d0}
                      </span>
                      <span
                        className="mx-1 text-xl font-bold sm:text-2xl"
                        style={{ color: COLORS.text }}
                      >
                        xx
                      </span>
                      <span
                        className="text-xl font-bold sm:text-2xl"
                        style={{ color: COLORS.text }}
                      >
                        {d3}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 往期历史 */}
            <section className="px-4 pb-6 sm:px-8">
              <div
                className="rounded-md p-4 sm:p-5"
                style={{
                  borderWidth: '2px',
                  borderColor: COLORS.border,
                  backgroundColor: 'rgba(255,255,255,0.45)',
                }}
              >
                <div className="mb-3 flex items-center justify-between border-b-2 pb-2"
                  style={{ borderColor: COLORS.borderSoft }}
                >
                  <h2
                    className="text-lg font-extrabold sm:text-xl"
                    style={{ color: COLORS.text, fontFamily: kaitiFamily, letterSpacing: '0.15em' }}
                  >
                    往期历史
                  </h2>
                  <span
                    className="text-xs tracking-[0.2em] sm:text-sm"
                    style={{ color: COLORS.highlight, fontFamily: kaitiFamily, fontWeight: 600 }}
                  >
                    真实数据 绝无作假
                  </span>
                </div>
                {issues.length === 0 ? (
                  <p
                    className="rounded border border-dashed py-6 text-center text-sm"
                    style={{
                      borderColor: COLORS.borderSoft,
                      color: COLORS.textMuted,
                      fontFamily: kaitiFamily,
                    }}
                  >
                    正在加载往期历史...
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-sm" style={{ border: `1px solid ${COLORS.borderSoft}` }}>
                    <table className="w-full border-collapse">
                      <tbody>
                        {issues.slice(0, 8).map((iss, idx) => {
                          const key = `${iss.digits[0]}${iss.digits[3]}`;
                          const hit = picks.some((p) => p.key === key);
                          return (
                            <tr key={iss.issue}>
                              <td colSpan={3}>
                                <div
                                  className="flex items-center px-4 py-2.5 sm:px-5 sm:py-3"
                                  style={{
                                    backgroundColor: hit ? COLORS.hitBg : COLORS.cardBg,
                                    borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.borderSoft}`,
                                  }}
                                >
                                  {/* 期号 */}
                                  <span
                                    className="text-sm font-extrabold sm:text-base"
                                    style={{ color: COLORS.text, fontFamily: monoFamily, width: 100, flexShrink: 0 }}
                                  >
                                    {iss.issue}期
                                  </span>

                                  {/* 开奖号码 */}
                                  <div className="flex-1 text-center">
                                    {iss.digits.slice(0, 4).map((d, di) => {
                                      const isHitDigit = (di === 0 || di === 3) && hit;
                                      return (
                                        <span
                                          key={di}
                                          className="inline-block text-base tracking-[0.25em] sm:text-lg"
                                          style={{
                                            color: isHitDigit ? COLORS.highlight : COLORS.textMuted,
                                            fontFamily: monoFamily,
                                            fontWeight: isHitDigit ? 700 : 400,
                                            minWidth: '1.2em',
                                          }}
                                        >
                                          {d}
                                          {di < 3 && <span style={{ color: COLORS.borderSoft }}> </span>}
                                        </span>
                                      );
                                    })}
                                  </div>

                                  {/* 命中标记 */}
                                  <span
                                    className="inline-flex items-center justify-center rounded-sm text-xs font-extrabold sm:text-sm"
                                    style={{
                                      width: 30,
                                      height: 22,
                                      flexShrink: 0,
                                      ...(hit
                                        ? { backgroundColor: COLORS.highlight, color: '#FFFFFF' }
                                        : {
                                            border: `1px solid ${COLORS.borderSoft}`,
                                            backgroundColor: COLORS.cardBg,
                                            color: COLORS.textMuted,
                                          }),
                                    }}
                                  >
                                    {hit ? '中' : '无'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </section>
        </div>
        </div>
        </div>
      </div>
    </main>
  );
}
