import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions, Permission } from "@/hooks/useUserPermissions";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PERMISSION_ROUTES: Record<Permission, string> = {
    dashboard: "/",
    cadastros: "/clientes",
    comercial: "/orcamentos",
    financeiro: "/contas-pagar",
    producao: "/producao",
    configuracoes: "/configuracoes",
};

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: Permission;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, permission, requireAdmin }: ProtectedRouteProps) {
    const { user, loading: authLoading } = useAuth();
    const { empresaAtiva, loading: empresaLoading } = useEmpresa();
    const { hasPermission, isAdmin, permissions, isLoading: permissionsLoading } = useUserPermissions();
    const location = useLocation();

    if (authLoading || empresaLoading || (user && empresaAtiva && permissionsLoading)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
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
                    onClick={() => window.location.href = '/auth'}
                >
                    Voltar para Login
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
