import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

import LandingPage from "@/pages/landing";
import CatalogPage from "@/pages/catalog";
import VehicleDetailPage from "@/pages/vehicle-detail";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import VehiclesPage from "@/pages/vehicles";
import CustomersPage from "@/pages/customers";
import SalesPage from "@/pages/sales";
import BrandsPage from "@/pages/brands";
import CategoriesPage from "@/pages/categories";
import UsersPage from "@/pages/users";
import FipePage from "@/pages/fipe";
import NotFound from "@/pages/not-found";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}


function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/catalog" component={CatalogPage} />
      <Route path="/catalog/:id" component={VehicleDetailPage} />
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/admin" /> : <LoginPage />}
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/vehicles">
        <ProtectedRoute>
          <AdminLayout>
            <VehiclesPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/customers">
        <ProtectedRoute>
          <AdminLayout>
            <CustomersPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/sales">
        <ProtectedRoute>
          <AdminLayout>
            <SalesPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/brands">
        <ProtectedRoute>
          <AdminLayout>
            <BrandsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/categories">
        <ProtectedRoute>
          <AdminLayout>
            <CategoriesPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute>
          <AdminLayout>
            <UsersPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/fipe">
        <ProtectedRoute>
          <AdminLayout>
            <FipePage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
