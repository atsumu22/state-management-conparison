"use client";

import Link from "next/link";
import { ChevronLeft, Smile } from "lucide-react";
import type { DayGroup } from "@/lib/diary";
import { formatTime } from "@/lib/diary";

type DiaryDetailProps = {
  monthLabel: string;
  dayGroups: DayGroup[];
};

export default function DiaryDetail({
  monthLabel,
  dayGroups,
}: DiaryDetailProps) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "linear-gradient(to bottom, #fef3c7, #fef9e3)" }}
    >
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 shadow-xl flex items-center gap-4">
        <Link
          href="/diary"
          className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <h2 className="text-2xl font-bold text-white">{monthLabel}</h2>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {dayGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-gray-500 text-lg">
                この月の日記はありません
              </p>
            </div>
          ) : (
            dayGroups.map((dayData) => (
              <div key={dayData.dateISO} className="mb-12">
                {/* 日付セパレーター */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <div className="px-6 py-2 bg-white rounded-full border-2 border-amber-400 shadow-lg">
                    <span className="text-sm font-bold text-amber-900">
                      {dayData.dateLabel}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </div>

                {/* 日記エントリ */}
                {dayData.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="mb-6 bg-white rounded-2xl p-6 shadow-xl border-l-4 border-amber-500 hover:shadow-2xl transition-shadow"
                  >
                    {/* 著者名 + 時刻 */}
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="font-bold text-gray-800 text-xl">
                        {entry.userName}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>

                    {/* 本文 */}
                    <p
                      className="text-gray-700 mb-5 leading-relaxed text-lg"
                      style={{
                        fontFamily:
                          entry.authorType === "me"
                            ? "var(--font-noto-serif-jp), 'Noto Serif JP', serif"
                            : "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif",
                      }}
                    >
                      {entry.content}
                    </p>

                    {/* スタンプ表示 */}
                    {entry.stamps.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {entry.stamps.map((stamp, stampIdx) => (
                          <span
                            key={stampIdx}
                            className="text-sm bg-amber-100 px-4 py-2 rounded-full border border-amber-300 font-medium"
                          >
                            {stamp.emoji} {stamp.userName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* スタンプを送るボタン（表示のみ、フェーズ3で実装） */}
                    <button
                      type="button"
                      disabled
                      className="text-sm text-amber-700 flex items-center gap-2 font-bold px-4 py-2 bg-amber-50 rounded-xl opacity-60 cursor-not-allowed"
                    >
                      <Smile className="w-4 h-4" />
                      スタンプを送る
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
