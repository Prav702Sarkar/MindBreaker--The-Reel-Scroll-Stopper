import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 relative selection:bg-indigo-600 selection:text-white">
      <SignUp path="/register" routing="path" signInUrl="/login" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}