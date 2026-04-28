from fastapi import FastAPI, UploadFile, File, Form
from typing import List
import numpy as np
import json

from face_engine import detect_and_embed
from utils import read_image, cosine_distance, compute_weighted_centroid, is_same_person
from anti_spoof_model import anti_spoof_multi

app = FastAPI()


# =========================
# REGISTER
# =========================
@app.post("/register")
async def register(files: List[UploadFile] = File(...)):
    embeddings = []
    qualities = []

    for file in files:
        content = await file.read()
        image = read_image(content)

        if image is None:
            continue

        data, err = detect_and_embed(image)

        if err:
            continue

        if data["quality"] < 0.6:
            continue

        emb = np.array(data["embedding"])
        norm = np.linalg.norm(emb)

        if norm == 0:
            continue

        emb = emb / norm

        embeddings.append(emb)
        qualities.append(data["quality"])

    if len(embeddings) < 3:
        return {"success": False, "message": "NOT_ENOUGH_IMAGES"}

    if not is_same_person(embeddings):
        return {"success": False, "message": "MULTIPLE_IDENTITIES"}

    centroid = compute_weighted_centroid(embeddings, qualities)

    return {
        "success": True,
        "centroid": centroid.tolist()
    }


@app.post("/verify")
async def verify(
    files: List[UploadFile] = File(...),
    stored_embedding: str = Form(...)
):
    stored_embedding = np.array(json.loads(stored_embedding))

    if stored_embedding.ndim != 1:
        return {"matched": False, "reason": "INVALID_STORED_EMBEDDING"}

    frames = []
    for file in files:
        content = await file.read()
        img = read_image(content)
        if img is not None:
            frames.append(img)

    if len(frames) < 3:
        return {"matched": False, "reason": "NOT_ENOUGH_FRAMES"}

    embeddings = []
    bboxes = []

    # ===== STEP 1: detect + crop + embedding =====
    for img in frames:
        data, err = detect_and_embed(img)

        if err:
            continue

        if data["quality"] < 0.6:
            continue

        bbox = data["bbox"]


        emb = np.array(data["embedding"])
        norm = np.linalg.norm(emb)

        if norm == 0:
            continue

        emb = emb / norm
        embeddings.append(emb)
        bboxes.append(bbox)

    if len(embeddings) < 3:
        return {"matched": False, "reason": "NOT_ENOUGH_GOOD_FRAMES"}

    # ===== STEP 2: anti-spoof (trên face crop) =====
    is_live, scores = anti_spoof_multi(frames, bboxes)

    if not is_live:
        return {
            "matched": False,
            "reason": "SPOOF_DETECTED",
            "spoof_scores": scores
        }

    # ===== STEP 3: chống video replay =====
    var = np.var(np.array(embeddings), axis=0).mean()

    if var < 1e-5:
        return {"matched": False, "reason": "VIDEO_REPLAY_DETECTED"}

    # ===== STEP 4: so sánh =====
    distances = [cosine_distance(e, stored_embedding) for e in embeddings]

    valid = [d for d in distances if d < 0.45]

    matched = len(valid) >= 2

    return {
        "matched": matched,
        "distances": distances,
        "avg_distance": float(np.mean(distances)),
        "spoof_scores": scores
    }