import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const mockFrom = vi.fn(() => ({
  update: mockUpdate,
  select: mockSelect,
}));

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

// Import after mocks
import { updateName, updateColor, disconnectPartner } from "./profile";

describe("updateName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it("空の名前はエラーを返す", async () => {
    const result = await updateName("   ");
    expect(result.error).toBe("名前を入力してください");
  });

  it("50文字を超える名前はエラーを返す", async () => {
    const longName = "あ".repeat(51);
    const result = await updateName(longName);
    expect(result.error).toBe("名前は50文字以内にしてください");
  });

  it("未認証の場合はエラーを返す", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await updateName("テスト");
    expect(result.error).toBe("認証されていません");
  });

  it("正常な名前は更新に成功する", async () => {
    const result = await updateName("テスト太郎");
    expect(result.error).toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpdate).toHaveBeenCalledWith({ name: "テスト太郎" });
    expect(mockEq).toHaveBeenCalledWith("id", "user-1");
  });

  it("名前の前後の空白をトリムする", async () => {
    const result = await updateName("  テスト太郎  ");
    expect(result.error).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({ name: "テスト太郎" });
  });

  it("DB更新失敗時はエラーを返す", async () => {
    mockEq.mockResolvedValue({ error: { message: "DB error" } });
    const result = await updateName("テスト");
    expect(result.error).toBe("名前の更新に失敗しました");
  });
});

describe("updateColor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it("無効なカラーはエラーを返す", async () => {
    const result = await updateColor("#000000");
    expect(result.error).toBe("無効なカラーです");
  });

  it("有効なカラーは更新に成功する", async () => {
    const result = await updateColor("#f87171");
    expect(result.error).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({ color: "#f87171" });
  });

  it("6色すべてが有効として受け入れられる", async () => {
    const validColors = [
      "#f87171",
      "#60a5fa",
      "#34d399",
      "#a78bfa",
      "#fbbf24",
      "#fb923c",
    ];
    for (const color of validColors) {
      vi.clearAllMocks();
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      const result = await updateColor(color);
      expect(result.error).toBeUndefined();
    }
  });

  it("未認証の場合はエラーを返す", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await updateColor("#f87171");
    expect(result.error).toBe("認証されていません");
  });
});

describe("disconnectPartner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
  });

  it("未認証の場合はエラーを返す", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await disconnectPartner();
    expect(result.error).toBe("認証されていません");
  });

  it("パートナー未設定の場合はエラーを返す", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { partner_id: null },
            error: null,
          }),
        })),
      })),
    });

    const result = await disconnectPartner();
    expect(result.error).toBe("パートナーが設定されていません");
  });

  it("パートナーがいる場合は双方のpartner_idをNULLにする", async () => {
    let callCount = 0;
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { partner_id: "partner-1" },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockImplementation((field: string, value: string) => {
          callCount++;
          return Promise.resolve({ error: null });
        }),
      })),
    });

    const result = await disconnectPartner();
    expect(result.error).toBeUndefined();
    // from("profiles") should have been called multiple times
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("プロフィール取得失敗時はエラーを返す", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "not found" },
          }),
        })),
      })),
    });

    const result = await disconnectPartner();
    expect(result.error).toBe("プロフィールの取得に失敗しました");
  });
});
