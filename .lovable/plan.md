

# Correcao: Dados da empresa nao aparecem no PDF

## Problema

Quando voce salva as informacoes da empresa em Configuracoes (CNPJ, email, telefone, endereco), os dados sao gravados no banco de dados, mas o sistema nao atualiza essas informacoes em memoria. Quando o PDF e gerado, ele usa os dados antigos (vazios) que estavam carregados na sessao.

## Solucao

Atualizar a pagina de Configuracoes para que, apos salvar os dados da empresa, o sistema recarregue as informacoes atualizadas. Isso garantira que o PDF sempre use os dados mais recentes.

## Alteracao necessaria

**Arquivo:** `src/pages/Configuracoes.tsx`

Na funcao `handleSalvarEmpresa`, apos salvar com sucesso, chamar `refetch()` do contexto de empresa para atualizar os dados em memoria. A funcao `refetch` ja existe no contexto (`useEmpresa`) mas nao esta sendo utilizada.

