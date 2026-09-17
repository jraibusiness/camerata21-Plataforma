#!/usr/bin/env python3
"""Visita o site de cada instituição e extrai o e-mail institucional publicado.

Só páginas públicas, uma por vez, com pausa. Nada de burlar bloqueio: se o site
responder 403 ou 429, o registro fica sem e-mail e segue o baile.
"""
import json, re, subprocess, time, sys

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
LIXO  = ("example.com","sentry.io","wixpress.com","@2x","godaddy","@sentry",
         "domain.com","email.com","seuemail","yourname","wordpress")

def buscar(url):
    if not url.startswith("http"): url = "https://" + url
    out = []
    for caminho in ("", "/contato", "/contato/", "/fale-conosco", "/sobre"):
        p = subprocess.run(["curl","-sL","--max-time","20","-A",
                            "Mozilla/5.0 (compatible; OpusAI-prospect/1.0)", url.rstrip("/")+caminho],
                           capture_output=True, text=True, errors="ignore")
        for m in EMAIL.findall(p.stdout or ""):
            m = m.lower().strip(".")
            if len(m) < 60 and not any(x in m for x in LIXO):
                out.append(m)
        if out: break
        time.sleep(1)
    # preferir endereço do próprio domínio
    dom = url.split("//")[-1].split("/")[0].replace("www.","")
    proprios = [e for e in out if dom.split(".")[0] in e]
    escolha = proprios or out
    return sorted(set(escolha))[:3]

def main():
    rows = json.load(open("osm_raw.json"))
    alvos = [r for r in rows if r["site"] and not r["email"]]
    print(f"{len(alvos)} sites a visitar", file=sys.stderr)
    for i, r in enumerate(alvos, 1):
        try:
            achados = buscar(r["site"])
        except Exception:
            achados = []
        if achados:
            r["email"] = achados[0]
            r["emails_extras"] = "; ".join(achados[1:])
            r["fonte"] += "+site"
        print(f"[{i}/{len(alvos)}] {r['nome'][:44]:44} -> {r['email'] or '—'}", file=sys.stderr)
        if i % 10 == 0:
            json.dump(rows, open("osm_raw.json","w"), ensure_ascii=False, indent=1)
        time.sleep(1.5)
    json.dump(rows, open("osm_raw.json","w"), ensure_ascii=False, indent=1)
    print("com e-mail:", sum(1 for r in rows if r["email"]), file=sys.stderr)

if __name__ == "__main__":
    main()
