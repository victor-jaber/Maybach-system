import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/hooks/use-auth";
import type { ContractWithRelations, Customer, VehicleWithRelations } from "@shared/schema";
import { formatCurrency, formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  FileDown,
  Car,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
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

const contractTypeLabels: Record<string, string> = {
  entry_complement: "Complemento de Entrada",
  purchase_sale: "Compra e Venda (Loja Vendendo)",
  vehicle_purchase: "Compra de Veículo (Loja Comprando)",
  consignment: "Consignação de Veículo",
  delivery_protocol: "Protocolo de Entrega",
  consignment_withdrawal: "Protocolo de Retirada (Consignação)",
};

const contractStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  generated: "Gerado",
  signed: "Assinado",
  cancelled: "Cancelado",
};

const contractStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  generated: "outline",
  signed: "default",
  cancelled: "destructive",
};

const contractFormSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente"),
  vehicleId: z.string().min(1, "Selecione um veículo"),
  contractType: z.string().min(1, "Selecione o tipo de contrato"),
  valorVenda: z.string().optional(),
  entradaTotal: z.string().optional(),
  entradaPaga: z.string().optional(),
  formaPagamentoRestante: z.string().optional(),
  dataVencimentoAvista: z.string().optional(),
  quantidadeParcelas: z.string().optional(),
  valorParcela: z.string().optional(),
  diaVencimento: z.string().optional(),
  formaPagamentoParcelas: z.string().optional(),
  multaAtraso: z.string().optional(),
  jurosAtraso: z.string().optional(),
  valorMinimoVenda: z.string().optional(),
  comissaoLoja: z.string().optional(),
  prazoConsignacao: z.string().optional(),
  multaRetiradaAntecipada: z.string().optional(),
  chavePrincipal: z.boolean().optional(),
  chaveReserva: z.boolean().optional(),
  manual: z.boolean().optional(),
  condicaoGeral: z.string().optional(),
  observacoesEntrega: z.string().optional(),
  hasTradeIn: z.boolean().optional(),
  tradeInPlate: z.string().optional(),
  tradeInValue: z.string().optional(),
  tradeInNotes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

