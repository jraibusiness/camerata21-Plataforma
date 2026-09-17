# Resultado da coleta — 17/09/2026, e o que aprendemos com ela

## O que saiu

| Métrica | Valor |
|---|---|
| Instituições coletadas | **43** |
| Com e-mail institucional | 6 |
| Com telefone | 16 |
| Com site | 7 |

Cobertura: São Paulo capital, ABC/litoral e Campinas. As demais regiões
falharam na coleta.

**O CSV não fica neste repositório.** Lista de contato versionada em Git é
receita de vazamento e de dor de cabeça com LGPD — os arquivos `osm_raw.json`,
`prospects.csv` e `prospects_com_email.csv` estão no `.gitignore`. Rode os
scripts para gerá-los quando precisar.

## Por que saiu pouco — sem enfeite

1. **Os espelhos da Overpass API caíram na maior parte das consultas** (HTTP 504,
   "server is probably too busy"). Das 28 consultas planejadas, a maioria voltou
   vazia. Rodar de novo, em outro horário, deve render bem mais — o script
   retoma de onde parou e não repete o que já coletou.
2. **O OpenStreetMap é raso no Brasil para esta categoria.** A etiqueta
   `amenity=music_school` existe e é usada, mas cobre uma fração do que há na
   rua, e e-mail é o campo menos preenchido de todos.

## O caminho melhor, que ficou mapeado

O **Portal Brasileiro de Dados Abertos** publica o conjunto
[`orquestras-brasileiras`](https://dados.gov.br/dados/conjuntos-dados/orquestras-brasileiras),
da Funarte: **371 orquestras em território nacional, com telefone e site**.

É exatamente o público do Raio-X de Fomento, com a vantagem de ser dado oficial
e atualizado.

**Só que a API do portal agora exige chave** — todas as chamadas voltaram HTTP
401. A chave é gratuita e sai em minutos no cadastro do próprio portal. Com ela
na mão, `coletar.py` ganha uma função a mais e o problema de lista fria está
resolvido de uma vez, com qualidade muito acima do OSM.

Vale olhar também o **SINOS — Sistema Nacional de Orquestras Sociais**, da
Funarte, que cadastra as orquestras sociais do país.

## Se o Apify for conectado

Não está conectado nesta conta. Se for, um actor de Google Maps sobre
`escola de música`, `conservatório` e `orquestra` por município cobre muito mais
que qualquer uma das fontes acima. Aí `coletar.py` vira só o normalizador.

## E a conclusão que não muda

Mesmo com a lista cheia, ela continua sendo **combustível da semana 2**.
Trezentos e setenta e um telefones não põem R$ 5.000 na conta hoje. O que põe
está em `../PIPELINE_QUENTE.md` — e cabe em quatro e-mails.
