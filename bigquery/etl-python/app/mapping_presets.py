# app/mapping_presets.py
from typing import Dict
from .normalizers import normalize_text

def norm_header(h: str) -> str:
    return normalize_text(h) or ""

def build_auto_mapping(headers: list[str]) -> Dict[str, str]:
    """
    Cria mapping baseado no header do CSV (seu caso: E-mail, Nome completo, etc).
    Retorna formato: { "email": "E-mail", "nome_completo": "Nome completo", ... }
    """

    original_by_norm: Dict[str, str] = {}
    for h in headers:
        nh = norm_header(h)
        if nh and nh not in original_by_norm:
            original_by_norm[nh] = h

    def pick(*candidates: str):
        for c in candidates:
            ch = original_by_norm.get(norm_header(c))
            if ch:
                return ch
        return None

    mapping: Dict[str, str] = {}

    # obrigatório
    email = pick("E-mail", "Email")
    if email:
        mapping["email"] = email

    # pessoa
    mapping["nome"] = pick("Nome")
    mapping["nome_completo"] = pick("Nome completo")
    mapping["linkedin"] = pick("LinkedIn")
    mapping["cargo"] = pick("Cargo")
    mapping["pais"] = pick("País")
    mapping["localizacao"] = pick("Localização")

    # empresa
    mapping["empresa"] = pick("Nome da empresa")
    mapping["url_empresa"] = pick("URL da empresa")

    # empresa detalhado (se tiver)
    mapping["tamanho"] = pick("Tamanho da empresa", "Tamanho da empresa (campo personalizado)")
    mapping["pais_empresa"] = pick("País da empresa", "País da empresa (campo personalizado)")
    mapping["localizacao_empresa"] = pick("Localização da empresa", "Localização da empresa (campo personalizado)")
    mapping["estado_empresa"] = pick("Estado", "Estado (campo personalizado)")
    mapping["cidade_empresa"] = pick("Cidade", "Cidade (campo personalizado)")
    mapping["setor_empresa"] = pick("Setor da empresa", "Setor da empresa (campo personalizado)", "Setor")

    # telefones se existirem (não entram no preview/export mas você pode manter no mongo se quiser)
    mapping["telefone_sede"] = pick("Telefone da sede")
    mapping["telefone"] = pick("Telefone")

    return {k: v for k, v in mapping.items() if v}