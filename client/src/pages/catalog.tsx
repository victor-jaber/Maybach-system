import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Car, Search, Gauge, Calendar, Fuel, ArrowLeft, SlidersHorizontal, X, 
  ChevronDown, ChevronUp, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import type { VehicleWithRelations, Brand, Category } from "@shared/schema";
import logoImage from "@assets/maybach-logo.png";

interface FilterState {
  search: string;
  brands: number[];
  categories: number[];
  fuels: string[];
  transmissions: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  mileageRange: [number, number];
}

const FUEL_OPTIONS = ["Flex", "Gasolina", "Etanol", "Diesel", "Elétrico", "Híbrido"];
const TRANSMISSION_OPTIONS = ["Manual", "Automático", "CVT", "Automatizado"];

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("pt-BR").format(mileage) + " km";
}

function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (num >= 1000) {
    return Math.round(num / 1000) + 'k';
  }
  return num.toString();
}

function getVehicleMainImage(vehicle: VehicleWithRelations): string | null {
  if (vehicle.images && vehicle.images.length > 0) {
    const primaryImage = vehicle.images.find(img => img.isPrimary);
    if (primaryImage) return primaryImage.imageUrl;
    return vehicle.images[0].imageUrl;
  }
  return vehicle.imageUrl || null;
}

