-- 1. Cria o bucket 'orcamentos' se ele não existir
insert into storage.buckets (id, name, public)
values ('orcamentos', 'orcamentos', true)
on conflict (id) do nothing;

-- 2. Permite acesso público para leitura dos arquivos
create policy "Acesso Público para Leitura"
on storage.objects for select
using ( bucket_id = 'orcamentos' );

-- 3. Permite que usuários autenticados façam upload de arquivos
create policy "Upload para Usuários Autenticados"
on storage.objects for insert
with check (
  bucket_id = 'orcamentos' 
  AND auth.role() = 'authenticated'
);

-- 4. Permite que usuários autenticados excluam arquivos
create policy "Exclusão para Usuários Autenticados"
on storage.objects for delete
using (
  bucket_id = 'orcamentos' 
  AND auth.role() = 'authenticated'
);
