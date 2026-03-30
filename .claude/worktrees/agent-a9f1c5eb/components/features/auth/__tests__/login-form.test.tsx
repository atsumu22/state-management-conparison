import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";

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
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ログインフォームが正しく描画されること", () => {
    render(<LoginForm />);

    expect(screen.getByText("やさしい交換日記")).toBeInTheDocument();
    expect(
      screen.getByText("時間が優しくしてくれる、ふたりの記録")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("メールアドレス")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログイン" })
    ).toBeInTheDocument();
    expect(screen.getByText("新規登録")).toBeInTheDocument();
  });

  it("メールアドレスが空の場合エラーを表示すること", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      screen.getByText("メールアドレスを入力してください")
    ).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("パスワードが空の場合エラーを表示すること", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "test@example.com"
    );
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      screen.getByText("パスワードを入力してください")
    ).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("ログイン成功時にリダイレクトすること", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("ログイン失敗時にエラーメッセージを表示すること", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText("メールアドレス"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("パスワード"), "wrong");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      screen.getByText("メールアドレスまたはパスワードが正しくありません")
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("新規登録リンクが /signup へ遷移すること", () => {
    render(<LoginForm />);

    const link = screen.getByText("新規登録");
    expect(link).toHaveAttribute("href", "/signup");
  });
});
