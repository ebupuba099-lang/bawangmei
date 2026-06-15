'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
      break;
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
  const cardRef = useRef<HTMLDivElement | null>(null);

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

  // ---- 保存图片：克隆节点 + html2canvas ----
  const handleSaveImage = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setSavingImage(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('lottery-card');
      if (!el) throw new Error('卡片未挂载');

      // 克隆节点插入可视区域
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

      // 等待克隆中的图片加载
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

      // 等两帧完成布局
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // 现代 CSS 颜色函数清理（html2canvas 不支持 lab/oklch/lch）
      const MODERN_COLOR_RE = /(?:lab|oklch|lch|color-mix)\(/;
      const replaceFn = (text: string): string =>
        text
          .replace(/lab\([^)]+\)/g, '#F7EED6')
          .replace(/oklch\([^)]+\)/g, '#F7EED6')
          .replace(/lch\([^)]+\)/g, '#F7EED6')
          .replace(/color-mix\([^)]+\)/g, '#F7EED6');

      const canvas = await html2canvas(clone, {
        backgroundColor: '#F7EED6',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: 888,
        windowWidth: 888,
        onclone: (doc: Document) => {
          doc.querySelectorAll('style').forEach((tag) => {
            const text = tag.textContent || '';
            if (!MODERN_COLOR_RE.test(text)) return;
            const newTag = doc.createElement('style');
            newTag.textContent = replaceFn(text);
            tag.parentNode?.replaceChild(newTag, tag);
          });
          doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
            const href = (link as HTMLLinkElement).href;
            if (!href) return;
            try {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', href, false);
              xhr.send();
              if (xhr.status === 200 && MODERN_COLOR_RE.test(xhr.responseText)) {
                const newTag = doc.createElement('style');
                newTag.textContent = replaceFn(xhr.responseText);
                link.parentNode?.replaceChild(newTag, link);
              }
            } catch { /* 跨域跳过 */ }
          });
          // 行内样式
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

      document.body.removeChild(clone);

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

  // ---- 渲染 ----
  return (
    <div className="flex min-h-screen bg-[#F7EED6]">
      {/* 左侧边栏 */}
      <Sidebar
        onCopy={handleCopy}
        onSaveImage={handleSaveImage}
        loading={loading}
        savingImage={savingImage}
      />

      {/* 主区域 */}
      <main className="flex-1 flex justify-center items-start py-8">
        <LotteryCard
          ref={cardRef}
          combos={combos}
          currentDraw={currentDraw}
          historyItems={historyItems}
          streak={streak}
          noHitStreak={noHitStreak}
          error={error}
        />
      </main>
    </div>
  );
}