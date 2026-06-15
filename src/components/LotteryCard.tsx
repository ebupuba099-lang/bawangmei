'use client';

import { forwardRef } from 'react';
import type { HeadTailCombo, LotteryDraw } from '@/lib/types';
import ComboGrid from './ComboGrid';
import HistoryTable from './HistoryTable';

export interface DrawHistoryItem {
  issue: string;
  numbers: string;
  time: string;
  hasHit: boolean;
}

interface LotteryCardProps {
  combos: HeadTailCombo[];
  currentDraw: LotteryDraw | null;
  historyItems: DrawHistoryItem[];
  streak: number;
  noHitStreak: number;
  error: string | null;
}

const LotteryCard = forwardRef<HTMLDivElement, LotteryCardProps>(
  function LotteryCard(
    { combos, currentDraw, historyItems, streak, noHitStreak, error },
    ref
  ) {
    // 状态标签
    const statusLabel =
      streak >= 3
        ? `🔥 连爆${streak}期`
        : noHitStreak >= 5
          ? '数据不稳'
          : '';

    return (
      <div
        ref={ref}
        id="lottery-card"
        className="w-[888px] overflow-hidden"
      >
        {/* ===== 顶部 Header：水墨背景 ===== */}
        <div className="relative bg-gradient-to-b from-[#F7EED6] via-[#F2E6CE] to-[#FCF5E2] overflow-hidden rounded-t-2xl border border-[#B59A7A]/40 border-b-0">
          {/* 水墨山水纹理 */}
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 40% at 20% 30%, rgba(100,80,60,0.3) 0%, transparent 70%),
              radial-gradient(ellipse 50% 35% at 85% 40%, rgba(120,100,80,0.2) 0%, transparent 60%),
              radial-gradient(ellipse 40% 30% at 50% 60%, rgba(90,70,50,0.15) 0%, transparent 50%),
              radial-gradient(ellipse 70% 20% at 30% 80%, rgba(80,60,40,0.1) 0%, transparent 60%),
              radial-gradient(ellipse 30% 50% at 70% 20%, rgba(110,90,70,0.15) 0%, transparent 50%)
            `,
          }} />

          {/* 左侧梅花枝干 SVG */}
          <div className="absolute left-2 top-0 bottom-0 w-20 pointer-events-none opacity-70">
            <svg viewBox="0 0 80 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M45 400 Q40 320 35 260 Q30 200 38 150 Q45 100 40 60 Q36 30 42 10"
                stroke="#5A3E2B" strokeWidth="2.5" fill="none" opacity="0.6"/>
              <path d="M38 200 Q25 185 15 170" stroke="#5A3E2B" strokeWidth="1.8" fill="none" opacity="0.5"/>
              <path d="M38 150 Q50 135 60 120" stroke="#5A3E2B" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <path d="M40 260 Q55 250 65 240" stroke="#5A3E2B" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <circle cx="15" cy="168" r="5" fill="#C45A43" opacity="0.8"/>
              <circle cx="15" cy="168" r="2.5" fill="#E9D5D8" opacity="0.6"/>
              <circle cx="60" cy="118" r="4.5" fill="#C45A43" opacity="0.7"/>
              <circle cx="60" cy="118" r="2.2" fill="#E9D5D8" opacity="0.5"/>
              <circle cx="65" cy="238" r="4" fill="#C45A43" opacity="0.65"/>
              <circle cx="42" cy="8" r="4.5" fill="#C45A43" opacity="0.75"/>
              <circle cx="42" cy="8" r="2.2" fill="#E9D5D8" opacity="0.5"/>
              <circle cx="30" cy="95" r="3.5" fill="#C45A43" opacity="0.6"/>
            </svg>
          </div>

          {/* 右侧梅花枝干 SVG */}
          <div className="absolute right-2 top-0 bottom-0 w-20 pointer-events-none opacity-70">
            <svg viewBox="0 0 80 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M35 400 Q40 320 45 260 Q50 200 42 150 Q35 100 40 60 Q44 30 38 10"
                stroke="#5A3E2B" strokeWidth="2.5" fill="none" opacity="0.6"/>
              <path d="M42 200 Q55 185 65 170" stroke="#5A3E2B" strokeWidth="1.8" fill="none" opacity="0.5"/>
              <path d="M42 150 Q30 135 20 120" stroke="#5A3E2B" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <path d="M40 260 Q25 250 15 240" stroke="#5A3E2B" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <circle cx="65" cy="168" r="5" fill="#C45A43" opacity="0.8"/>
              <circle cx="65" cy="168" r="2.5" fill="#E9D5D8" opacity="0.6"/>
              <circle cx="20" cy="118" r="4.5" fill="#C45A43" opacity="0.7"/>
              <circle cx="20" cy="118" r="2.2" fill="#E9D5D8" opacity="0.5"/>
              <circle cx="15" cy="238" r="4" fill="#C45A43" opacity="0.65"/>
              <circle cx="38" cy="8" r="4.5" fill="#C45A43" opacity="0.75"/>
              <circle cx="38" cy="8" r="2.2" fill="#E9D5D8" opacity="0.5"/>
              <circle cx="50" cy="95" r="3.5" fill="#C45A43" opacity="0.6"/>
            </svg>
          </div>

          {/* 内容 */}
          <div className="relative z-10 px-12 pt-10 pb-6 flex flex-col items-center">
            {/* 主标题 - 毛笔书法 */}
            <h1
              className="text-6xl font-bold tracking-[0.35em] text-[#5A3E2B] mb-3"
              style={{ fontFamily: 'STKaiti, KaiTi, serif' }}
            >
              霸王梅
            </h1>

            {/* 副标题圆角框 */}
            <div className="mb-4">
              <span className="inline-block px-5 py-1 text-sm text-[#7A5D4A] border border-[#7A5D4A] rounded-full tracking-wider">
                43组头尾
              </span>
            </div>
          </div>
        </div>

        {/* ===== 核心内容区 ===== */}
        <div className="bg-[#FCF5E2] border-x border-[#B59A7A]/40 px-10 py-5">
          {/* 期号，两侧横线装饰 */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-[1px] flex-1 max-w-[80px] bg-[#B59A7A]/40" />
            <span className="text-base font-bold text-[#5A3E2B] tracking-wider font-mono">
              {currentDraw ? `${parseInt(currentDraw.issue) + 1}期` : '加载中…'}
            </span>
            <div className="h-[1px] flex-1 max-w-[80px] bg-[#B59A7A]/40" />
          </div>

          {/* 状态胶囊标签 */}
          {statusLabel && (
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: streak >= 3 ? '#C45A43' : '#BAB8B6' }}
              >
                {statusLabel}
              </span>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="text-center text-sm text-[#C45A43] mb-3">{error}</div>
          )}

          {/* 43组头尾网格 — 全部显示，无动画 */}
          <div className="mb-5">
            <ComboGrid combos={combos} />
          </div>
        </div>

        {/* ===== 底部历史记录区（最多4期） ===== */}
        <div className="bg-[#FCF5E2] border border-[#B59A7A]/40 rounded-b-2xl px-10 py-5">
          {/* 表头：往期历史 + 标语 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#7A5D4A]">往期历史</h3>
            <span className="text-[11px] text-[#C45A43]">真实数据 绝无作假</span>
          </div>

          <HistoryTable items={historyItems} />

          {/* 页脚 */}
          <div className="mt-4 pt-3 border-t border-[#B59A7A]/20 text-center text-[10px] text-[#B59A7A]/60">
            数据来源：中国体育彩票 · 时时彩 · 仅供娱乐参考
          </div>
        </div>
      </div>
    );
  }
);

export default LotteryCard;