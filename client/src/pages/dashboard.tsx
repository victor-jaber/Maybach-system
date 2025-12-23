import { useQuery } from "@tanstack/react-query";
import {
  Car,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle, Customer, Sale, SaleWithRelations } from "@shared/schema";

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: vehicles, isLoading: loadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: customers, isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: sales, isLoading: loadingSales } = useQuery<SaleWithRelations[]>({
    queryKey: ["/api/sales"],
  });

  const availableVehicles = vehicles?.filter((v) => v.status === "available") || [];
  const soldVehicles = vehicles?.filter((v) => v.status === "sold") || [];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthSales = sales?.filter((s) => {
    const saleDate = new Date(s.saleDate);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  }) || [];

  const monthTotal = monthSales.reduce(
    (acc, s) => acc + parseFloat(s.totalValue as string),
    0
  );

  const cashSales = sales?.filter((s) => s.paymentType === "cash") || [];
  const financedSales = sales?.filter((s) => s.paymentType === "financed") || [];

  const recentSales = sales?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Veículos em Estoque"
          value={availableVehicles.length}
          description={`${soldVehicles.length} vendidos`}
          icon={Car}
          loading={loadingVehicles}
        />
        <StatCard
          title="Clientes Cadastrados"
          value={customers?.length || 0}
          icon={Users}
          loading={loadingCustomers}
        />
        <StatCard
          title="Vendas do Mês"
          value={monthSales.length}
          description={formatCurrency(monthTotal)}
          icon={ShoppingCart}
          loading={loadingSales}
        />
        <StatCard
          title="Total de Vendas"
          value={sales?.length || 0}
          description={`${cashSales.length} à vista | ${financedSales.length} financiadas`}
          icon={TrendingUp}
          loading={loadingSales}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Veículos em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVehicles ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : availableVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum veículo em estoque
              </p>
            ) : (
              <div className="space-y-3">
                {availableVehicles.slice(0, 5).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between rounded-md border p-3"
                    data-testid={`card-vehicle-${vehicle.id}`}
                  >
                    <div>
                      <p className="font-medium">{vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.year} • {vehicle.color}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {formatCurrency(vehicle.price)}
                    </p>
                  </div>
                ))}
                {availableVehicles.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{availableVehicles.length - 5} veículos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Vendas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSales ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma venda registrada
              </p>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-md border p-3"
                    data-testid={`card-sale-${sale.id}`}
                  >
                    <div>
                      <p className="font-medium">{sale.vehicle?.model}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.customer?.name} • {formatDate(sale.saleDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(sale.totalValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sale.paymentType === "cash" ? "À Vista" : "Financiado"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
