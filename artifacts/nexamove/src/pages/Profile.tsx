import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { disconnectSocket } from "@/lib/socket";
import BottomNav from "@/components/BottomNav";
import { User, Mail, Shield, LogOut, ChevronRight, MapPin } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#e53935] px-4 pt-12 pb-5">
        <h1 className="text-white text-xl font-black tracking-tight">NEXAMOVE</h1>
        <p className="text-red-100 text-sm mt-1 font-medium">Profile</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Avatar + name */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#e53935] flex items-center justify-center">
            <span className="text-white text-2xl font-black">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base" data-testid="text-username">{user?.name}</p>
            <p className="text-gray-400 text-xs mt-0.5" data-testid="text-email">{user?.email}</p>
            <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              user?.role === "rider" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-[#e53935]"
            }`} data-testid="text-role">
              {user?.role === "rider" ? "Delivery Rider" : "Customer"}
            </span>
          </div>
        </div>

        {/* Info cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <User size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Full name</p>
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            </div>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <Mail size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-semibold text-gray-800">{user?.email}</p>
            </div>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <Shield size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Account type</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <MapPin size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Delivery area</p>
              <p className="text-sm font-semibold text-gray-800">Niamathpur, Lala, Hailakandi</p>
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">App version</p>
              <p className="text-xs text-gray-400">Nexamove v1.0.0</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Service area</p>
              <p className="text-xs text-gray-400">Hailakandi district, Assam</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </div>

        {/* Logout */}
        <button
          data-testid="button-logout"
          onClick={handleLogout}
          className="w-full bg-white border border-red-100 text-[#e53935] rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold shadow-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
