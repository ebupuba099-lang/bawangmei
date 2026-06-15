import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '霸王梅 · 排列五头尾参考',
  description:
    '排列五第一位和第四位组合 · 43组头尾随机生成 · 历史开奖命中匹配',
  keywords: ['排列五', '排列5', '头尾', '43组头尾', '霸王梅', '彩票'],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  openGraph: {
    title: '霸王梅 · 排列五头尾参考',
    description:
      '排列五第一位和第四位组合 · 43组头尾随机生成 · 历史开奖命中匹配',
    url: 'https://code.coze.cn',
    siteName: '霸王梅',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}