import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Loader2,
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
import { Skeleton } from "@/components/ui/skeleton";
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
  cleanCPFCNPJ,
  validateCPFCNPJ,
  formatRG,
  cleanRG,
  validateRG,
  formatCNH,
  validateCNH,
  formatPhone,
  cleanPhone,
  validatePhone,
  formatCEP,
  cleanCEP,
  validateCEP,
  validateAge,
} from "@/lib/br-formatters";
import { useViaCep } from "@/hooks/use-viacep";
import type { Customer } from "@shared/schema";

const customerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: z.string().min(1, "CPF/CNPJ é obrigatório").superRefine((val, ctx) => {
    const result = validateCPFCNPJ(val);
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.message || "CPF/CNPJ inválido",
      });
    }
  }),
  rg: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return validateRG(val);
  }, "RG inválido (7 a 9 dígitos)"),
  cnh: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return validateCNH(val);
  }, "CNH inválida (11 dígitos)"),
  birthDate: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return validateAge(val, 18);
  }, "Cliente deve ter pelo menos 18 anos"),
  profession: z.string().optional(),
  monthlyIncome: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "Telefone é obrigatório").refine((val) => {
    return validatePhone(val);
  }, "Telefone inválido (10 ou 11 dígitos)"),
  secondaryPhone: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return validatePhone(val);
  }, "Telefone inválido (10 ou 11 dígitos)"),
  cep: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return validateCEP(val);
  }, "CEP inválido (8 dígitos)"),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const { loading: cepLoading, lookupCEP } = useViaCep();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      cpfCnpj: "",
      phone: "",
      rg: "",
      cnh: "",
      birthDate: "",
      profession: "",
      monthlyIncome: "",
      email: "",
      secondaryPhone: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      notes: "",
    },
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

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormValues) =>
      apiRequest("POST", "/api/customers", {
        ...data,
        cpfCnpj: cleanCPFCNPJ(data.cpfCnpj),
        rg: data.rg ? cleanRG(data.rg) : null,
        cnh: data.cnh ? data.cnh.replace(/\D/g, "") : null,
        phone: cleanPhone(data.phone),
        secondaryPhone: data.secondaryPhone ? cleanPhone(data.secondaryPhone) : null,
        cep: data.cep ? cleanCEP(data.cep) : null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        monthlyIncome: data.monthlyIncome ? parseCurrencyToNumber(data.monthlyIncome) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Cliente cadastrado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar cliente", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormValues & { id: number }) =>
      apiRequest("PATCH", `/api/customers/${data.id}`, {
        ...data,
        cpfCnpj: cleanCPFCNPJ(data.cpfCnpj),
        rg: data.rg ? cleanRG(data.rg) : null,
        cnh: data.cnh ? data.cnh.replace(/\D/g, "") : null,
        phone: cleanPhone(data.phone),
        secondaryPhone: data.secondaryPhone ? cleanPhone(data.secondaryPhone) : null,
        cep: data.cep ? cleanCEP(data.cep) : null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        monthlyIncome: data.monthlyIncome ? parseCurrencyToNumber(data.monthlyIncome) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      form.reset();
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar cliente", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setDeletingCustomer(null);
      toast({ title: "Cliente excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    form.reset({
      name: "",
      cpfCnpj: "",
      phone: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      cpfCnpj: formatCPFCNPJ(customer.cpfCnpj),
      rg: customer.rg ? formatRG(customer.rg) : "",
      cnh: customer.cnh || "",
      birthDate: customer.birthDate
        ? new Date(customer.birthDate).toISOString().split("T")[0]
        : "",
      profession: customer.profession || "",
      monthlyIncome: customer.monthlyIncome ? formatCurrency(customer.monthlyIncome) : "",
      email: customer.email || "",
      phone: formatPhone(customer.phone),
      secondaryPhone: customer.secondaryPhone ? formatPhone(customer.secondaryPhone) : "",
      cep: customer.cep ? formatCEP(customer.cep) : "",
      street: customer.street || "",
      number: customer.number || "",
      complement: customer.complement || "",
      neighborhood: customer.neighborhood || "",
      city: customer.city || "",
      state: customer.state || "",
      notes: customer.notes || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateMutation.mutate({ ...data, id: editingCustomer.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCustomers = customers?.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.cpfCnpj.includes(search) ||
      customer.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie os clientes cadastrados
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-customer">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-customers"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredCustomers?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground">
            Cadastre seu primeiro cliente para começar
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Renda</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers?.map((customer) => (
                <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.email && (
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCPFCNPJ(customer.cpfCnpj)}</TableCell>
                  <TableCell>{formatPhone(customer.phone)}</TableCell>
                  <TableCell>
                    {customer.city && customer.state
                      ? `${customer.city}/${customer.state}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(customer.monthlyIncome)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(customer)}
                        data-testid={`button-edit-customer-${customer.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingCustomer(customer)}
                        data-testid={`button-delete-customer-${customer.id}`}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Dados Pessoais</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="000.000.000-00"
                            maxLength={18}
                            data-testid="input-cpf-cnpj"
                            onChange={(e) => {
                              const formatted = formatCPFCNPJ(e.target.value);
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
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00.000.000-0"
                            maxLength={12}
                            data-testid="input-rg"
                            onChange={(e) => {
                              const formatted = formatRG(e.target.value);
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
                    name="cnh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNH</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00000000000"
                            maxLength={11}
                            data-testid="input-cnh"
                            onChange={(e) => {
                              const formatted = formatCNH(e.target.value);
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
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-birth-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-profession" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renda Mensal</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="R$ 0,00"
                            data-testid="input-monthly-income"
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

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            data-testid="input-phone"
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
                    name="secondaryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone Secundário</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            data-testid="input-secondary-phone"
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
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP {cepLoading && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00000-000"
                            maxLength={9}
                            data-testid="input-cep"
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
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-complement" />
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
                          <Input {...field} data-testid="input-neighborhood" />
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
                          <Input {...field} data-testid="input-city" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brazilianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                        placeholder="Observações sobre o cliente..."
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-customer"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCustomer} onOpenChange={() => setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{deletingCustomer?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCustomer && deleteMutation.mutate(deletingCustomer.id)}
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
