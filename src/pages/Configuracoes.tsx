import { useState, useEffect } from "react";
import { Building2, Users, Bell, Shield, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions, PERMISSION_OPTIONS, Permission } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EmpresaUsuario {
  id: string;
  user_id: string;
  role: string;
  profile?: { nome: string; email: string };
  permissions: string[];
}

export default function Configuracoes() {
  const { empresaAtiva, empresas, refetch } = useEmpresa();
  const { user } = useAuth();
  const { isAdmin } = useUserPermissions();

  // Empresa form
  const [empresaForm, setEmpresaForm] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
  });
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

  // Users
  const [usuarios, setUsuarios] = useState<EmpresaUsuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    nome: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<EmpresaUsuario | null>(null);
  const [excluindoUsuario, setExcluindoUsuario] = useState(false);

  useEffect(() => {
    if (empresaAtiva) {
      setEmpresaForm({
        nome: empresaAtiva.nome || "",
        cnpj: empresaAtiva.cnpj || "",
        email: empresaAtiva.email || "",
        telefone: empresaAtiva.telefone || "",
        endereco: empresaAtiva.endereco || "",
      });
      loadUsuarios();
    }
  }, [empresaAtiva]);

  const loadUsuarios = async () => {
    if (!empresaAtiva) return;
    setLoadingUsers(true);
    try {
      const { data: euData, error: euError } = await supabase
        .from("empresa_usuarios")
        .select("id, user_id, role")
        .eq("empresa_id", empresaAtiva.id);

      if (euError) throw euError;
      if (!euData || euData.length === 0) {
        setUsuarios([]);
        return;
      }

      const userIds = euData.map(eu => eu.user_id);

      // Fetch all profiles in one go
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds);

      if (profilesError) {
        console.warn("Aviso ao buscar perfis:", profilesError);
      }

      // Fetch all permissions in one go
      const { data: permsData, error: permsError } = await supabase
        .from("user_permissions")
        .select("user_id, permission")
        .eq("empresa_id", empresaAtiva.id)
        .in("user_id", userIds);

      if (permsError) {
        console.warn("Aviso ao buscar permissões:", permsError);
      }

      const usersWithProfiles = euData.map(eu => {
        const profile = profilesData?.find(p => p.id === eu.user_id);
        const userPerms = permsData?.filter(p => p.user_id === eu.user_id).map(p => p.permission) || [];

        return {
          ...eu,
          profile: profile || undefined,
          permissions: userPerms,
        };
      });

      setUsuarios(usersWithProfiles);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar lista de usuários: " + error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSalvarEmpresa = async () => {
    if (!empresaAtiva || !isAdmin) return;
    setSalvandoEmpresa(true);
    try {
      const { error } = await supabase
        .from("empresas")
        .update(empresaForm)
        .eq("id", empresaAtiva.id);
      if (error) throw error;
      await refetch();
      toast.success("Empresa atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar empresa: " + error.message);
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  const handleCriarUsuario = async () => {
    if (!empresaAtiva) return;
    if (!newUserForm.email || !newUserForm.password || !newUserForm.nome) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setCriandoUsuario(true);
    try {
      // Fallback: Criar usuário diretamente via Auth
      // Usamos um cliente temporário para não desconectar o admin logado
      const { createClient } = await import("@supabase/supabase-js");
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            nome: newUserForm.nome,
            is_invited: true,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário: Sem dados retorno");

      // Vincular usuário à empresa ativa
      const { error: linkError } = await supabase
        .from("empresa_usuarios")
        .insert({
          empresa_id: empresaAtiva.id,
          user_id: authData.user.id,
          role: "usuario",
        });

      if (linkError) {
        console.error("Erro ao vincular empresa:", linkError);
        toast.error("Erro crítico ao vincular usuário à empresa: " + linkError.message);
        throw linkError;
      }

      // Tentar salvar permissões
      if (selectedPermissions.length > 0) {
        const permRows = selectedPermissions.map((perm) => ({
          empresa_id: empresaAtiva.id,
          user_id: authData.user.id,
          permission: perm,
        }));

        const { error: permError } = await supabase
          .from("user_permissions")
          .insert(permRows);

        if (permError) {
          console.error("Erro ao salvar permissões:", permError);
          toast.error(`Usuário criado e vinculado, mas erro ao salvar permissões: ${permError.message}`);
        }
      }

      toast.success("Usuário criado com sucesso!");
      setAddUserOpen(false);
      setNewUserForm({ email: "", password: "", nome: "" });
      setSelectedPermissions([]);
      await loadUsuarios();
    } catch (error: any) {
      console.error("Erro geral no processo:", error);
      toast.error("Processo falhou: " + error.message);
    } finally {
      setCriandoUsuario(false);
    }
  };

  const togglePermission = (perm: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleExcluirUsuario = async () => {
    if (!usuarioParaExcluir || !empresaAtiva) return;
    setExcluindoUsuario(true);
    try {
      // Remover permissões
      await supabase
        .from("user_permissions")
        .delete()
        .eq("empresa_id", empresaAtiva.id)
        .eq("user_id", usuarioParaExcluir.user_id);

      // Remover vínculo com a empresa
      const { error } = await supabase
        .from("empresa_usuarios")
        .delete()
        .eq("id", usuarioParaExcluir.id);

      if (error) throw error;

      toast.success("Usuário removido com sucesso!");
      setUsuarioParaExcluir(null);
      await loadUsuarios();
    } catch (error: any) {
      toast.error("Erro ao remover usuário: " + error.message);
    } finally {
      setExcluindoUsuario(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Configure os dados principais da empresa ativa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Empresa</Label>
                    <Input
                      id="nome"
                      value={empresaForm.nome}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={empresaForm.cnpj}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, cnpj: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      value={empresaForm.email}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={empresaForm.telefone}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, telefone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro, cidade - UF"
                    value={empresaForm.endereco}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, endereco: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSalvarEmpresa} disabled={salvandoEmpresa}>
                    {salvandoEmpresa && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>Adicione e gerencie os usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  usuarios.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                          {(u.profile?.nome || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.profile?.nome || "Usuário"}</p>
                          <p className="text-sm text-muted-foreground">{u.profile?.email || ""}</p>
                          {u.permissions.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Acesso: {u.permissions.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                          {u.role === "admin" ? "Administrador" : "Usuário"}
                        </span>
                        {isAdmin && u.user_id !== user?.id && u.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setUsuarioParaExcluir(u)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isAdmin && (
                  <Button variant="outline" className="w-full" onClick={() => setAddUserOpen(true)}>
                    + Adicionar Novo Usuário
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>Configure como você deseja receber alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Estoque Baixo</p>
                  <p className="text-sm text-muted-foreground">Receber notificações quando o estoque atingir o mínimo</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resumo Diário</p>
                  <p className="text-sm text-muted-foreground">Receber um resumo das movimentações do dia</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Pagamentos</p>
                  <p className="text-sm text-muted-foreground">Notificar sobre contas a pagar e receber</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Alterar Senha</h4>
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="senha-atual">Senha Atual</Label>
                    <Input id="senha-atual" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nova-senha">Nova Senha</Label>
                    <Input id="nova-senha" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                    <Input id="confirmar-senha" type="password" />
                  </div>
                  <Button className="w-fit">Alterar Senha</Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação de Dois Fatores</p>
                  <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Adicionar Usuário */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário e defina suas permissões de acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome do usuário"
                value={newUserForm.nome}
                onChange={(e) => setNewUserForm({ ...newUserForm, nome: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </div>
            <Separator />
            <div className="grid gap-3">
              <Label className="text-base font-semibold">Permissões de Acesso</Label>
              <p className="text-sm text-muted-foreground">Selecione os módulos que o usuário terá acesso:</p>
              {PERMISSION_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={opt.value}
                    checked={selectedPermissions.includes(opt.value)}
                    onCheckedChange={() => togglePermission(opt.value)}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <label htmlFor={opt.value} className="text-sm font-medium cursor-pointer">
                      {opt.label}
                    </label>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarUsuario} disabled={criandoUsuario}>
              {criandoUsuario && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão de Usuário */}
      <Dialog open={!!usuarioParaExcluir} onOpenChange={(open) => !open && setUsuarioParaExcluir(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{usuarioParaExcluir?.profile?.nome || "este usuário"}</strong> da empresa?
              O usuário perderá todo o acesso a esta empresa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuarioParaExcluir(null)} disabled={excluindoUsuario}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluirUsuario}
              disabled={excluindoUsuario}
            >
              {excluindoUsuario && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
