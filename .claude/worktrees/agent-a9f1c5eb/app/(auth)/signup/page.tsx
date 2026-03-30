import { SignupForm } from "@/components/features/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-blue-100">
      <SignupForm />
    </div>
  );
}
