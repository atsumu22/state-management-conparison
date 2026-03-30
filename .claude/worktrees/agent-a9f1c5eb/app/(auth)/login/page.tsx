import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-blue-100">
      <div className="flex-1 flex items-center justify-center p-6">
        <LoginForm />
      </div>
    </div>
  );
}
