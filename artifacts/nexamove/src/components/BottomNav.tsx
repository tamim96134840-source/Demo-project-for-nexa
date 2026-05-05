import { useLocation, Link } from "wouter";
import { Home, Search, ShoppingBag, User } from "lucide-react";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 bottom-nav-safe z-50"
      style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = location === href || (href === "/home" && location === "/");
          return (
            <Link key={href} href={href}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[56px] ${
                  active ? "text-[#e53935]" : "text-gray-400"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "text-[#e53935]" : "text-gray-400"}
                />
                <span className={`text-[10px] font-${active ? "semibold" : "medium"}`}>{label}</span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-[#e53935] mt-0.5" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