export default function ContractsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<ContractWithRelations | null>(null);
  const [deletingContract, setDeletingContract] = useState<ContractWithRelations | null>(null);

  const { data: contracts = [], isLoading } = useQuery<ContractWithRelations[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: vehicles = [] } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles"],
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      customerId: "",
      vehicleId: "",
      contractType: "",
      valorVenda: "",
      entradaTotal: "",
      entradaPaga: "",
      formaPagamentoRestante: "",
      dataVencimentoAvista: "",
      quantidadeParcelas: "",
      valorParcela: "",
      diaVencimento: "",
      formaPagamentoParcelas: "",
      multaAtraso: "2",
      jurosAtraso: "1",
      valorMinimoVenda: "",
      comissaoLoja: "10",
      prazoConsignacao: "60",
      multaRetiradaAntecipada: "R$ 500,00",
      chavePrincipal: true,
      chaveReserva: false,
      manual: false,
      condicaoGeral: "",
      observacoesEntrega: "",
      hasTradeIn: false,
      tradeInPlate: "",
      tradeInValue: "",
      tradeInNotes: "",
    },
  });

  const [tradeInVehicle, setTradeInVehicle] = useState<VehicleWithRelations | null>(null);
  const [tradeInSearching, setTradeInSearching] = useState(false);
  const [tradeInNotFound, setTradeInNotFound] = useState(false);

  const watchedVehicleId = form.watch("vehicleId");
  const watchedFormaPagamento = form.watch("formaPagamentoRestante");
  const watchedEntradaTotal = form.watch("entradaTotal");
  const watchedEntradaPaga = form.watch("entradaPaga");
  const watchedContractType = form.watch("contractType");
  const watchedHasTradeIn = form.watch("hasTradeIn");

  const selectedVehicle = vehicles.find(v => v.id.toString() === watchedVehicleId);
  
  const entradaRestante = (() => {
    const total = parseCurrencyToNumber(watchedEntradaTotal || "0");
    const paga = parseCurrencyToNumber(watchedEntradaPaga || "0");
    return Math.max(0, total - paga);
  })();

  const searchTradeInVehicle = async (plate: string) => {
    if (!plate || plate.length < 7) return;
    setTradeInSearching(true);
    setTradeInNotFound(false);
    setTradeInVehicle(null);
    
    try {
      const response = await fetch(`/api/vehicles/search/plate/${encodeURIComponent(plate)}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.ok) {
        const vehicle = await response.json();
        setTradeInVehicle(vehicle);
        setTradeInNotFound(false);
      } else {
        setTradeInNotFound(true);
      }
    } catch (error) {
      console.error("Error searching trade-in vehicle:", error);
      setTradeInNotFound(true);
    } finally {
      setTradeInSearching(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const entradaTotalNum = data.entradaTotal ? String(parseCurrencyToNumber(data.entradaTotal)) : null;
      const entradaPagaNum = data.entradaPaga ? String(parseCurrencyToNumber(data.entradaPaga)) : null;
      const valorVendaNum = data.valorVenda ? String(parseCurrencyToNumber(data.valorVenda)) : null;
      const valorParcelaNum = data.valorParcela ? String(parseCurrencyToNumber(data.valorParcela)) : null;
      
      const tradeInValueNum = data.tradeInValue ? String(parseCurrencyToNumber(data.tradeInValue)) : null;
      
      return apiRequest("POST", "/api/contracts", {
        customerId: parseInt(data.customerId),
        vehicleId: parseInt(data.vehicleId),
        contractType: data.contractType,
        valorVenda: valorVendaNum,
        entradaTotal: entradaTotalNum,
        entradaPaga: entradaPagaNum,
        entradaRestante: entradaTotalNum && entradaPagaNum 
          ? String(Math.max(0, parseFloat(entradaTotalNum) - parseFloat(entradaPagaNum)))
          : null,
        formaPagamentoRestante: data.formaPagamentoRestante || null,
        dataVencimentoAvista: data.dataVencimentoAvista || null,
        quantidadeParcelas: data.quantidadeParcelas ? parseInt(data.quantidadeParcelas) : null,
        valorParcela: valorParcelaNum,
        diaVencimento: data.diaVencimento ? parseInt(data.diaVencimento) : null,
        formaPagamentoParcelas: data.formaPagamentoParcelas || null,
        multaAtraso: data.multaAtraso || null,
        jurosAtraso: data.jurosAtraso || null,
        tradeInVehicleId: data.hasTradeIn && tradeInVehicle ? tradeInVehicle.id : null,
        tradeInValue: data.hasTradeIn ? tradeInValueNum : null,
        tradeInNotes: data.hasTradeIn && data.tradeInNotes ? data.tradeInNotes : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      setTradeInVehicle(null);
      setTradeInNotFound(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contrato.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/contracts/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Status atualizado",
        description: "O status do contrato foi atualizado.",
      });
      setViewingContract(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setDeletingContract(null);
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    },
  });

  const generatePdfMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/contracts/${id}/generate-pdf`, {
        method: "POST",
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      return response.blob();
    },
    onSuccess: async (blob, id) => {
      const contract = contracts.find(c => c.id === id);
      const fileName = `contrato_${id}_${contract?.customer?.name?.replace(/\s/g, "_") || "cliente"}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "PDF gerado",
        description: "O contrato foi gerado e está sendo baixado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF do contrato.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractFormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-contracts">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-serif font-bold">Contratos</h1>
            <p className="text-muted-foreground">
              Gerencie os contratos de compra e venda
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-contract">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Contrato</DialogTitle>
              <DialogDescription>
                Preencha os dados do contrato
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Informações Básicas</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contract-customer">
                                <SelectValue placeholder="Selecione um cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{customer.name}</span>
                                  </div>
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
                          <Select value={field.value} onValueChange={(value) => {
                            field.onChange(value);
                            const vehicle = vehicles.find(v => v.id.toString() === value);
                            if (vehicle) {
                              form.setValue("valorVenda", formatCurrency(parseFloat(vehicle.price.toString())));
                            }
                          }}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contract-vehicle">
                                <SelectValue placeholder="Selecione um veículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicles.filter(v => v.status === "available").map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Car className="h-4 w-4" />
                                    <span>{vehicle.brand?.name} {vehicle.model} - {formatCurrency(vehicle.price)}</span>
                                  </div>
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
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Contrato *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contract-type">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="purchase_sale">Compra e Venda (Loja Vendendo)</SelectItem>
                              <SelectItem value="entry_complement">Complemento de Entrada</SelectItem>
                              <SelectItem value="vehicle_purchase">Compra de Veículo (Loja Comprando)</SelectItem>
                              <SelectItem value="consignment">Consignação de Veículo</SelectItem>
                              <SelectItem value="delivery_protocol">Protocolo de Entrega</SelectItem>
                              <SelectItem value="consignment_withdrawal">Protocolo de Retirada (Consignação)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {(watchedContractType === "purchase_sale" || watchedContractType === "entry_complement" || watchedContractType === "vehicle_purchase") && (
                      <FormField
                        control={form.control}
                        name="valorVenda"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{watchedContractType === "vehicle_purchase" ? "Valor de Compra" : "Valor da Venda"}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="R$ 0,00"
                                data-testid="input-valor-venda"
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
                    )}
                  </div>
                </div>

                {(watchedContractType === "purchase_sale" || watchedContractType === "entry_complement") && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Valores da Entrada</h4>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="entradaTotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Entrada Total</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="R$ 0,00"
                                  data-testid="input-entrada-total"
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
                          name="entradaPaga"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Entrada Paga</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="R$ 0,00"
                                  data-testid="input-entrada-paga"
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
                          <Label>Entrada Restante</Label>
                          <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-muted-foreground">
                            {formatCurrency(entradaRestante)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Veículo na Troca (Opcional)</h4>
                        <FormField
                          control={form.control}
                          name="hasTradeIn"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked);
                                    if (!e.target.checked) {
                                      setTradeInVehicle(null);
                                      setTradeInNotFound(false);
                                      form.setValue("tradeInPlate", "");
                                      form.setValue("tradeInValue", "");
                                      form.setValue("tradeInNotes", "");
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                  data-testid="checkbox-has-trade-in"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Cliente dará veículo na troca</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      {watchedHasTradeIn && (
                        <div className="space-y-4 p-4 rounded-md border bg-muted/30">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="tradeInPlate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Placa do Veículo</FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="ABC1D23"
                                        maxLength={7}
                                        data-testid="input-trade-in-plate"
                                        onChange={(e) => {
                                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                          field.onChange(value);
                                        }}
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={tradeInSearching || !field.value || field.value.length < 7}
                                      onClick={() => searchTradeInVehicle(field.value || "")}
                                      data-testid="button-search-trade-in"
                                    >
                                      {tradeInSearching ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Buscar"
                                      )}
                                    </Button>
                                  </div>
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

                          {tradeInVehicle && (
                            <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-medium">Veículo encontrado no sistema</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p><strong>{tradeInVehicle.brand?.name} {tradeInVehicle.model}</strong> - {tradeInVehicle.year}</p>
                                <p>Placa: {tradeInVehicle.plate} | Cor: {tradeInVehicle.color}</p>
                                {tradeInVehicle.mileage && <p>Km: {tradeInVehicle.mileage.toLocaleString("pt-BR")}</p>}
                              </div>
                            </div>
                          )}

                          {tradeInNotFound && (
                            <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-2">
                                <XCircle className="h-4 w-4" />
                                <span className="font-medium">Veículo não cadastrado</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Este veículo não está cadastrado no sistema. Você precisará cadastrá-lo separadamente em "Veículos" antes de finalizar o contrato.
                              </p>
                            </div>
                          )}

                          <FormField
                            control={form.control}
                            name="tradeInNotes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Observações sobre a Troca</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Condições do veículo, pendências, etc..."
                                    data-testid="input-trade-in-notes"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {watchedContractType === "consignment" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Dados da Consignação</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="valorMinimoVenda"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor Mínimo de Venda</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="R$ 0,00"
                                  data-testid="input-valor-minimo"
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
                          name="comissaoLoja"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Comissão da Loja (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  {...field}
                                  data-testid="input-comissao"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="prazoConsignacao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prazo de Consignação (dias)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="365"
                                  {...field}
                                  data-testid="input-prazo"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="multaRetiradaAntecipada"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Multa por Retirada Antecipada</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="R$ 500,00"
                                  data-testid="input-multa-retirada"
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
                    </div>
                  </>
                )}

                {(watchedContractType === "delivery_protocol" || watchedContractType === "consignment_withdrawal") && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Checklist de Entrega/Retirada</h4>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="chavePrincipal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300"
                                  data-testid="checkbox-chave-principal"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Chave Principal</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="chaveReserva"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300"
                                  data-testid="checkbox-chave-reserva"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Chave Reserva</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="manual"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300"
                                  data-testid="checkbox-manual"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Manual do Proprietário</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="condicaoGeral"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condição Geral do Veículo</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-condicao">
                                  <SelectValue placeholder="Selecione a condição" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excelente">Excelente</SelectItem>
                                <SelectItem value="boa">Boa</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="reparos">Necessita Reparos</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="observacoesEntrega"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Observações sobre o estado do veículo..."
                                data-testid="input-observacoes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {(watchedContractType === "purchase_sale" || watchedContractType === "entry_complement") && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Forma de Pagamento do Restante</h4>
                  <FormField
                    control={form.control}
                    name="formaPagamentoRestante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Como será pago o restante?</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-forma-pagamento">
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="avista">À Vista</SelectItem>
                            <SelectItem value="parcelado">Parcelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedFormaPagamento === "avista" && (
                    <FormField
                      control={form.control}
                      name="dataVencimentoAvista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-data-vencimento"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedFormaPagamento === "parcelado" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="quantidadeParcelas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade de Parcelas</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                {...field}
                                data-testid="input-quantidade-parcelas"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="valorParcela"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor da Parcela</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="R$ 0,00"
                                data-testid="input-valor-parcela"
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
                        name="diaVencimento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia de Vencimento</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="Ex: 10"
                                {...field}
                                data-testid="input-dia-vencimento"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="formaPagamentoParcelas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Forma de Pagamento</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-forma-parcelas">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="boleto">Boleto</SelectItem>
                                <SelectItem value="transferencia">Transferência</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="multaAtraso"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Multa por Atraso (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                {...field}
                                data-testid="input-multa-atraso"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jurosAtraso"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Juros por Atraso (% ao mês)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                {...field}
                                data-testid="input-juros-atraso"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                )}

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-create-contract"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Contrato"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
          <CardDescription>
            {contracts.length} contrato{contracts.length !== 1 ? "s" : ""} encontrado{contracts.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground">
                Clique em "Novo Contrato" para criar um contrato.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Entrada Restante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                    <TableCell className="font-medium">#{contract.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {contract.customer?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {contract.vehicle?.brand?.name} {contract.vehicle?.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contractTypeLabels[contract.contractType] || contract.contractType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.valorVenda ? formatCurrency(parseFloat(contract.valorVenda)) : "-"}
                    </TableCell>
                    <TableCell>
                      {contract.entradaRestante ? formatCurrency(parseFloat(contract.entradaRestante)) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contractStatusColors[contract.status] || "secondary"}>
                        {contractStatusLabels[contract.status] || contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.createdAt
                        ? format(new Date(contract.createdAt), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingContract(contract)}
                          data-testid={`button-view-contract-${contract.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => generatePdfMutation.mutate(contract.id)}
                          disabled={generatePdfMutation.isPending}
                          data-testid={`button-download-contract-${contract.id}`}
                        >
                          {generatePdfMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingContract(contract)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-contract-${contract.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato #{viewingContract?.id}</DialogTitle>
          </DialogHeader>
          {viewingContract && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{viewingContract.customer?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Veículo</Label>
                  <p className="font-medium">
                    {viewingContract.vehicle?.brand?.name} {viewingContract.vehicle?.model}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{contractTypeLabels[viewingContract.contractType]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={contractStatusColors[viewingContract.status]}>
                    {contractStatusLabels[viewingContract.status]}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Valor da Venda</Label>
                  <p className="font-medium">
                    {viewingContract.valorVenda ? formatCurrency(parseFloat(viewingContract.valorVenda)) : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entrada Total</Label>
                  <p className="font-medium">
                    {viewingContract.entradaTotal ? formatCurrency(parseFloat(viewingContract.entradaTotal)) : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entrada Restante</Label>
                  <p className="font-medium">
                    {viewingContract.entradaRestante ? formatCurrency(parseFloat(viewingContract.entradaRestante)) : "-"}
                  </p>
                </div>
              </div>

              {viewingContract.formaPagamentoRestante === "parcelado" && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label className="text-muted-foreground">Parcelas</Label>
                      <p className="font-medium">{viewingContract.quantidadeParcelas || "-"}x</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Valor da Parcela</Label>
                      <p className="font-medium">
                        {viewingContract.valorParcela ? formatCurrency(parseFloat(viewingContract.valorParcela)) : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Dia de Vencimento</Label>
                      <p className="font-medium">{viewingContract.diaVencimento || "-"}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                {viewingContract.status === "draft" && (
                  <Button
                    onClick={() => updateStatusMutation.mutate({ id: viewingContract.id, status: "generated" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Gerado
                  </Button>
                )}
                {viewingContract.status === "generated" && (
                  <Button
                    onClick={() => updateStatusMutation.mutate({ id: viewingContract.id, status: "signed" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Assinado
                  </Button>
                )}
                {(viewingContract.status === "draft" || viewingContract.status === "generated") && (
                  <Button
                    variant="destructive"
                    onClick={() => updateStatusMutation.mutate({ id: viewingContract.id, status: "cancelled" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar Contrato
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => generatePdfMutation.mutate(viewingContract.id)}
                  disabled={generatePdfMutation.isPending}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingContract} onOpenChange={() => setDeletingContract(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato #{deletingContract?.id}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContract && deleteMutation.mutate(deletingContract.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
