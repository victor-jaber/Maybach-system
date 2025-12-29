import { useState, useEffect } from "react";
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
  UserPlus,
  Calculator,
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
import { Separator } from "@/components/ui/separator";
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
import {
  formatCPFCNPJ,
  validateCPFCNPJ,
  formatPhone,
  validatePhone,
} from "@/lib/br-formatters";
import type { SaleWithRelations, VehicleWithRelations, Customer, VehicleCost, Brand, Category } from "@shared/schema";

const saleFormSchema = z.object({
  customerId: z.number({ required_error: "Selecione um cliente" }),
  vehicleId: z.number({ required_error: "Selecione um veículo" }),
  saleDate: z.string().min(1, "Data da venda é obrigatória"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  downPayment: z.string().optional(),
  hasTradeIn: z.boolean().default(false),
  tradeInVehicleId: z.number().optional(),
  tradeInValue: z.string().optional(),
  remainingPaymentType: z.enum(["cash", "financed", "credit_card", "pix", "boleto"]).default("cash"),
  financedValue: z.string().optional(),
  installments: z.number().optional(),
  installmentValue: z.string().optional(),
  financingBank: z.string().optional(),
  notes: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

const quickCustomerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: z.string().min(1, "CPF/CNPJ é obrigatório").superRefine((val, ctx) => {
    const result = validateCPFCNPJ(val);
    if (!result.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message || "CPF/CNPJ inválido" });
    }
  }),
  phone: z.string().min(1, "Telefone é obrigatório").refine(validatePhone, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

type QuickCustomerValues = z.infer<typeof quickCustomerSchema>;

const quickVehicleSchema = z.object({
  brandId: z.number({ required_error: "Selecione uma marca" }),
  categoryId: z.number({ required_error: "Selecione uma categoria" }),
  model: z.string().min(1, "Modelo é obrigatório"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, "Cor é obrigatória"),
  mileage: z.number().min(0),
  price: z.string().min(1, "Preço é obrigatório"),
  plate: z.string().optional(),
  status: z.string().default("reserved"),
});

type QuickVehicleValues = z.infer<typeof quickVehicleSchema>;

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
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isTradeInVehicle, setIsTradeInVehicle] = useState(false);
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

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
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
      remainingPaymentType: "cash",
      hasTradeIn: false,
      downPayment: "",
      tradeInValue: "",
    },
  });

  const customerForm = useForm<QuickCustomerValues>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: { name: "", cpfCnpj: "", phone: "", email: "" },
  });

  const vehicleForm = useForm<QuickVehicleValues>({
    resolver: zodResolver(quickVehicleSchema),
    defaultValues: {
      model: "",
      year: new Date().getFullYear(),
      color: "",
      mileage: 0,
      price: "",
      status: "reserved",
    },
  });

  const costForm = useForm<CostFormValues>({
    resolver: zodResolver(costFormSchema),
    defaultValues: { date: new Date().toISOString().split("T")[0] },
  });

  const hasTradeIn = form.watch("hasTradeIn");
  const totalValue = form.watch("totalValue");
  const downPayment = form.watch("downPayment");
  const tradeInValue = form.watch("tradeInValue");
  const remainingPaymentType = form.watch("remainingPaymentType");

  const calculateRemainingValue = (): number => {
    const total = parseCurrencyToNumber(totalValue || "0");
    const down = parseCurrencyToNumber(downPayment || "0");
    const trade = hasTradeIn ? parseCurrencyToNumber(tradeInValue || "0") : 0;
    return Math.max(0, total - down - trade);
  };

  const remainingValue = calculateRemainingValue();

  useEffect(() => {
    if (remainingPaymentType === "financed") {
      form.setValue("financedValue", formatCurrency(remainingValue));
    }
  }, [remainingValue, remainingPaymentType]);

  const createMutation = useMutation({
    mutationFn: async (data: SaleFormValues) => {
      const totalValueNum = parseCurrencyToNumber(data.totalValue || "0");
      const downPaymentNum = data.downPayment ? parseCurrencyToNumber(data.downPayment) : null;
      const financedValueNum = data.financedValue ? parseCurrencyToNumber(data.financedValue) : null;
      const installmentValueNum = data.installmentValue ? parseCurrencyToNumber(data.installmentValue) : null;
      const tradeInValueNum = data.hasTradeIn && data.tradeInValue ? parseCurrencyToNumber(data.tradeInValue) : null;

      const salePayload = {
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        saleDate: new Date(data.saleDate),
        totalValue: totalValueNum,
        paymentType: data.remainingPaymentType === "financed" ? "financed" : 
                     data.remainingPaymentType === "credit_card" ? "credit_card" : "cash",
        downPayment: downPaymentNum,
        financedValue: financedValueNum,
        installments: data.installments || null,
        installmentValue: installmentValueNum,
        financingBank: data.financingBank || null,
        tradeInVehicleId: data.hasTradeIn ? data.tradeInVehicleId : null,
        tradeInValue: tradeInValueNum,
        notes: data.notes || null,
      };
      const saleResponse = await apiRequest("POST", "/api/sales", salePayload);
      const sale = await saleResponse.json();

      try {
        const contractPayload = {
          contractType: "purchase_sale",
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          saleId: sale.id,
          valorVenda: totalValueNum,
          entradaTotal: downPaymentNum,
          entradaPaga: downPaymentNum,
          entradaRestante: 0,
          formaPagamentoRestante: data.remainingPaymentType,
          quantidadeParcelas: data.installments || null,
          valorParcela: installmentValueNum,
          tradeInVehicleId: data.hasTradeIn ? data.tradeInVehicleId : null,
          tradeInValue: tradeInValueNum,
          status: "pending",
        };
        await apiRequest("POST", "/api/contracts", contractPayload);
      } catch (err) {
        console.error("Failed to create contract:", err);
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Venda registrada com sucesso! Contrato criado automaticamente." });
    },
    onError: () => {
      toast({ title: "Erro ao registrar venda", variant: "destructive" });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: QuickCustomerValues) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      form.setValue("customerId", data.id);
      setIsCustomerDialogOpen(false);
      customerForm.reset();
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar cliente", variant: "destructive" });
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: QuickVehicleValues) => {
      const vehiclePayload = {
        ...data,
        price: parseCurrencyToNumber(data.price),
      };
      const response = await apiRequest("POST", "/api/vehicles", vehiclePayload);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      if (isTradeInVehicle) {
        form.setValue("tradeInVehicleId", data.id);
      } else {
        form.setValue("vehicleId", data.id);
        form.setValue("totalValue", formatCurrency(data.price));
      }
      setIsVehicleDialogOpen(false);
      vehicleForm.reset({ model: "", year: new Date().getFullYear(), color: "", mileage: 0, price: "", status: "reserved" });
      toast({ title: "Veículo criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar veículo", variant: "destructive" });
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
        body: JSON.stringify({ ...data, value: parseCurrencyToNumber(data.value) }),
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
      remainingPaymentType: "cash",
      hasTradeIn: false,
      downPayment: "",
      tradeInValue: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenCustomerDialog = () => {
    customerForm.reset();
    setIsCustomerDialogOpen(true);
  };

  const handleOpenVehicleDialog = (forTradeIn: boolean) => {
    setIsTradeInVehicle(forTradeIn);
    vehicleForm.reset({
      model: "",
      year: new Date().getFullYear(),
      color: "",
      mileage: 0,
      price: "",
      status: forTradeIn ? "reserved" : "available",
    });
    setIsVehicleDialogOpen(true);
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
            Registre vendas, compras e acompanhe seu estoque
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
                        {sale.tradeInVehicle ? (
                          <Badge variant="outline">
                            <ArrowRightLeft className="mr-1 h-3 w-3" />
                            {formatCurrency(sale.tradeInValue)}
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
                            <Calculator className="h-4 w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                      <FormLabel className="flex items-center justify-between">
                        Cliente *
                        <Button type="button" variant="ghost" size="sm" onClick={handleOpenCustomerDialog}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Novo
                        </Button>
                      </FormLabel>
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
                      <FormLabel className="flex items-center justify-between">
                        Veículo *
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenVehicleDialog(false)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Novo
                        </Button>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          const vehicle = availableVehicles.find((v) => v.id === parseInt(value));
                          if (vehicle) {
                            form.setValue("totalValue", formatCurrency(vehicle.price));
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
                              {vehicle.brand?.name} {vehicle.model} - {vehicle.year} - {formatCurrency(vehicle.price)}
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
                      <FormLabel>Valor Total do Veículo *</FormLabel>
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

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Forma de Pagamento</h3>
                
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
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Valor Restante</p>
                    <div className="flex items-center h-9 px-3 rounded-md border bg-muted">
                      <span className="font-medium text-lg">{formatCurrency(remainingValue)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Veículo de Troca</h4>
                      <p className="text-xs text-muted-foreground">Cliente dá veículo como parte do pagamento</p>
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
                                  form.setValue("tradeInValue", "");
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
                            <FormLabel className="flex items-center justify-between">
                              Veículo de Troca
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenVehicleDialog(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Cadastrar
                              </Button>
                            </FormLabel>
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
                  name="remainingPaymentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento do Valor Restante</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-type">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                          <SelectItem value="financed">Financiamento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {remainingPaymentType === "credit_card" && (
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcelas do Cartão</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Número de parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x de {formatCurrency(remainingValue / num)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {remainingPaymentType === "financed" && (
                  <div className="grid gap-4 sm:grid-cols-2">
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
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                      name="financingBank"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco/Financeira</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do banco" />
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
                        rows={2}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Resumo da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor do Veículo</span>
                    <span className="font-medium">{totalValue || "R$ 0,00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">(-) Entrada</span>
                    <span>{downPayment || "R$ 0,00"}</span>
                  </div>
                  {hasTradeIn && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">(-) Veículo de Troca</span>
                      <span>{tradeInValue || "R$ 0,00"}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-medium">Valor Restante</span>
                    <span className="font-bold">{formatCurrency(remainingValue)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-sale">
                  {createMutation.isPending ? "Salvando..." : "Registrar Venda"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit((data) => createCustomerMutation.mutate(data))} className="space-y-4">
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do cliente" data-testid="input-quick-customer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="cpfCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="000.000.000-00"
                        data-testid="input-quick-customer-cpf"
                        onChange={(e) => field.onChange(formatCPFCNPJ(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="(00) 00000-0000"
                        data-testid="input-quick-customer-phone"
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com" data-testid="input-quick-customer-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isTradeInVehicle ? "Cadastrar Veículo de Troca" : "Cadastrar Novo Veículo"}
            </DialogTitle>
          </DialogHeader>
          <Form {...vehicleForm}>
            <form onSubmit={vehicleForm.handleSubmit((data) => createVehicleMutation.mutate(data))} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={vehicleForm.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-quick-brand">
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands?.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id.toString()}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vehicleForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-quick-category">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
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
                  control={vehicleForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Civic LXS" data-testid="input-quick-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vehicleForm.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-quick-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={vehicleForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Preto" data-testid="input-quick-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vehicleForm.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KM</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-quick-mileage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vehicleForm.control}
                  name="plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC1234" data-testid="input-quick-plate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={vehicleForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isTradeInVehicle ? "Valor de Avaliação *" : "Preço de Venda *"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="R$ 0,00"
                        data-testid="input-quick-price"
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
              {isTradeInVehicle && (
                <p className="text-sm text-muted-foreground">
                  O veículo será cadastrado com status "Reservado" para avaliação.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createVehicleMutation.isPending}>
                  {createVehicleMutation.isPending ? "Salvando..." : "Cadastrar"}
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
                    <p className="text-sm text-muted-foreground">CPF/CNPJ: {viewingSale.customer?.cpfCnpj}</p>
                    <p className="text-sm text-muted-foreground">Tel: {viewingSale.customer?.phone}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Veículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{viewingSale.vehicle?.brand?.name} {viewingSale.vehicle?.model}</p>
                    <p className="text-sm text-muted-foreground">Ano: {viewingSale.vehicle?.year} - Cor: {viewingSale.vehicle?.color}</p>
                    <p className="text-sm text-muted-foreground">Placa: {viewingSale.vehicle?.plate || "N/A"}</p>
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
                    <span className="font-medium">{formatCurrency(viewingSale.totalValue)}</span>
                  </div>
                  {viewingSale.downPayment && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entrada</span>
                      <span className="font-medium">{formatCurrency(viewingSale.downPayment)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forma de Pagamento</span>
                    <Badge variant="outline">
                      {viewingSale.paymentType === "cash" ? "Dinheiro/PIX" : viewingSale.paymentType === "credit_card" ? "Cartão" : "Financiado"}
                    </Badge>
                  </div>
                  {viewingSale.paymentType === "financed" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Financiado</span>
                        <span className="font-medium">{formatCurrency(viewingSale.financedValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parcelas</span>
                        <span className="font-medium">{viewingSale.installments}x de {formatCurrency(viewingSale.installmentValue)}</span>
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
                      <span className="font-medium">{viewingSale.tradeInVehicle.brand?.name} {viewingSale.tradeInVehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor da Troca</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(viewingSale.tradeInValue)}</span>
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
            <DialogTitle>Custos e Lucro do Veículo</DialogTitle>
          </DialogHeader>
          {viewingVehicle && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Informações do Veículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{viewingVehicle.brand?.name} {viewingVehicle.model}</p>
                  <p className="text-sm text-muted-foreground">Ano: {viewingVehicle.year} - Placa: {viewingVehicle.plate || "N/A"}</p>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Compra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">
                      {viewingVehicle.purchasePrice ? formatCurrency(viewingVehicle.purchasePrice) : "N/A"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Custos Extras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(calculateTotalCosts(vehicleCosts))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Preço Venda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{formatCurrency(viewingVehicle.price)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Lucro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-lg font-bold ${calculateProfit(viewingVehicle, vehicleCosts) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(calculateProfit(viewingVehicle, vehicleCosts))}
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
                                {cost.notes && <p className="text-xs text-muted-foreground">{cost.notes}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(cost.value)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditCost(cost)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeletingCost(cost)}>
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
                      <Input {...field} placeholder="Ex: IPVA, Multas, Reparos..." />
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
                        <Input type="date" {...field} />
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
                      <Textarea {...field} placeholder="Observações adicionais..." className="resize-none" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCostDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCostMutation.isPending || updateCostMutation.isPending}>
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
              Tem certeza que deseja excluir esta venda? O veículo será marcado como disponível novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSale && deleteMutation.mutate(deletingSale.id)}
              className="bg-destructive text-destructive-foreground"
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
              Tem certeza que deseja excluir este custo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCost && deleteCostMutation.mutate(deletingCost.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
