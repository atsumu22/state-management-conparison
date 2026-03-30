import { X } from "lucide-react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { aggregateByMonth } from "@/lib/diary";
import DiaryMonthList from "@/components/features/diary/DiaryMonthList";

export default async function DiaryPage() {
  const supabase = await createServerSupabaseClient();

  // 公開済みの日記を取得（自分＋パートナー）
  const now = new Date().toISOString();
  const { data: diaries } = await supabase
    .from("diary_entries")
    .select("*")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("diary_date", { ascending: false });

  const months = aggregateByMonth(diaries ?? []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>📖</span> 日記帳
          </h2>
          <Link
            href="/"
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition"
          >
            <X className="w-6 h-6 text-white" />
          </Link>
        </div>
      </div>

      {/* 月リスト */}
      <DiaryMonthList months={months} />
    </div>
  );
}
