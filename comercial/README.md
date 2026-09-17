# comercial/ — análise de receita e material de prospecção

Material de desenvolvimento comercial da **Opus AI**, produzido em 17/09/2026 a
partir do inventário dos cinco repositórios, do histórico de e-mail e das contas
conectadas.

| Arquivo | O que é |
|---|---|
| [`ANALISE_RENDA_RAPIDA.md`](ANALISE_RENDA_RAPIDA.md) | **Comece aqui.** Inventário de ativos, por que o caminho "PME genérica" é o pior para caixa urgente, ranking das frentes por velocidade até o dinheiro e ordem de execução das próximas 24 h |
| [`OFERTAS.md`](OFERTAS.md) | As três ofertas montadas no método Hormozi — equação de valor, stack, garantia, escassez e preço |
| [`PIPELINE_QUENTE.md`](PIPELINE_QUENTE.md) | A lista que fecha esta semana, levantada do próprio inbox. Vale mais que qualquer raspagem |
| [`emails/`](emails/) | Os três textos de abordagem, na voz do João. Já existem como rascunho no Gmail |
| [`prospeccao/`](prospeccao/) | Scripts de coleta de lista fria (OpenStreetMap), enriquecimento de e-mail e exportação pontuada |

---

## Resumo em cinco linhas

1. O caminho mais rápido para os R$ 5.000 **inteiros** é a **turma nova de
   masterclass** — produto próprio, plataforma pronta, lista quente, pagamento
   antecipado, custo marginal zero.
2. O dinheiro mais fácil já está no inbox: um **advogado parceiro** ofereceu consultoria
   paga hoje e ficou sem preço.
3. O **Raio-X de Fomento** transforma o Radar em produto repetível de R$ 1.500,
   e o **COB** é o canal que multiplica isso.
4. Lista fria de PME (capinha, manicure, contador) precisa de ~250 e-mails por
   fechamento. Não é caminho para 72 horas.
5. O padrão a corrigir: **diagnóstico de graça, execução com preço.**

---

## Prospecção — como rodar

```bash
cd comercial/prospeccao
python3 coletar.py       # OpenStreetMap -> osm_raw.json
python3 enriquecer.py    # visita os sites e extrai e-mail institucional
python3 exportar.py      # prospects.csv e prospects_com_email.csv, pontuados
```

**Apify não está conectado** nesta conta — os conectores ativos são Gmail,
Google Calendar, Google Drive e Notion; Brevo e Canva aparecem como *needs
reconnect*. Se o Apify for conectado, a etapa `coletar.py` pode ser trocada por
um actor de Google Maps, que traz cobertura bastante maior que a do OSM.
Vale reconectar o **Brevo** antes de qualquer disparo em lote — Gmail não é
ferramenta de campanha e queima a reputação do domínio.

### Regras de uso da lista

- Só endereço institucional publicado. Nenhum dado de pessoa física.
- Identificação, motivo do contato e descadastro em **toda** mensagem
  (LGPD, legítimo interesse).
- Dez e-mails escritos à mão convertem mais que duzentos disparados. O ativo
  aqui é a reputação do remetente, não o volume.
