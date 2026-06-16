
# --- Load Environment Variables from .env file ---
# This must be at the very top of the file to ensure all environment
# variables are loaded before any other modules that might need them.
from dotenv import load_dotenv
load_dotenv()
# --------------------------------------------------

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from typing import List, Dict, Any
import numpy as np
import json
import os
import logging
from json import JSONDecodeError

# The modules below will now be able to see the environment variables loaded by load_dotenv()
from face_engine import detect_and_embed
from utils import read_image, cosine_distance
from anti_spoof_model import anti_spoof_multi

# =========================
# SERVICE CONFIGURATION
# =========================
MIN_FACE_QUALITY_THRESHOLD = 0.6
COSINE_DISTANCE_THRESHOLD = 0.45

ANTI_SPOOF_CONFIGS = {
    "relaxed": {"threshold": 0.5, "description": "Nới lỏng"},
    "balanced": {"threshold": 0.7, "description": "Cân bằng"},
    "strict": {"threshold": 0.9, "description": "Nghiêm ngặt"}
}

# Đọc cấu hình từ Biến Môi Trường (đã được load từ .env)
SERVER_SPOOF_LEVEL = os.environ.get("ANTI_SPOOF_LEVEL", "balanced").lower()
if SERVER_SPOOF_LEVEL not in ANTI_SPOOF_CONFIGS:
    logging.warning(f"Invalid ANTI_SPOOF_LEVEL. Falling back to 'balanced'.")
    SERVER_SPOOF_LEVEL = "balanced"

ACTIVE_SPOOF_THRESHOLD = ANTI_SPOOF_CONFIGS[SERVER_SPOOF_LEVEL]["threshold"]

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logging.basicConfig(level=logging.INFO)
    logging.info(f"Service starting with Anti-Spoofing Level: '{SERVER_SPOOF_LEVEL}' (Threshold: {ACTIVE_SPOOF_THRESHOLD})")

# =========================
# DEPENDENCIES & HELPERS
# =========================
MAX_FILES_UPLOAD = 1
MAX_FILE_SIZE_MB = 5 * 1024 * 1024

async def limit_single_file_upload(files: List[UploadFile] = File(...)):
    if len(files) != MAX_FILES_UPLOAD: raise HTTPException(status_code=400, detail=f"Please upload exactly {MAX_FILES_UPLOAD} file.")
    file = files[0]
    if file.size > MAX_FILE_SIZE_MB: raise HTTPException(status_code=413, detail="File is too large.")
    return files

# =========================
# API ENDPOINTS
# =========================
@app.post("/register")
async def register(files: List[UploadFile] = Depends(limit_single_file_upload)):
    content = await files[0].read()
    image = await run_in_threadpool(read_image, content)
    if image is None: raise HTTPException(status_code=400, detail="INVALID_IMAGE_FORMAT")

    data, err = await run_in_threadpool(detect_and_embed, image)
    if err: return {"success": False, "embedding": None, "message": err}
    if data["quality"] < MIN_FACE_QUALITY_THRESHOLD: return {"success": False, "embedding": None, "message": "FACE_QUALITY_TOO_LOW"}

    embedding = np.array(data["embedding"])
    norm = np.linalg.norm(embedding)
    if norm == 0: return {"success": False, "embedding": None, "message": "INVALID_EMBEDDING"}
    
    return {"success": True, "embedding": (embedding / norm).tolist(), "message": "Successfully registered."}

@app.post("/verify")
async def verify(
    files: List[UploadFile] = Depends(limit_single_file_upload),
    stored_embedding_str: str = Form(..., alias="stored_embedding"),
):
    try:
        stored_embedding = np.array(json.loads(stored_embedding_str))
    except (JSONDecodeError, TypeError):
        raise HTTPException(status_code=400, detail="INVALID_STORED_EMBEDDING_FORMAT")

    content = await files[0].read()
    image = await run_in_threadpool(read_image, content)
    if image is None: raise HTTPException(status_code=400, detail="INVALID_IMAGE_FORMAT")

    _, scores = await run_in_threadpool(anti_spoof_multi, [image], [[0,0,image.shape[1],image.shape[0]]])
    spoof_score = scores[0] if scores else -1.0

    if spoof_score < ACTIVE_SPOOF_THRESHOLD:
        return {"matched": False, "reason": "SPOOF_DETECTED", "score": -1.0, "spoof_score": spoof_score}

    data, err = await run_in_threadpool(detect_and_embed, image)
    if err: return {"matched": False, "reason": err, "score": -1.0}

    new_embedding = np.array(data["embedding"])
    norm = np.linalg.norm(new_embedding)
    if norm == 0: return {"matched": False, "reason": "INVALID_EMBEDDING", "score": -1.0}
    
    dist = await run_in_threadpool(cosine_distance, new_embedding / norm, stored_embedding)

    return {
        "matched": dist < COSINE_DISTANCE_THRESHOLD,
        "score": dist,
        "spoof_score": spoof_score,
        "details": f"Anti-spoof level set to '{SERVER_SPOOF_LEVEL}' (Threshold: {ACTIVE_SPOOF_THRESHOLD})"
    }
