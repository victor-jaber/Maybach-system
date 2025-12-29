import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/hooks/use-auth";
import type { ContractWithRelations } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Eye,
  Trash2,
  FileDown,
  Car,
  User,
  Loader2,
  Mail,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  sale: "Venda",
  entry_complement: "Complemento de Entrada",
  purchase_sale: "Compra e Venda (Loja Vendendo)",
  vehicle_purchase: "Compra de Veículo (Loja Comprando)",
  consignment: "Consignação de Veículo",
  delivery_protocol: "Protocolo de Entrega",
  consignment_withdrawal: "Protocolo de Retirada (Consignação)",
};

const contractStatusLabels: Record<string, string> = {
  pending: "Pendente",
  draft: "Rascunho",
  generated: "Gerado",
  signed: "Assinado",
  cancelled: "Cancelado",
};

const contractStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  draft: "secondary",
  generated: "outline",
  signed: "default",
  cancelled: "destructive",
};

export default function ContractsPage() {
  const { toast } = useToast();
  const [viewingContract, setViewingContract] = useState<ContractWithRelations | null>(null);
  const [deletingContract, setDeletingContract] = useState<ContractWithRelations | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<number | null>(null);

  const { data: contracts = [], isLoading } = useQuery<ContractWithRelations[]>({
    queryKey: ["/api/contracts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      });
      setDeletingContract(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    },
  });

  const sendSignatureMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await fetch(`/api/contracts/${contractId}/send-signature`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao enviar email");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Email enviado",
        description: "O email de assinatura foi enviado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de assinatura.",
        variant: "destructive",
      });
    },
  });

  const downloadPDF = async (contractId: number) => {
    setDownloadingPDF(contractId);
    try {
      const response = await fetch(`/api/contracts/${contractId}/pdf`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Erro ao gerar PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrato-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "PDF baixado com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro ao baixar PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingPDF(null);
    }
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
              Visualize, baixe e envie contratos para assinatura
            </p>
          </div>
        </div>
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
                Os contratos são criados automaticamente ao registrar uma venda.
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
                  <TableHead>Valor</TableHead>
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
                        {contract.vehicle ? `${contract.vehicle.brand?.name} ${contract.vehicle.model}` : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contractTypeLabels[contract.contractType || "sale"] || "Venda"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(contract.valorVenda || contract.entradaTotal || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contractStatusColors[contract.status || "pending"]}>
                        {contractStatusLabels[contract.status || "pending"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.createdAt ? format(new Date(contract.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setViewingContract(contract)}
                              data-testid={`button-view-contract-${contract.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Detalhes</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => downloadPDF(contract.id)}
                              disabled={downloadingPDF === contract.id}
                              data-testid={`button-download-pdf-${contract.id}`}
                            >
                              {downloadingPDF === contract.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Baixar PDF</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => sendSignatureMutation.mutate(contract.id)}
                              disabled={sendSignatureMutation.isPending}
                              data-testid={`button-send-signature-${contract.id}`}
                            >
                              {sendSignatureMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Enviar para Assinatura</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeletingContract(contract)}
                              data-testid={`button-delete-contract-${contract.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato #{viewingContract?.id}</DialogTitle>
          </DialogHeader>
          {viewingContract && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{viewingContract.customer?.name}</p>
                    <p className="text-sm text-muted-foreground">CPF/CNPJ: {viewingContract.customer?.cpfCnpj}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Veículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{viewingContract.vehicle?.brand?.name} {viewingContract.vehicle?.model}</p>
                    <p className="text-sm text-muted-foreground">Ano: {viewingContract.vehicle?.year}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Informações do Contrato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="outline">
                      {contractTypeLabels[viewingContract.contractType || "sale"] || "Venda"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium">
                      {formatCurrency(viewingContract.valorVenda || viewingContract.entradaTotal || 0)}
                    </span>
                  </div>
                  {viewingContract.entradaPaga && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entrada Paga</span>
                      <span className="font-medium">{formatCurrency(viewingContract.entradaPaga)}</span>
                    </div>
                  )}
                  {viewingContract.entradaRestante && Number(viewingContract.entradaRestante) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entrada Restante</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(viewingContract.entradaRestante)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={contractStatusColors[viewingContract.status || "pending"]}>
                      {contractStatusLabels[viewingContract.status || "pending"]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Criação</span>
                    <span>{viewingContract.createdAt ? format(new Date(viewingContract.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}</span>
                  </div>
                </CardContent>
              </Card>

              {viewingContract.tradeInVehicle && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Veículo de Troca</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Veículo</span>
                      <span className="font-medium">
                        {viewingContract.tradeInVehicle.brand?.name} {viewingContract.tradeInVehicle.model}
                      </span>
                    </div>
                    {viewingContract.tradeInValue && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(viewingContract.tradeInValue)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadPDF(viewingContract.id)}
                  disabled={downloadingPDF === viewingContract.id}
                >
                  {downloadingPDF === viewingContract.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Baixar PDF
                </Button>
                <Button
                  onClick={() => sendSignatureMutation.mutate(viewingContract.id)}
                  disabled={sendSignatureMutation.isPending}
                >
                  {sendSignatureMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Enviar para Assinatura
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingContract} onOpenChange={() => setDeletingContract(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato #{deletingContract?.id}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContract && deleteMutation.mutate(deletingContract.id)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
