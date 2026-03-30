import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import SettingsForm from "./SettingsForm";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock supabase client
const mockSignOut = vi.fn().mockResolvedValue({});
vi.mock("@/lib/supabase-browser", () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

// Mock server actions
const mockUpdateName = vi.fn().mockResolvedValue({});
const mockUpdateColor = vi.fn().mockResolvedValue({});
const mockDisconnectPartner = vi.fn().mockResolvedValue({});

vi.mock("@/app/actions/profile", () => ({
  updateName: (...args: unknown[]) => mockUpdateName(...args),
  updateColor: (...args: unknown[]) => mockUpdateColor(...args),
  disconnectPartner: (...args: unknown[]) => mockDisconnectPartner(...args),
}));

const defaultProfile = {
  id: "user-1",
  name: "テストユーザー",
  color: "#f87171",
  partner_id: "partner-1",
};

const defaultPartner = {
  name: "パートナー太郎",
  color: "#60a5fa",
};

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ヘッダーに「設定」と表示される", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  it("自分の名前が表示される", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
  });

  it("パートナーの名前が表示される", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    expect(screen.getByText("パートナー太郎")).toBeInTheDocument();
  });

  it("編集ボタンで名前入力欄が表示される", async () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    const editButton = screen.getByText("編集");
    fireEvent.click(editButton);
    const input = screen.getByDisplayValue("テストユーザー");
    expect(input).toBeInTheDocument();
  });

  it("名前編集のキャンセルで元の表示に戻る", async () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    fireEvent.click(screen.getByText("編集"));
    fireEvent.click(screen.getByText("キャンセル"));
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
  });

  it("6色のカラーパレットが表示される", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    const colorButtons = screen.getAllByRole("button", { name: /カラー/ });
    expect(colorButtons).toHaveLength(6);
  });

  it("選択中のカラーにチェックマークが表示される", () => {
    const { container } = render(
      <SettingsForm profile={defaultProfile} partner={defaultPartner} />
    );
    // The selected color button (#f87171) should have a Check icon (svg) inside
    const selectedButton = screen.getByLabelText("カラー #f87171");
    expect(selectedButton.querySelector("svg")).not.toBeNull();
  });

  it("カラー選択でupdateColorが呼ばれる", async () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    const blueButton = screen.getByLabelText("カラー #60a5fa");
    fireEvent.click(blueButton);
    await waitFor(() => {
      expect(mockUpdateColor).toHaveBeenCalledWith("#60a5fa");
    });
  });

  it("パートナー未設定時は招待ボタンが表示される", () => {
    render(
      <SettingsForm
        profile={{ ...defaultProfile, partner_id: null }}
        partner={null}
      />
    );
    expect(screen.getByText("パートナーを招待する")).toBeInTheDocument();
  });

  it("パートナー招待ボタンで/inviteに遷移する", () => {
    render(
      <SettingsForm
        profile={{ ...defaultProfile, partner_id: null }}
        partner={null}
      />
    );
    fireEvent.click(screen.getByText("パートナーを招待する"));
    expect(mockPush).toHaveBeenCalledWith("/invite");
  });

  it("接続解除ボタンで確認ダイアログが表示される", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    fireEvent.click(screen.getByText("接続を解除"));
    expect(
      screen.getByText(
        "本当に接続を解除しますか？お互いの日記が見られなくなります。"
      )
    ).toBeInTheDocument();
  });

  it("確認ダイアログでキャンセルすると元に戻る", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    fireEvent.click(screen.getByText("接続を解除"));
    fireEvent.click(screen.getByText("キャンセル"));
    // 確認メッセージが消えている
    expect(
      screen.queryByText(
        "本当に接続を解除しますか？お互いの日記が見られなくなります。"
      )
    ).not.toBeInTheDocument();
  });

  it("確認ダイアログで解除するとdisconnectPartnerが呼ばれる", async () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    fireEvent.click(screen.getByText("接続を解除"));
    fireEvent.click(screen.getByText("解除する"));
    await waitFor(() => {
      expect(mockDisconnectPartner).toHaveBeenCalled();
    });
  });

  it("ログアウトボタンが表示される", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    expect(screen.getByText("ログアウト")).toBeInTheDocument();
  });

  it("ログアウトでsignOutが呼ばれ/loginに遷移する", async () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    fireEvent.click(screen.getByText("ログアウト"));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("戻るボタンで/に遷移する", () => {
    render(<SettingsForm profile={defaultProfile} partner={defaultPartner} />);
    // ChevronLeft button is the back button
    const backButton = screen.getByRole("button", { name: "" });
    // Find the button that contains ChevronLeft - it's the first button
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // back button is first
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
