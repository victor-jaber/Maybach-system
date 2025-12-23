import { Car, Shield, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Car,
    title: "Gestão de Estoque",
    description: "Controle completo do seu inventário de veículos com todos os dados necessários",
  },
  {
    icon: Users,
    title: "Cadastro de Clientes",
    description: "Mantenha todos os dados dos seus clientes organizados e acessíveis",
  },
  {
    icon: TrendingUp,
    title: "Controle de Vendas",
    description: "Registre vendas à vista ou financiadas com histórico completo",
  },
  {
    icon: Shield,
    title: "Dados Seguros",
    description: "Seus dados protegidos com autenticação segura e backup automático",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AutoGestão</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild data-testid="link-catalog">
              <a href="/catalog">Ver Catálogo</a>
            </Button>
            <Button asChild data-testid="button-login">
              <a href="/api/login">Entrar</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Gerencie sua{" "}
                <span className="text-primary">concessionária</span> com
                eficiência
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Sistema completo para administração de loja de veículos. Controle
                estoque, clientes, vendas e muito mais em um só lugar.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild data-testid="button-start">
                  <a href="/api/login">Começar Agora</a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-see-catalog">
                  <a href="/catalog">Ver Catálogo de Veículos</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Tudo que você precisa para sua loja
              </h2>
              <p className="mt-4 text-muted-foreground">
                Ferramentas poderosas para gerenciar todos os aspectos do seu
                negócio automotivo
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="text-center"
                  data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <CardContent className="pt-6">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Pronto para começar?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Simplifique a gestão da sua concessionária hoje mesmo.
              </p>
              <Button size="lg" className="mt-8" asChild data-testid="button-access-system">
                <a href="/api/login">Acessar o Sistema</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} AutoGestão. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