function VehicleCard({ vehicle }: { vehicle: VehicleWithRelations }) {
  const mainImage = getVehicleMainImage(vehicle);
  
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-catalog-vehicle-${vehicle.id}`}>
      <div className="aspect-video bg-muted relative overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
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
        <div className="flex items-center justify-between gap-2">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(vehicle.price)}
          </span>
          <Button size="sm" variant="outline" asChild data-testid={`button-view-vehicle-${vehicle.id}`}>
            <Link href={`/catalog/${vehicle.id}`}>
              Ver Detalhes
            </Link>
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

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold hover-elevate rounded-md px-2 -mx-2">
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface CatalogFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  brands: Brand[];
  categories: Category[];
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
  availableFuels: string[];
  availableTransmissions: string[];
  onReset: () => void;
  activeFiltersCount: number;
}

function CatalogFilters({
  filters,
  onFiltersChange,
  brands,
  categories,
  priceRange,
  yearRange,
  mileageRange,
  availableFuels,
  availableTransmissions,
  onReset,
  activeFiltersCount,
}: CatalogFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'brands' | 'categories', value: number) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const toggleStringArrayFilter = (key: 'fuels' | 'transmissions', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </h2>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
            data-testid="button-reset-filters"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      <FilterSection title="Preço">
        <div className="space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
            min={priceRange.min}
            max={priceRange.max}
            step={5000}
            className="mt-2"
            data-testid="slider-price"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(filters.priceRange[0])}</span>
            <span>{formatCurrency(filters.priceRange[1])}</span>
          </div>
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Ano">
        <div className="space-y-4">
          <Slider
            value={filters.yearRange}
            onValueChange={(value) => updateFilter('yearRange', value as [number, number])}
            min={yearRange.min}
            max={yearRange.max}
            step={1}
            className="mt-2"
            data-testid="slider-year"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filters.yearRange[0]}</span>
            <span>{filters.yearRange[1]}</span>
          </div>
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Quilometragem">
        <div className="space-y-4">
          <Slider
            value={filters.mileageRange}
            onValueChange={(value) => updateFilter('mileageRange', value as [number, number])}
            min={mileageRange.min}
            max={mileageRange.max}
            step={5000}
            className="mt-2"
            data-testid="slider-mileage"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatCompactNumber(filters.mileageRange[0])} km</span>
            <span>{formatCompactNumber(filters.mileageRange[1])} km</span>
          </div>
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Marca">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand.id}`}
                checked={filters.brands.includes(brand.id)}
                onCheckedChange={() => toggleArrayFilter('brands', brand.id)}
                data-testid={`checkbox-brand-${brand.id}`}
              />
              <Label
                htmlFor={`brand-${brand.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {brand.name}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Categoria">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={filters.categories.includes(category.id)}
                onCheckedChange={() => toggleArrayFilter('categories', category.id)}
                data-testid={`checkbox-category-${category.id}`}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Combustível">
        <div className="space-y-2">
          {availableFuels.map((fuel) => (
            <div key={fuel} className="flex items-center space-x-2">
              <Checkbox
                id={`fuel-${fuel}`}
                checked={filters.fuels.includes(fuel)}
                onCheckedChange={() => toggleStringArrayFilter('fuels', fuel)}
                data-testid={`checkbox-fuel-${fuel}`}
              />
              <Label
                htmlFor={`fuel-${fuel}`}
                className="text-sm font-normal cursor-pointer"
              >
                {fuel}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Transmissão">
        <div className="space-y-2">
          {availableTransmissions.map((transmission) => (
            <div key={transmission} className="flex items-center space-x-2">
              <Checkbox
                id={`transmission-${transmission}`}
                checked={filters.transmissions.includes(transmission)}
                onCheckedChange={() => toggleStringArrayFilter('transmissions', transmission)}
                data-testid={`checkbox-transmission-${transmission}`}
              />
              <Label
                htmlFor={`transmission-${transmission}`}
                className="text-sm font-normal cursor-pointer"
              >
                {transmission}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

export default function CatalogPage() {
  const { data: vehicles, isLoading: loadingVehicles } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles/public"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const dataRanges = useMemo(() => {
    if (!vehicles || vehicles.length === 0) {
      return {
        price: { min: 0, max: 500000 },
        year: { min: 2000, max: new Date().getFullYear() },
        mileage: { min: 0, max: 200000 },
        fuels: FUEL_OPTIONS,
        transmissions: TRANSMISSION_OPTIONS,
      };
    }

    const prices = vehicles.map((v) => parseFloat(v.price as string));
    const years = vehicles.map((v) => v.year);
    const mileages = vehicles.map((v) => v.mileage);
    const fuels = Array.from(new Set(vehicles.map((v) => v.fuel).filter(Boolean))) as string[];
    const transmissions = Array.from(new Set(vehicles.map((v) => v.transmission).filter(Boolean))) as string[];

    return {
      price: { min: Math.min(...prices), max: Math.max(...prices) },
      year: { min: Math.min(...years), max: Math.max(...years) },
      mileage: { min: Math.min(...mileages), max: Math.max(...mileages) },
      fuels: fuels.length > 0 ? fuels : FUEL_OPTIONS,
      transmissions: transmissions.length > 0 ? transmissions : TRANSMISSION_OPTIONS,
    };
  }, [vehicles]);

  const initialFilters: FilterState = useMemo(() => ({
    search: "",
    brands: [],
    categories: [],
    fuels: [],
    transmissions: [],
    priceRange: [dataRanges.price.min, dataRanges.price.max],
    yearRange: [dataRanges.year.min, dataRanges.year.max],
    mileageRange: [dataRanges.mileage.min, dataRanges.mileage.max],
  }), [dataRanges]);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.brands.length > 0) count += filters.brands.length;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.fuels.length > 0) count += filters.fuels.length;
    if (filters.transmissions.length > 0) count += filters.transmissions.length;
    if (filters.priceRange[0] !== dataRanges.price.min || filters.priceRange[1] !== dataRanges.price.max) count++;
    if (filters.yearRange[0] !== dataRanges.year.min || filters.yearRange[1] !== dataRanges.year.max) count++;
    if (filters.mileageRange[0] !== dataRanges.mileage.min || filters.mileageRange[1] !== dataRanges.mileage.max) count++;
    return count;
  }, [filters, dataRanges]);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];

    return vehicles.filter((vehicle) => {
      const price = parseFloat(vehicle.price as string);
      
      const matchesSearch =
        filters.search === "" ||
        vehicle.model.toLowerCase().includes(filters.search.toLowerCase()) ||
        vehicle.brand?.name.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesBrand = filters.brands.length === 0 || filters.brands.includes(vehicle.brandId);
      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(vehicle.categoryId);
      const matchesFuel = filters.fuels.length === 0 || (vehicle.fuel && filters.fuels.includes(vehicle.fuel));
      const matchesTransmission = filters.transmissions.length === 0 || (vehicle.transmission && filters.transmissions.includes(vehicle.transmission));
      const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      const matchesYear = vehicle.year >= filters.yearRange[0] && vehicle.year <= filters.yearRange[1];
      const matchesMileage = vehicle.mileage >= filters.mileageRange[0] && vehicle.mileage <= filters.mileageRange[1];

      return matchesSearch && matchesBrand && matchesCategory && matchesFuel && 
             matchesTransmission && matchesPrice && matchesYear && matchesMileage;
    });
  }, [vehicles, filters]);

  const filterProps = {
    filters,
    onFiltersChange: setFilters,
    brands,
    categories,
    priceRange: dataRanges.price,
    yearRange: dataRanges.year,
    mileageRange: dataRanges.mileage,
    availableFuels: dataRanges.fuels,
    availableTransmissions: dataRanges.transmissions,
    onReset: resetFilters,
    activeFiltersCount,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImage} alt="MayBach Cars" className="h-9 w-auto" />
            <span className="text-xl font-bold">MayBach Cars</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild data-testid="link-back-home">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
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

        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-lg border bg-card p-4 shadow-sm">
              <CatalogFilters {...filterProps} />
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por modelo ou marca..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                  data-testid="input-search-catalog"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="button-open-filters">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="sr-only">Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <CatalogFilters {...filterProps} />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="text-sm text-muted-foreground">
                  {filteredVehicles.length} veículo{filteredVehicles.length !== 1 ? 's' : ''} encontrado{filteredVehicles.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {filters.brands.map((brandId) => {
                  const brand = brands.find((b) => b.id === brandId);
                  return brand ? (
                    <Badge key={`brand-${brandId}`} variant="secondary" className="gap-1">
                      {brand.name}
                      <button
                        onClick={() => setFilters({
                          ...filters,
                          brands: filters.brands.filter((id) => id !== brandId),
                        })}
                        className="ml-1 rounded-full hover:bg-muted-foreground/20"
                        data-testid={`button-remove-brand-${brandId}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                {filters.categories.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  return category ? (
                    <Badge key={`category-${categoryId}`} variant="secondary" className="gap-1">
                      {category.name}
                      <button
                        onClick={() => setFilters({
                          ...filters,
                          categories: filters.categories.filter((id) => id !== categoryId),
                        })}
                        className="ml-1 rounded-full hover:bg-muted-foreground/20"
                        data-testid={`button-remove-category-${categoryId}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                {filters.fuels.map((fuel) => (
                  <Badge key={`fuel-${fuel}`} variant="secondary" className="gap-1">
                    {fuel}
                    <button
                      onClick={() => setFilters({
                        ...filters,
                        fuels: filters.fuels.filter((f) => f !== fuel),
                      })}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20"
                      data-testid={`button-remove-fuel-${fuel}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.transmissions.map((transmission) => (
                  <Badge key={`transmission-${transmission}`} variant="secondary" className="gap-1">
                    {transmission}
                    <button
                      onClick={() => setFilters({
                        ...filters,
                        transmissions: filters.transmissions.filter((t) => t !== transmission),
                      })}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20"
                      data-testid={`button-remove-transmission-${transmission}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground"
                  data-testid="button-clear-all-filters"
                >
                  Limpar todos
                </Button>
              </div>
            )}

            {loadingVehicles ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Car className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold">Nenhum veículo encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar seus filtros de busca
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={resetFilters} data-testid="button-reset-no-results">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
