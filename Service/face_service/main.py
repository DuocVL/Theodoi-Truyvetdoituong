
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from typing import List, Dict, Any
import numpy as np
import json
from json import JSONDecodeError

from face_engine import detect_and_embed
from utils import read_image, cosine_distance
from anti_spoof_model import anti_spoof_multi

# =========================
# SERVICE CONFIGURATION
# =========================
# Các ngưỡng này được sử dụng cho logic xử lý một ảnh duy nhất.
MIN_FACE_QUALITY_THRESHOLD = 0.6
COSINE_DISTANCE_THRESHOLD = 0.45
ANTI_SPOOF_LIVE_SCORE_THRESHOLD = 0.7

app = FastAPI()

# =========================
# DEPENDENCY FOR FILE SIZE LIMIT
# =========================
# Giới hạn chỉ cho phép upload 1 file duy nhất.
MAX_FILES_UPLOAD = 1
MAX_FILE_SIZE_MB = 5 * 1024 * 1024  # 5 MB

async def limit_single_file_upload(files: List[UploadFile] = File(...)):
    if len(files) != MAX_FILES_UPLOAD:
        raise HTTPException(status_code=400, detail=f"Please upload exactly {MAX_FILES_UPLOAD} file.")
    file = files[0]
    if file.size > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File '{file.filename}' is too large. Max size is 5MB.")
    return files


# =========================
# REGISTER ENDPOINT (SINGLE IMAGE)
# =========================
@app.post("/register")
async def register(
    files: List[UploadFile] = Depends(limit_single_file_upload)
):
    """
    Đăng ký khuôn mặt từ một ảnh duy nhất.
    """
    file = files[0]
    content = await file.read()
    image = await run_in_threadpool(read_image, content)
    
    if image is None:
        raise HTTPException(status_code=400, detail="INVALID_IMAGE_FORMAT. Could not decode image.")

    data, err = await run_in_threadpool(detect_and_embed, image)
    if err:
        return {"success": False, "embedding": None, "message": err}

    if data["quality"] < MIN_FACE_QUALITY_THRESHOLD:
        return {"success": False, "embedding": None, "message": f"FACE_QUALITY_TOO_LOW. Quality was {data['quality']:.2f}"}

    # Chuẩn hóa embedding
    embedding = np.array(data["embedding"])
    norm = np.linalg.norm(embedding)
    if norm == 0: 
        return {"success": False, "embedding": None, "message": "INVALID_EMBEDDING_GENERATED"}
    
    normalized_embedding = (embedding / norm).tolist()

    return {
        "success": True,
        "embedding": normalized_embedding,
        "message": "Successfully registered face."
    }


# =========================
# VERIFY ENDPOINT (SINGLE IMAGE)
# =========================
@app.post("/verify")
async def verify(
    files: List[UploadFile] = Depends(limit_single_file_upload),
    stored_embedding_str: str = Form(..., alias="stored_embedding"),
):
    """
    Xác thực khuôn mặt bằng một ảnh duy nhất so với embedding đã lưu.
    """
    try:
        stored_embedding = np.array(json.loads(stored_embedding_str))
    except (JSONDecodeError, TypeError):
        raise HTTPException(status_code=400, detail="INVALID_STORED_EMBEDDING_FORMAT")

    file = files[0]
    content = await file.read()
    image = await run_in_threadpool(read_image, content)
    if image is None:
        raise HTTPException(status_code=400, detail="INVALID_IMAGE_FORMAT. Could not decode image.")

    # 1. Anti-Spoofing Check
    # Chạy anti-spoof trước để tránh xử lý embedding không cần thiết
    _, scores = await run_in_threadpool(anti_spoof_multi, [image], [[0,0,image.shape[1],image.shape[0]]]) # Sử dụng bbox toàn ảnh
    spoof_score = scores[0] if scores else -1.0

    if spoof_score < ANTI_SPOOF_LIVE_SCORE_THRESHOLD:
        return {"matched": False, "reason": "SPOOF_DETECTED", "score": -1.0, "spoof_score": spoof_score}

    # 2. Embedding Extraction
    data, err = await run_in_threadpool(detect_and_embed, image)
    if err:
        return {"matched": False, "reason": err, "score": -1.0}

    # 3. Cosine Distance Comparison
    new_embedding = np.array(data["embedding"])
    norm = np.linalg.norm(new_embedding)
    if norm == 0:
        return {"matched": False, "reason": "INVALID_EMBEDDING_GENERATED", "score": -1.0}
    
    normalized_new_embedding = new_embedding / norm
    
    dist = await run_in_threadpool(cosine_distance, normalized_new_embedding, stored_embedding)

    is_matched = dist < COSINE_DISTANCE_THRESHOLD

    return {
        "matched": is_matched,
        "score": dist,
        "spoof_score": spoof_score
    }
