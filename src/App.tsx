import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmpresaProvider } from "@/contexts/EmpresaContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Produtos from "./pages/Produtos";
import Categorias from "./pages/Categorias";
import Orcamentos from "./pages/Orcamentos";
import OrcamentoForm from "./pages/OrcamentoForm";
import Producao from "./pages/Producao";
import OrdemServico from "./pages/OrdemServico";
import PainelOS from "./pages/PainelOS";
import Compras from "./pages/Compras";
import ContasPagar from "./pages/ContasPagar";
import ContasReceber from "./pages/ContasReceber";
import DespesasFixas from "./pages/DespesasFixas";
import Budget from "./pages/Budget";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmpresaProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <Routes>
                  <Route path="/auth" element={<Auth />} />

                  {/* Public-ish (needs auth but no specific permission) */}
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                  {/* Cadastros */}
                  <Route path="/clientes" element={<ProtectedRoute permission="cadastros"><Clientes /></ProtectedRoute>} />
                  <Route path="/fornecedores" element={<ProtectedRoute permission="cadastros"><Fornecedores /></ProtectedRoute>} />
                  <Route path="/produtos" element={<ProtectedRoute permission="cadastros"><Produtos /></ProtectedRoute>} />
                  <Route path="/categorias" element={<ProtectedRoute permission="cadastros"><Categorias /></ProtectedRoute>} />

                  {/* Comercial */}
                  <Route path="/orcamentos" element={<ProtectedRoute permission="comercial"><Orcamentos /></ProtectedRoute>} />
                  <Route path="/orcamentos/novo" element={<ProtectedRoute permission="comercial"><OrcamentoForm /></ProtectedRoute>} />
                  <Route path="/orcamentos/:id" element={<ProtectedRoute permission="comercial"><OrcamentoForm /></ProtectedRoute>} />
                  <Route path="/ordem-servico" element={<ProtectedRoute permission="comercial"><OrdemServico /></ProtectedRoute>} />
                  <Route path="/painel-os" element={<ProtectedRoute permission="comercial"><PainelOS /></ProtectedRoute>} />
                  <Route path="/compras" element={<ProtectedRoute permission="comercial"><Compras /></ProtectedRoute>} />
                  <Route path="/producao" element={<ProtectedRoute permission="producao"><Producao /></ProtectedRoute>} />

                  {/* Financeiro */}
                  <Route path="/contas-pagar" element={<ProtectedRoute permission="financeiro"><ContasPagar /></ProtectedRoute>} />
                  <Route path="/contas-receber" element={<ProtectedRoute permission="financeiro"><ContasReceber /></ProtectedRoute>} />
                  <Route path="/despesas-fixas" element={<ProtectedRoute permission="financeiro"><DespesasFixas /></ProtectedRoute>} />
                  <Route path="/budget" element={<ProtectedRoute permission="financeiro"><Budget /></ProtectedRoute>} />

                  {/* Sistema */}
                  <Route path="/configuracoes" element={<ProtectedRoute permission="configuracoes"><Configuracoes /></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </EmpresaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
