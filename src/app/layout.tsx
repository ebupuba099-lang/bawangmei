import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: '霸王梅 · 43组头尾',
  description:
    '体彩时时彩头尾玩法查询工具 — 43组头尾组合，实时开奖，翻牌动画',
  keywords: ['霸王梅', '时时彩', '头尾', '彩票', '体彩', '43组头尾'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: '霸王梅 · 43组头尾',
    description: '体彩时时彩头尾玩法查询工具',
    locale: 'zh_CN',
    type: 'website',
  },
  title: {
    default: '霸王梅 · 排列五头尾参考',
    template: '%s | 霸王梅',
  },
  description:
    '排列五第一位和第四位组合 · 43组头尾随机生成 · 历史开奖命中匹配',
  keywords: [
    '排列五',
    '排列5',
    '头尾',
    '43组头尾',
    '霸王梅',
    '彩票',
    'AI 编程',
  ],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  generator: 'Coze Code',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '霸王梅 · 排列五头尾参考',
    description:
      '排列五第一位和第四位组合 · 43组头尾随机生成 · 历史开奖命中匹配',
    url: 'https://code.coze.cn',
    siteName: '霸王梅',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '霸王梅 - 排列五头尾参考',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
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
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
}
