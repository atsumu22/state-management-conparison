"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("お名前を入力してください");
      return;
    }
    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("このメールアドレスは既に登録されています");
        } else {
          setError("登録に失敗しました。もう一度お試しください。");
        }
        return;
      }

      router.push("/invite");
      router.refresh();
    } catch {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4">
        <Link
          href="/login"
          className="text-gray-600 hover:text-gray-800 transition inline-block"
          aria-label="戻る"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              アカウント作成
            </h2>
            <p className="text-gray-600 text-sm">新しい記録を始めましょう</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
              >
                {error}
              </div>
            )}

            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="お名前"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="password"
                  name="password"
                  placeholder="パスワード（8文字以上）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "登録中..." : "登録する"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
