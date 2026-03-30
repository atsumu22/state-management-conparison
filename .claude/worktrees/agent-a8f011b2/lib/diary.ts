import type { Database } from "@/types/database";

type DiaryRow = Database["public"]["Tables"]["diary_entries"]["Row"];
type MyAndPartnerDiaryRow =
  Database["public"]["Views"]["my_and_partner_diaries"]["Row"];

/**
 * 公開済み月ごとの日記件数を表す型
 */
export type MonthSummary = {
  /** "YYYY-MM" 形式 */
  month: string;
  /** 表示用ラベル（例: "2026年2月"） */
  label: string;
  /** その月の公開済み日記件数 */
  count: number;
};

/**
 * 日付ごとにグループ化された日記エントリ
 */
export type DayGroup = {
  /** 日付文字列（例: "1月15日"） */
  dateLabel: string;
  /** ISO 日付文字列（ソート用） */
  dateISO: string;
  /** その日の日記エントリ一覧 */
  entries: DiaryEntryWithStamps[];
};

/**
 * スタンプ付き日記エントリ
 */
export type DiaryEntryWithStamps = {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  authorType: "me" | "partner";
  diaryDate: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
  stamps: StampInfo[];
};

/**
 * スタンプ情報
 */
export type StampInfo = {
  emoji: string;
  userName: string;
};

/**
 * diary_entries の行データから、公開済みの月ごとの集計を行う
 */
export function aggregateByMonth(diaries: DiaryRow[]): MonthSummary[] {
  const monthMap = new Map<string, number>();

  for (const diary of diaries) {
    // diary_date は "YYYY-MM-DD" 形式
    const month = diary.diary_date.substring(0, 7); // "YYYY-MM"
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  const summaries: MonthSummary[] = [];
  for (const [month, count] of monthMap.entries()) {
    summaries.push({
      month,
      label: formatMonthLabel(month),
      count,
    });
  }

  // 新しい月から順にソート
  summaries.sort((a, b) => b.month.localeCompare(a.month));
  return summaries;
}

/**
 * "YYYY-MM" を "YYYY年M月" 形式に変換する
 */
export function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  return `${year}年${m}月`;
}

/**
 * 日付文字列 "YYYY-MM-DD" を "M月D日" 形式に変換する
 */
export function formatDateLabel(dateStr: string): string {
  const [, monthStr, dayStr] = dateStr.split("-");
  const m = parseInt(monthStr, 10);
  const d = parseInt(dayStr, 10);
  return `${m}月${d}日`;
}

/**
 * 日記エントリの作成時刻からHH:mm形式の時刻文字列を返す
 */
export function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * my_and_partner_diaries ビューの結果を日付ごとにグループ化する
 */
export function groupByDate(
  diaries: MyAndPartnerDiaryRow[],
  stamps: Map<string, StampInfo[]>
): DayGroup[] {
  const dateMap = new Map<string, DiaryEntryWithStamps[]>();

  for (const diary of diaries) {
    const dateISO = diary.diary_date;
    if (!dateMap.has(dateISO)) {
      dateMap.set(dateISO, []);
    }

    const entryStamps = stamps.get(diary.id) ?? [];

    dateMap.get(dateISO)!.push({
      id: diary.id,
      userId: diary.user_id,
      userName: diary.user_name,
      userColor: diary.user_color,
      authorType: diary.author_type,
      diaryDate: diary.diary_date,
      content: diary.content,
      publishedAt: diary.published_at,
      createdAt: diary.created_at,
      stamps: entryStamps,
    });
  }

  const groups: DayGroup[] = [];
  for (const [dateISO, entries] of dateMap.entries()) {
    // エントリを作成時刻でソート
    entries.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    groups.push({
      dateLabel: formatDateLabel(dateISO),
      dateISO,
      entries,
    });
  }

  // 日付昇順でソート
  groups.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return groups;
}

/**
 * YYYY-MM 形式の文字列が有効な月形式かどうかをバリデーションする
 */
export function isValidMonthParam(month: string): boolean {
  const pattern = /^\d{4}-(?:0[1-9]|1[0-2])$/;
  return pattern.test(month);
}
