"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut, Check, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { updateName, updateColor, disconnectPartner } from "@/app/actions/profile";

const COLOR_OPTIONS = [
  "#f87171",
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#fbbf24",
  "#fb923c",
] as const;

type Profile = {
  id: string;
  name: string;
  color: string;
  partner_id: string | null;
};

type PartnerProfile = {
  name: string;
  color: string;
} | null;

type SettingsFormProps = {
  profile: Profile;
  partner: PartnerProfile;
};

export default function SettingsForm({ profile, partner }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 名前編集
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile.name);
  const [nameError, setNameError] = useState<string | null>(null);

  // カラー
  const [selectedColor, setSelectedColor] = useState(profile.color);

  // パートナー解除確認
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // エラー表示
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSaveName = () => {
    setNameError(null);
    startTransition(async () => {
      const result = await updateName(nameValue);
      if (result.error) {
        setNameError(result.error);
      } else {
        setIsEditingName(false);
      }
    });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setGeneralError(null);
    startTransition(async () => {
      const result = await updateColor(color);
      if (result.error) {
        setSelectedColor(profile.color);
        setGeneralError(result.error);
      }
    });
  };

  const handleDisconnect = () => {
    setGeneralError(null);
    startTransition(async () => {
      const result = await disconnectPartner();
      if (result.error) {
        setGeneralError(result.error);
      }
      setShowDisconnectConfirm(false);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-rose-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-rose-100 to-blue-100 p-6 shadow-lg flex items-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="bg-white p-3 rounded-xl hover:shadow-lg transition shadow-md border border-gray-200"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">設定</h2>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* エラー表示 */}
          {generalError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-600 text-sm">
              {generalError}
            </div>
          )}

          {/* 名前カード */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="text-sm text-gray-500 mb-2">お名前</div>
            {isEditingName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-rose-400 focus:outline-none transition"
                  autoFocus
                />
                {nameError && (
                  <p className="text-red-500 text-sm">{nameError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={isPending}
                    className="flex-1 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    {isPending ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNameValue(profile.name);
                      setNameError(null);
                    }}
                    disabled={isPending}
                    className="flex-1 py-2 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-gray-800">
                  {profile.name}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600 font-semibold transition"
                >
                  <Pencil className="w-4 h-4" />
                  編集
                </button>
              </div>
            )}
          </div>

          {/* カラーカード */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="text-sm text-gray-500 mb-3">カラー</div>
            <div className="flex gap-3 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  disabled={isPending}
                  className="w-12 h-12 rounded-full shadow-lg transition hover:scale-110 flex items-center justify-center disabled:opacity-50"
                  style={{ backgroundColor: color }}
                  aria-label={`カラー ${color}`}
                >
                  {selectedColor === color && (
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* パートナーカード */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="text-sm text-gray-500 mb-2">パートナー</div>
            {partner ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-full shadow-md"
                    style={{ backgroundColor: partner.color }}
                  />
                  <div className="text-xl font-bold text-gray-800">
                    {partner.name}
                  </div>
                </div>
                {showDisconnectConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      本当に接続を解除しますか？お互いの日記が見られなくなります。
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDisconnect}
                        disabled={isPending}
                        className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                      >
                        {isPending ? "解除中..." : "解除する"}
                      </button>
                      <button
                        onClick={() => setShowDisconnectConfirm(false)}
                        disabled={isPending}
                        className="flex-1 py-2 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold transition"
                  >
                    接続を解除
                  </button>
                )}
              </>
            ) : (
              <div>
                <p className="text-gray-500 mb-3">
                  パートナーが設定されていません
                </p>
                <button
                  onClick={() => router.push("/invite")}
                  className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition"
                >
                  パートナーを招待する
                </button>
              </div>
            )}
          </div>

          {/* ログアウトボタン */}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full py-4 bg-white rounded-2xl shadow-lg border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
