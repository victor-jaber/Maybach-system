import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken, useAuth } from "@/hooks/use-auth";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Car,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalSalesMonth: number;
  totalRevenueMonth: number;
  averageTicket: number;
  totalVehiclesInStock: number;
  totalCustomers: number;
  salesGrowth: number;
}

interface SalesByPeriod {
  period: string;
  count: number;
  revenue: number;
}

interface SalesByBrand {
  brandId: number;
  brandName: string;
  count: number;
  revenue: number;
}

interface SalesByCategory {
  categoryId: number;
  categoryName: string;
  count: number;
  revenue: number;
}

interface ProfitMarginData {
  saleId: number;
  vehicleModel: string;
  brandName: string;
  saleDate: string;
  salePrice: number;
  purchasePrice: number;
  profit: number;
  marginPercent: number;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  loading?: boolean;
  trend?: number;
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
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {trend !== undefined && (
                  <>
                    {trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
                      {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
                    </span>
                  </>
                )}
                <span>{description}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatPeriodLabel(period: string, groupBy: string): string {
  if (groupBy === "month") {
    const [year, month] = period.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
  }
  if (groupBy === "week") {
    const [year, week] = period.split("-");
    return `Sem ${week}/${year.slice(2)}`;
  }
  return new Date(period).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function ReportsPage() {
  const { isAuthenticated } = useAuth();
  const [dateRange, setDateRange] = useState("6months");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case "7days":
        start.setDate(start.getDate() - 7);
        break;
      case "30days":
        start.setDate(start.getDate() - 30);
        break;
      case "3months":
        start.setMonth(start.getMonth() - 3);
        break;
      case "6months":
        start.setMonth(start.getMonth() - 6);
        break;
      case "1year":
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 6);
    }
    
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data: dashboardStats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/reports/dashboard"],
    enabled: isAuthenticated,
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const { data: salesByPeriod, isLoading: loadingPeriod } = useQuery<SalesByPeriod[]>({
    queryKey: ["/api/reports/sales-by-period", startDate, endDate, groupBy],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch(`/api/reports/sales-by-period?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: salesByBrand, isLoading: loadingBrand } = useQuery<SalesByBrand[]>({
    queryKey: ["/api/reports/sales-by-brand", startDate, endDate],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch(`/api/reports/sales-by-brand?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: salesByCategory, isLoading: loadingCategory } = useQuery<SalesByCategory[]>({
    queryKey: ["/api/reports/sales-by-category", startDate, endDate],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch(`/api/reports/sales-by-category?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: profitMargin, isLoading: loadingProfit } = useQuery<ProfitMarginData[]>({
    queryKey: ["/api/reports/profit-margin", startDate, endDate],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch(`/api/reports/profit-margin?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const chartData = salesByPeriod?.map((item) => ({
    ...item,
    periodLabel: formatPeriodLabel(item.period, groupBy),
  })) || [];

  const totalProfit = profitMargin?.reduce((acc, item) => acc + item.profit, 0) || 0;
  const avgMargin = profitMargin?.length 
    ? profitMargin.reduce((acc, item) => acc + item.marginPercent, 0) / profitMargin.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Análise de desempenho e estatísticas de vendas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]" data-testid="select-date-range">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}>
            <SelectTrigger className="w-[130px]" data-testid="select-group-by">
              <BarChart3 className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por Dia</SelectItem>
              <SelectItem value="week">Por Semana</SelectItem>
              <SelectItem value="month">Por Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas do Mês"
          value={dashboardStats?.totalSalesMonth || 0}
          description="vs. mês anterior"
          icon={ShoppingCart}
          loading={loadingStats}
          trend={dashboardStats?.salesGrowth}
        />
        <StatCard
          title="Faturamento do Mês"
          value={formatCurrency(dashboardStats?.totalRevenueMonth || 0)}
          description="receita total"
          icon={DollarSign}
          loading={loadingStats}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(dashboardStats?.averageTicket || 0)}
          description="por venda"
          icon={TrendingUp}
          loading={loadingStats}
        />
        <StatCard
          title="Veículos em Estoque"
          value={dashboardStats?.totalVehiclesInStock || 0}
          description={`${dashboardStats?.totalCustomers || 0} clientes cadastrados`}
          icon={Car}
          loading={loadingStats}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales by Period Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Evolução de Vendas
            </CardTitle>
            <CardDescription>
              Vendas e faturamento por período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPeriod ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="periodLabel" 
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    yAxisId="left"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Faturamento") return [formatCurrency(value), name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    name="Vendas"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))" }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Faturamento"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))" }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhuma venda no período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Brand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Vendas por Marca
            </CardTitle>
            <CardDescription>
              Distribuição de vendas por marca de veículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBrand ? (
              <Skeleton className="h-[250px] w-full" />
            ) : salesByBrand && salesByBrand.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesByBrand} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="brandName"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Faturamento") return [formatCurrency(value), name];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="count" name="Vendas" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Nenhuma venda por marca no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Vendas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição de vendas por tipo de veículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCategory ? (
              <Skeleton className="h-[250px] w-full" />
            ) : salesByCategory && salesByCategory.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="categoryName"
                      label={({ categoryName, count }) => `${categoryName}: ${count}`}
                      labelLine={false}
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [value, "Vendas"]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {salesByCategory.map((item, index) => (
                    <div key={item.categoryId} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.categoryName}</span>
                      <Badge variant="secondary" className="ml-auto">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Nenhuma venda por categoria no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profit Margin Analysis */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Análise de Margem de Lucro
              </CardTitle>
              <CardDescription>
                Comparativo entre preço de compra e venda
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Margem Média</p>
                <p className={`text-lg font-bold ${avgMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {avgMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProfit ? (
            <Skeleton className="h-[200px] w-full" />
          ) : profitMargin && profitMargin.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Preço Compra</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitMargin.map((item) => (
                    <TableRow key={item.saleId} data-testid={`row-profit-${item.saleId}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.vehicleModel}</p>
                          <p className="text-xs text-muted-foreground">{item.brandName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(item.saleDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.salePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.profit >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(item.profit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={item.marginPercent >= 10 ? "default" : item.marginPercent >= 0 ? "secondary" : "destructive"}
                        >
                          {item.marginPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              Nenhuma venda com dados de margem no período
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
