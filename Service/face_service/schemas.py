from pydantic import BaseModel
from typing import List


class RegisterResponse(BaseModel):
    success: bool
    message: str | None = None
    centroid_embedding: List[float] | None = None
    embeddings: list | None = None