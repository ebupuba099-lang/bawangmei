'use client';

import { Copy, ImageIcon } from 'lucide-react';

interface SidebarProps {
  onCopy: () => void;
  onSaveImage: () => void;
  loading: boolean;
  savingImage: boolean;
}

export default function Sidebar({
  onCopy,
  onSaveImage,
  loading,
  savingImage,
}: SidebarProps) {
  const buttons = [
    {
      label: '复制',
      icon: Copy,
      onClick: onCopy,
      disabled: loading,
    },
    {
      label: savingImage ? '生成中…' : '保存图片分享',
      icon: ImageIcon,
      onClick: onSaveImage,
      disabled: loading || savingImage,
    },
  ];

  return (
    <aside className="w-[192px] shrink-0 flex flex-col items-center gap-3 pt-8 px-3">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={`
            w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
            text-sm font-medium transition-all duration-200 backdrop-blur-sm
            ${
              btn.disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-black/5 active:scale-[0.97] cursor-pointer'
            }
            text-[#5A3E2B] bg-white/60 border border-[#B59A7A]/30
          `}
        >
          <btn.icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{btn.label}</span>
        </button>
      ))}
    </aside>
  );
}