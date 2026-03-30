"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { MonthSummary } from "@/lib/diary";

type DiaryMonthListProps = {
  months: MonthSummary[];
};

export default function DiaryMonthList({ months }: DiaryMonthListProps) {
  if (months.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">📔</div>
          <p className="text-gray-500 text-lg">
            まだ公開された日記はありません
          </p>
          <p className="text-gray-400 text-sm mt-2">
            翌月1日に日記が公開されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-4">
        {months.map((item) => (
          <Link
            key={item.month}
            href={`/diary/${item.month}`}
            className="block bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-amber-200 hover:border-amber-400 hover:-translate-y-1 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  📔
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {item.label}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {item.count}件の日記
                </div>
              </div>
              <div className="text-gray-300 group-hover:text-gray-400 transition">
                <ChevronLeft className="w-8 h-8 rotate-180" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-400 font-medium">
        カレンダーに戻る →
      </div>
    </div>
  );
}
