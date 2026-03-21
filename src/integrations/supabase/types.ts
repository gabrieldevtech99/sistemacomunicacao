export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          cor: string
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_categoria"]
          updated_at: string
        }
        Insert: {
          cor?: string
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_categoria"]
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          telefone: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          fornecedor_id: string | null
          id: string
          is_despesa_fixa: boolean
          observacoes: string | null
          recorrencia: Database["public"]["Enums"]["recorrencia"] | null
          status: Database["public"]["Enums"]["status_conta"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          fornecedor_id?: string | null
          id?: string
          is_despesa_fixa?: boolean
          observacoes?: string | null
          recorrencia?: Database["public"]["Enums"]["recorrencia"] | null
          status?: Database["public"]["Enums"]["status_conta"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          fornecedor_id?: string | null
          id?: string
          is_despesa_fixa?: boolean
          observacoes?: string | null
          recorrencia?: Database["public"]["Enums"]["recorrencia"] | null
          status?: Database["public"]["Enums"]["status_conta"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          categoria_id: string | null
          cliente_id: string | null
          created_at: string
          created_by: string | null
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          observacoes: string | null
          pedido_id: string | null
          status: Database["public"]["Enums"]["status_conta"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["status_conta"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["status_conta"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_usuarios: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          sigla: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          sigla: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          sigla?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entradas: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string | null
          data: string
          descricao: string
          empresa_id: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          margem_lucro: number | null
          observacoes: string | null
          updated_at: string
          valor_custo: number
          valor_venda: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao: string
          empresa_id: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          margem_lucro?: number | null
          observacoes?: string | null
          updated_at?: string
          valor_custo?: number
          valor_venda: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          margem_lucro?: number | null
          observacoes?: string | null
          updated_at?: string
          valor_custo?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "entradas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entradas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          logradouro: string | null
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          razao_social: string
          telefone: string | null
          tipo_material: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          id?: string
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social: string
          telefone?: string | null
          tipo_material?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string
          telefone?: string | null
          tipo_material?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string
          id: string
          motivo: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_nova: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id: string
          id?: string
          motivo?: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_nova: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          id?: string
          motivo?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_anterior?: number
          quantidade_nova?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_financeiro: {
        Row: {
          ano: number
          categoria_id: string | null
          created_at: string
          empresa_id: string
          id: string
          mes: number
          updated_at: string
          valor_previsto: number
          valor_realizado: number
        }
        Insert: {
          ano: number
          categoria_id?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          mes: number
          updated_at?: string
          valor_previsto?: number
          valor_realizado?: number
        }
        Update: {
          ano?: number
          categoria_id?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          mes?: number
          updated_at?: string
          valor_previsto?: number
          valor_realizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_financeiro_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          produto_id: string | null
          quantidade: number
          unidade: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          orcamento_id: string
          produto_id?: string | null
          quantidade?: number
          unidade?: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          produto_id?: string | null
          quantidade?: number
          unidade?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          banco: string | null
          chave_pix: string | null
          cliente_id: string | null
          created_at: string
          created_by: string | null
          desconto: number
          dias_uteis: number | null
          empresa_id: string
          formas_pagamento: string | null
          garantia_servico: string | null
          id: string
          numero: number
          observacoes: string | null
          prazo_entrega: string | null
          requisitos: string | null
          status: Database["public"]["Enums"]["status_orcamento"]
          updated_at: string
          validade: string | null
          valor_final: number
          valor_total: number
          vendedor_nome: string | null
        }
        Insert: {
          banco?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          desconto?: number
          dias_uteis?: number | null
          empresa_id: string
          formas_pagamento?: string | null
          garantia_servico?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          prazo_entrega?: string | null
          requisitos?: string | null
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
          validade?: string | null
          valor_final?: number
          valor_total?: number
          vendedor_nome?: string | null
        }
        Update: {
          banco?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          desconto?: number
          dias_uteis?: number | null
          empresa_id?: string
          formas_pagamento?: string | null
          garantia_servico?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          prazo_entrega?: string | null
          requisitos?: string | null
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
          validade?: string | null
          valor_final?: number
          valor_total?: number
          vendedor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_producao: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_entrada: string
          data_entrega: string | null
          data_previsao: string | null
          empresa_id: string
          id: string
          numero: number
          observacoes: string | null
          orcamento_id: string | null
          status: Database["public"]["Enums"]["status_pedido"]
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          data_entrega?: string | null
          data_previsao?: string | null
          empresa_id: string
          id?: string
          numero?: number
          observacoes?: string | null
          orcamento_id?: string | null
          status?: Database["public"]["Enums"]["status_pedido"]
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          data_entrega?: string | null
          data_previsao?: string | null
          empresa_id?: string
          id?: string
          numero?: number
          observacoes?: string | null
          orcamento_id?: string | null
          status?: Database["public"]["Enums"]["status_pedido"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_producao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_producao_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria_id: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          quantidade: number
          quantidade_minima: number
          status: string | null
          subcategoria_id: string | null
          unidade: string
          updated_at: string
          valor_custo: number
          valor_venda: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          quantidade?: number
          quantidade_minima?: number
          status?: string | null
          subcategoria_id?: string | null
          unidade?: string
          updated_at?: string
          valor_custo?: number
          valor_venda?: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          quantidade?: number
          quantidade_minima?: number
          status?: string | null
          subcategoria_id?: string | null
          unidade?: string
          updated_at?: string
          valor_custo?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "subcategorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      saidas: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string | null
          data: string
          descricao: string
          empresa_id: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          observacoes: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao: string
          empresa_id: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "saidas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategorias: {
        Row: {
          categoria_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          categoria_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          categoria_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_empresa_role: {
        Args: {
          p_empresa_id: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      user_belongs_to_empresa: {
        Args: { p_empresa_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "usuario"
      forma_pagamento:
      | "dinheiro"
      | "pix"
      | "cartao"
      | "transferencia"
      | "boleto"
      | "outros"
      recorrencia: "mensal" | "semanal" | "quinzenal" | "anual"
      status_conta: "pendente" | "pago" | "recebido" | "vencido" | "cancelado"
      status_orcamento: "rascunho" | "enviado" | "aprovado" | "rejeitado"
      status_pedido:
      | "aguardando"
      | "em_producao"
      | "acabamento"
      | "pronto_entrega"
      | "entregue"
      tipo_categoria: "entrada" | "saida"
      tipo_pessoa: "pf" | "pj"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "usuario"],
      forma_pagamento: [
        "dinheiro",
        "pix",
        "cartao",
        "transferencia",
        "boleto",
        "outros",
      ],
      recorrencia: ["mensal", "semanal", "quinzenal", "anual"],
      status_conta: ["pendente", "pago", "recebido", "vencido", "cancelado"],
      status_orcamento: ["rascunho", "enviado", "aprovado", "rejeitado"],
      status_pedido: [
        "aguardando",
        "em_producao",
        "acabamento",
        "pronto_entrega",
        "entregue",
      ],
      tipo_categoria: ["entrada", "saida"],
      tipo_pessoa: ["pf", "pj"],
    },
  },
} as const
