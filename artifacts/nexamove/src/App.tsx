import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";

setAuthTokenGetter(() => localStorage.getItem("nexamove_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isAuthenticated && location !== "/register" && location !== "/login") {
    setLocation("/login");
    return null;
  }

  if (isAuthenticated && (location === "/" || location === "/login" || location === "/register")) {
    setLocation("/home");
    return null;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/home" component={Home} />
      <Route path="/orders" component={Orders} />
      <Route path="/profile" component={Profile} />
      <Route path="/search" component={Search} />
      <Route path="/" component={isAuthenticated ? Home : Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
