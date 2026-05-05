import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { MapPin, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user as any);
        setLocation("/home");
      },
      onError: () => {
        setError("Invalid email or password. Please try again.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#e53935] px-6 pt-14 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="text-white" size={28} strokeWidth={2.5} />
          <span className="text-white text-3xl font-black tracking-tight">NEXAMOVE</span>
        </div>
        <p className="text-red-100 text-sm mt-1">Hyperlocal delivery for your neighbourhood</p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-8">Sign in to continue</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm" data-testid="text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] focus:border-transparent bg-gray-50"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] focus:border-transparent bg-gray-50 pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                data-testid="button-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            data-testid="button-submit"
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-[#e53935] text-white rounded-xl py-3.5 font-semibold text-base mt-2 hover:bg-[#c62828] transition-colors disabled:opacity-60"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-500 text-sm">Don't have an account? </span>
          <button
            data-testid="link-register"
            onClick={() => setLocation("/register")}
            className="text-[#e53935] font-semibold text-sm hover:underline"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
