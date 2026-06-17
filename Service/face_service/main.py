from fastapi import FastAPI
from fastapi import UploadFile
from fastapi import File
from fastapi import Form

import json

from face_engine import detect_and_embed
from utils import (
    read_image,
    cosine_distance
)

app = FastAPI()

THRESHOLD = 0.45

@app.post("/extract-embedding")
async def extract_embedding(
    file: UploadFile = File(...)
):

    content = await file.read()

    image = read_image(content)

    if image is None:
        return {
            "success": False,
            "message": "INVALID_IMAGE"
        }

    data, err = detect_and_embed(
        image
    )

    if err:
        return {
            "success": False,
            "message": err
        }

    return {
        "success": True,
        "embedding":
            data["embedding"],
        "quality":
            data["quality"]
    }

@app.post("/verify-images")
async def verify_images(
    image_a: UploadFile = File(...),
    image_b: UploadFile = File(...)
):

    img_a = read_image(
        await image_a.read()
    )

    img_b = read_image(
        await image_b.read()
    )

    data_a, err_a = detect_and_embed(
        img_a
    )

    data_b, err_b = detect_and_embed(
        img_b
    )

    if err_a:
        return {
            "success": False,
            "message": err_a
        }

    if err_b:
        return {
            "success": False,
            "message": err_b
        }

    dist = cosine_distance(
        data_a["embedding"],
        data_b["embedding"]
    )

    return {
        "matched":
            dist < THRESHOLD,
        "distance":
            dist
    }


@app.post("/verify-embedding")
async def verify_embedding(
    file: UploadFile = File(...),
    embedding: str = Form(...)
):

    image = read_image(
        await file.read()
    )

    data, err = detect_and_embed(
        image
    )

    if err:
        return {
            "success": False,
            "message": err
        }

    stored_embedding = json.loads(
        embedding
    )

    dist = cosine_distance(
        data["embedding"],
        stored_embedding
    )

    return {
        "matched":
            dist < THRESHOLD,
        "distance":
            dist
    }


from pydantic import BaseModel


class VerifyEmbeddingsRequest(
    BaseModel
):
    embedding_a: list[float]
    embedding_b: list[float]


@app.post("/verify-embeddings")
async def verify_embeddings(
    req: VerifyEmbeddingsRequest
):

    dist = cosine_distance(
        req.embedding_a,
        req.embedding_b
    )

    return {
        "matched":
            dist < THRESHOLD,
        "distance":
            dist
    }