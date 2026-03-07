import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions, Permission } from "@/hooks/useUserPermissions";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

const PERMISSION_ROUTES: Record<Permission, string> = {
    dashboard: "/",
    cadastros: "/clientes",
    comercial: "/ordem-servico",
    orcamentos: "/orcamentos",
    compras: "/compras",
    financeiro: "/contas-pagar",
    producao: "/producao",
    configuracoes: "/configuracoes",
};

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: Permission;
    requireAdmin?: boolean;
}

function SemEmpresaVinculada({ onLogout }: { onLogout: () => void }) {
    const { criarEmpresa, refetch } = useEmpresa();
    const [nome, setNome] = useState("");
    const [sigla, setSigla] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCriar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome || !sigla) {
            toast.error("Preencha todos os campos");
            return;
        }
        setLoading(true);
        const { error } = await criarEmpresa(nome, sigla.toUpperCase());
        setLoading(false);
        if (error) {
            toast.error("Erro ao criar empresa: " + error.message);
        } else {
            toast.success("Empresa criada! Carregando...");
            await refetch();
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Criar sua Empresa</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        Crie sua empresa para começar a usar o sistema.
                    </p>
                </div>
                <form onSubmit={handleCriar} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="emp-nome">Nome da Empresa</Label>
                        <Input
                            id="emp-nome"
                            placeholder="Ex: Minha Empresa"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emp-sigla">Sigla (2-3 letras)</Label>
                        <Input
                            id="emp-sigla"
                            placeholder="Ex: ME"
                            maxLength={3}
                            value={sigla}
                            onChange={(e) => setSigla(e.target.value.toUpperCase())}
                            disabled={loading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : "Criar Empresa"}
                    </Button>
                </form>
                <Button variant="ghost" className="w-full mt-3 text-muted-foreground" onClick={onLogout}>
                    Sair da conta
                </Button>
            </div>
        </div>
    );
}




export function ProtectedRoute({ children, permission, requireAdmin }: ProtectedRouteProps) {
    const { user, loading: authLoading, signOut } = useAuth();
    const { empresaAtiva, empresas, loading: empresaLoading } = useEmpresa();
    const { hasPermission, isAdmin, permissions, isLoading: permissionsLoading } = useUserPermissions();
    const location = useLocation();

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/auth';
    };

    if (authLoading || empresaLoading || (user && empresaAtiva && permissionsLoading)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // User is logged in but has no empresa linked yet
    if (user && !empresaLoading && empresas.length === 0) {
        return <SemEmpresaVinculada onLogout={handleLogout} />;
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (permission && !hasPermission(permission)) {
        // Find the first permitted route to redirect to (avoid infinite loop)
        const firstPermitted = permissions.find(p => p !== permission);

        if (firstPermitted) {
            const redirectTo = PERMISSION_ROUTES[firstPermitted];
            return <Navigate to={redirectTo} replace />;
        }

        // If no permissions at all, show a restricted access message instead of redirecting to login
        return (
            <div className="flex flex-col h-screen w-screen items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
                <p className="text-muted-foreground mb-4">Você ainda não tem permissão para acessar esta área.</p>
                <p className="text-sm text-muted-foreground">Solicite ao administrador da sua empresa a liberação do seu acesso.</p>
                <Button
                    variant="outline"
                    className="mt-6"
                    onClick={handleLogout}
                >
                    Sair e Voltar para Login
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
