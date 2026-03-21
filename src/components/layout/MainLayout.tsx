import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Building2 } from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { empresas, empresaAtiva, loading: empresaLoading } = useEmpresa();

  console.log("MainLayout render:", { authLoading, user: !!user, empresaLoading, empresas: empresas.length });

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("MainLayout: Redirecting to /auth");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || empresaLoading) {
    console.log("MainLayout: Showing loader", { authLoading, empresaLoading });
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Se não tem empresa, mostra mensagem para criar
  if (empresas.length === 0) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo ao Leal Sistem!
            </h2>
            <p className="text-muted-foreground mb-6">
              Para começar, crie sua primeira empresa clicando no botão "Criar Empresa" na barra lateral.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 md:pl-6">{children}</div>
      </main>
    </div>
  );
}
