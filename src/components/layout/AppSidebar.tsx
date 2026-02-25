import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Settings,
  Building2,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Plus,
  Users,
  Truck,
  FileText,
  Kanban,
  Wallet,
  Receipt,
  CalendarClock,
  PiggyBank,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useUserPermissions, Permission } from "@/hooks/useUserPermissions";
import { toast } from "sonner";

interface NavItem {
  type?: string;
  name: string;
  href?: string;
  icon?: any;
  permission?: Permission;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { type: "section", name: "CADASTROS", permission: "cadastros" },
  { name: "Clientes", href: "/clientes", icon: Users, permission: "cadastros" },
  { name: "Fornecedores", href: "/fornecedores", icon: Truck, permission: "cadastros" },
  { name: "Produtos", href: "/produtos", icon: Package, permission: "cadastros" },
  { name: "Categorias", href: "/categorias", icon: FolderOpen, permission: "cadastros" },
  { type: "section", name: "COMERCIAL", permission: "comercial" },
  { name: "Orçamentos", href: "/orcamentos", icon: FileText, permission: "comercial" },
  { name: "Ordem de Serviço", href: "/ordem-servico", icon: Kanban, permission: "comercial" },
  { name: "Painel de OS", href: "/painel-os", icon: LayoutDashboard, permission: "comercial" },
  { name: "Compras", href: "/compras", icon: ShoppingCart, permission: "comercial" },
  { type: "section", name: "FINANCEIRO", permission: "financeiro" },
  { name: "Contas a Pagar", href: "/contas-pagar", icon: Wallet, permission: "financeiro" },
  { name: "Contas a Receber", href: "/contas-receber", icon: Receipt, permission: "financeiro" },
  { name: "Despesas Fixas", href: "/despesas-fixas", icon: CalendarClock, permission: "financeiro" },
  { name: "Orçamento", href: "/budget", icon: PiggyBank, permission: "financeiro" },
  { type: "section", name: "SISTEMA", permission: "configuracoes" },
  { name: "Configurações", href: "/configuracoes", icon: Settings, permission: "configuracoes" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { empresas, empresaAtiva, setEmpresaAtiva, criarEmpresa, excluirEmpresa } = useEmpresa();
  const { hasPermission, isAdmin } = useUserPermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [novaEmpresaOpen, setNovaEmpresaOpen] = useState(false);
  const [novaEmpresaNome, setNovaEmpresaNome] = useState("");
  const [novaEmpresaSigla, setNovaEmpresaSigla] = useState("");
  const [criandoEmpresa, setCriandoEmpresa] = useState(false);
  const [empresaParaExcluir, setEmpresaParaExcluir] = useState<{ id: string, nome: string } | null>(null);
  const [excluindoEmpresa, setExcluindoEmpresa] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleCriarEmpresa = async () => {
    if (!novaEmpresaNome || !novaEmpresaSigla) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCriandoEmpresa(true);
    const { error } = await criarEmpresa(novaEmpresaNome, novaEmpresaSigla.toUpperCase());
    setCriandoEmpresa(false);

    if (error) {
      toast.error("Erro ao criar empresa: " + error.message);
    } else {
      toast.success("Empresa criada com sucesso!");
      setNovaEmpresaOpen(false);
      setNovaEmpresaNome("");
      setNovaEmpresaSigla("");
    }
  };

  const handleExcluirEmpresa = async () => {
    if (!empresaParaExcluir) return;

    setExcluindoEmpresa(true);
    const { error } = await excluirEmpresa(empresaParaExcluir.id);
    setExcluindoEmpresa(false);

    if (error) {
      toast.error("Erro ao excluir empresa: " + error.message);
    } else {
      toast.success("Empresa excluída com sucesso!");
      setEmpresaParaExcluir(null);
    }
  };

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  // Remove section headers that have no items following them
  const visibleNav = filteredNavigation.filter((item, index) => {
    if (item.type === "section") {
      const nextItems = navigation.slice(navigation.indexOf(item) + 1);
      const sectionEndIndex = nextItems.findIndex(i => i.type === "section");
      const sectionItems = sectionEndIndex === -1 ? nextItems : nextItems.slice(0, sectionEndIndex);

      return sectionItems.some(subItem => {
        if (!subItem.permission) return true;
        return hasPermission(subItem.permission);
      });
    }
    return true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:flex-shrink-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
              LS
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Leal Sistem</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestão Empresarial</p>
            </div>
          </div>

          {/* Company Selector */}
          <div className="px-4 py-4 flex-shrink-0">
            {empresas.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-3 py-6 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                        {empresaAtiva?.sigla?.substring(0, 2) || "?"}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium truncate max-w-[120px]">
                          {empresaAtiva?.nome || "Selecionar"}
                        </p>
                        <p className="text-xs text-sidebar-foreground/60">Empresa ativa</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {empresas.map((empresa) => (
                    <div key={empresa.id} className="flex items-center group">
                      <DropdownMenuItem
                        onClick={() => setEmpresaAtiva(empresa)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                            {empresa.sigla?.substring(0, 2)}
                          </div>
                          <span>{empresa.nome}</span>
                        </div>
                      </DropdownMenuItem>
                      {isAdmin && empresas.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmpresaParaExcluir({ id: empresa.id, nome: empresa.nome });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setNovaEmpresaOpen(true)}
                    className="cursor-pointer text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar empresa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={() => setNovaEmpresaOpen(true)}
              >
                <Building2 className="h-4 w-4" />
                Criar Empresa
              </Button>
            )}
          </div>

          {/* Navigation - scrollable */}
          <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto min-h-0">
            {visibleNav.map((item, index) => {
              if (item.type === "section") {
                return (
                  <div key={index} className="pt-4 pb-2 px-3">
                    <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                      {item.name}
                    </span>
                  </div>
                );
              }
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href!}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "sidebar-item",
                    isActive && "sidebar-item-active"
                  )}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer - fixed */}
          <div className="px-4 py-4 border-t border-sidebar-border flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-sidebar-accent transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.email?.split("@")[0] || "Usuário"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Dialog Nova Empresa */}
      <Dialog open={novaEmpresaOpen} onOpenChange={setNovaEmpresaOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>Crie uma nova empresa para gerenciar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Empresa</Label>
              <Input
                id="nome"
                placeholder="Ex: Minha Empresa"
                value={novaEmpresaNome}
                onChange={(e) => setNovaEmpresaNome(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sigla">Sigla (2-3 letras)</Label>
              <Input
                id="sigla"
                placeholder="Ex: ME"
                maxLength={3}
                value={novaEmpresaSigla}
                onChange={(e) => setNovaEmpresaSigla(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaEmpresaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarEmpresa} disabled={criandoEmpresa}>
              {criandoEmpresa ? "Criando..." : "Criar Empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={!!empresaParaExcluir} onOpenChange={(open) => !open && setEmpresaParaExcluir(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir Empresa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a empresa <strong>{empresaParaExcluir?.nome}</strong>?
              Todos os dados vinculados a ela serão perdidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpresaParaExcluir(null)} disabled={excluindoEmpresa}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluirEmpresa}
              disabled={excluindoEmpresa}
            >
              {excluindoEmpresa ? "Excluindo..." : "Excluir Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
