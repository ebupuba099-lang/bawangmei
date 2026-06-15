'use client';

import type { DrawHistoryItem } from './LotteryCard';

interface HistoryTableProps {
  items: DrawHistoryItem[];
}

function formatNumbers(numbers: string): string {
  if (!numbers) return '';
  // 只显示前4位（第1~第4位，头尾玩法关注的位置）
  return numbers.slice(0, 4).split('').join(' ');
}

export default function HistoryTable({ items }: HistoryTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center text-xs text-[#BAB8B6] py-4">
        暂无往期数据
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const isHit = item.hasHit;
        return (
          <div
            key={item.issue}
            className={`
              flex items-center justify-between px-4 py-2.5 rounded-lg text-sm
              ${isHit ? 'bg-[#F8D9CF]/40' : 'bg-white/60'}
            `}
          >
            {/* 左侧：期号 */}
            <span className="text-[#5A3E2B] font-mono font-bold w-[70px]">
              {item.issue}期
            </span>

            {/* 中间：开奖号码 */}
            <span className="text-[#5A3E2B] font-mono tracking-[0.2em]">
              {formatNumbers(item.numbers)}
            </span>

            {/* 右侧：中/无 标识 */}
            {isHit ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 flex items-center justify-center bg-[#C45A43] rounded text-white text-[10px] font-bold">
                  中
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 flex items-center justify-center border border-[#BAB8B6] rounded text-[#BAB8B6] text-[10px]">
                  无
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}