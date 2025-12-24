import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Car, Phone, MapPin, Clock, ChevronRight, Star, Shield, Award, 
  CheckCircle, Users, Wrench, CreditCard, ArrowRight, Quote,
  FileCheck, Truck, MessageCircle, Building2, Gauge, Sparkles,
  Instagram, Facebook, Mail
} from "lucide-react";
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
            <a href="#process" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Como Comprar
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
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-[#1a1816]">
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 80% 50% at 80% 50%, rgba(115, 92, 63, 0.3) 0%, transparent 50%),
                  radial-gradient(ellipse 60% 40% at 20% 80%, rgba(193, 163, 106, 0.15) 0%, transparent 40%)
                `
              }}
            />
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, transparent 0%, transparent 50%, rgba(255,255,255,0.03) 50%, transparent 51%),
                  linear-gradient(0deg, transparent 0%, transparent 50%, rgba(255,255,255,0.02) 50%, transparent 51%)
                `,
                backgroundSize: '100px 100px'
              }}
            />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px w-12 bg-[#C1A36A]" />
                <span className="text-sm font-medium tracking-widest uppercase text-[#C1A36A]">
                  Excelência em Veículos Premium
                </span>
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight">
                Encontre o carro{" "}
                <span className="text-[#C1A36A] italic">perfeito</span>
                <br />
                para sua próxima jornada
              </h1>
              
              <p className="mt-8 text-xl text-white/80 leading-relaxed max-w-2xl">
                Na MayBach Cars, cada veículo conta uma história de qualidade e confiança.
                Mais de 14 anos realizando sonhos com procedência garantida e condições únicas.
              </p>
              
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button size="lg" className="bg-[#5B9A4D] text-white" asChild data-testid="button-see-catalog">
                  <Link href="/catalog">
                    <Car className="mr-2 h-5 w-5" />
                    Ver Estoque Completo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white backdrop-blur-sm" asChild data-testid="button-whatsapp-hero">
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Falar com Especialista
                  </a>
                </Button>
              </div>
              
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">500+</div>
                  <div className="text-sm text-white/60 mt-1">Veículos Vendidos</div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="text-4xl font-bold text-white">14+</div>
                  <div className="text-sm text-white/60 mt-1">Anos no Mercado</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">98%</div>
                  <div className="text-sm text-white/60 mt-1">Clientes Satisfeitos</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <a href="#vehicles" className="text-white/40 hover:text-white/60 transition-colors" data-testid="link-scroll-vehicles">
              <ChevronRight className="h-8 w-8 rotate-90" />
            </a>
          </div>
        </section>

        <section id="vehicles" className="py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-[#C1A36A]" />
                  <span className="text-sm font-medium tracking-widest uppercase text-[#735C3F]">
                    Nosso Showroom
                  </span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight">
                  Veículos em Destaque
                </h2>
                <p className="mt-3 text-lg text-muted-foreground max-w-xl">
                  Cada veículo passa por uma rigorosa inspeção de mais de 100 itens antes de integrar nosso estoque premium.
                </p>
              </div>
              <Button variant="outline" className="border-[#735C3F] text-[#735C3F]" asChild data-testid="button-view-all-vehicles">
                <Link href="/catalog">
                  Ver Todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {featuredVehicles.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="group overflow-hidden border-0 shadow-xl bg-card" data-testid={`card-vehicle-${vehicle.id}`}>
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt={`${vehicle.brand.name} ${vehicle.model}`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                          <Car className="h-20 w-20 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge className="absolute top-4 left-4 bg-[#735C3F] text-white border-0">
                        {vehicle.category.name}
                      </Badge>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" className="bg-[#5B9A4D] text-white" asChild data-testid={`button-vehicle-details-${vehicle.id}`}>
                          <Link href="/catalog">
                            Ver Detalhes
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-xl">
                          {vehicle.brand.name} {vehicle.model}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          {formatMileage(vehicle.mileage)}
                        </span>
                        <span>{vehicle.year}</span>
                        {vehicle.fuel && <span>{vehicle.fuel}</span>}
                      </div>
                      <div className="pt-4 border-t flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">A partir de</div>
                          <span className="text-2xl font-bold text-[#735C3F]">
                            {formatCurrency(vehicle.price)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-2xl">
                <Car className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Novos veículos em breve</h3>
                <p className="text-muted-foreground">
                  Estamos preparando uma seleção especial para você.
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="benefits" className="py-24 bg-[#2E2B27]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-8 bg-[#C1A36A]" />
                <span className="text-sm font-medium tracking-widest uppercase text-[#C1A36A]">
                  Diferenciais
                </span>
                <div className="h-px w-8 bg-[#C1A36A]" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-white">
                Por Que Escolher a MayBach Cars?
              </h2>
              <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
                Cada etapa da sua experiência é pensada para oferecer confiança, transparência e satisfação total.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5B9A4D] mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Garantia de Procedência</h3>
                <p className="text-white/70 leading-relaxed">
                  Todos os veículos passam por verificação completa de histórico: multas, sinistros, alienação fiduciária e leilão.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5B9A4D] mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Financiamento Facilitado</h3>
                <p className="text-white/70 leading-relaxed">
                  Parcerias com os principais bancos para oferecer as melhores taxas. Entrada facilitada e até 60x para pagar.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5B9A4D] mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Veículos Periciados</h3>
                <p className="text-white/70 leading-relaxed">
                  Inspeção técnica completa com mais de 100 itens verificados. Laudos disponíveis para consulta.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5B9A4D] mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Atendimento Especializado</h3>
                <p className="text-white/70 leading-relaxed">
                  Equipe treinada para entender suas necessidades e encontrar o veículo ideal para seu perfil.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5B9A4D] mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Pós-Venda Premium</h3>
                <p className="text-white/70 leading-relaxed">
                  Suporte contínuo após a compra. Estamos sempre disponíveis para ajudar com qualquer necessidade.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5B9A4D] mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">14 Anos de Tradição</h3>
                <p className="text-white/70 leading-relaxed">
                  Mais de uma década construindo uma reputação sólida baseada em confiança, qualidade e transparência.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="py-24 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-8 bg-[#735C3F]" />
                <span className="text-sm font-medium tracking-widest uppercase text-[#735C3F]">
                  Processo Simples
                </span>
                <div className="h-px w-8 bg-[#735C3F]" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight">
                Como Funciona a Compra
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Do primeiro contato até a entrega das chaves, tornamos tudo simples e transparente.
              </p>
            </div>
            
            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#735C3F] via-[#C1A36A] to-[#5B9A4D] -translate-y-1/2 rounded-full" />
              
              <div className="grid gap-8 lg:grid-cols-4 relative">
                <div className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#735C3F] text-white text-2xl font-bold shadow-xl">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-2">Escolha</h3>
                  <p className="text-muted-foreground">
                    Navegue pelo nosso catálogo online ou visite nossa loja para encontrar o veículo dos seus sonhos.
                  </p>
                </div>
                
                <div className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#8B7355] text-white text-2xl font-bold shadow-xl">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-2">Simulação</h3>
                  <p className="text-muted-foreground">
                    Faça uma simulação de financiamento personalizada e encontre as melhores condições.
                  </p>
                </div>
                
                <div className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C1A36A] text-white text-2xl font-bold shadow-xl">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-2">Documentação</h3>
                  <p className="text-muted-foreground">
                    Nossa equipe cuida de toda a burocracia: transferência, despachante e documentação.
                  </p>
                </div>
                
                <div className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#5B9A4D] text-white text-2xl font-bold shadow-xl">
                    4
                  </div>
                  <h3 className="text-xl font-bold mb-2">Entrega</h3>
                  <p className="text-muted-foreground">
                    Receba seu veículo revisado, higienizado e pronto para rodar. É só curtir!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-[#5B9A4D] to-[#4a8340]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Simule Seu Financiamento Agora
                </h2>
                <p className="mt-3 text-xl text-white/90 max-w-xl">
                  Descubra as melhores condições para realizar seu sonho. Resposta em minutos!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" variant="outline" className="bg-white text-[#5B9A4D] border-white" asChild data-testid="button-simulate-whatsapp">
                  <a href="https://wa.me/5511999999999?text=Olá! Gostaria de simular um financiamento." target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Simular pelo WhatsApp
                  </a>
                </Button>
                <Button size="lg" className="bg-white/10 border-white/30 text-white" asChild data-testid="button-call-now">
                  <a href="tel:+551199999999">
                    <Phone className="mr-2 h-5 w-5" />
                    Ligar Agora
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-8 bg-[#735C3F]" />
                <span className="text-sm font-medium tracking-widest uppercase text-[#735C3F]">
                  Experiências Reais
                </span>
                <div className="h-px w-8 bg-[#735C3F]" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight">
                O Que Nossos Clientes Dizem
              </h2>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-6 w-6 fill-[#C1A36A] text-[#C1A36A]" />
                  ))}
                </div>
                <span className="text-lg font-semibold">4.9/5</span>
                <span className="text-muted-foreground">baseado em 127 avaliações</span>
              </div>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="relative border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-5 w-5 fill-[#C1A36A] text-[#C1A36A]" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-[#735C3F]/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Excelente atendimento! Encontrei o carro perfeito com um preço justo. 
                    A equipe foi super transparente em todo o processo. Recomendo muito!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#735C3F] to-[#C1A36A] flex items-center justify-center">
                      <span className="font-bold text-white text-lg">RS</span>
                    </div>
                    <div>
                      <div className="font-semibold">Roberto Silva</div>
                      <div className="text-sm text-muted-foreground">Comprou Honda Civic 2022</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-5 w-5 fill-[#C1A36A] text-[#C1A36A]" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-[#735C3F]/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Processo de compra muito tranquilo. A equipe cuidou de toda documentação 
                    e me ajudou a conseguir um ótimo financiamento. Super satisfeita!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#735C3F] to-[#C1A36A] flex items-center justify-center">
                      <span className="font-bold text-white text-lg">MC</span>
                    </div>
                    <div>
                      <div className="font-semibold">Maria Costa</div>
                      <div className="text-sm text-muted-foreground">Comprou Toyota Corolla 2023</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-5 w-5 fill-[#C1A36A] text-[#C1A36A]" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-[#735C3F]/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Já é o segundo carro que compro na MayBach. Confiança total! 
                    Veículos sempre em perfeito estado e com toda documentação em dia."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#735C3F] to-[#C1A36A] flex items-center justify-center">
                      <span className="font-bold text-white text-lg">JO</span>
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

        <section className="py-16 bg-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-4">
                Parceiros de Confiança
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Building2 className="h-8 w-8" />
                  <span className="font-bold text-lg">Santander</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Building2 className="h-8 w-8" />
                  <span className="font-bold text-lg">Bradesco</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Building2 className="h-8 w-8" />
                  <span className="font-bold text-lg">Itaú</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Building2 className="h-8 w-8" />
                  <span className="font-bold text-lg">BV</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Building2 className="h-8 w-8" />
                  <span className="font-bold text-lg">Pan</span>
                </div>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-6 rounded-xl bg-card">
                <CheckCircle className="h-10 w-10 text-[#5B9A4D] mx-auto mb-3" />
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground">Documentação em Dia</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card">
                <Shield className="h-10 w-10 text-[#5B9A4D] mx-auto mb-3" />
                <div className="text-2xl font-bold">Garantia</div>
                <div className="text-sm text-muted-foreground">Motor e Câmbio</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card">
                <Truck className="h-10 w-10 text-[#5B9A4D] mx-auto mb-3" />
                <div className="text-2xl font-bold">Entrega</div>
                <div className="text-sm text-muted-foreground">Em Todo Brasil</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card">
                <Star className="h-10 w-10 text-[#5B9A4D] mx-auto mb-3" />
                <div className="text-2xl font-bold">4.9/5</div>
                <div className="text-sm text-muted-foreground">Google Reviews</div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-8 bg-[#735C3F]" />
                  <span className="text-sm font-medium tracking-widest uppercase text-[#735C3F]">
                    Visite-nos
                  </span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight mb-4">
                  Estamos Prontos Para Atendê-lo
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Visite nosso showroom e conheça de perto nossa seleção de veículos. 
                  Nossa equipe está pronta para oferecer a melhor experiência.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Endereço</h3>
                      <p className="text-muted-foreground">Av. Principal, 1234 - Centro</p>
                      <p className="text-muted-foreground">São Paulo - SP, 01234-000</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Telefone / WhatsApp</h3>
                      <p className="text-muted-foreground">(11) 99999-9999</p>
                      <p className="text-muted-foreground">(11) 3333-3333</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Horário de Funcionamento</h3>
                      <p className="text-muted-foreground">Segunda a Sexta: 8h às 18h</p>
                      <p className="text-muted-foreground">Sábado: 8h às 14h</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#735C3F]">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">E-mail</h3>
                      <p className="text-muted-foreground">contato@maybachcars.com.br</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-4">
                  <Button size="lg" className="bg-[#5B9A4D] text-white" asChild data-testid="button-contact-whatsapp-section">
                    <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild data-testid="button-view-map">
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      Ver no Mapa
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975986698856!2d-46.6556756!3d-23.5504817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzAxLjciUyA0NsKwMzknMjAuNCJX!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização MayBach Cars"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#2E2B27] via-[#3a3632] to-[#2E2B27] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Pronto para encontrar seu próximo veículo?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Acesse nosso catálogo completo e descubra o carro perfeito para você.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="bg-[#5B9A4D] text-white" asChild data-testid="button-catalog-cta">
                <Link href="/catalog">
                  Ver Catálogo Completo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white" asChild data-testid="button-contact-whatsapp">
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Fale Conosco
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#1a1816] text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <img src={logoImage} alt="MayBach Cars" className="h-14 w-auto mb-6 brightness-0 invert" />
              <p className="text-white/60 mb-6 leading-relaxed">
                Há mais de 14 anos realizando o sonho do carro próprio com qualidade, 
                confiança e as melhores condições do mercado.
              </p>
              <div className="flex gap-3">
                <a href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" data-testid="link-instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" data-testid="link-facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://wa.me/5511999999999" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" data-testid="link-whatsapp-footer">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Links Rápidos</h4>
              <ul className="space-y-3 text-white/60">
                <li><Link href="/catalog" className="hover:text-white transition-colors">Catálogo de Veículos</Link></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Nossas Vantagens</a></li>
                <li><a href="#process" className="hover:text-white transition-colors">Como Comprar</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Depoimentos</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Contato</h4>
              <ul className="space-y-3 text-white/60">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  (11) 99999-9999
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  (11) 3333-3333
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  contato@maybachcars.com.br
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Endereço</h4>
              <div className="text-white/60 space-y-2">
                <p>Av. Principal, 1234</p>
                <p>Centro - São Paulo/SP</p>
                <p>CEP: 01234-000</p>
              </div>
              <div className="mt-4 text-white/60">
                <p className="font-medium text-white mb-1">Horário:</p>
                <p>Seg-Sex: 8h às 18h</p>
                <p>Sábado: 8h às 14h</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} MayBach Cars. Todos os direitos reservados.
            </p>
            <p className="text-sm text-white/40">
              CNPJ: 00.000.000/0001-00
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
