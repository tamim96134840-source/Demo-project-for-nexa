import { useState } from "react";
import { useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { MapPin, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "rider">("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user as any);
        setLocation("/home");
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Registration failed. Please try again.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({ data: { name, email, password, role } });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#e53935] px-6 pt-14 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="text-white" size={28} strokeWidth={2.5} />
          <span className="text-white text-3xl font-black tracking-tight">NEXAMOVE</span>
        </div>
        <p className="text-red-100 text-sm mt-1">Join your neighbourhood delivery network</p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
        <p className="text-gray-500 text-sm mb-6">Sign up to get started</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm" data-testid="text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              data-testid="input-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] focus:border-transparent bg-gray-50"
              placeholder="Your full name"
              required
            />
          </div>

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
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                data-testid="button-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {(["customer", "rider"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  data-testid={`button-role-${r}`}
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all capitalize ${
                    role === r
                      ? "border-[#e53935] bg-red-50 text-[#e53935]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {r === "customer" ? "Customer" : "Delivery Rider"}
                </button>
              ))}
            </div>
          </div>

          <button
            data-testid="button-submit"
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-[#e53935] text-white rounded-xl py-3.5 font-semibold text-base mt-2 hover:bg-[#c62828] transition-colors disabled:opacity-60"
          >
            {registerMutation.isPending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-500 text-sm">Already have an account? </span>
          <button
            data-testid="link-login"
            onClick={() => setLocation("/login")}
            className="text-[#e53935] font-semibold text-sm hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
