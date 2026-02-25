import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";

export type Permission = "cadastros" | "comercial" | "financeiro" | "producao" | "configuracoes";

export const ALL_PERMISSIONS: Permission[] = ["cadastros", "comercial", "financeiro", "producao", "configuracoes"];

export const PERMISSION_OPTIONS: { value: Permission; label: string; description: string }[] = [
  { value: "cadastros", label: "Cadastros", description: "Clientes, Fornecedores, Produtos, Categorias" },
  { value: "comercial", label: "Comercial", description: "Orçamentos, Produção" },
  { value: "financeiro", label: "Financeiro", description: "Contas a Pagar/Receber, Despesas Fixas, Budget" },
  { value: "producao", label: "Produção", description: "Gestão de produção" },
  { value: "configuracoes", label: "Configurações", description: "Configurações do sistema" },
];

export function useUserPermissions() {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();

  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ["user-role", empresaAtiva?.id, user?.id],
    queryFn: async () => {
      if (!empresaAtiva || !user) return null;
      const { data, error } = await supabase
        .from("empresa_usuarios")
        .select("role")
        .eq("empresa_id", empresaAtiva.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) return "usuario"; // Default to restricted user if no record found
      return data.role as "admin" | "usuario";
    },
    enabled: !!empresaAtiva && !!user,
  });

  const { data: userPermissions = [], isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["user-permissions", empresaAtiva?.id, user?.id],
    queryFn: async () => {
      if (!empresaAtiva || !user) return [];
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("empresa_id", empresaAtiva.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching permissions:", error);
        return [];
      }
      return (data as any[]).map(p => p.permission as Permission);
    },
    enabled: !!empresaAtiva && !!user,
  });

  // Strict check: must be explicitly 'admin'
  const isAdmin = userRole === "admin";
  const isLoading = isLoadingRole || isLoadingPermissions;

  const hasPermission = (permission: Permission): boolean => {
    if (isLoading) return false; // Prevent access while loading
    if (isAdmin) return true;
    return userPermissions.includes(permission);
  };

  return {
    isAdmin,
    permissions: isAdmin ? ALL_PERMISSIONS : userPermissions,
    hasPermission,
    userRole,
    isLoading
  };
}

