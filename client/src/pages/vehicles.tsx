import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Car,
  X,
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
import type { VehicleWithRelations, Brand, Category } from "@shared/schema";

const vehicleFormSchema = z.object({
  brandId: z.number({ required_error: "Selecione uma marca" }),
  categoryId: z.number({ required_error: "Selecione uma categoria" }),
  model: z.string().min(1, "Modelo é obrigatório"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, "Cor é obrigatória"),
  mileage: z.number().min(0, "Quilometragem inválida"),
  price: z.string().min(1, "Preço é obrigatório"),
  renavam: z.string().max(11, "Renavam deve ter no máximo 11 dígitos").optional(),
  plate: z.string().max(7, "Placa deve ter no máximo 7 caracteres").optional(),
  chassis: z.string().max(17, "Chassi deve ter no máximo 17 caracteres").optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  doors: z.number().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.string().default("available"),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("pt-BR").format(mileage) + " km";
}

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithRelations | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<VehicleWithRelations | null>(null);
  const { toast } = useToast();

  const { data: vehicles, isLoading } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      model: "",
      year: new Date().getFullYear(),
      color: "",
      mileage: 0,
      price: "",
      status: "available",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: VehicleFormValues) =>
      apiRequest("POST", "/api/vehicles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Veículo cadastrado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar veículo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: VehicleFormValues & { id: number }) =>
      apiRequest("PATCH", `/api/vehicles/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsDialogOpen(false);
      setEditingVehicle(null);
      form.reset();
      toast({ title: "Veículo atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar veículo", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setDeletingVehicle(null);
      toast({ title: "Veículo excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir veículo", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    form.reset({
      model: "",
      year: new Date().getFullYear(),
      color: "",
      mileage: 0,
      price: "",
      status: "available",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (vehicle: VehicleWithRelations) => {
    setEditingVehicle(vehicle);
    form.reset({
      brandId: vehicle.brandId,
      categoryId: vehicle.categoryId,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      mileage: vehicle.mileage,
      price: vehicle.price as string,
      renavam: vehicle.renavam || "",
      plate: vehicle.plate || "",
      chassis: vehicle.chassis || "",
      fuel: vehicle.fuel || "",
      transmission: vehicle.transmission || "",
      doors: vehicle.doors || undefined,
      description: vehicle.description || "",
      imageUrl: vehicle.imageUrl || "",
      status: vehicle.status,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: VehicleFormValues) => {
    if (editingVehicle) {
      updateMutation.mutate({ ...data, id: editingVehicle.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredVehicles = vehicles?.filter(
    (vehicle) =>
      vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.brand?.name.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.plate?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default">Disponível</Badge>;
      case "sold":
        return <Badge variant="secondary">Vendido</Badge>;
      case "reserved":
        return <Badge variant="outline">Reservado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Veículos
          </h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de veículos
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-vehicle">
          <Plus className="mr-2 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar veículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-vehicles"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredVehicles?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Car className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">Nenhum veículo encontrado</h3>
          <p className="text-muted-foreground">
            Cadastre seu primeiro veículo para começar
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Km</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles?.map((vehicle) => (
                <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand?.name} • {vehicle.category?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{formatMileage(vehicle.mileage)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(vehicle.price)}
                  </TableCell>
                  <TableCell>{vehicle.plate || "-"}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(vehicle)}
                        data-testid={`button-edit-vehicle-${vehicle.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingVehicle(vehicle)}
                        data-testid={`button-delete-vehicle-${vehicle.id}`}
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
              {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-brand">
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
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
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
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Civic EXL" data-testid="input-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Prata" data-testid="input-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quilometragem *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-mileage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 85000.00" data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="renavam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renavam</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="11 dígitos" maxLength={11} data-testid="input-renavam" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: ABC1D23" maxLength={7} className="uppercase" data-testid="input-plate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chassis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chassi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="17 caracteres" maxLength={17} className="uppercase" data-testid="input-chassis" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="fuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustível</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-fuel">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Flex">Flex</SelectItem>
                          <SelectItem value="Gasolina">Gasolina</SelectItem>
                          <SelectItem value="Etanol">Etanol</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Elétrico">Elétrico</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Câmbio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transmission">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automático">Automático</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                          <SelectItem value="Automatizado">Automatizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portas</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-doors">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2">2 portas</SelectItem>
                          <SelectItem value="4">4 portas</SelectItem>
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
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-image-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="reserved">Reservado</SelectItem>
                          <SelectItem value="sold">Vendido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações sobre o veículo..."
                        className="resize-none"
                        rows={3}
                        data-testid="textarea-description"
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
                  data-testid="button-save-vehicle"
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

      <AlertDialog open={!!deletingVehicle} onOpenChange={() => setDeletingVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o veículo "{deletingVehicle?.model}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingVehicle && deleteMutation.mutate(deletingVehicle.id)}
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
