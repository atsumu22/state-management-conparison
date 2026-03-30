import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import SettingsForm from "@/components/features/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 自分のプロフィールを取得
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, color, partner_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // パートナー情報を取得（partner_id がある場合）
  let partner: { name: string; color: string } | null = null;

  if (profile.partner_id) {
    const { data: partnerData } = await supabase
      .from("profiles")
      .select("name, color")
      .eq("id", profile.partner_id)
      .single();

    if (partnerData) {
      partner = { name: partnerData.name, color: partnerData.color };
    }
  }

  return <SettingsForm profile={profile} partner={partner} />;
}
