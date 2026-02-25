import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions, Permission } from "@/hooks/useUserPermissions";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: Permission;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, permission, requireAdmin }: ProtectedRouteProps) {
    const { user, loading: authLoading } = useAuth();
    const { hasPermission, isAdmin, isLoading: permissionsLoading } = useUserPermissions();
    const location = useLocation();

    if (authLoading || permissionsLoading) {
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
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
