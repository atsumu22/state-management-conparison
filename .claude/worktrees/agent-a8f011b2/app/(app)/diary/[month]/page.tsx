import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  isValidMonthParam,
  formatMonthLabel,
  groupByDate,
} from "@/lib/diary";
import type { StampInfo } from "@/lib/diary";
import type { Database } from "@/types/database";
import DiaryDetail from "@/components/features/diary/DiaryDetail";

type ViewRow = Database["public"]["Views"]["my_and_partner_diaries"]["Row"];
type StampRow = Database["public"]["Tables"]["stamps"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type Props = {
  params: Promise<{ month: string }>;
};

export default async function DiaryMonthPage({ params }: Props) {
  const { month } = await params;

  // バリデーション
  if (!isValidMonthParam(month)) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  // 対象月の開始・終了日を計算
  const startDate = `${month}-01`;
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  // 翌月の1日を計算して終了日とする
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01`;

  // my_and_partner_diaries ビューから対象月の公開済み日記を取得
  const { data: rawDiaries } = await supabase
    .from("my_and_partner_diaries")
    .select("*")
    .gte("diary_date", startDate)
    .lt("diary_date", endDate)
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("diary_date", { ascending: true });

  const diaries = (rawDiaries ?? []) as ViewRow[];

  // 日記IDリストからスタンプを取得
  const diaryIds = diaries.map((d) => d.id);

  const stampsMap = new Map<string, StampInfo[]>();
  if (diaryIds.length > 0) {
    const { data: rawStamps } = await supabase
      .from("stamps")
      .select("*")
      .in("diary_entry_id", diaryIds);

    const stamps = (rawStamps ?? []) as StampRow[];

    if (stamps.length > 0) {
      // スタンプのuser_idからユーザー名を取得
      const userIds = [...new Set(stamps.map((s) => s.user_id))];
      const { data: rawProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profiles = (rawProfiles ?? []) as ProfileRow[];

      const profileMap = new Map<string, string>();
      for (const p of profiles) {
        profileMap.set(p.id, p.name);
      }

      for (const stamp of stamps) {
        const key = stamp.diary_entry_id;
        if (!stampsMap.has(key)) {
          stampsMap.set(key, []);
        }
        stampsMap.get(key)!.push({
          emoji: stamp.emoji,
          userName: profileMap.get(stamp.user_id) ?? "不明",
        });
      }
    }
  }

  const dayGroups = groupByDate(diaries, stampsMap);
  const monthLabel = formatMonthLabel(month);

  return <DiaryDetail monthLabel={monthLabel} dayGroups={dayGroups} />;
}
