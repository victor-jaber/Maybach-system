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
  Tags,
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
import type { Brand } from "@shared/schema";

const brandFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function BrandsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const { toast } = useToast();

  const { data: brands, isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BrandFormValues) =>
      apiRequest("POST", "/api/brands", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Marca cadastrada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar marca", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BrandFormValues & { id: number }) =>
      apiRequest("PATCH", `/api/brands/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setIsDialogOpen(false);
      setEditingBrand(null);
      form.reset();
      toast({ title: "Marca atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar marca", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setDeletingBrand(null);
      toast({ title: "Marca excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir marca. Verifique se não há veículos vinculados.", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingBrand(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    form.reset({ name: brand.name });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: BrandFormValues) => {
    if (editingBrand) {
      updateMutation.mutate({ ...data, id: editingBrand.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredBrands = brands?.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Marcas
          </h1>
          <p className="text-muted-foreground">
            Gerencie as marcas de veículos
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-brand">
          <Plus className="mr-2 h-4 w-4" />
          Nova Marca
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar marcas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-brands"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredBrands?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tags className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">Nenhuma marca encontrada</h3>
          <p className="text-muted-foreground">
            Cadastre sua primeira marca para começar
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands?.map((brand) => (
                <TableRow key={brand.id} data-testid={`row-brand-${brand.id}`}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{formatDate(brand.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(brand)}
                        data-testid={`button-edit-brand-${brand.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingBrand(brand)}
                        data-testid={`button-delete-brand-${brand.id}`}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Editar Marca" : "Nova Marca"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Honda, Toyota, Ford" data-testid="input-brand-name" />
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
                  data-testid="button-save-brand"
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

      <AlertDialog open={!!deletingBrand} onOpenChange={() => setDeletingBrand(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a marca "{deletingBrand?.name}"?
              Esta ação não pode ser desfeita e falhará se houver veículos vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBrand && deleteMutation.mutate(deletingBrand.id)}
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
