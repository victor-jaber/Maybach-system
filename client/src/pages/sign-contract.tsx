import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileCheck, Shield, Car, User, AlertCircle, CheckCircle2, Lock, Loader2 } from "lucide-react";
import type { ContractWithRelations, Store, ContractFile } from "@shared/schema";

interface SignatureInfo {
  status: string;
  isValidated: boolean;
  isSigned: boolean;
  contractId: number;
  contractType: string;
  customerName: string;
  vehicleInfo: string;
  cpfCnpjLength: number;
}

interface ContractData {
  contract: ContractWithRelations;
  store: Store | null;
  files: ContractFile[];
  isSigned: boolean;
  signedAt: Date | null;
}

const contractTypeNames: Record<string, string> = {
  entry_complement: "Complemento de Entrada",
  purchase_sale: "Compra e Venda",
  vehicle_purchase: "Aquisição de Veículo",
  consignment: "Consignação",
  delivery_protocol: "Protocolo de Entrega",
  consignment_withdrawal: "Retirada em Consignação",
};

function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "R$ 0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR");
}

export default function SignContractPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [validationCode, setValidationCode] = useState("");
  const [step, setStep] = useState<"loading" | "validate" | "sign" | "signed" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: signatureInfo, isLoading: isLoadingInfo, error: infoError } = useQuery<SignatureInfo>({
    queryKey: ["/api/public/signature", token],
    enabled: !!token,
  });

  const { data: contractData, isLoading: isLoadingContract, refetch: refetchContract } = useQuery<ContractData>({
    queryKey: ["/api/public/signature", token, "contract"],
    enabled: false,
  });

  const validateMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", `/api/public/signature/${token}/validate`, { code });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Identidade validada!", description: "Agora você pode visualizar e assinar o contrato." });
      refetchContract();
      setStep("sign");
    },
    onError: (error: Error) => {
      toast({ title: "Erro na validação", description: error.message, variant: "destructive" });
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/public/signature/${token}/sign`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Contrato assinado!", description: "Sua assinatura foi registrada com sucesso." });
      setStep("signed");
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao assinar", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (infoError) {
      setErrorMessage((infoError as Error).message || "Link inválido ou expirado");
      setStep("error");
    } else if (signatureInfo) {
      if (signatureInfo.isSigned) {
        setStep("signed");
      } else if (signatureInfo.isValidated) {
        refetchContract();
        setStep("sign");
      } else {
        setStep("validate");
      }
    }
  }, [signatureInfo, infoError, refetchContract]);

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationCode.length !== 3) {
      toast({ title: "Código inválido", description: "Digite exatamente 3 dígitos", variant: "destructive" });
      return;
    }
    validateMutation.mutate(validationCode);
  };

  const handleSign = () => {
    signMutation.mutate();
  };

  if (isLoadingInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Entre em contato com a MayBack Cars para solicitar um novo link de assinatura.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "signed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-green-600">Contrato Assinado</CardTitle>
            <CardDescription>
              Seu contrato foi assinado digitalmente com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Uma cópia do contrato será enviada para o seu email. 
                Guarde este documento para futuras referências.
              </p>
            </div>
            <Separator />
            <div className="text-center text-sm text-muted-foreground">
              <p>MayBack Cars - Qualidade e Confiança</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "validate") {
    const isCpf = signatureInfo?.cpfCnpjLength === 11;
    const hint = isCpf 
      ? "Digite os últimos 3 dígitos do seu CPF" 
      : "Digite os primeiros 3 dígitos do seu CNPJ";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Validar Identidade</CardTitle>
            <CardDescription>
              Para visualizar e assinar o contrato, precisamos confirmar sua identidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{signatureInfo?.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{signatureInfo?.vehicleInfo}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {contractTypeNames[signatureInfo?.contractType] || signatureInfo?.contractType}
                </Badge>
              </div>
            </div>

            <form onSubmit={handleValidate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{hint}</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  placeholder="000"
                  value={validationCode}
                  onChange={(e) => setValidationCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="text-center text-2xl tracking-widest"
                  data-testid="input-validation-code"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={validationCode.length !== 3 || validateMutation.isPending}
                data-testid="button-validate"
              >
                {validateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  "Validar e Continuar"
                )}
              </Button>
            </form>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Seus dados são protegidos e esta verificação garante a segurança do processo de assinatura digital.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "sign") {
    const contract = contractData?.contract;
    const store = contractData?.store;

    if (isLoadingContract || !contract) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center border-b">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>
                Contrato de {contractTypeNames[contract.contractType] || contract.contractType}
              </CardTitle>
              <CardDescription>
                Contrato #{contract.id} - Leia atentamente antes de assinar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">COMPRADOR</h4>
                  <p className="font-medium">{contract.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{contract.customer.cpfCnpj}</p>
                  {contract.customer.email && (
                    <p className="text-sm text-muted-foreground">{contract.customer.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">VENDEDOR</h4>
                  <p className="font-medium">{store?.nomeFantasia || store?.razaoSocial || "MayBack Cars"}</p>
                  <p className="text-sm text-muted-foreground">{store?.cnpj}</p>
                  {store?.email && (
                    <p className="text-sm text-muted-foreground">{store?.email}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">VEÍCULO</h4>
                <div className="rounded-lg bg-muted p-4">
                  <p className="font-medium">
                    {contract.vehicle.brand.name} {contract.vehicle.model} {contract.vehicle.year}
                  </p>
                  <div className="grid gap-2 mt-2 text-sm text-muted-foreground md:grid-cols-3">
                    <p><span className="font-medium">Placa:</span> {contract.vehicle.plate || "N/A"}</p>
                    <p><span className="font-medium">Renavam:</span> {contract.vehicle.renavam || "N/A"}</p>
                    <p><span className="font-medium">Chassi:</span> {contract.vehicle.chassis || "N/A"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">VALORES</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {contract.valorVenda && (
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Valor de Venda</p>
                      <p className="text-xl font-bold">{formatCurrency(contract.valorVenda)}</p>
                    </div>
                  )}
                  {contract.entradaTotal && (
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Entrada Total</p>
                      <p className="text-xl font-bold">{formatCurrency(contract.entradaTotal)}</p>
                    </div>
                  )}
                </div>
              </div>

              {contract.tradeInVehicle && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">VEÍCULO DADO EM TROCA</h4>
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                      <p className="font-medium">
                        {contract.tradeInVehicle.brand.name} {contract.tradeInVehicle.model} {contract.tradeInVehicle.year}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Placa: {contract.tradeInVehicle.plate || "N/A"}
                      </p>
                      {contract.tradeInValue && (
                        <p className="text-lg font-bold mt-2 text-amber-600">
                          Valor: {formatCurrency(contract.tradeInValue)}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {contract.observacoes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">OBSERVAÇÕES</h4>
                    <p className="text-sm">{contract.observacoes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Assinatura Digital</p>
                    <p className="text-sm text-muted-foreground">
                      Ao clicar em "Assinar Contrato", você concorda com todos os termos e condições 
                      deste contrato. Sua assinatura digital tem validade jurídica conforme a 
                      Medida Provisória nº 2.200-2/2001.
                    </p>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handleSign}
                  disabled={signMutation.isPending}
                  data-testid="button-sign-contract"
                >
                  {signMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      <FileCheck className="mr-2 h-4 w-4" />
                      Assinar Contrato
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>
                  Data: {formatDate(new Date())} | IP registrado para fins de segurança
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
