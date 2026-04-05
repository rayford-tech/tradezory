import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">Reset password</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Password reset is not available yet. Contact support or use your existing credentials.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
          <p className="text-sm text-zinc-400 mb-4">
            If you've forgotten your password, please reach out to the admin to reset it manually.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
