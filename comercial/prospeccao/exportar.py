#!/usr/bin/env python3
"""Pontua e exporta prospects.csv — ordenado por quem vale abordar primeiro.

Pontuação: quem tem canal de contato direto e cara de instituição com
processo seletivo (logo, quem compra 'Matrícula Sem Papel') sobe.
"""
import json, csv, re

def pontuar(r):
    p, por = 0, []
    if r.get("email"):    p += 40; por.append("e-mail direto")
    if r.get("telefone"): p += 15; por.append("telefone")
    if r.get("site"):     p += 10; por.append("site")
    n = r["nome"].lower()
    if "conservat" in n:                     p += 25; por.append("conservatório: processo seletivo com taxa")
    if "escola de m" in n or r["tipo"]=="music_school": p += 20; por.append("escola: matrícula recorrente")
    if "orquestra" in n or "filarm" in n or "sinf" in n: p += 20; por.append("orquestra: fomento e folha de extras")
    if "municipal" in n or "prefeitura" in n: p -= 10; por.append("público: ciclo de empenho mais lento")
    if "faculdade" in n or "universidade" in n: p += 5
    return p, "; ".join(por)

def oferta(r):
    n = r["nome"].lower()
    if "orquestra" in n or "filarm" in n or "sinf" in n or "camerata" in n:
        return "Raio-X de Fomento (R$ 1.500)"
    if "conservat" in n:
        return "Matrícula Sem Papel (R$ 5.900)"
    return "Matrícula Sem Papel (R$ 5.900)"

rows = json.load(open("osm_raw.json"))
for r in rows:
    r["score"], r["por_que"] = pontuar(r)
    r["oferta_indicada"] = oferta(r)
    r["contato"] = r.get("email") or r.get("telefone") or r.get("site") or ""
rows.sort(key=lambda r: -r["score"])

cols = ["score","nome","tipo","cidade","uf","email","emails_extras","telefone","site",
        "instagram","oferta_indicada","por_que","lat","lon","fonte"]
with open("prospects.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader()
    for r in rows: w.writerow(r)

com_email = [r for r in rows if r.get("email")]
with open("prospects_com_email.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader()
    for r in com_email: w.writerow(r)

print(f"prospects.csv: {len(rows)} | prospects_com_email.csv: {len(com_email)}")
