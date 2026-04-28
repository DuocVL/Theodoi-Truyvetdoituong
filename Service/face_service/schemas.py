from pydantic import BaseModel
from typing import List


class EmbeddingItem(BaseModel):
    embedding: List[float]
    quality: float


class RegisterResponse(BaseModel):
    success: bool
    embeddings: List[EmbeddingItem]


class VerifyResponse(BaseModel):
    matched: bool
    score: float