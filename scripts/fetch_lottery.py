#!/usr/bin/env python3
"""
<<<<<<< HEAD
体彩时时彩开奖数据采集脚本
主: sporttery.cn 体彩官方 API
备: 灰鸟 API（容灾）
输出: public/data/lottery_data.json
"""

import json
import urllib.request
import urllib.error
import ssl
import sys
import os
from datetime import datetime, timezone, timedelta

# 北京时区
BJT = timezone(timedelta(hours=8))
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")


def fetch_sporttery(count=20):
    """从体彩官方 API 获取数据（与前端 data.ts 同源）"""
    url = f"https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=350133&provinceId=0&pageSize={count}&is11=0"

    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
    })

    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        draw_list = data.get("value", {}).get("list", [])
        if len(draw_list) > 0:
            draws = []
            for d in draw_list:
                draws.append({
                    "issue": d["lotteryDrawNum"],
                    "numbers": d["lotteryDrawResult"].replace(" ", ""),
                    "time": d["lotteryDrawTime"],
                })
            return draws
        return None
    except Exception as e:
        print(f"[sporttery] 请求失败: {e}", file=sys.stderr)
        return None


def fetch_huiluan(count=20):
    """从灰鸟 API 获取数据（容灾，与前端 data.ts 同源）"""
    url = f"http://api.huiniao.top/interface/home/lotteryHistory?type=plw&page=1&limit={count}"

    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
    })

    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("code") == 1 and "data" in data:
            list_data = data["data"].get("data", {}).get("list", [])
            if len(list_data) > 0:
                draws = []
                for d in list_data:
                    draws.append({
                        "issue": d["code"],
                        "numbers": f"{d['one']}{d['two']}{d['three']}{d['four']}{d['five']}",
                        "time": d["open_time"],
                    })
                return draws
        return None
    except Exception as e:
        print(f"[huiluan] 请求失败: {e}", file=sys.stderr)
        return None


def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    output_path = os.path.join(PUBLIC_DIR, "lottery_data.json")

    print(f"[fetch] 开始获取时时彩数据...")
    print(f"[fetch] 输出路径: {output_path}")

    # 主通道
    draws = fetch_sporttery()
    source = "sporttery"

    # 备用通道
    if not draws or len(draws) == 0:
        print("[fetch] 主通道失败，尝试备用通道...")
        draws = fetch_huiluan()
        source = "huiluan"

    if draws and len(draws) > 0:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(draws, f, ensure_ascii=False, indent=2)
        print(f"[fetch] ✅ 成功从 {source} 获取 {len(draws)} 条数据")
        print(f"[fetch] 最新期号: {draws[0]['issue']} 号码: {draws[0]['numbers']}")
    else:
        print("[fetch] ❌ 所有数据源均失败")
        # 保留旧数据，不覆盖
        if os.path.exists(output_path):
            print("[fetch] 保留已有数据文件")
        sys.exit(1)
=======
排列五开奖数据采集
体彩官方 API(主) + 灰鸟 API(容灾) 双保险
每日 21:40 (北京时间) 由 GitHub Actions 触发
"""

import json
import os
import sys
import time
import urllib.request

# ---------- 路径 ----------
# Next.js 静态导出: public/data/lottery_data.json
# 脚本从仓库根目录执行，public 在根目录下
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
PUBLIC_DATA_DIR = os.path.join(PROJECT_DIR, "public", "data")
DATA_FILE = os.path.join(PUBLIC_DATA_DIR, "lottery_data.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    "Accept": "application/json, text/plain, */*",
}


def fetch_sporttery(limit: int = 10) -> list[dict]:
    """体彩官方 API"""
    url = (
        "https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry"
        f"?gameNo=350133&provinceId=0&pageSize={limit}&is11=0"
    )
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    # 体彩返回结构: result -> [ {lotteryDrawNum, lotteryDrawResult, lotteryDrawTime, ...} ]
    items = raw.get("result", raw.get("value", []))
    if not items and isinstance(raw, list):
        items = raw

    normalized = []
    for item in items:
        issue = item.get("lotteryDrawNum", item.get("issue", ""))
        draw_result = item.get(
            "lotteryDrawResult", item.get("frontWinningNum", "")
        )
        draw_time = item.get(
            "lotteryDrawTime", item.get("openTime", "")
        )

        if not issue or not draw_result:
            continue

        parts = (
            draw_result.replace(",", " ").replace("|", " ").replace("+", " ").split()
        )
        digits = [int(n) for n in parts if n.strip().isdigit()]
        if len(digits) < 5:
            continue

        normalized.append(
            {
                "issue": str(issue).strip(),
                "openTime": str(draw_time).strip()[:10],
                "week": item.get("week", ""),
                "digits": digits[:5],
                "headTail": {
                    "first": digits[0],
                    "fourth": digits[3],
                    "key": f"{digits[0]}{digits[3]}",
                },
            }
        )

    if not normalized:
        raise ValueError("体彩API返回空数据")
    return normalized


def fetch_huiniao(limit: int = 10) -> list[dict]:
    """灰鸟 API (容灾)"""
    url = f"http://api.huiniao.top/interface/home/lotteryHistory?type=plw&page=1&limit={limit}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    # 灰鸟返回结构: { code:200, data:{list:[...]} }
    data = raw.get("data", raw)
    if isinstance(data, dict):
        items = data.get("list", data.get("rows", []))
    elif isinstance(data, list):
        items = data
    else:
        items = []

    normalized = []
    for item in items:
        issue = item.get("issue", item.get("expect", ""))
        open_code = item.get(
            "openCode",
            item.get("frontWinningNum", item.get("opencode", "")),
        )
        open_time = item.get(
            "openTime",
            item.get("time", item.get("openTime", "")),
        )

        if not issue or not open_code:
            continue

        parts = open_code.replace(",", " ").replace("|", " ").split()
        digits = [int(n) for n in parts if n.strip().isdigit()]
        if len(digits) < 5:
            continue

        normalized.append(
            {
                "issue": str(issue).strip()[-5:],
                "openTime": str(open_time).strip()[:10],
                "week": item.get("week", ""),
                "digits": digits[:5],
                "headTail": {
                    "first": digits[0],
                    "fourth": digits[3],
                    "key": f"{digits[0]}{digits[3]}",
                },
            }
        )

    if not normalized:
        raise ValueError("灰鸟API返回空数据")
    return normalized


def main():
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)

    issues = []
    errors = []

    # 主: 体彩官方
    try:
        issues = fetch_sporttery()
        source = "sporttery"
        print(f"✅ 体彩API 获取 {len(issues)} 期")
    except Exception as e:
        errors.append(f"体彩API失败: {e}")
        print(f"⚠️ {errors[-1]}")
        # 容灾: 灰鸟
        try:
            issues = fetch_huiniao()
            source = "huiniao"
            print(f"✅ 灰鸟API 获取 {len(issues)} 期")
        except Exception as e2:
            errors.append(f"灰鸟API也失败: {e2}")
            print(f"❌ {errors[-1]}")
            # 如果已有旧数据，保留
            if os.path.exists(DATA_FILE):
                print("⚠️ 保留旧数据文件")
                return
            sys.exit(1)

    payload = {
        "source": source,
        "data": issues,
        "lastUpdate": int(time.time() * 1000),
    }

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    print(f"✅ 写入 {len(issues)} 条到 {DATA_FILE}")
>>>>>>> f2489fbff9d043b08412c8207f533099dbe402e1


if __name__ == "__main__":
    main()