import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Car, Search, Filter, Gauge, Calendar, Fuel, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import type { VehicleWithRelations, Brand, Category } from "@shared/schema";

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

function VehicleCard({ vehicle }: { vehicle: VehicleWithRelations }) {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-catalog-vehicle-${vehicle.id}`}>
      <div className="aspect-video bg-muted relative overflow-hidden">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={vehicle.model}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Car className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <Badge className="absolute top-3 left-3" variant="secondary">
          {vehicle.category?.name}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">{vehicle.brand?.name}</p>
          <h3 className="text-lg font-semibold">{vehicle.model}</h3>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />
            <span>{formatMileage(vehicle.mileage)}</span>
          </div>
          {vehicle.fuel && (
            <div className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" />
              <span>{vehicle.fuel}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(vehicle.price)}
          </span>
          <Button size="sm" variant="outline" data-testid={`button-view-vehicle-${vehicle.id}`}>
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4">
        <Skeleton className="mb-1 h-4 w-20" />
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: vehicles, isLoading: loadingVehicles } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles/public"],
  });

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filteredVehicles = vehicles?.filter((vehicle) => {
    const matchesSearch =
      search === "" ||
      vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.brand?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesBrand = selectedBrand === "all" || vehicle.brandId === parseInt(selectedBrand);
    const matchesCategory = selectedCategory === "all" || vehicle.categoryId === parseInt(selectedCategory);

    return matchesSearch && matchesBrand && matchesCategory;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AutoGestão</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild data-testid="link-back-home">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-catalog-title">
            Catálogo de Veículos
          </h1>
          <p className="mt-2 text-muted-foreground">
            Encontre o carro perfeito para você
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por modelo ou marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-catalog"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[160px]" data-testid="select-brand-filter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Marcas</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadingVehicles ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Car className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">Nenhum veículo encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar seus filtros de busca
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
