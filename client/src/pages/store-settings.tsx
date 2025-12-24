import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Store } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Save, Loader2 } from "lucide-react";
import {
  formatCNPJ,
  formatCPF,
  formatPhone,
  formatCEP,
  cleanCEP,
  cleanPhone,
  validateCNPJ,
  validateCPF,
  validatePhone,
  validateCEP,
} from "@/lib/br-formatters";
import { useViaCep } from "@/hooks/use-viacep";

const storeFormSchema = z.object({
  razaoSocial: z.string().min(1, "Razão Social é obrigatória"),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(1, "CNPJ é obrigatório").refine((val) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length < 14) return false;
    return validateCNPJ(val);
  }, "CNPJ inválido"),
  inscricaoEstadual: z.string().optional(),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return validatePhone(val);
  }, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cep: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return validateCEP(val);
  }, "CEP inválido"),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  representanteLegal: z.string().optional(),
  cpfRepresentante: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    const digits = val.replace(/\D/g, "");
    if (digits.length < 11) return false;
    return validateCPF(val);
  }, "CPF inválido"),
  logoUrl: z.string().optional(),
});

type StoreFormData = z.infer<typeof storeFormSchema>;

export default function StoreSettingsPage() {
  const { toast } = useToast();
  const { loading: cepLoading, lookupCEP } = useViaCep();

  const { data: store, isLoading } = useQuery<Store | null>({
    queryKey: ["/api/store"],
  });

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      inscricaoEstadual: "",
      phone: "",
      email: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      representanteLegal: "",
      cpfRepresentante: "",
      logoUrl: "",
    },
    values: store ? {
      razaoSocial: store.razaoSocial || "",
      nomeFantasia: store.nomeFantasia || "",
      cnpj: store.cnpj ? formatCNPJ(store.cnpj) : "",
      inscricaoEstadual: store.inscricaoEstadual || "",
      phone: store.phone ? formatPhone(store.phone) : "",
      email: store.email || "",
      cep: store.cep ? formatCEP(store.cep) : "",
      street: store.street || "",
      number: store.number || "",
      complement: store.complement || "",
      neighborhood: store.neighborhood || "",
      city: store.city || "",
      state: store.state || "",
      representanteLegal: store.representanteLegal || "",
      cpfRepresentante: store.cpfRepresentante ? formatCPF(store.cpfRepresentante) : "",
      logoUrl: store.logoUrl || "",
    } : undefined,
  });

  const cepValue = useWatch({ control: form.control, name: "cep" });

  useEffect(() => {
    const handleCepLookup = async () => {
      if (cepValue && cleanCEP(cepValue).length === 8) {
        const address = await lookupCEP(cepValue);
        if (address) {
          form.setValue("street", address.logradouro || "");
          form.setValue("neighborhood", address.bairro || "");
          form.setValue("city", address.localidade || "");
          form.setValue("state", address.uf || "");
          if (address.complemento) {
            form.setValue("complement", address.complemento);
          }
        }
      }
    };
    handleCepLookup();
  }, [cepValue, lookupCEP, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      return apiRequest("POST", "/api/store", {
        ...data,
        cnpj: data.cnpj.replace(/\D/g, ""),
        cpfRepresentante: data.cpfRepresentante ? data.cpfRepresentante.replace(/\D/g, "") : null,
        phone: data.phone ? cleanPhone(data.phone) : null,
        cep: data.cep ? cleanCEP(data.cep) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store"] });
      toast({
        title: "Configurações salvas",
        description: "Os dados da loja foram atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StoreFormData) => {
    saveMutation.mutate(data);
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
    <div className="space-y-6" data-testid="page-store-settings">
      <div className="flex items-center gap-3">
        <Building className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-serif font-bold">Configurações da Loja</h1>
          <p className="text-muted-foreground">
            Configure os dados da sua loja para os contratos
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Informações legais da empresa</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão Social da empresa" {...field} data-testid="input-razao-social" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome fantasia" {...field} data-testid="input-nome-fantasia" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        {...field}
                        data-testid="input-store-cnpj"
                        onChange={(e) => {
                          const formatted = formatCNPJ(e.target.value);
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
                name="inscricaoEstadual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição Estadual</FormLabel>
                    <FormControl>
                      <Input placeholder="Inscrição estadual" {...field} data-testid="input-inscricao-estadual" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        {...field}
                        data-testid="input-store-phone"
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@loja.com.br" {...field} data-testid="input-store-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização da empresa</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP {cepLoading && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        maxLength={9}
                        {...field}
                        data-testid="input-store-cep"
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Avenida, etc." {...field} data-testid="input-store-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} data-testid="input-store-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Sala, Bloco, etc." {...field} data-testid="input-store-complement" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} data-testid="input-store-neighborhood" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} data-testid="input-store-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" maxLength={2} {...field} data-testid="input-store-state" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Representante Legal</CardTitle>
              <CardDescription>Dados do representante legal da empresa</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="representanteLegal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do representante" {...field} data-testid="input-representante-legal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpfRepresentante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        maxLength={14}
                        {...field}
                        data-testid="input-cpf-representante"
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-store">
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
