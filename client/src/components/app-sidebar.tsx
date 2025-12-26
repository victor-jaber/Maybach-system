import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Car,
  Users,
  ShoppingCart,
  Tags,
  FolderTree,
  LogOut,
  UserCog,
  Search,
  FileText,
  Building,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import logoImage from "@assets/maybach-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Veículos",
    url: "/admin/vehicles",
    icon: Car,
  },
  {
    title: "Vendas",
    url: "/admin/sales",
    icon: ShoppingCart,
  },
  {
    title: "Contratos",
    url: "/admin/contracts",
    icon: FileText,
  },
  {
    title: "Relatórios",
    url: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Consulta FIPE",
    url: "/admin/fipe",
    icon: Search,
  },
  {
    title: "Débitos (Em Breve)",
    url: "/admin/debts",
    icon: AlertTriangle,
    disabled: true,
  },
];

const configNavItems = [
  {
    title: "Clientes",
    url: "/admin/customers",
    icon: Users,
  },
  {
    title: "Marcas",
    url: "/admin/brands",
    icon: Tags,
  },
  {
    title: "Categorias",
    url: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: UserCog,
  },
  {
    title: "Loja",
    url: "/admin/store-settings",
    icon: Building,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/admin" className="flex items-center gap-3">
          <img src={logoImage} alt="MayBach Cars" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-sidebar-foreground">
              MayBach
            </span>
            <span className="text-xs text-muted-foreground">
              Painel Administrativo
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.disabled ? (
                    <SidebarMenuButton
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
