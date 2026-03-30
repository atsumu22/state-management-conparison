import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "../signup-form";

// next/navigation のモック
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Supabase クライアントのモック
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("サインアップフォームが正しく描画されること", () => {
    render(<SignupForm />);

    expect(screen.getByText("アカウント作成")).toBeInTheDocument();
    expect(
      screen.getByText("新しい記録を始めましょう")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("お名前")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("メールアドレス")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("パスワード（8文字以上）")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "登録する" })
    ).toBeInTheDocument();
  });

  it("名前が空の場合エラーを表示すること", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      screen.getByText("お名前を入力してください")
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("メールアドレスが空の場合エラーを表示すること", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("お名前"), "テスト");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      screen.getByText("メールアドレスを入力してください")
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("パスワードが8文字未満の場合エラーを表示すること", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("お名前"), "テスト");
    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("パスワード（8文字以上）"),
      "short"
    );
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      screen.getByText("パスワードは8文字以上で入力してください")
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("パスワードが7文字の場合もエラーを表示すること", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("お名前"), "テスト");
    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("パスワード（8文字以上）"),
      "1234567"
    );
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      screen.getByText("パスワードは8文字以上で入力してください")
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("登録成功時に /invite へリダイレクトすること", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("お名前"), "テスト");
    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("パスワード（8文字以上）"),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      options: {
        data: {
          name: "テスト",
        },
      },
    });
    expect(mockPush).toHaveBeenCalledWith("/invite");
  });

  it("登録失敗時にエラーメッセージを表示すること", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "Signup failed" },
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("お名前"), "テスト");
    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("パスワード（8文字以上）"),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      screen.getByText("登録に失敗しました。もう一度お試しください。")
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("既に登録済みのメールアドレスの場合に適切なエラーを表示すること", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "User already registered" },
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("お名前"), "テスト");
    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "existing@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("パスワード（8文字以上）"),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      screen.getByText("このメールアドレスは既に登録されています")
    ).toBeInTheDocument();
  });

  it("戻るリンクが /login へ遷移すること", () => {
    render(<SignupForm />);

    const link = screen.getByLabelText("戻る");
    expect(link).toHaveAttribute("href", "/login");
  });
});
