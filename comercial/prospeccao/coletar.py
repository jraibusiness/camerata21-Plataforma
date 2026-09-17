#!/usr/bin/env python3
"""
Coleta de prospects — instituições musicais do Brasil.

Fonte: OpenStreetMap via Overpass API (dados abertos, licença ODbL).
Não usa Apify: o conector não está ativo na conta. Se ativar, esta etapa pode
ser trocada por um actor de Google Maps, que traz cobertura bem maior.

Uso:
    python3 coletar.py            # coleta e grava osm_raw.json
    python3 enriquecer.py         # visita os sites e extrai e-mails públicos
    python3 exportar.py           # gera prospects.csv já pontuado

Cuidados deliberados:
  * 1 requisição por vez, com pausa — não derruba servidor público de ninguém;
  * só endereço institucional publicado; nenhum dado de pessoa física;
  * quem for contatado recebe identificação, motivo do contato e descadastro.
"""
import json, subprocess, sys, time, os

MIRRORS = ["https://overpass.kumi.systems/api/interpreter",
           "https://overpass.private.coffee/api/interpreter",
           "https://overpass-api.de/api/interpreter"]

BOXES = [("SP-capital",-23.80,-46.85,-23.35,-46.35), ("SP-ABC-litoral",-24.30,-46.60,-23.60,-45.90),
         ("SP-campinas",-23.40,-47.60,-22.30,-46.30), ("SP-interior1",-23.20,-50.20,-21.50,-47.60),
         ("SP-interior2",-21.50,-51.50,-19.70,-47.50), ("RJ",-23.40,-44.90,-20.70,-40.90),
         ("MG",-21.50,-46.00,-18.50,-42.00), ("PR",-26.80,-54.60,-22.50,-48.00),
         ("SC",-29.40,-53.90,-25.90,-48.30), ("RS",-33.80,-57.70,-27.00,-49.60),
         ("BA-SE",-18.40,-46.70,-8.50,-37.00), ("NE",-9.50,-41.50,-2.70,-34.70),
         ("CO",-24.10,-61.70,-12.40,-45.90), ("N",-12.00,-74.00,5.30,-41.50)]

RX = "[Cc]onservat|[Ee]scola de [Mm][úu]sica|[Oo]rquestra|[Ff]ilarm|[Cc]amerata|[Ss]inf.nica"

def run(q):
    for i in range(3):
        p = subprocess.run(["curl","-s","--max-time","75",MIRRORS[i%3],
                            "--data-urlencode",f"data={q}"],capture_output=True,text=True)
        if p.stdout.lstrip().startswith("{"):
            try: return json.loads(p.stdout)["elements"]
            except Exception: pass
        time.sleep(3)
    return None

def main():
    rows, seen = [], {}
    if os.path.exists("osm_raw.json"):
        rows = json.load(open("osm_raw.json")); seen = {r["nome"].lower(): 1 for r in rows}

    def add(e, fonte):
        t = e.get("tags", {}); nm = (t.get("name") or "").strip()
        if not nm or nm.lower() in seen: return
        seen[nm.lower()] = 1
        rows.append({"nome": nm, "tipo": t.get("amenity") or t.get("office") or "",
            "cidade": t.get("addr:city",""), "uf": t.get("addr:state",""),
            "site": t.get("website") or t.get("contact:website") or "",
            "email": t.get("email") or t.get("contact:email") or "",
            "telefone": t.get("phone") or t.get("contact:phone") or t.get("contact:mobile") or "",
            "instagram": t.get("contact:instagram",""),
            "lat": e.get("lat") or (e.get("center") or {}).get("lat",""),
            "lon": e.get("lon") or (e.get("center") or {}).get("lon",""), "fonte": fonte})

    for nome, s, w, n, ee in BOXES:
        bb = f"{s},{w},{n},{ee}"
        for lab, q in (("ms", f'[out:json][timeout:70];nwr["amenity"="music_school"]({bb});out center tags;'),
                       ("sch", f'[out:json][timeout:70];(nwr["amenity"="school"]["name"~"{RX}"]({bb});'
                               f'nwr["amenity"="college"]["name"~"{RX}"]({bb});'
                               f'nwr["amenity"="arts_centre"]["name"~"{RX}"]({bb}););out center tags;')):
            r = run(q)
            if r is None:
                print(f"{nome}/{lab}: FAIL", file=sys.stderr); continue
            for e in r: add(e, f"OSM:{lab}/{nome}")
            print(f"{nome}/{lab}: {len(r)} -> {len(rows)}", file=sys.stderr)
            json.dump(rows, open("osm_raw.json","w"), ensure_ascii=False, indent=1)
            time.sleep(2)

    print(f"TOTAL {len(rows)} | site: {sum(1 for r in rows if r['site'])} "
          f"| email: {sum(1 for r in rows if r['email'])} "
          f"| tel: {sum(1 for r in rows if r['telefone'])}", file=sys.stderr)

if __name__ == "__main__":
    main()
