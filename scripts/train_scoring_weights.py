#!/usr/bin/env python3
"""
train_scoring_weights.py
========================
Treina modelos de regressão por classe de unidade (Ridge linear e GBM).
Seleciona automaticamente o modelo com menor erro e exporta arquivos TypeScript.

Meta: LOO/CV-MAE ≤ 2 pts por classe.

Dependências:
    pip install scikit-learn numpy requests

Uso:
    python scripts/train_scoring_weights.py --api-url http://localhost:8080
    python scripts/train_scoring_weights.py --api-url http://localhost:8080 --gbm-only
    python scripts/train_scoring_weights.py --load-json data/units.json --api-url http://x
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

import numpy as np
import requests
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import RidgeCV
from sklearn.model_selection import KFold, LeaveOneOut, cross_val_predict
from sklearn.preprocessing import StandardScaler

# ─────────────────────────────────────────────────────────────────────────────
# Extração de features — espelha computeScore.ts exatamente
# ─────────────────────────────────────────────────────────────────────────────

SLOTS: list[str] = [
    "primaryEquipColorMeaningId",
    "secondaryEquipColorMeaningId",
    "movementEquipColorMeaningId",
    "attackEquipColorMeaningId",
    "defenseEquipColorMeaningId",
]

BASE_FEAT: list[str] = [
    "health", "maxSpeed", "ventCapacity", "maxAttack", "maxDefense", "maxDamage", "isUnique",
    "avgPrimary", "avgSecondary", "avgMovement", "avgAttack", "avgDefense",
    "peakPrimary", "peakSecondary", "peakAttack",
    "sumAttack", "sumDefense", "sumMovement",
    "degradationAttack", "degradationDefense", "degradationMovement",
    "totalPrimaryHeatPenalty", "totalSecondaryHeatPenalty",
    "totalMovementHeatPenalty", "totalHeatPenalty",
    "maxTargetCount", "maxMaxRange", "avgMinRange", "avgMaxRange",
    "hasBallistic", "hasEnergetic", "hasMelee",
]


def _slugify(meaning: str) -> str:
    nfd = unicodedata.normalize("NFD", meaning)
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "_", stripped.lower()).strip("_")
    return f"equip__{slug}"


def _f(v: Any) -> float:
    return float(v) if v is not None else 0.0


def extract_features(unit: dict, cm_map: dict[str, dict]) -> dict[str, float] | None:
    dial = unit.get("combatDial") or []
    heat = unit.get("heatDial") or []
    attacks = unit.get("attackStats") or []
    n = len(dial)
    if n == 0:
        return None

    sw = lambda i: (n - i) / n

    prim = [_f(d.get("primaryValue")) for d in dial]
    sec  = [_f(d.get("secondaryValue")) for d in dial]
    mov  = [_f(d.get("movementValue")) for d in dial]
    defv = [_f(d.get("defenseValue")) for d in dial]
    atk  = [_f(d.get("attackValue")) for d in dial]

    def avg(xs: list[float]) -> float:
        return sum(xs) / len(xs) if xs else 0.0

    def deg(last_v: Any, first_v: Any) -> float:
        fv = _f(first_v)
        return _f(last_v) / fv if fv else 0.0

    first, last = dial[0], dial[-1]

    # Equipment step-weighted dummies
    equip: dict[str, float] = {}
    for i, row in enumerate(dial):
        sw_i = sw(i)
        seen: set[str] = set()
        for slot in SLOTS:
            mid = row.get(slot)
            if mid and mid in cm_map and cm_map[mid].get("usageType") == "equipment":
                slug = _slugify(cm_map[mid]["meaning"])
                if slug not in seen:
                    equip[slug] = equip.get(slug, 0.0) + sw_i
                    seen.add(slug)

    ph = sum(_f(h.get("primaryHeatValue")) for h in heat)
    sh = sum(_f(h.get("secondaryHeatValue")) for h in heat)
    mh = sum(_f(h.get("movementHeatValue")) for h in heat)

    dtypes    = [a.get("damageType", "").lower() for a in attacks]
    maxr      = [_f(a.get("maxRange")) for a in attacks]
    minr      = [_f(a.get("minRange")) for a in attacks]
    targets   = [_f(a.get("targetCount")) for a in attacks]

    base: dict[str, float] = {
        "health":       _f(unit.get("health")),
        "maxSpeed":     _f(unit.get("maxSpeed")),
        "ventCapacity": _f(unit.get("ventCapacity")),
        "maxAttack":    _f(unit.get("maxAttack")),
        "maxDefense":   _f(unit.get("maxDefense")),
        "maxDamage":    _f(unit.get("maxDamage")),
        "isUnique":     1.0 if unit.get("isUnique") else 0.0,
        "avgPrimary":   avg(prim),
        "avgSecondary": avg(sec),
        "avgMovement":  avg(mov),
        "avgAttack":    avg(atk),
        "avgDefense":   avg(defv),
        "peakPrimary":   _f(first.get("primaryValue")),
        "peakSecondary": _f(first.get("secondaryValue")),
        "peakAttack":    _f(first.get("attackValue")),
        "sumAttack":   sum(atk),
        "sumDefense":  sum(defv),
        "sumMovement": sum(mov),
        "degradationAttack":   deg(last.get("attackValue"),   first.get("attackValue")),
        "degradationDefense":  deg(last.get("defenseValue"),  first.get("defenseValue")),
        "degradationMovement": deg(last.get("movementValue"), first.get("movementValue")),
        "totalPrimaryHeatPenalty":   ph,
        "totalSecondaryHeatPenalty": sh,
        "totalMovementHeatPenalty":  mh,
        "totalHeatPenalty":          ph + sh + mh,
        "maxTargetCount": max(targets) if targets else 0.0,
        "maxMaxRange":    max(maxr)    if maxr    else 0.0,
        "avgMinRange":    avg(minr),
        "avgMaxRange":    avg(maxr),
        "hasBallistic": 1.0 if "ballistic" in dtypes else 0.0,
        "hasEnergetic": 1.0 if "energetic" in dtypes else 0.0,
        "hasMelee":     1.0 if "melee"     in dtypes else 0.0,
    }
    return {**base, **equip}


def class_key(unit: dict) -> str:
    utype  = (unit.get("type") or "").capitalize()
    uclass = unit.get("class") or "NA"
    if utype == "Vehicle":  return "NA_Vehicle"
    if utype == "Infantry": return "NA_Infantry"
    return f"{uclass}_Mech"


# ─────────────────────────────────────────────────────────────────────────────
# Nomes de exportação TypeScript
# ─────────────────────────────────────────────────────────────────────────────

EXPORT_META: dict[str, tuple[str, str]] = {
    "Light_Mech":   ("LIGHT_MECH_SCORING_WEIGHTS",   "Light_MechScoringWeights"),
    "Medium_Mech":  ("MEDIUM_MECH_SCORING_WEIGHTS",  "Medium_MechScoringWeights"),
    "Heavy_Mech":   ("HEAVY_MECH_SCORING_WEIGHTS",   "Heavy_MechScoringWeights"),
    "Assault_Mech": ("ASSAULT_MECH_SCORING_WEIGHTS", "Assault_MechScoringWeights"),
    "NA_Vehicle":   ("NA_VEHICLE_SCORING_WEIGHTS",   "NA_VehicleScoringWeights"),
    "NA_Infantry":  ("NA_INFANTRY_SCORING_WEIGHTS",  "NA_infantryScoringWeights"),
}

# ─────────────────────────────────────────────────────────────────────────────
# API
# ─────────────────────────────────────────────────────────────────────────────

def fetch_units(api_url: str) -> list[dict]:
    """Busca todas as unidades com paginação."""
    units: list[dict] = []
    page = 1
    while True:
        r = requests.get(
            f"{api_url.rstrip('/')}/units",
            params={"page": page, "limit": 100},
            timeout=30,
        )
        r.raise_for_status()
        payload = r.json()
        batch = payload.get("data") or payload
        if not isinstance(batch, list) or not batch:
            break
        units.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return units


def fetch_color_meanings(api_url: str) -> dict[str, dict]:
    r = requests.get(f"{api_url.rstrip('/')}/color-meanings", timeout=30)
    r.raise_for_status()
    payload = r.json()
    items = payload.get("data") or payload
    return {item["id"]: item for item in items}


# ─────────────────────────────────────────────────────────────────────────────
# Construção da matriz de features
# ─────────────────────────────────────────────────────────────────────────────

def build_matrix(
    units: list[dict],
    cm_map: dict[str, dict],
    feat_names: list[str] | None = None,
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    rows: list[dict[str, float]] = []
    targets: list[float] = []

    for u in units:
        pts = u.get("points")
        if pts is None:
            continue
        f = extract_features(u, cm_map)
        if f is None:
            continue
        rows.append(f)
        targets.append(float(pts))

    if not rows:
        return np.empty((0, 0)), np.empty(0), feat_names or []

    if feat_names is None:
        equip_names = sorted({k for row in rows for k in row if k.startswith("equip__")})
        feat_names = BASE_FEAT + equip_names

    X = np.array([[row.get(fn, 0.0) for fn in feat_names] for row in rows], dtype=float)
    y = np.array(targets, dtype=float)
    return X, y, feat_names


# ─────────────────────────────────────────────────────────────────────────────
# Treino Ridge (LOO)
# ─────────────────────────────────────────────────────────────────────────────

def train_ridge(
    X: np.ndarray,
    y: np.ndarray,
    feat_names: list[str],
) -> dict:
    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)
    alphas = np.logspace(-3, 6, 200)

    loo = LeaveOneOut()
    ridge_cv = RidgeCV(alphas=alphas, fit_intercept=True)
    y_pred = cross_val_predict(ridge_cv, X_s, y, cv=loo)
    loo_mae = float(np.mean(np.abs(y_pred - y)))
    loo_max = float(np.max(np.abs(y_pred - y)))

    ridge_cv.fit(X_s, y)
    w_unscaled = ridge_cv.coef_ / scaler.scale_
    bias = float(ridge_cv.intercept_ - np.dot(ridge_cv.coef_, scaler.mean_ / scaler.scale_))

    weights = {
        feat_names[i]: round(float(w_unscaled[i]), 4)
        for i in range(len(feat_names))
        if abs(w_unscaled[i]) > 1e-6
    }

    return {
        "model": "ridge",
        "loo_mae": loo_mae,
        "loo_max": loo_max,
        "bias": round(bias, 4),
        "weights": weights,
        "feat_names": feat_names,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Treino GBM (K-fold porque LOO com GBM seria muito lento)
# ─────────────────────────────────────────────────────────────────────────────

def train_gbm(
    X: np.ndarray,
    y: np.ndarray,
    feat_names: list[str],
    n_splits: int = 5,
) -> dict:
    n = len(y)
    # Hiper-parâmetros conservadores para evitar overfitting em datasets pequenos
    gbm = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=max(2, n // 30),
        random_state=42,
    )

    cv = KFold(n_splits=min(n_splits, n), shuffle=True, random_state=42)
    y_pred = cross_val_predict(gbm, X, y, cv=cv)
    cv_mae = float(np.mean(np.abs(y_pred - y)))
    cv_max = float(np.max(np.abs(y_pred - y)))

    # Treina no dataset completo para exportação
    gbm.fit(X, y)

    return {
        "model": "gbm",
        "cv_mae": cv_mae,
        "cv_max": cv_max,
        "fitted": gbm,
        "feat_names": feat_names,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Exportação TypeScript
# ─────────────────────────────────────────────────────────────────────────────

def _ts_num(v: float) -> str:
    """Formata número para TypeScript (sem trailing zeros desnecessários)."""
    s = f"{v:.6f}".rstrip("0").rstrip(".")
    return s if s else "0"


def export_linear_ts(key: str, n: int, result: dict, out_dir: Path) -> None:
    const_name, file_stem = EXPORT_META[key]
    mae = result["loo_mae"]
    bias = result["bias"]
    weights = result["weights"]

    lines: list[str] = [
        "// Auto-generated by train_scoring_weights.py",
        f"// Class: {key} | n={n} | model=Ridge | LOO-MAE: {mae:.2f} pts",
        f"export const {const_name} = {{",
        "  type: 'linear' as const,",
        f"  bias: {_ts_num(bias)},",
        "  weights: {",
    ]
    for feat, w in sorted(weights.items(), key=lambda kv: -abs(kv[1])):
        lines.append(f"    {json.dumps(feat)}: {_ts_num(w)},")
    lines += ["  },", "} as const", ""]

    (out_dir / f"{file_stem}.ts").write_text("\n".join(lines), encoding="utf-8")


def _serialize_tree(est_list) -> dict:
    """Serializa uma árvore sklearn para dict compacto."""
    dt = est_list[0]  # GBM embrulha cada árvore em lista
    t = dt.tree_
    return {
        "cl": t.children_left.tolist(),
        "cr": t.children_right.tolist(),
        "fi": t.feature.tolist(),
        "th": [round(float(v), 6) for v in t.threshold.tolist()],
        "va": [round(float(v[0][0]), 4) for v in t.value.tolist()],
    }


def export_gbm_ts(key: str, n: int, result: dict, out_dir: Path) -> None:
    const_name, file_stem = EXPORT_META[key]
    gbm: GradientBoostingRegressor = result["fitted"]
    feat_names: list[str] = result["feat_names"]
    mae = result["cv_mae"]

    trees_data = [_serialize_tree(est) for est in gbm.estimators_]

    # init_.constant_ é a previsão inicial (média dos targets)
    init_pred = round(float(gbm.init_.constant_[0][0]), 4)

    lines: list[str] = [
        "// Auto-generated by train_scoring_weights.py",
        f"// Class: {key} | n={n} | model=GBM | CV-MAE: {mae:.2f} pts",
        f"import type {{ GBMWeights }} from './types'",
        f"export const {const_name}: GBMWeights = {{",
        "  type: 'gbm',",
        f"  initPrediction: {init_pred},",
        f"  learningRate: {gbm.learning_rate},",
        f"  featureNames: {json.dumps(feat_names)},",
        f"  trees: {json.dumps(trees_data)},",
        "}",
        "",
    ]

    (out_dir / f"{file_stem}.ts").write_text("\n".join(lines), encoding="utf-8")


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline por classe
# ─────────────────────────────────────────────────────────────────────────────

TARGET_MAE = 2.0


def train_class(
    key: str,
    units: list[dict],
    cm_map: dict[str, dict],
    out_dir: Path,
    gbm_only: bool = False,
) -> dict:
    X, y, feat_names = build_matrix(units, cm_map)
    n = len(y)
    print(f"\n{'═' * 60}")
    print(f"  Classe: {key}  |  n={n}")
    print(f"{'─' * 60}")

    if n < 5:
        print(f"  ⚠  Amostras insuficientes ({n}). Pulando.")
        return {}

    summary: dict = {"n": n, "key": key}

    # ── Ridge ──────────────────────────────────────────────────────────────
    if not gbm_only:
        print("  [Ridge] treinando …", end="", flush=True)
        ridge_result = train_ridge(X, y, feat_names)
        print(f"  LOO-MAE={ridge_result['loo_mae']:.2f}  max={ridge_result['loo_max']:.2f}")
        summary["ridge"] = ridge_result
    else:
        ridge_result = None

    # ── GBM ────────────────────────────────────────────────────────────────
    print("  [GBM]   treinando …", end="", flush=True)
    gbm_result = train_gbm(X, y, feat_names)
    print(f"  CV-MAE={gbm_result['cv_mae']:.2f}  max={gbm_result['cv_max']:.2f}")
    summary["gbm"] = gbm_result

    # ── Seleção do melhor modelo ────────────────────────────────────────────
    if ridge_result is not None and ridge_result["loo_mae"] <= gbm_result["cv_mae"]:
        best = "ridge"
        best_mae = ridge_result["loo_mae"]
    else:
        best = "gbm"
        best_mae = gbm_result["cv_mae"]

    achieved = "✓" if best_mae <= TARGET_MAE else "✗"
    print(f"  {achieved} Melhor modelo: {best.upper()}  MAE={best_mae:.2f} pts", end="")
    print(f"  (meta ≤ {TARGET_MAE} pts)" if best_mae > TARGET_MAE else "")

    # ── Exportação TypeScript ───────────────────────────────────────────────
    if best == "ridge":
        export_linear_ts(key, n, ridge_result, out_dir)
    else:
        export_gbm_ts(key, n, gbm_result, out_dir)

    print(f"  → Exportado: {EXPORT_META[key][1]}.ts")
    summary["best"] = best
    summary["best_mae"] = best_mae
    return summary


# ─────────────────────────────────────────────────────────────────────────────
# Arquivo de tipos TypeScript (gerado uma vez)
# ─────────────────────────────────────────────────────────────────────────────

TYPES_TS = """\
// Auto-generated by train_scoring_weights.py — não editar manualmente

