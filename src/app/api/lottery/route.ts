import { NextRequest, NextResponse } from 'next/server';
import { fetchLotteryData, fetchIssueByCode } from '@/lib/lottery-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const issue = url.searchParams.get('issue');
  const count = Number.parseInt(url.searchParams.get('count') ?? '10', 10);

  try {
    if (issue) {
      const detail = await fetchIssueByCode(issue);
      if (!detail) {
        return NextResponse.json(
          { error: 'issue_not_found', message: '期号未找到' },
          { status: 404 },
        );
      }
      return NextResponse.json({ source: 'zhcw', data: detail });
    }

    const safeCount = Math.max(1, Math.min(50, count || 10));
    const list = await fetchLotteryData(safeCount);
    return NextResponse.json({ source: 'zhcw', data: list });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json(
      {
        error: 'fetch_failed',
        message,
        hint: '请稍后重试',
      },
      { status: 500 },
    );
  }
}
