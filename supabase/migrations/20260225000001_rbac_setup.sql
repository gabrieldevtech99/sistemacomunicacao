-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, empresa_id, permission)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions"
    ON public.user_permissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage permissions for their company"
    ON public.user_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.empresa_usuarios
            WHERE empresa_id = user_permissions.empresa_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Ensure RLS on other tables uses empresa_id check
-- This is a generic way to check if a user belongs to an empresa
CREATE OR REPLACE FUNCTION public.user_belongs_to_empresa(emp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.empresa_usuarios
        WHERE empresa_id = emp_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example of applying to an existing table (adjust as needed for all tables)
-- CREATE POLICY "Empresa based access" ON public.clientes
--     FOR ALL USING (user_belongs_to_empresa(empresa_id));
