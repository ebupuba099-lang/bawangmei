'use client';

import type { HeadTailCombo } from '@/lib/types';
import { layoutGrid } from '@/lib/lottery';

interface ComboGridProps {
  combos: HeadTailCombo[];
}

/** 格式化组合标签：0xx5 → 0 xx 5 */
function formatLabel(label: string): string {
  if (label.length !== 4) return label;
  return `${label[0]} ${label[1]}${label[2]} ${label[3]}`;
}

export default function ComboGrid({ combos }: ComboGridProps) {
  const rows = layoutGrid(combos);

  return (
    <div className="w-full">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-3 mb-2 justify-center">
          {row.map((combo) => (
            <div
              key={combo.label}
              className="w-[80px] h-[38px] flex items-center justify-center text-sm tracking-[0.15em] text-[#5A3E2B] select-none"
            >
              {formatLabel(combo.label)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}