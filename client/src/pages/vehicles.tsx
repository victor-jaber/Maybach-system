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
  FileText,
  Upload,
  File,
  Image as ImageIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { VehicleMultiImageUploader } from "@/components/VehicleMultiImageUploader";
import type { VehicleWithRelations, Brand, Category, VehicleImage, VehicleDocument } from "@shared/schema";

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

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("pt-BR").format(mileage) + " km";
}

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithRelations | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<VehicleWithRelations | null>(null);
  const [localImages, setLocalImages] = useState<VehicleImage[]>([]);
  const [pendingImageUploads, setPendingImageUploads] = useState<{url: string, isPrimary: boolean}[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
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

  const createBrandMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/brands", { name });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      form.setValue("brandId", data.id);
      setNewBrandName("");
      setIsAddingBrand(false);
      toast({ title: "Marca criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar marca", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/categories", { name });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.setValue("categoryId", data.id);
      setNewCategoryName("");
      setIsAddingCategory(false);
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      const vehicle = await apiRequest("POST", "/api/vehicles", data);
      const vehicleData = await vehicle.json();
      
      for (const img of pendingImageUploads) {
        await apiRequest("POST", `/api/vehicles/${vehicleData.id}/images`, {
          imageUrl: img.url,
          isPrimary: img.isPrimary,
        });
      }
      
      return vehicleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsDialogOpen(false);
      form.reset();
      setLocalImages([]);
      setPendingImageUploads([]);
      setDocuments([]);
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
      setDocuments([]);
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

  const addImageMutation = useMutation({
    mutationFn: ({ vehicleId, imageUrl, isPrimary }: { vehicleId: number; imageUrl: string; isPrimary: boolean }) =>
      apiRequest("POST", `/api/vehicles/${vehicleId}/images`, { imageUrl, isPrimary }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: ({ vehicleId, imageId }: { vehicleId: number; imageId: number }) =>
      apiRequest("DELETE", `/api/vehicles/${vehicleId}/images/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: ({ vehicleId, imageId }: { vehicleId: number; imageId: number }) =>
      apiRequest("POST", `/api/vehicles/${vehicleId}/images/${imageId}/primary`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: ({ vehicleId, documentId }: { vehicleId: number; documentId: number }) =>
      apiRequest("DELETE", `/api/vehicles/${vehicleId}/documents/${documentId}`),
    onSuccess: () => {
      toast({ title: "Documento excluído com sucesso!" });
    },
  });

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setLocalImages([]);
    setPendingImageUploads([]);
    setDocuments([]);
    setNewBrandName("");
    setNewCategoryName("");
    setIsAddingBrand(false);
    setIsAddingCategory(false);
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

  const handleOpenEdit = async (vehicle: VehicleWithRelations) => {
    setEditingVehicle(vehicle);
    setLocalImages(vehicle.images || []);
    setPendingImageUploads([]);
    setNewBrandName("");
    setNewCategoryName("");
    setIsAddingBrand(false);
    setIsAddingCategory(false);
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
    
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/documents`, {
        credentials: "include",
      });
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
    
    setIsDialogOpen(true);
  };

  const handleImageAdd = async (imageUrl: string, isPrimary: boolean) => {
    if (editingVehicle) {
      const response = await addImageMutation.mutateAsync({
        vehicleId: editingVehicle.id,
        imageUrl,
        isPrimary,
      });
      const imageData = await (response as Response).json() as VehicleImage;
      setLocalImages(prev => [...prev, imageData]);
    } else {
      const tempId = -Date.now();
      const newImage: VehicleImage = {
        id: tempId,
        vehicleId: 0,
        imageUrl,
        isPrimary,
        order: pendingImageUploads.length,
        createdAt: new Date(),
      };
      setLocalImages(prev => [...prev, newImage]);
      setPendingImageUploads(prev => [...prev, { url: imageUrl, isPrimary }]);
    }
  };

  const handleImageRemove = async (imageId: number) => {
    if (editingVehicle && imageId > 0) {
      await removeImageMutation.mutateAsync({
        vehicleId: editingVehicle.id,
        imageId,
      });
    }
    setLocalImages(prev => prev.filter(img => img.id !== imageId));
    if (imageId < 0) {
      const index = localImages.findIndex(img => img.id === imageId);
      if (index >= 0) {
        setPendingImageUploads(prev => prev.filter((_, i) => i !== index));
      }
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    if (editingVehicle && imageId > 0) {
      await setPrimaryMutation.mutateAsync({
        vehicleId: editingVehicle.id,
        imageId,
      });
      setLocalImages(prev => prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      })));
    } else {
      setLocalImages(prev => prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      })));
      setPendingImageUploads(prev => {
        const imageIndex = localImages.findIndex(img => img.id === imageId);
        return prev.map((p, i) => ({
          ...p,
          isPrimary: i === imageIndex,
        }));
      });
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingVehicle) return;

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");
      
      const { url } = await uploadResponse.json();
      
      const documentType = file.type.includes("pdf") ? "pdf" : "image";
      
      const docResponse = await apiRequest("POST", `/api/vehicles/${editingVehicle.id}/documents`, {
        documentUrl: url,
        documentName: file.name,
        documentType,
        description: "",
      });
      
      const newDoc = await docResponse.json();
      setDocuments(prev => [newDoc, ...prev]);
      toast({ title: "Documento adicionado com sucesso!" });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({ title: "Erro ao enviar documento", variant: "destructive" });
    } finally {
      setIsUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!editingVehicle) return;
    
    try {
      await deleteDocumentMutation.mutateAsync({
        vehicleId: editingVehicle.id,
        documentId: docId,
      });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      toast({ title: "Erro ao excluir documento", variant: "destructive" });
    }
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
                        {vehicle.brand?.name} - {vehicle.category?.name}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados" data-testid="tab-dados">Dados</TabsTrigger>
              <TabsTrigger value="imagens" data-testid="tab-imagens">Imagens</TabsTrigger>
              <TabsTrigger value="documentos" data-testid="tab-documentos">Documentos</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="dados" className="space-y-6 mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="brandId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca *</FormLabel>
                          {isAddingBrand ? (
                            <div className="flex gap-2">
                              <Input
                                value={newBrandName}
                                onChange={(e) => setNewBrandName(e.target.value)}
                                placeholder="Nome da nova marca"
                                data-testid="input-new-brand"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  if (newBrandName.trim()) {
                                    createBrandMutation.mutate(newBrandName.trim());
                                  }
                                }}
                                disabled={createBrandMutation.isPending}
                                data-testid="button-save-brand"
                              >
                                Salvar
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setIsAddingBrand(false);
                                  setNewBrandName("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-brand" className="flex-1">
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
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => setIsAddingBrand(true)}
                                data-testid="button-add-brand"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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
                          {isAddingCategory ? (
                            <div className="flex gap-2">
                              <Input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nome da nova categoria"
                                data-testid="input-new-category"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  if (newCategoryName.trim()) {
                                    createCategoryMutation.mutate(newCategoryName.trim());
                                  }
                                }}
                                disabled={createCategoryMutation.isPending}
                                data-testid="button-save-category"
                              >
                                Salvar
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setIsAddingCategory(false);
                                  setNewCategoryName("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-category" className="flex-1">
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
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => setIsAddingCategory(true)}
                                data-testid="button-add-category"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-price"
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
                </TabsContent>

                <TabsContent value="imagens" className="space-y-6 mt-4">
                  <div>
                    <label className="text-sm font-medium">Imagens do Veículo</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Adicione uma imagem principal e fotos adicionais para a galeria (visível no catálogo)
                    </p>
                    <VehicleMultiImageUploader
                      vehicleId={editingVehicle?.id}
                      images={localImages}
                      onImageAdd={handleImageAdd}
                      onImageRemove={handleImageRemove}
                      onSetPrimary={handleSetPrimary}
                      isLoading={addImageMutation.isPending || removeImageMutation.isPending}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-6 mt-4">
                  <div>
                    <label className="text-sm font-medium">Documentos do Veículo</label>
                    <p className="text-xs text-muted-foreground mb-4">
                      Adicione documentos do veículo (CRLV, laudos, etc.) - apenas para uso interno
                    </p>
                    
                    {editingVehicle ? (
                      <>
                        <div className="mb-4">
                          <label
                            htmlFor="document-upload"
                            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {isUploadingDoc ? "Enviando..." : "Clique para enviar documento (PDF ou imagem)"}
                            </span>
                          </label>
                          <input
                            id="document-upload"
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={handleDocumentUpload}
                            disabled={isUploadingDoc}
                            data-testid="input-document-upload"
                          />
                        </div>

                        {documents.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Nenhum documento adicionado</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {doc.documentType === "pdf" ? (
                                    <File className="h-5 w-5 text-red-500" />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-blue-500" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">{doc.documentName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(doc.createdAt!).toLocaleDateString("pt-BR")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(doc.documentUrl, "_blank")}
                                    data-testid={`button-view-doc-${doc.id}`}
                                  >
                                    Visualizar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    data-testid={`button-delete-doc-${doc.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Salve o veículo primeiro para adicionar documentos</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <div className="flex justify-end gap-3 pt-4 border-t">
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
                      : editingVehicle
                      ? "Salvar Alterações"
                      : "Cadastrar Veículo"}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVehicle} onOpenChange={() => setDeletingVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o veículo{" "}
              <strong>{deletingVehicle?.model}</strong>? Esta ação não pode ser
              desfeita.
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
