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
import type { SaleWithRelations, VehicleWithRelations, Customer } from "@shared/schema";

const saleFormSchema = z.object({
  customerId: z.number({ required_error: "Selecione um cliente" }),
  vehicleId: z.number({ required_error: "Selecione um veículo" }),
  saleDate: z.string().min(1, "Data da venda é obrigatória"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  paymentType: z.enum(["cash", "financed"], { required_error: "Selecione o tipo de pagamento" }),
  downPayment: z.string().optional(),
  financedValue: z.string().optional(),
  installments: z.number().optional(),
  installmentValue: z.string().optional(),
  financingBank: z.string().optional(),
  notes: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<SaleWithRelations | null>(null);
  const [deletingSale, setDeletingSale] = useState<SaleWithRelations | null>(null);
  const { toast } = useToast();

  const { data: sales, isLoading } = useQuery<SaleWithRelations[]>({
    queryKey: ["/api/sales"],
  });

  const { data: vehicles } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const availableVehicles = vehicles?.filter((v) => v.status === "available") || [];

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleDate: new Date().toISOString().split("T")[0],
      paymentType: "cash",
    },
  });

  const paymentType = form.watch("paymentType");

  const createMutation = useMutation({
    mutationFn: (data: SaleFormValues) =>
      apiRequest("POST", "/api/sales", {
        ...data,
        saleDate: new Date(data.saleDate),
      }),
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

  const handleOpenCreate = () => {
    form.reset({
      saleDate: new Date().toISOString().split("T")[0],
      paymentType: "cash",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: SaleFormValues) => {
    createMutation.mutate(data);
  };

  const filteredSales = sales?.filter(
    (sale) =>
      sale.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      sale.vehicle?.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Vendas
          </h1>
          <p className="text-muted-foreground">
            Histórico de vendas realizadas
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-sale">
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar vendas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-sales"
          />
        </div>
      </div>

      {isLoading ? (
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
                        {sale.vehicle?.brand?.name} • {sale.vehicle?.year}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(sale.totalValue)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.paymentType === "cash" ? "default" : "secondary"}>
                      {sale.paymentType === "cash" ? "À Vista" : "Financiado"}
                    </Badge>
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
                            form.setValue("totalValue", vehicle.price as string);
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
                        <SelectItem value="financed">Financiado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      Ano: {viewingSale.vehicle?.year} • Cor: {viewingSale.vehicle?.color}
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
                    <span className="font-medium text-primary">
                      {formatCurrency(viewingSale.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forma de Pagamento</span>
                    <Badge variant={viewingSale.paymentType === "cash" ? "default" : "secondary"}>
                      {viewingSale.paymentType === "cash" ? "À Vista" : "Financiado"}
                    </Badge>
                  </div>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
