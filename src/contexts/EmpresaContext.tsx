import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Empresa {
  id: string;
  nome: string;
  sigla: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
}

interface EmpresaContextType {
  empresas: Empresa[];
  empresaAtiva: Empresa | null;
  setEmpresaAtiva: (empresa: Empresa) => void;
  loading: boolean;
  refetch: () => Promise<void>;
  criarEmpresa: (nome: string, sigla: string) => Promise<{ error: Error | null; empresa?: Empresa }>;
  excluirEmpresa: (id: string) => Promise<{ error: Error | null }>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmpresas = async () => {
    if (!user) {
      setEmpresas([]);
      setEmpresaAtiva(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch only companies where the user is a member
      const { data: userEmpresas, error: ueError } = await supabase
        .from("empresa_usuarios")
        .select("empresa_id")
        .eq("user_id", user.id);

      if (ueError) throw ueError;

      const empresaIds = userEmpresas?.map(ue => ue.empresa_id) || [];

      if (empresaIds.length === 0) {
        setEmpresas([]);
        setEmpresaAtiva(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .in("id", empresaIds)
        .order("nome");

      if (error) throw error;

      setEmpresas(data || []);

      // Se não tem empresa ativa, seleciona a primeira
      if (data && data.length > 0 && !empresaAtiva) {
        // Tenta recuperar do localStorage
        const savedEmpresaId = localStorage.getItem("empresaAtiva");
        const savedEmpresa = data.find((e) => e.id === savedEmpresaId);
        setEmpresaAtiva(savedEmpresa || data[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, [user]);

  useEffect(() => {
    if (empresaAtiva) {
      localStorage.setItem("empresaAtiva", empresaAtiva.id);
    }
  }, [empresaAtiva]);

  const criarEmpresa = async (nome: string, sigla: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("empresas")
        .insert({ nome, sigla })
        .select()
        .single();

      if (error) throw error;

      await fetchEmpresas();
      setEmpresaAtiva(data);

      return { error: null, empresa: data };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const excluirEmpresa = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se não é a única empresa
      if (empresas.length <= 1) {
        throw new Error("Você deve ter pelo menos uma empresa cadastrada.");
      }

      const { error } = await supabase.from("empresas").delete().eq("id", id);

      if (error) throw error;

      if (empresaAtiva?.id === id) {
        const remainingEmpresas = empresas.filter((e) => e.id !== id);
        setEmpresaAtiva(remainingEmpresas[0] || null);
        localStorage.removeItem("empresaAtiva");
      }

      await fetchEmpresas();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <EmpresaContext.Provider
      value={{
        empresas,
        empresaAtiva,
        setEmpresaAtiva,
        loading,
        refetch: fetchEmpresas,
        criarEmpresa,
        excluirEmpresa,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error("useEmpresa must be used within an EmpresaProvider");
  }
  return context;
}
