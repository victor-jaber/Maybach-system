import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Car, Bike, Truck, DollarSign, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";

interface FipeType {
  id: string;
  name: string;
}

interface FipeBrand {
  id: string;
  name: string;
}

interface FipeModel {
  id: string;
  name: string;
}

interface FipeYear {
  id: string;
  year: string;
  fuel: string;
}

interface FipePrice {
  brand: { id: string; name: string };
  model: { id: string; name: string };
  year: { id: string; name: string };
  type: { id: string; name: string };
  price: number;
  id: string;
  referenceMonth?: string;
}

function getVehicleTypeIcon(typeId: string) {
  switch (typeId) {
    case "cars":
      return <Car className="h-5 w-5" />;
    case "motorcycles":
      return <Bike className="h-5 w-5" />;
    case "trucks":
      return <Truck className="h-5 w-5" />;
    default:
      return <Car className="h-5 w-5" />;
  }
}

function getVehicleTypeName(typeId: string) {
  switch (typeId) {
    case "cars":
      return "Carros";
    case "motorcycles":
      return "Motos";
    case "trucks":
      return "Caminhões";
    default:
      return typeId;
  }
}

export default function FipePage() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [priceResult, setPriceResult] = useState<FipePrice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: types, isLoading: loadingTypes } = useQuery<FipeType[]>({
    queryKey: ["/api/fipe/types"],
  });

  const { data: brands, isLoading: loadingBrands, isError: brandsError } = useQuery<FipeBrand[]>({
    queryKey: ["/api/fipe/brands", selectedType],
    enabled: !!selectedType,
  });

  const { data: models, isLoading: loadingModels, isError: modelsError } = useQuery<FipeModel[]>({
    queryKey: ["/api/fipe/models", selectedType, selectedBrand],
    enabled: !!selectedType && !!selectedBrand,
  });

  const { data: years, isLoading: loadingYears, isError: yearsError } = useQuery<FipeYear[]>({
    queryKey: ["/api/fipe/years", selectedType, selectedBrand, selectedModel],
    enabled: !!selectedType && !!selectedBrand && !!selectedModel,
  });

  const priceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/fipe/price/${selectedType}/${selectedBrand}/${selectedModel}/${selectedYear}`);
      return response.json();
    },
    onSuccess: (data: FipePrice) => {
      setPriceResult(data);
      setError(null);
    },
    onError: () => {
      setError("Erro ao consultar preço. Tente novamente.");
      setPriceResult(null);
    },
  });

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    setPriceResult(null);
    setError(null);
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSelectedModel("");
    setSelectedYear("");
    setPriceResult(null);
    setError(null);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setSelectedYear("");
    setPriceResult(null);
    setError(null);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setPriceResult(null);
    setError(null);
  };

  const handleSearch = () => {
    if (selectedType && selectedBrand && selectedModel && selectedYear) {
      priceMutation.mutate();
    }
  };

  const canSearch = selectedType && selectedBrand && selectedModel && selectedYear;
  const hasQueryError = brandsError || modelsError || yearsError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-fipe-title">
          Consulta Tabela FIPE
        </h1>
        <p className="text-muted-foreground mt-2">
          Consulte o valor de mercado de veículos pela tabela FIPE
        </p>
      </div>

      {(error || hasQueryError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error || "Ocorreu um erro ao carregar os dados. Verifique sua conexão e tente novamente."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Veículo</Label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger id="type" data-testid="select-fipe-type">
                  <SelectValue placeholder={loadingTypes ? "Carregando..." : "Selecione o tipo"} />
                </SelectTrigger>
                <SelectContent>
                  {types?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        {getVehicleTypeIcon(type.id)}
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select 
                value={selectedBrand} 
                onValueChange={handleBrandChange}
                disabled={!selectedType || loadingBrands}
              >
                <SelectTrigger id="brand" data-testid="select-fipe-brand">
                  <SelectValue placeholder={loadingBrands ? "Carregando..." : "Selecione a marca"} />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={String(brand.id)}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Select 
                value={selectedModel} 
                onValueChange={handleModelChange}
                disabled={!selectedBrand || loadingModels}
              >
                <SelectTrigger id="model" data-testid="select-fipe-model">
                  <SelectValue placeholder={loadingModels ? "Carregando..." : "Selecione o modelo"} />
                </SelectTrigger>
                <SelectContent>
                  {models?.map((model) => (
                    <SelectItem key={model.id} value={String(model.id)}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano/Combustível</Label>
              <Select 
                value={selectedYear} 
                onValueChange={handleYearChange}
                disabled={!selectedModel || loadingYears}
              >
                <SelectTrigger id="year" data-testid="select-fipe-year">
                  <SelectValue placeholder={loadingYears ? "Carregando..." : "Selecione o ano"} />
                </SelectTrigger>
                <SelectContent>
                  {years?.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.year} - {year.fuel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <Button 
              onClick={handleSearch} 
              disabled={!canSearch || priceMutation.isPending}
              className="w-full"
              data-testid="button-search-fipe"
            >
              {priceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Consultar Preço
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resultado da Consulta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priceResult ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Valor FIPE</p>
                  <p className="text-4xl font-bold text-primary heading-premium" data-testid="text-fipe-price">
                    {formatCurrency(priceResult.price)}
                  </p>
                  {priceResult.referenceMonth && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Referência: {priceResult.referenceMonth}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="secondary">
                      {getVehicleTypeName(priceResult.type?.id || selectedType)}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Marca</span>
                    <span className="font-medium">{priceResult.brand?.name}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Modelo</span>
                    <span className="font-medium text-right max-w-[200px]">{priceResult.model?.name}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Ano
                    </span>
                    <span className="font-medium">{priceResult.year?.name}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Código FIPE</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{priceResult.id}</code>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Nenhuma consulta realizada</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Selecione o tipo, marca, modelo e ano do veículo para consultar o valor na tabela FIPE
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
