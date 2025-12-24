import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Car, Calendar, Gauge, Fuel, Settings, Palette, MapPin, Phone, MessageCircle, Shield, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import type { VehicleWithRelations } from "@shared/schema";
import logoImage from "@/assets/maybach-logo.png";

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

export default function VehicleDetailPage() {
  const [, params] = useRoute("/catalog/:id");
  const vehicleId = params?.id;

  const { data: vehicle, isLoading, error } = useQuery<VehicleWithRelations>({
    queryKey: ["/api/vehicles/public", vehicleId],
    enabled: !!vehicleId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/">
              <img src={logoImage} alt="MayBach Cars" className="h-10 w-auto" />
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-8 w-32" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/">
              <img src={logoImage} alt="MayBach Cars" className="h-10 w-auto" />
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Car className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Veículo não encontrado</h2>
            <p className="text-muted-foreground mb-6">O veículo que você procura não está disponível.</p>
            <Button asChild data-testid="button-back-catalog">
              <Link href="/catalog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Catálogo
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" data-testid="link-logo-home">
            <img src={logoImage} alt="MayBach Cars" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild data-testid="link-back-catalog">
              <Link href="/catalog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Catálogo
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href="/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt={`${vehicle.brand?.name} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                  data-testid="img-vehicle-main"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                  <Car className="h-24 w-24 text-muted-foreground/20" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <Shield className="mx-auto h-6 w-6 text-[#5B9A4D] mb-2" />
                <p className="text-sm font-medium">Garantia</p>
                <p className="text-xs text-muted-foreground">3 meses</p>
              </Card>
              <Card className="text-center p-4">
                <Award className="mx-auto h-6 w-6 text-[#C1A36A] mb-2" />
                <p className="text-sm font-medium">Procedência</p>
                <p className="text-xs text-muted-foreground">Verificada</p>
              </Card>
              <Card className="text-center p-4">
                <CheckCircle className="mx-auto h-6 w-6 text-[#735C3F] mb-2" />
                <p className="text-sm font-medium">Revisado</p>
                <p className="text-xs text-muted-foreground">100+ itens</p>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Badge className="mb-3 bg-[#735C3F] text-white border-0">
                {vehicle.category?.name}
              </Badge>
              <h1 className="text-3xl font-bold" data-testid="text-vehicle-title">
                {vehicle.brand?.name} {vehicle.model}
              </h1>
              <p className="text-muted-foreground mt-1">
                {vehicle.year} | {vehicle.color}
              </p>
            </div>

            <div className="text-4xl font-bold text-[#735C3F]" data-testid="text-vehicle-price">
              {formatCurrency(vehicle.price)}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="font-medium" data-testid="text-vehicle-year">{vehicle.year}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Gauge className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quilometragem</p>
                  <p className="font-medium" data-testid="text-vehicle-mileage">{formatMileage(vehicle.mileage)}</p>
                </div>
              </div>

              {vehicle.fuel && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Combustível</p>
                    <p className="font-medium" data-testid="text-vehicle-fuel">{vehicle.fuel}</p>
                  </div>
                </div>
              )}

              {vehicle.transmission && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Câmbio</p>
                    <p className="font-medium" data-testid="text-vehicle-transmission">{vehicle.transmission}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cor</p>
                  <p className="font-medium" data-testid="text-vehicle-color">{vehicle.color}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Entre em Contato</h3>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-[#5B9A4D] text-white flex-1" asChild data-testid="button-whatsapp-vehicle">
                  <a href={`https://wa.me/5511999999999?text=Olá! Tenho interesse no ${vehicle.brand?.name} ${vehicle.model} ${vehicle.year}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="flex-1" asChild data-testid="button-phone-vehicle">
                  <a href="tel:+5511999999999">
                    <Phone className="mr-2 h-5 w-5" />
                    Ligar
                  </a>
                </Button>
              </div>
            </div>

            <Card className="bg-[#F5F3EF] dark:bg-[#2E2B27] border-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#735C3F] mt-0.5" />
                  <div>
                    <p className="font-medium">Visite Nossa Loja</p>
                    <p className="text-sm text-muted-foreground">
                      Av. Exemplo, 1234 - São Paulo, SP
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seg-Sex: 8h às 18h | Sáb: 8h às 14h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
