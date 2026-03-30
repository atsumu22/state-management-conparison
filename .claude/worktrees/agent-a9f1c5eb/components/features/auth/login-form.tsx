"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }
    if (!password) {
      setError("パスワードを入力してください");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("メールアドレスまたはパスワードが正しくありません");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("ログインに失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">📔</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          やさしい交換日記
        </h1>
        <p className="text-gray-600 text-sm">
          時間が優しくしてくれる、ふたりの記録
        </p>
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
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        <Link
          href="/signup"
          className="block w-full py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition shadow-sm text-center"
        >
          新規登録
        </Link>
      </form>
    </div>
  );
}
