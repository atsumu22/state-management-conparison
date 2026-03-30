import { describe, it, expect } from "vitest";
import {
  aggregateByMonth,
  formatMonthLabel,
  formatDateLabel,
  formatTime,
  groupByDate,
  isValidMonthParam,
} from "./diary";
import type { Database } from "@/types/database";

type DiaryRow = Database["public"]["Tables"]["diary_entries"]["Row"];
type MyAndPartnerDiaryRow =
  Database["public"]["Views"]["my_and_partner_diaries"]["Row"];

function makeDiaryRow(overrides: Partial<DiaryRow> = {}): DiaryRow {
  return {
    id: "test-id",
    user_id: "user-1",
    diary_date: "2026-01-15",
    content: "テスト日記",
    published_at: "2026-02-01T00:00:00Z",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

function makeViewRow(
  overrides: Partial<MyAndPartnerDiaryRow> = {}
): MyAndPartnerDiaryRow {
  return {
    id: "test-id",
    user_id: "user-1",
    user_name: "テストユーザー",
    user_color: "#f87171",
    diary_date: "2026-01-15",
    content: "テスト日記",
    published_at: "2026-02-01T00:00:00Z",
    created_at: "2026-01-15T10:00:00Z",
    author_type: "me",
    ...overrides,
  };
}

describe("formatMonthLabel", () => {
  it("YYYY-MM を YYYY年M月 に変換する", () => {
    expect(formatMonthLabel("2026-02")).toBe("2026年2月");
  });

  it("12月の場合", () => {
    expect(formatMonthLabel("2025-12")).toBe("2025年12月");
  });

  it("1月の場合（先頭ゼロ除去）", () => {
    expect(formatMonthLabel("2026-01")).toBe("2026年1月");
  });
});

describe("formatDateLabel", () => {
  it("YYYY-MM-DD を M月D日 に変換する", () => {
    expect(formatDateLabel("2026-01-15")).toBe("1月15日");
  });

  it("12月31日の場合", () => {
    expect(formatDateLabel("2025-12-31")).toBe("12月31日");
  });

  it("1月1日の場合（先頭ゼロ除去）", () => {
    expect(formatDateLabel("2026-01-01")).toBe("1月1日");
  });
});

describe("formatTime", () => {
  it("ISO 日時文字列から HH:mm を返す", () => {
    // Note: formatTime uses local timezone via new Date().getHours()
    // テストではUTCで渡して結果を検証
    const result = formatTime("2026-01-15T10:00:00Z");
    // UTC 10:00 なのでタイムゾーン依存だが、形式が正しいか確認
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("aggregateByMonth", () => {
  it("月ごとに件数を集計する", () => {
    const diaries: DiaryRow[] = [
      makeDiaryRow({ id: "1", diary_date: "2026-01-15" }),
      makeDiaryRow({ id: "2", diary_date: "2026-01-20" }),
      makeDiaryRow({ id: "3", diary_date: "2026-02-01" }),
    ];

    const result = aggregateByMonth(diaries);
    expect(result).toHaveLength(2);
    // 新しい月が先
    expect(result[0]).toEqual({
      month: "2026-02",
      label: "2026年2月",
      count: 1,
    });
    expect(result[1]).toEqual({
      month: "2026-01",
      label: "2026年1月",
      count: 2,
    });
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(aggregateByMonth([])).toEqual([]);
  });

  it("同じ月の日記が複数ある場合は件数が合算される", () => {
    const diaries: DiaryRow[] = [
      makeDiaryRow({ id: "1", diary_date: "2025-12-01" }),
      makeDiaryRow({ id: "2", diary_date: "2025-12-15" }),
      makeDiaryRow({ id: "3", diary_date: "2025-12-31" }),
    ];

    const result = aggregateByMonth(diaries);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
  });
});

describe("groupByDate", () => {
  it("日付ごとにグループ化される", () => {
    const diaries: MyAndPartnerDiaryRow[] = [
      makeViewRow({
        id: "1",
        diary_date: "2026-01-15",
        created_at: "2026-01-15T10:00:00Z",
      }),
      makeViewRow({
        id: "2",
        diary_date: "2026-01-15",
        created_at: "2026-01-15T14:00:00Z",
        user_id: "user-2",
        user_name: "パートナー",
        author_type: "partner",
      }),
      makeViewRow({
        id: "3",
        diary_date: "2026-01-16",
        created_at: "2026-01-16T09:00:00Z",
      }),
    ];

    const stamps = new Map([["1", [{ emoji: "❤️", userName: "パートナー" }]]]);

    const result = groupByDate(diaries, stamps);
    expect(result).toHaveLength(2);

    // 日付昇順
    expect(result[0].dateLabel).toBe("1月15日");
    expect(result[0].entries).toHaveLength(2);
    expect(result[0].entries[0].stamps).toHaveLength(1);
    expect(result[0].entries[0].stamps[0].emoji).toBe("❤️");

    expect(result[1].dateLabel).toBe("1月16日");
    expect(result[1].entries).toHaveLength(1);
  });

  it("同じ日の中でcreatedAt順にソートされる", () => {
    const diaries: MyAndPartnerDiaryRow[] = [
      makeViewRow({
        id: "2",
        diary_date: "2026-01-15",
        created_at: "2026-01-15T22:00:00Z",
      }),
      makeViewRow({
        id: "1",
        diary_date: "2026-01-15",
        created_at: "2026-01-15T10:00:00Z",
      }),
    ];

    const result = groupByDate(diaries, new Map());
    expect(result[0].entries[0].id).toBe("1");
    expect(result[0].entries[1].id).toBe("2");
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(groupByDate([], new Map())).toEqual([]);
  });

  it("スタンプがない日記には空のスタンプ配列が設定される", () => {
    const diaries: MyAndPartnerDiaryRow[] = [
      makeViewRow({ id: "1", diary_date: "2026-01-15" }),
    ];

    const result = groupByDate(diaries, new Map());
    expect(result[0].entries[0].stamps).toEqual([]);
  });
});

describe("isValidMonthParam", () => {
  it("正しい形式を許可する", () => {
    expect(isValidMonthParam("2026-01")).toBe(true);
    expect(isValidMonthParam("2026-12")).toBe(true);
    expect(isValidMonthParam("2025-06")).toBe(true);
  });

  it("不正な形式を拒否する", () => {
    expect(isValidMonthParam("2026-13")).toBe(false);
    expect(isValidMonthParam("2026-00")).toBe(false);
    expect(isValidMonthParam("2026")).toBe(false);
    expect(isValidMonthParam("2026-1")).toBe(false);
    expect(isValidMonthParam("abcd-01")).toBe(false);
    expect(isValidMonthParam("")).toBe(false);
    expect(isValidMonthParam("2026-01-15")).toBe(false);
  });
});
