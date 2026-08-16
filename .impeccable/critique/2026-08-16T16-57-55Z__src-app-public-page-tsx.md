---
target: home pública e lacunas visuais
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-16T16-57-55Z
slug: src-app-public-page-tsx
---
# Avaliação visual — Home

## Design Health Score

| # | Heurística | Nota | Evidência principal |
|---|---|---:|---|
| 1 | Visibilidade do estado | 3 | Ações têm estados, mas navegação não tem skeleton nem estado ativo consistente. |
| 2 | Correspondência com o mundo real | 4 | A linguagem de estante, volume, capítulo e leitura é clara e própria do produto. |
| 3 | Controle e liberdade | 3 | Filtros podem ser limpos, mas faltam undo e saídas mais claras em ações secundárias. |
| 4 | Consistência e padrões | 3 | Sistema visual coeso; alguns cards e labels divergem. |
| 5 | Prevenção de erros | 2 | O destaque aceita obra sem capítulo e alguns fluxos dependem de configuração invisível. |
| 6 | Reconhecimento em vez de memória | 3 | Ações principais são visíveis, mas a quantidade de filtros compete com as obras. |
| 7 | Flexibilidade e eficiência | n/a | A home é uma superfície de experiência, não uma ferramenta de produtividade. |
| 8 | Estética e minimalismo | 3 | Identidade forte; ritmo fica esparso no desktop e longo no mobile. |
| 9 | Recuperação de erros | 2 | Mensagens existem, mas vários erros continuam genéricos e sem ação de recuperação. |
| 10 | Ajuda e documentação | n/a | Não é requisito central da home de leitura. |
| **Total** | | **23/32** | **Bom, com problemas prioritários antes de crescer.** |

## Design Specificity Verdict

A interface é reconhecivelmente uma plataforma de mangá: preto tinta, amarelo shonen, Anton, capa como protagonista e linguagem de estante. Não parece um template genérico. O detector retornou zero achados no arquivo da home. A inspeção de produção em 1440×900 e 390×844 encontrou um único H1, sem overflow horizontal, sem erros no console e imagens íntegras. A fraqueza não é identidade; é direção editorial e densidade: a primeira obra destacada não pode ser lida e os controles de catálogo ocupam mais atenção que o acervo.

## Impressão geral

A chegada é forte e tem personalidade, mas a promessa quebra no primeiro CTA: o destaque mostra “0 capítulos”. O maior ganho virá de transformar a home em uma porta imediata para leitura, simplificar a escolha no mobile e dar mais ritmo à estante.

## O que funciona

- Marca própria e memorável, com capas liderando a composição.
- Contraste, proporção das imagens e hierarquia tipográfica funcionam em desktop e mobile.
- A estrutura banner → lançamentos → catálogo é compreensível e o leitor encontra obras rapidamente.

## Problemas prioritários

1. **[P1] Destaque sem leitura disponível.** A home promove “Ninguém Faltou” com 0 capítulos, eliminando o CTA principal. Filtrar o destaque para obra com capítulo publicado e usar a primeira leitura/continuação como ação dominante.
2. **[P1] Sobrecarga de filtros e alvos pequenos no mobile.** Existem 21 gêneros mais 3 ordenações; vários alvos medem 31–39 px e o botão de busca 21×21. Mostrar gêneros principais e “Ver todos”, manter ordenação em menu e garantir 44×44 px.
3. **[P2] Card de lançamento com copy quebrada.** “CAP. · CAP. 1” duplica o prefixo e títulos ficam excessivamente truncados. Exibir obra, capítulo e data em uma hierarquia única.
4. **[P2] Ritmo esparso no desktop e longo no mobile.** Duas miniaturas deixam um grande vazio; no mobile filtros, cards e rodapé estendem a página. Ajustar largura/agrupamento das prateleiras e compactar o rodapé.
5. **[P2] Feedback de sistema incompleto.** Não existem loading.tsx/skeletons e algumas configurações aparentam funcionar mesmo quando o serviço externo está ausente. Criar estados de carregamento e esconder/desabilitar recursos indisponíveis.

## Personas

- **Jordan (primeira visita):** entende a marca, mas entra no destaque e descobre que não há capítulo; a diferença entre “Em breve” e uma obra realmente legível não conduz a próxima ação.
- **Riley (teste de estresse):** encontra catálogo sem paginação e notificação por email habilitável sem provedor; os estados prometem mais do que a operação entrega.
- **Casey (mobile):** enfrenta 24 opções de filtro, alvos menores que 44 px e uma página muito longa antes do rodapé; isso dificulta uso com uma mão.

## Observações menores

- A busca não oferece sugestão, autocomplete ou tolerância a erro de digitação.
- Falta estado ativo claro na navegação superior.
- O final da home não oferece uma próxima ação forte, como “Continuar lendo” ou “Ver lançamento”.

## Perguntas

- A home deve priorizar sempre uma leitura disponível ou também divulgar obras futuras?
- O próximo ciclo deve otimizar primeiro aquisição/leitura, experiência mobile ou ferramentas do autor?
