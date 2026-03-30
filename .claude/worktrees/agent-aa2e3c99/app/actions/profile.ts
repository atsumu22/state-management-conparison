"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";

const VALID_COLORS = [
  "#f87171",
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#fbbf24",
  "#fb923c",
] as const;

type ValidColor = (typeof VALID_COLORS)[number];

function isValidColor(color: string): color is ValidColor {
  return (VALID_COLORS as readonly string[]).includes(color);
}

export async function updateName(
  name: string
): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { error: "名前を入力してください" };
  }
  if (trimmed.length > 50) {
    return { error: "名前は50文字以内にしてください" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: trimmed })
    .eq("id", user.id);

  if (error) {
    return { error: "名前の更新に失敗しました" };
  }

  revalidatePath("/settings");
  return {};
}

export async function updateColor(
  color: string
): Promise<{ error?: string }> {
  if (!isValidColor(color)) {
    return { error: "無効なカラーです" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ color })
    .eq("id", user.id);

  if (error) {
    return { error: "カラーの更新に失敗しました" };
  }

  revalidatePath("/settings");
  return {};
}

export async function disconnectPartner(): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  // 自分のプロフィールを取得して partner_id を確認
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "プロフィールの取得に失敗しました" };
  }

  if (!profile.partner_id) {
    return { error: "パートナーが設定されていません" };
  }

  const partnerId = profile.partner_id;

  // 自分の partner_id を NULL に
  const { error: selfError } = await supabase
    .from("profiles")
    .update({ partner_id: null })
    .eq("id", user.id);

  if (selfError) {
    return { error: "接続解除に失敗しました" };
  }

  // 相手の partner_id を NULL に
  const { error: partnerError } = await supabase
    .from("profiles")
    .update({ partner_id: null })
    .eq("id", partnerId);

  if (partnerError) {
    // 自分側は既に更新済み。ロールバックは困難だがログとして返す
    return { error: "パートナー側の接続解除に失敗しました" };
  }

  revalidatePath("/settings");
  return {};
}
