import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Car, Phone, MapPin, Clock, ChevronRight, Star, Shield, Award, CheckCircle, Users, Wrench, CreditCard, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import type { VehicleWithRelations } from "@shared/schema";
import logoImage from "@/assets/maybach-logo.png";

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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="MayBach Cars" className="h-10 w-auto" />
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#vehicles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Estoque
            </a>
            <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Vantagens
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild data-testid="link-catalog">
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E2B27] via-[#3a3632] to-[#2E2B27]" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23735C3F' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge className="mb-6 bg-primary/20 text-primary-foreground border-primary/30">
                  Excelência em Veículos Premium
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Realize o sonho do seu{" "}
                  <span className="text-[#C1A36A]">
                    carro ideal
                  </span>
                </h1>
                <p className="mt-6 text-lg text-[#E2DED6] leading-relaxed">
                  A MayBach Cars oferece os melhores veículos seminovos e usados do mercado, 
                  com procedência garantida, preços justos e as melhores condições de financiamento.
                  Sua satisfação é nossa prioridade.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Button size="lg" className="bg-[#5B9A4D] hover:bg-[#4a8340] text-white" asChild data-testid="button-see-catalog">
                    <Link href="/catalog">
                      Explorar Catálogo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                    <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" data-testid="button-whatsapp">
                      <Phone className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#C1A36A]" />
                    <span className="text-sm text-[#E2DED6]">Garantia de Procedência</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#C1A36A]" />
                    <span className="text-sm text-[#E2DED6]">Financiamento Facilitado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#C1A36A]" />
                    <span className="text-sm text-[#E2DED6]">Atendimento Premium</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#735C3F]/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-[#C1A36A]/10 rounded-full blur-2xl" />
                <div className="relative bg-gradient-to-br from-[#3a3632]/90 to-[#2E2B27]/90 rounded-2xl p-8 border border-[#735C3F]/30 backdrop-blur">
                  <img src={logoImage} alt="MayBach Cars" className="w-full max-w-[280px] mx-auto opacity-90" />
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">500+</div>
                      <div className="text-xs text-[#E2DED6]">Vendidos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">14+</div>
                      <div className="text-xs text-[#E2DED6]">Anos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">98%</div>
                      <div className="text-xs text-[#E2DED6]">Satisfação</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-card border-y">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]/10">
                  <Star className="h-7 w-7 text-[#735C3F]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">+500 Veículos</h3>
                  <p className="text-sm text-muted-foreground">Vendidos com sucesso</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]/10">
                  <Shield className="h-7 w-7 text-[#735C3F]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Garantia Total</h3>
                  <p className="text-sm text-muted-foreground">Procedência verificada</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]/10">
                  <CreditCard className="h-7 w-7 text-[#735C3F]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Financiamento</h3>
                  <p className="text-sm text-muted-foreground">As melhores taxas</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]/10">
                  <Award className="h-7 w-7 text-[#735C3F]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">14 Anos</h3>
                  <p className="text-sm text-muted-foreground">De tradição no mercado</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {featuredVehicles.length > 0 && (
          <section id="vehicles" className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 border-[#735C3F]/30 text-[#735C3F]">
                  Nosso Estoque
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Veículos em Destaque
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Selecionamos os melhores veículos para você. Cada um passou por rigorosa inspeção.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="overflow-hidden group" data-testid={`card-vehicle-${vehicle.id}`}>
                    <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt={`${vehicle.brand.name} ${vehicle.model}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                          <Car className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-[#735C3F] text-white">
                        {vehicle.category.name}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <div className="mb-3">
                        <h3 className="font-bold text-lg truncate">
                          {vehicle.brand.name} {vehicle.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year} • {formatMileage(vehicle.mileage)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xl font-bold text-[#735C3F]">
                          {formatCurrency(vehicle.price)}
                        </span>
                        <Button size="sm" className="bg-[#5B9A4D] hover:bg-[#4a8340] text-white" asChild>
                          <Link href="/catalog">
                            Detalhes
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
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
              <div className="text-center mt-12">
                <Button size="lg" variant="outline" className="border-[#735C3F] text-[#735C3F] hover:bg-[#735C3F]/10" asChild>
                  <Link href="/catalog">
                    Ver Catálogo Completo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        <section id="benefits" className="py-20 bg-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-[#735C3F]/30 text-[#735C3F]">
                Por Que Nos Escolher
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Vantagens MayBach Cars
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Oferecemos uma experiência completa na compra do seu veículo
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F] mb-6">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Procedência Garantida</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Todos os veículos passam por uma rigorosa verificação de histórico, 
                    incluindo consulta de multas, sinistros e procedência.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F] mb-6">
                    <CreditCard className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Financiamento Facilitado</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Parcerias com os principais bancos do mercado para oferecer 
                    as melhores taxas e condições de financiamento.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F] mb-6">
                    <Wrench className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Revisão Completa</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cada veículo passa por uma inspeção técnica completa com mais de 
                    100 itens verificados antes de ir para venda.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F] mb-6">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Atendimento Premium</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Nossa equipe está pronta para oferecer um atendimento 
                    personalizado e encontrar o veículo ideal para você.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F] mb-6">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">14 Anos de Tradição</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Mais de uma década no mercado automotivo, construindo 
                    uma reputação sólida baseada em confiança e qualidade.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F] mb-6">
                    <Car className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Estoque Diversificado</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Variedade de modelos, marcas e faixas de preço para 
                    atender diferentes perfis e necessidades.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-[#735C3F]/30 text-[#735C3F]">
                Depoimentos
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                O Que Nossos Clientes Dizem
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                A satisfação dos nossos clientes é o nosso maior orgulho
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="relative">
                <CardContent className="p-8">
                  <Quote className="h-10 w-10 text-[#735C3F]/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Excelente atendimento! Encontrei o carro perfeito com um preço justo. 
                    Recomendo a todos que buscam um seminovo de qualidade."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#735C3F]/10 flex items-center justify-center">
                      <span className="font-bold text-[#735C3F]">RS</span>
                    </div>
                    <div>
                      <div className="font-semibold">Roberto Silva</div>
                      <div className="text-sm text-muted-foreground">Cliente desde 2022</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <CardContent className="p-8">
                  <Quote className="h-10 w-10 text-[#735C3F]/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Processo de compra muito tranquilo. A equipe foi super atenciosa 
                    e me ajudou a conseguir um ótimo financiamento."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#735C3F]/10 flex items-center justify-center">
                      <span className="font-bold text-[#735C3F]">MC</span>
                    </div>
                    <div>
                      <div className="font-semibold">Maria Costa</div>
                      <div className="text-sm text-muted-foreground">Cliente desde 2023</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <CardContent className="p-8">
                  <Quote className="h-10 w-10 text-[#735C3F]/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Já é o segundo carro que compro na MayBach. Confiança total! 
                    Veículos sempre em perfeito estado e com toda documentação em dia."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#735C3F]/10 flex items-center justify-center">
                      <span className="font-bold text-[#735C3F]">JO</span>
                    </div>
                    <div>
                      <div className="font-semibold">João Oliveira</div>
                      <div className="text-sm text-muted-foreground">Cliente desde 2019</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-[#735C3F]/30 text-[#735C3F]">
                Fale Conosco
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Estamos Prontos Para Ajudá-lo
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Entre em contato conosco e agende uma visita. Nossa equipe está pronta 
                para encontrar o veículo perfeito para você.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mb-12">
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F]">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Telefone / WhatsApp</h3>
                  <p className="text-muted-foreground">(11) 99999-9999</p>
                  <p className="text-muted-foreground">(11) 3333-3333</p>
                </CardContent>
              </Card>
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F]">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Endereço</h3>
                  <p className="text-muted-foreground">Av. Principal, 1234 - Centro</p>
                  <p className="text-muted-foreground">São Paulo - SP</p>
                </CardContent>
              </Card>
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#735C3F]">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Horário</h3>
                  <p className="text-muted-foreground">Seg-Sex: 8h às 18h</p>
                  <p className="text-muted-foreground">Sábado: 8h às 14h</p>
                </CardContent>
              </Card>
            </div>
            <div className="text-center">
              <Button size="lg" className="bg-[#5B9A4D] hover:bg-[#4a8340] text-white" asChild>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-4 w-4" />
                  Falar pelo WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#2E2B27] to-[#3a3632] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Pronto para encontrar seu próximo veículo?
                </h2>
                <p className="mt-2 text-[#E2DED6]">
                  Acesse nosso catálogo completo e encontre o carro ideal para você.
                </p>
              </div>
              <Button size="lg" className="bg-[#5B9A4D] hover:bg-[#4a8340] text-white" asChild data-testid="button-catalog-cta">
                <Link href="/catalog">
                  Ver Catálogo Completo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <img src={logoImage} alt="MayBach Cars" className="h-12 w-auto mb-4" />
              <p className="text-muted-foreground max-w-md">
                Há mais de 14 anos realizando o sonho do carro próprio. 
                Qualidade, confiança e as melhores condições do mercado.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/catalog" className="hover:text-foreground transition-colors">Catálogo</Link></li>
                <li><a href="#benefits" className="hover:text-foreground transition-colors">Vantagens</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a></li>
                <li><a href="#contact" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>(11) 99999-9999</li>
                <li>(11) 3333-3333</li>
                <li>contato@maybachcars.com.br</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MayBach Cars. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              CNPJ: 00.000.000/0001-00
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
