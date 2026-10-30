"""Which chunks a user is allowed to see: their own, plus the shared sample documents."""
import os

from qdrant_client import models

SHARED = "shared"


def visible_filter(owner=None, doc=None, sections=None):
    must = []
    if owner:
        must.append(
            models.FieldCondition(key="metadata.owner", match=models.MatchAny(any=[owner, SHARED]))
        )
    if doc:
        base = os.path.basename(doc)
        sources = ["data/" + base]
        if owner:
            sources.append(f"data/{owner}/{base}")
        must.append(
            models.FieldCondition(key="metadata.source", match=models.MatchAny(any=sources))
        )
    if sections:
        must.append(
            models.FieldCondition(key="metadata.sections", match=models.MatchAny(any=list(sections)))
        )
    return models.Filter(must=must) if must else None
