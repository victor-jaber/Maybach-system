import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ShoppingCart,
  Car,
  DollarSign,
  ArrowRightLeft,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import type { SaleWithRelations, VehicleWithRelations, Customer, VehicleCost } from "@shared/schema";

const saleFormSchema = z.object({
  customerId: z.number({ required_error: "Selecione um cliente" }),
  vehicleId: z.number({ required_error: "Selecione um veículo" }),
  saleDate: z.string().min(1, "Data da venda é obrigatória"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  paymentType: z.enum(["cash", "financed", "credit_card"], { required_error: "Selecione o tipo de pagamento" }),
  downPayment: z.string().optional(),
  financedValue: z.string().optional(),
  installments: z.number().optional(),
  installmentValue: z.string().optional(),
  financingBank: z.string().optional(),
  notes: z.string().optional(),
  hasTradeIn: z.boolean().default(false),
  tradeInVehicleId: z.number().optional(),
  tradeInValue: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

const costFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.string().min(1, "Valor é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  notes: z.string().optional(),
});

type CostFormValues = z.infer<typeof costFormSchema>;

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [salesSearch, setSalesSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<SaleWithRelations | null>(null);
  const [deletingSale, setDeletingSale] = useState<SaleWithRelations | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<VehicleWithRelations | null>(null);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<VehicleCost | null>(null);
  const [deletingCost, setDeletingCost] = useState<VehicleCost | null>(null);
  const { toast } = useToast();

  const { data: sales, isLoading: salesLoading } = useQuery<SaleWithRelations[]>({
    queryKey: ["/api/sales"],
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: vehicleCosts } = useQuery<VehicleCost[]>({
    queryKey: ["/api/vehicles", viewingVehicle?.id, "costs"],
    enabled: !!viewingVehicle,
    queryFn: async () => {
      if (!viewingVehicle) return [];
      const response = await fetch(`/api/vehicles/${viewingVehicle.id}/costs`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch costs");
      return response.json();
    },
  });

  const availableVehicles = vehicles?.filter((v) => v.status === "available") || [];
  const reservedVehicles = vehicles?.filter((v) => v.status === "reserved") || [];
  const stockVehicles = vehicles?.filter((v) => v.status === "available" || v.status === "reserved") || [];

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleDate: new Date().toISOString().split("T")[0],
      paymentType: "cash",
      hasTradeIn: false,
    },
  });

  const costForm = useForm<CostFormValues>({
    resolver: zodResolver(costFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const paymentType = form.watch("paymentType");
  const hasTradeIn = form.watch("hasTradeIn");

  const createMutation = useMutation({
    mutationFn: async (data: SaleFormValues) => {
      const response = await apiRequest("POST", "/api/sales", {
        ...data,
        saleDate: new Date(data.saleDate),
        tradeInVehicleId: data.hasTradeIn ? data.tradeInVehicleId : null,
        tradeInValue: data.hasTradeIn && data.tradeInValue ? data.tradeInValue : null,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Venda registrada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao registrar venda", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setDeletingSale(null);
      toast({ title: "Venda excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir venda", variant: "destructive" });
    },
  });

  const createCostMutation = useMutation({
    mutationFn: async (data: CostFormValues) => {
      if (!viewingVehicle) throw new Error("No vehicle selected");
      const response = await fetch(`/api/vehicles/${viewingVehicle.id}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          value: parseCurrencyToNumber(data.value),
        }),
      });
      if (!response.ok) throw new Error("Failed to create cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", viewingVehicle?.id, "costs"] });
      setIsCostDialogOpen(false);
      costForm.reset({ date: new Date().toISOString().split("T")[0] });
      toast({ title: "Custo adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar custo", variant: "destructive" });
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: async (data: CostFormValues & { id: number }) => {
      if (!viewingVehicle) throw new Error("No vehicle selected");
      const response = await fetch(`/api/vehicles/${viewingVehicle.id}/costs/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description: data.description,
          value: parseCurrencyToNumber(data.value),
          date: data.date,
          notes: data.notes,
        }),
      });
      if (!response.ok) throw new Error("Failed to update cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", viewingVehicle?.id, "costs"] });
      setIsCostDialogOpen(false);
      setEditingCost(null);
      costForm.reset({ date: new Date().toISOString().split("T")[0] });
      toast({ title: "Custo atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar custo", variant: "destructive" });
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!viewingVehicle) throw new Error("No vehicle selected");
      const response = await fetch(`/api/vehicles/${viewingVehicle.id}/costs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", viewingVehicle?.id, "costs"] });
      setDeletingCost(null);
      toast({ title: "Custo excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir custo", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    form.reset({
      saleDate: new Date().toISOString().split("T")[0],
      paymentType: "cash",
      hasTradeIn: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenCostCreate = () => {
    setEditingCost(null);
    costForm.reset({ date: new Date().toISOString().split("T")[0] });
    setIsCostDialogOpen(true);
  };

  const handleEditCost = (cost: VehicleCost) => {
    setEditingCost(cost);
    costForm.reset({
      description: cost.description,
      value: formatCurrency(cost.value),
      date: cost.date ? new Date(cost.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      notes: cost.notes || "",
    });
    setIsCostDialogOpen(true);
  };

  const onSubmit = (data: SaleFormValues) => {
    createMutation.mutate(data);
  };

  const onCostSubmit = (data: CostFormValues) => {
    if (editingCost) {
      updateCostMutation.mutate({ ...data, id: editingCost.id });
    } else {
      createCostMutation.mutate(data);
    }
  };

  const filteredSales = sales?.filter(
    (sale) =>
      sale.customer?.name.toLowerCase().includes(salesSearch.toLowerCase()) ||
      sale.vehicle?.model.toLowerCase().includes(salesSearch.toLowerCase())
  );

  const filteredStock = stockVehicles?.filter(
    (vehicle) =>
      vehicle.model.toLowerCase().includes(stockSearch.toLowerCase()) ||
      vehicle.brand?.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      vehicle.plate?.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const calculateTotalCosts = (costs: VehicleCost[] | undefined): number => {
    if (!costs) return 0;
    return costs.reduce((sum, cost) => sum + parseCurrencyToNumber(String(cost.value)), 0);
  };

  const calculateProfit = (vehicle: VehicleWithRelations, costs: VehicleCost[] | undefined): number => {
    const purchasePrice = parseCurrencyToNumber(String(vehicle.purchasePrice || 0));
    const salePrice = parseCurrencyToNumber(String(vehicle.price));
    const totalCosts = calculateTotalCosts(costs);
    return salePrice - purchasePrice - totalCosts;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Vendas e Compras
          </h1>
          <p className="text-muted-foreground">
            Gerencie vendas e acompanhe seus veículos em estoque
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales" data-testid="tab-sales">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">
            <Car className="mr-2 h-4 w-4" />
            Estoque / Compras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar vendas..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-sales"
              />
            </div>
            <Button onClick={handleOpenCreate} data-testid="button-add-sale">
              <Plus className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          </div>

          {salesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSales?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold">Nenhuma venda encontrada</h3>
              <p className="text-muted-foreground">
                Registre sua primeira venda para começar
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Troca</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales?.map((sale) => (
                    <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                      <TableCell>{formatDate(sale.saleDate)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.customer?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {sale.customer?.cpfCnpj}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.vehicle?.model}</p>
                          <p className="text-sm text-muted-foreground">
                            {sale.vehicle?.brand?.name} - {sale.vehicle?.year}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(sale.totalValue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.paymentType === "cash" ? "default" : sale.paymentType === "credit_card" ? "outline" : "secondary"}>
                          {sale.paymentType === "cash" ? "À Vista" : sale.paymentType === "credit_card" ? "Cartão" : "Financiado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sale.tradeInVehicle ? (
                          <Badge variant="outline">
                            <ArrowRightLeft className="mr-1 h-3 w-3" />
                            {sale.tradeInVehicle.brand?.name} {sale.tradeInVehicle.model}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingSale(sale)}
                            data-testid={`button-view-sale-${sale.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingSale(sale)}
                            data-testid={`button-delete-sale-${sale.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar veículos no estoque..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-stock"
              />
            </div>
          </div>

          {vehiclesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredStock?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Car className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold">Nenhum veículo no estoque</h3>
              <p className="text-muted-foreground">
                Cadastre veículos na página de Veículos
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preço Compra</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Lucro Est.</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock?.map((vehicle) => {
                    const purchasePrice = parseCurrencyToNumber(String(vehicle.purchasePrice || 0));
                    const salePrice = parseCurrencyToNumber(String(vehicle.price));
                    const estimatedProfit = salePrice - purchasePrice;
                    return (
                      <TableRow key={vehicle.id} data-testid={`row-stock-${vehicle.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vehicle.brand?.name} {vehicle.model}</p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.year} - {vehicle.color}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{vehicle.plate || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vehicle.status === "available" ? "default" : "secondary"}>
                            {vehicle.status === "available" ? "Disponível" : "Reservado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {vehicle.purchasePrice ? formatCurrency(vehicle.purchasePrice) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(vehicle.price)}
                        </TableCell>
                        <TableCell>
                          <span className={estimatedProfit > 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                            {formatCurrency(estimatedProfit)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingVehicle(vehicle)}
                            data-testid={`button-view-vehicle-${vehicle.id}`}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name} - {customer.cpfCnpj}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          const vehicle = availableVehicles.find(
                            (v) => v.id === parseInt(value)
                          );
                          if (vehicle) {
                            form.setValue("totalValue", String(vehicle.price));
                          }
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle">
                            <SelectValue placeholder="Selecione o veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicles?.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                              {vehicle.brand?.name} {vehicle.model} - {vehicle.year} -{" "}
                              {formatCurrency(vehicle.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="saleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Venda *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-sale-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="R$ 0,00"
                          data-testid="input-total-value"
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-type">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">À Vista</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="financed">Financiado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentType === "credit_card" && (
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="text-sm font-medium">Dados do Cartão de Crédito</h3>
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas *</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-credit-card-installments">
                              <SelectValue placeholder="Selecione o número de parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {paymentType === "financed" && (
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="text-sm font-medium">Dados do Financiamento</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="downPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor de Entrada</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-down-payment"
                              onChange={(e) => {
                                const formatted = formatCurrencyInput(e.target.value);
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="financedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Financiado</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-financed-value"
                              onChange={(e) => {
                                const formatted = formatCurrencyInput(e.target.value);
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="installments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Parcelas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-installments"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="installmentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Parcela</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-installment-value"
                              onChange={(e) => {
                                const formatted = formatCurrencyInput(e.target.value);
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="financingBank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco/Financeira</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome do banco ou financeira" data-testid="input-financing-bank" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Veículo de Troca</h3>
                    <p className="text-sm text-muted-foreground">Cliente oferece veículo como parte do pagamento</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="hasTradeIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                form.setValue("tradeInVehicleId", undefined);
                                form.setValue("tradeInValue", undefined);
                              }
                            }}
                            data-testid="switch-trade-in"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {hasTradeIn && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tradeInVehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veículo de Troca</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-trade-in-vehicle">
                                <SelectValue placeholder="Selecione o veículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {reservedVehicles?.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  {vehicle.brand?.name} {vehicle.model} - {vehicle.year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cadastre o veículo de troca primeiro e marque como "Reservado"
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradeInValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Troca</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-trade-in-value"
                              onChange={(e) => {
                                const formatted = formatCurrencyInput(e.target.value);
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações sobre a venda..."
                        className="resize-none"
                        rows={3}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-save-sale"
                >
                  {createMutation.isPending ? "Salvando..." : "Registrar Venda"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {viewingSale && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{viewingSale.customer?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      CPF/CNPJ: {viewingSale.customer?.cpfCnpj}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tel: {viewingSale.customer?.phone}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Veículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {viewingSale.vehicle?.brand?.name} {viewingSale.vehicle?.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ano: {viewingSale.vehicle?.year} - Cor: {viewingSale.vehicle?.color}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Placa: {viewingSale.vehicle?.plate || "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Dados da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data da Venda</span>
                    <span className="font-medium">{formatDate(viewingSale.saleDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Total</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(viewingSale.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forma de Pagamento</span>
                    <Badge variant={viewingSale.paymentType === "cash" ? "default" : viewingSale.paymentType === "credit_card" ? "outline" : "secondary"}>
                      {viewingSale.paymentType === "cash" ? "À Vista" : viewingSale.paymentType === "credit_card" ? "Cartão de Crédito" : "Financiado"}
                    </Badge>
                  </div>
                  {viewingSale.paymentType === "credit_card" && viewingSale.installments && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parcelas</span>
                      <span className="font-medium">{viewingSale.installments}x</span>
                    </div>
                  )}
                  {viewingSale.paymentType === "financed" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrada</span>
                        <span className="font-medium">
                          {formatCurrency(viewingSale.downPayment)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Financiado</span>
                        <span className="font-medium">
                          {formatCurrency(viewingSale.financedValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parcelas</span>
                        <span className="font-medium">
                          {viewingSale.installments}x de{" "}
                          {formatCurrency(viewingSale.installmentValue)}
                        </span>
                      </div>
                      {viewingSale.financingBank && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Banco/Financeira</span>
                          <span className="font-medium">{viewingSale.financingBank}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {viewingSale.tradeInVehicle && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      <ArrowRightLeft className="inline mr-2 h-4 w-4" />
                      Veículo de Troca
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Veículo</span>
                      <span className="font-medium">
                        {viewingSale.tradeInVehicle.brand?.name} {viewingSale.tradeInVehicle.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano</span>
                      <span className="font-medium">{viewingSale.tradeInVehicle.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor da Troca</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(viewingSale.tradeInValue)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {viewingSale.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{viewingSale.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingVehicle} onOpenChange={() => setViewingVehicle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custos do Veículo</DialogTitle>
          </DialogHeader>
          {viewingVehicle && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Informações do Veículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{viewingVehicle.brand?.name} {viewingVehicle.model}</p>
                  <p className="text-sm text-muted-foreground">
                    Ano: {viewingVehicle.year} - Placa: {viewingVehicle.plate || "N/A"}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Preço de Compra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">
                      {viewingVehicle.purchasePrice ? formatCurrency(viewingVehicle.purchasePrice) : "N/A"}
                    </p>
                    {viewingVehicle.purchaseDate && (
                      <p className="text-xs text-muted-foreground">
                        Data: {formatDate(viewingVehicle.purchaseDate)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Custos Extras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(calculateTotalCosts(vehicleCosts))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicleCosts?.length || 0} itens
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Lucro Estimado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-xl font-bold ${calculateProfit(viewingVehicle, vehicleCosts) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(calculateProfit(viewingVehicle, vehicleCosts))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Venda: {formatCurrency(viewingVehicle.price)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Custos de Aquisição</h3>
                  <Button size="sm" onClick={handleOpenCostCreate} data-testid="button-add-cost">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Custo
                  </Button>
                </div>

                {vehicleCosts?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="mx-auto h-12 w-12 opacity-30 mb-2" />
                    <p>Nenhum custo adicional registrado</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicleCosts?.map((cost) => (
                          <TableRow key={cost.id}>
                            <TableCell>{cost.date ? formatDate(cost.date) : "-"}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{cost.description}</p>
                                {cost.notes && (
                                  <p className="text-xs text-muted-foreground">{cost.notes}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(cost.value)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCost(cost)}
                                  data-testid={`button-edit-cost-${cost.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingCost(cost)}
                                  data-testid={`button-delete-cost-${cost.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCost ? "Editar Custo" : "Adicionar Custo"}</DialogTitle>
          </DialogHeader>
          <Form {...costForm}>
            <form onSubmit={costForm.handleSubmit(onCostSubmit)} className="space-y-4">
              <FormField
                control={costForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: IPVA, Multas, Reparos..." data-testid="input-cost-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={costForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="R$ 0,00"
                          data-testid="input-cost-value"
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={costForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-cost-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={costForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações adicionais..."
                        className="resize-none"
                        rows={2}
                        data-testid="textarea-cost-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCostDialogOpen(false)}
                  data-testid="button-cancel-cost"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createCostMutation.isPending || updateCostMutation.isPending}
                  data-testid="button-save-cost"
                >
                  {(createCostMutation.isPending || updateCostMutation.isPending) ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingSale} onOpenChange={() => setDeletingSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? O veículo será marcado como
              disponível novamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSale && deleteMutation.mutate(deletingSale.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingCost} onOpenChange={() => setDeletingCost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este custo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-cost">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCost && deleteCostMutation.mutate(deletingCost.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-cost"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
