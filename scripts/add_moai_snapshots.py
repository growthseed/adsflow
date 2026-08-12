"""
Adiciona MOAI nos 3 snapshots JSON consumidos pela view 'Hoje' do AdsFlow.
- clickup-snapshot.json: lista de clientes (overdue/urgent/tasks)
- performance-snapshot.json: agregado de mídia (spend/leads/conversões)
- meta-ads-snapshot.json: detalhe Meta Ads
Não destrói nada — só insere a entry MOAI se ainda não existir.
"""
import json
import os

BASE = r"C:\Users\EFEITO DIGITAL\Ad Flow\src\data\snapshots"


def load(name):
    with open(os.path.join(BASE, name), "r", encoding="utf-8") as f:
        return json.load(f)


def save(name, data):
    with open(os.path.join(BASE, name), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ============= 1) CLICKUP SNAPSHOT =============
cu = load("clickup-snapshot.json")
slugs = {c.get("slug") for c in cu.get("clients", [])}
if "moai" not in slugs:
    moai_cu = {
        "slug": "moai",
        "name": "MOAI",
        "short_name": "MO",
        "clickup_folder_id": None,
        "clickup_folder_name": "MOAI — Vinícius Postai",
        "avatar_gradient": "from-amber-500 to-orange-600",
        "industry": "Mentoria / Consultoria B2B",
        "city": "Brasília, DF",
        "task_count": 0,
        "stats": {
            "urgent": 0,
            "in_progress": 0,
            "review": 0,
            "upcoming": 0,
            "backlog": 0,
            "done": 0,
            "overdue": 0,
            "total_active": 0,
        },
        "upcoming_tasks": [],
        "all_tasks": [],
        "last_synced_at": "2026-05-21T20:00:00Z",
        "clickup_url": None,
    }
    cu["clients"].append(moai_cu)
    save("clickup-snapshot.json", cu)
    print(f"[OK] MOAI adicionado em clickup-snapshot.json (total {len(cu['clients'])} clientes)")
else:
    print("[SKIP] MOAI já existe em clickup-snapshot.json")


# ============= 2) PERFORMANCE SNAPSHOT =============
perf = load("performance-snapshot.json")
if "moai" not in perf.get("clients", {}):
    moai_perf = {
        "client_slug": "moai",
        "client_name": "MOAI",
        "period": {
            "from": "2026-05-01",
            "to": "2026-05-20",
            "label": "Maio 2026 (1-20)",
        },
        "platforms": {
            "meta_ads": {
                "platform": "meta_ads",
                "account_id": "act_394842817764673",
                "account_name": "[CA] Moai_ContaPrincipal",
                "currency": "BRL",
                "timezone": "America/Sao_Paulo",
                "connected": True,
                "last_synced_at": "2026-05-21T20:00:00Z",
                "summary": {
                    "impressions": 45277,
                    "clicks": 343,
                    "spend": 1844.97,
                    "conversions": 33,
                    "conversion_value": 0,
                    "ctr": 0.0115,
                    "cpc": 5.38,
                    "cpm": 40.75,
                    "cost_per_conversion": 55.91,
                    "roas": 0,
                    "reach": 15605,
                    "frequency": 2.90,
                    "active_campaigns": 3,
                    "total_campaigns": 196,
                },
                "campaigns": [
                    {
                        "name": "PH [19/05] LEADS CBO MASTERCLASS ALAV",
                        "status": "active",
                        "spend": 584.78,
                        "impressions": 17235,
                        "clicks": 118,
                        "conversions": 7,
                    },
                    {
                        "name": "PH [13/05] LEADS ABO MASTERCLASS ALAV",
                        "status": "paused",
                        "spend": 1316.22,
                        "impressions": 30240,
                        "clicks": 275,
                        "conversions": 27,
                    },
                ],
                "daily": [],
            },
        },
        "blended": {
            "total_spend": 1844.97,
            "total_impressions": 45277,
            "total_clicks": 343,
            "total_conversions": 33,
            "total_reach": 15605,
            "avg_ctr": 0.0115,
            "avg_cpc": 5.38,
            "avg_cpm": 40.75,
            "cost_per_conversion": 55.91,
            "roas": 0,
        },
        "last_synced_at": "2026-05-21T20:00:00Z",
    }
    perf["clients"]["moai"] = moai_perf
    save("performance-snapshot.json", perf)
    print(f"[OK] MOAI adicionado em performance-snapshot.json (total {len(perf['clients'])} clientes)")
else:
    print("[SKIP] MOAI já existe em performance-snapshot.json")


# ============= 3) META ADS SNAPSHOT =============
meta = load("meta-ads-snapshot.json")
print(f"meta-ads-snapshot top-level keys: {list(meta.keys())}")
# Identify shape
if "clients" in meta:
    if isinstance(meta["clients"], dict):
        if "moai" not in meta["clients"]:
            # use same shape as performance.meta_ads
            moai_meta = perf["clients"]["moai"]["platforms"]["meta_ads"].copy()
            moai_meta["client_slug"] = "moai"
            moai_meta["client_name"] = "MOAI"
            meta["clients"]["moai"] = moai_meta
            save("meta-ads-snapshot.json", meta)
            print(f"[OK] MOAI adicionado em meta-ads-snapshot.json (dict, total {len(meta['clients'])})")
        else:
            print("[SKIP] MOAI já existe em meta-ads-snapshot.json")
    elif isinstance(meta["clients"], list):
        existing = {c.get("slug") or c.get("client_slug") for c in meta["clients"]}
        if "moai" not in existing:
            moai_meta = perf["clients"]["moai"]["platforms"]["meta_ads"].copy()
            moai_meta["client_slug"] = "moai"
            moai_meta["client_name"] = "MOAI"
            meta["clients"].append(moai_meta)
            save("meta-ads-snapshot.json", meta)
            print(f"[OK] MOAI adicionado em meta-ads-snapshot.json (list, total {len(meta['clients'])})")
        else:
            print("[SKIP] MOAI já existe em meta-ads-snapshot.json")
else:
    print("[?] meta-ads-snapshot.json sem chave 'clients' — não modificado")
