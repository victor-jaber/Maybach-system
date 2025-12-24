import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthToken, useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Car,
  DollarSign,
  Calendar,
  FileText,
  RefreshCw,
  Trash2,
  CreditCard,
  Receipt,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { VehicleWithRelations } from "@shared/schema";

interface VehicleDebt {
  id: number;
  vehicleId: number;
  debtType: string;
  description: string;
  year: number | null;
  dueDate: string | null;
  value: string;
  status: string;
  paymentDate: string | null;
  reference: string | null;
  consultedAt: string;
  source: string | null;
}

interface DebtsSummary {
  totalPending: number;
  totalPaid: number;
  byType: { type: string; count: number; total: number }[];
  vehiclesWithDebts: number;
}

const debtTypeLabels: Record<string, string> = {
  ipva: "IPVA",
  multa: "Multa",
  licenciamento: "Licenciamento",
  seguro: "Seguro Obrigatório",
  divida_ativa: "Dívida Ativa",
};

const debtTypeIcons: Record<string, typeof DollarSign> = {
  ipva: DollarSign,
  multa: AlertTriangle,
  licenciamento: FileText,
  seguro: Shield,
  divida_ativa: AlertCircle,
};

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function VehicleDebtsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<VehicleDebt | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles"],
    enabled: isAuthenticated,
  });

  const { data: summary, isLoading: loadingSummary } = useQuery<DebtsSummary>({
    queryKey: ["/api/vehicle-debts/summary"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/vehicle-debts/summary", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: debts = [], isLoading: loadingDebts, refetch: refetchDebts } = useQuery<VehicleDebt[]>({
    queryKey: ["/api/vehicles", selectedVehicleId, "debts"],
    enabled: isAuthenticated && selectedVehicleId !== null,
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${selectedVehicleId}/debts`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const consultMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await fetch(`/api/vehicles/${vehicleId}/debts/consult`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to consult");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Consulta realizada",
        description: "Débitos do veículo foram consultados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", selectedVehicleId, "debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-debts/summary"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na consulta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const payMutation = useMutation({
    mutationFn: async (debtId: number) => {
      const res = await fetch(`/api/vehicle-debts/${debtId}/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error("Failed to mark as paid");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Débito quitado",
        description: "O débito foi marcado como pago.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", selectedVehicleId, "debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-debts/summary"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar o débito como pago.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (debtId: number) => {
      await apiRequest("DELETE", `/api/vehicle-debts/${debtId}`);
    },
    onSuccess: () => {
      toast({
        title: "Débito removido",
        description: "O registro de débito foi removido.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", selectedVehicleId, "debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-debts/summary"] });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o débito.",
        variant: "destructive",
      });
    },
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const pendingDebts = debts.filter((d) => d.status === "pending");
  const paidDebts = debts.filter((d) => d.status === "paid");
  const totalPending = pendingDebts.reduce((sum, d) => sum + parseFloat(d.value), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif" data-testid="text-page-title">
            Consulta de Débitos
          </h1>
          <p className="text-muted-foreground">
            Consulte multas, IPVA, licenciamento e outros débitos dos veículos
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-total-pending">
              {loadingSummary ? "..." : formatCurrency(summary?.totalPending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.vehiclesWithDebts || 0} veículos com débitos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-total-paid">
              {loadingSummary ? "..." : formatCurrency(summary?.totalPaid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Débitos quitados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPVA</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ipva-count">
              {loadingSummary ? "..." : summary?.byType.find((t) => t.type === "ipva")?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary?.byType.find((t) => t.type === "ipva")?.total || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multas</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-fines-count">
              {loadingSummary ? "..." : summary?.byType.find((t) => t.type === "multa")?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary?.byType.find((t) => t.type === "multa")?.total || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultar Veículo</CardTitle>
          <CardDescription>
            Selecione um veículo para consultar seus débitos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[250px]">
              <label className="text-sm font-medium mb-2 block">Veículo</label>
              <Select
                value={selectedVehicleId?.toString() || ""}
                onValueChange={(v) => setSelectedVehicleId(parseInt(v))}
              >
                <SelectTrigger data-testid="select-vehicle">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.brand?.name} {vehicle.model} - {vehicle.plate || "Sem placa"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => selectedVehicleId && consultMutation.mutate(selectedVehicleId)}
              disabled={!selectedVehicleId || consultMutation.isPending}
              data-testid="button-consult"
            >
              {consultMutation.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Consultar Débitos
            </Button>
          </div>

          {selectedVehicle && (
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-md">
              <Car className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">
                  {selectedVehicle.brand?.name} {selectedVehicle.model} ({selectedVehicle.year})
                </p>
                <p className="text-sm text-muted-foreground">
                  Placa: {selectedVehicle.plate || "N/A"} | Renavam: {selectedVehicle.renavam || "N/A"}
                </p>
              </div>
              {debts.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Pendente</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(totalPending)}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVehicleId && debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Débitos do Veículo</CardTitle>
            <CardDescription>
              Lista de débitos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => {
                  const Icon = debtTypeIcons[debt.debtType] || FileText;
                  const isPending = debt.status === "pending";

                  return (
                    <TableRow key={debt.id} data-testid={`row-debt-${debt.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{debtTypeLabels[debt.debtType] || debt.debtType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{debt.description}</p>
                          {debt.reference && (
                            <p className="text-xs text-muted-foreground">Ref: {debt.reference}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(debt.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(debt.value)}
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <Badge variant="destructive" className="whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500 whitespace-nowrap">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => payMutation.mutate(debt.id)}
                              disabled={payMutation.isPending}
                              data-testid={`button-pay-${debt.id}`}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setDebtToDelete(debt);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${debt.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedVehicleId && debts.length === 0 && !loadingDebts && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum débito encontrado</h3>
            <p className="text-muted-foreground">
              Clique em "Consultar Débitos" para buscar débitos deste veículo
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Débito</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este registro de débito?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {debtToDelete && (
              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium">{debtToDelete.description}</p>
                <p className="text-sm text-muted-foreground">
                  Valor: {formatCurrency(debtToDelete.value)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => debtToDelete && deleteMutation.mutate(debtToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