/** Árvore de decisão compacta exportada do sklearn GBM */
export interface GBMTree {
  /** children_left  */ cl: number[]
  /** children_right */ cr: number[]
  /** feature index  */ fi: number[]
  /** threshold      */ th: number[]
  /** leaf value     */ va: number[]
}

/** Modelo GBM (Gradient Boosting Machine) */
export interface GBMWeights {
  type: 'gbm'
  /** Previsão inicial (média dos targets de treino) */
  initPrediction: number
  learningRate: number
  /** Nomes das features na mesma ordem usada em computeScore.ts */
  featureNames: string[]
  trees: GBMTree[]
}

/** Modelo Ridge linear (backward-compat com arquivos antigos sem `type`) */
export interface LinearWeights {
  type?: 'linear'
  bias: number
  weights: Record<string, number>
}

export type ScoringWeights = LinearWeights | GBMWeights
"""


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Treina pesos de pontuação por classe de unidade.")
    parser.add_argument("--api-url", required=True, help="URL base da API (ex: http://localhost:8080)")
    parser.add_argument("--load-json", help="Arquivo JSON local com lista de unidades (evita chamadas à API)")
    parser.add_argument("--gbm-only", action="store_true", help="Treina apenas GBM (mais rápido)")
    parser.add_argument(
        "--out-dir",
        default=str(Path(__file__).parent.parent / "src" / "lib" / "scoringWeights"),
        help="Diretório de saída dos arquivos TypeScript",
    )
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # ── Carrega dados ──────────────────────────────────────────────────────
    if args.load_json:
        print(f"📂 Carregando unidades de {args.load_json} …")
        with open(args.load_json, encoding="utf-8") as f:
            all_units = json.load(f)
        if isinstance(all_units, dict):
            all_units = all_units.get("data") or all_units
    else:
        print(f"🌐 Buscando unidades de {args.api_url} …")
        all_units = fetch_units(args.api_url)

    print(f"🌐 Buscando color-meanings de {args.api_url} …")
    cm_map = fetch_color_meanings(args.api_url)

    print(f"   {len(all_units)} unidades carregadas  |  {len(cm_map)} color-meanings")

    # ── Gera types.ts ──────────────────────────────────────────────────────
    types_path = out_dir / "types.ts"
    types_path.write_text(TYPES_TS, encoding="utf-8")
    print(f"\n📄 Gerado: {types_path.relative_to(out_dir.parent.parent)}")

    # ── Agrupa por classe ──────────────────────────────────────────────────
    groups: dict[str, list[dict]] = {}
    skipped = 0
    for u in all_units:
        key = class_key(u)
        if key not in EXPORT_META:
            skipped += 1
            continue
        groups.setdefault(key, []).append(u)

    if skipped:
        print(f"   ({skipped} unidades ignoradas — classe desconhecida)")

    # ── Treina cada classe ─────────────────────────────────────────────────
    summaries: list[dict] = []
    for key in EXPORT_META:
        units = groups.get(key, [])
        result = train_class(key, units, cm_map, out_dir, gbm_only=args.gbm_only)
        if result:
            summaries.append(result)

    # ── Relatório final ────────────────────────────────────────────────────
    print(f"\n{'═' * 60}")
    print("  RESUMO FINAL")
    print(f"{'─' * 60}")
    print(f"  {'Classe':<20} {'n':>5} {'Modelo':<8} {'MAE':>6}  {'Meta ≤2':>7}")
    print(f"  {'-'*20} {'─'*5} {'─'*8} {'─'*6}  {'─'*7}")
    all_ok = True
    for s in summaries:
        ok = s["best_mae"] <= TARGET_MAE
        if not ok:
            all_ok = False
        mark = "✓" if ok else "✗"
        print(f"  {s['key']:<20} {s['n']:>5} {s['best'].upper():<8} {s['best_mae']:>6.2f}  {mark}")

    print(f"\n  {'✅ Todos dentro da meta!' if all_ok else '⚠  Algumas classes acima de 2 pts.'}")
    print(f"  Arquivos salvos em: {out_dir}\n")


if __name__ == "__main__":
    main()
