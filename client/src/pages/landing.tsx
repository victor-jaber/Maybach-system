import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Car, Phone, MapPin, Clock, ChevronRight, Star, Shield, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VehicleWithRelations } from "@shared/schema";

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMileage(km: number) {
  return km.toLocaleString("pt-BR") + " km";
}

export default function LandingPage() {
  const { data: vehicles = [] } = useQuery<VehicleWithRelations[]>({
    queryKey: ["/api/vehicles/public"],
  });

  const featuredVehicles = vehicles.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">MayBach</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#vehicles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Veículos
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sobre Nós
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild data-testid="link-catalog">
              <Link href="/catalog">Ver Catálogo</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild data-testid="button-login" className="text-muted-foreground">
              <Link href="/login">Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6">
                Desde 2010 realizando sonhos
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Seu próximo{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  veículo
                </span>{" "}
                está aqui
              </h1>
              <p className="mt-6 text-lg text-slate-300">
                Na MayBach você encontra os melhores veículos seminovos e usados 
                com procedência garantida, preços justos e condições especiais de pagamento.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild data-testid="button-see-catalog">
                  <Link href="/catalog">
                    Ver Catálogo Completo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" data-testid="button-whatsapp">
                    <Phone className="mr-2 h-4 w-4" />
                    Falar pelo WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b py-12 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">+500 Veículos Vendidos</h3>
                  <p className="text-sm text-muted-foreground">Clientes satisfeitos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Garantia de Procedência</h3>
                  <p className="text-sm text-muted-foreground">Todos os veículos verificados</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Financiamento Facilitado</h3>
                  <p className="text-sm text-muted-foreground">Aprovação rápida</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {featuredVehicles.length > 0 && (
          <section id="vehicles" className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    Veículos em Destaque
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Confira alguns dos nossos melhores veículos disponíveis
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/catalog">
                    Ver todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="overflow-hidden group" data-testid={`card-vehicle-${vehicle.id}`}>
                    <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt={`${vehicle.brand.name} ${vehicle.model}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3">
                        {vehicle.category.name}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <h3 className="font-semibold truncate">
                          {vehicle.brand.name} {vehicle.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year} • {formatMileage(vehicle.mileage)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(vehicle.price)}
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/catalog">Ver mais</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {featuredVehicles.length === 0 && (
                <div className="text-center py-12">
                  <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Em breve novos veículos disponíveis
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section id="about" className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Por que escolher a MayBach?
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Há mais de 14 anos no mercado automotivo, a MayBach se consolidou 
                  como referência em qualidade e confiança na venda de veículos seminovos.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Procedência Garantida</h4>
                      <p className="text-sm text-muted-foreground">
                        Todos os veículos passam por rigorosa vistoria e verificação de histórico
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Financiamento Facilitado</h4>
                      <p className="text-sm text-muted-foreground">
                        Parcerias com os principais bancos para as melhores taxas do mercado
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Atendimento Personalizado</h4>
                      <p className="text-sm text-muted-foreground">
                        Equipe especializada para encontrar o veículo ideal para você
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Car className="mx-auto h-16 w-16 text-primary mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">MayBach</h3>
                    <p className="text-slate-300">Qualidade e confiança</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">
                Entre em Contato
              </h2>
              <p className="mt-4 text-muted-foreground">
                Estamos prontos para ajudá-lo a encontrar o veículo perfeito
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Telefone</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    (11) 99999-9999
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Endereço</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Av. Principal, 1234 - Centro
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Horário</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Seg-Sáb: 8h às 18h
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t bg-slate-900 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Pronto para encontrar seu próximo veículo?
              </h2>
              <p className="mt-4 text-slate-300">
                Acesse nosso catálogo completo e encontre o carro ideal para você
              </p>
              <Button size="lg" className="mt-8" asChild data-testid="button-catalog-cta">
                <Link href="/catalog">
                  Ver Catálogo Completo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">MayBach</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MayBach Veículos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
