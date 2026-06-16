
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from typing import List
import numpy as np
import json
from json import JSONDecodeError

# Các module con sẽ được tạo ở các bước tiếp theo
from face_engine import detect_and_embed
from utils import read_image, cosine_distance

# =========================
# CONFIGURATION
# =========================
# Ngưỡng khoảng cách cosine: Nếu khoảng cách nhỏ hơn giá trị này, hai khuôn mặt được coi là cùng một người.
COSINE_DISTANCE_THRESHOLD = 0.45 

app = FastAPI(
    title="Simple Face Verification API",
    description="Một service đơn giản để đăng ký và xác thực khuôn mặt bằng một ảnh duy nhất.",
    version="1.0.0"
)

# =========================
# HELPER DEPENDENCY
# =========================
# Dependency để đảm bảo người dùng chỉ upload 1 file duy nhất
async def limit_single_file_upload(files: List[UploadFile] = File(...)):
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Please upload exactly one file.")
    return files[0] # Trả về file duy nhất

# =========================
# API ENDPOINTS
# =========================

@app.post("/register")
async def register(
    file: UploadFile = Depends(limit_single_file_upload)
):
    """
    **Đăng ký khuôn mặt từ một ảnh duy nhất.**
    
    Nhận vào 1 file ảnh, trả về một chuỗi `embedding` (vector đặc trưng của khuôn mặt).
    `embedding` này sau đó có thể được lưu trữ và sử dụng cho việc xác thực.
    """
    content = await file.read()
    image = await run_in_threadpool(read_image, content)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image format.")

    # Trích xuất embedding từ ảnh
    data, err = await run_in_threadpool(detect_and_embed, image)
    if err:
        raise HTTPException(status_code=400, detail=err)

    # Chuẩn hóa embedding trước khi trả về
    embedding = np.array(data["embedding"])
    norm = np.linalg.norm(embedding)
    if norm == 0:
        raise HTTPException(status_code=500, detail="Failed to generate a valid embedding.")

    normalized_embedding = (embedding / norm).tolist()

    return {
        "success": True,
        "embedding": normalized_embedding,
        "message": "Face registered successfully. You can now use the returned embedding for verification."
    }

@app.post("/verify")
async def verify(
    file: UploadFile = Depends(limit_single_file_upload),
    stored_embedding_str: str = Form(..., alias="stored_embedding"),
):
    """
    **Xác thực khuôn mặt bằng một ảnh duy nhất so với embedding đã lưu.**

    Nhận 1 file ảnh và 1 `stored_embedding` (từ bước đăng ký).
    So sánh khuôn mặt trong ảnh với embedding và trả về kết quả.
    """
    try:
        # Chuyển chuỗi embedding từ JSON thành numpy array
        stored_embedding = np.array(json.loads(stored_embedding_str))
    except (JSONDecodeError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid stored_embedding format. It must be a JSON array of numbers.")

    # Đọc và xử lý ảnh mới
    content = await file.read()
    image = await run_in_threadpool(read_image, content)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image format.")

    # Trích xuất embedding từ ảnh mới
    data, err = await run_in_threadpool(detect_and_embed, image)
    if err:
        raise HTTPException(status_code=400, detail=err)

    # Chuẩn hóa embedding mới
    new_embedding = np.array(data["embedding"])
    norm = np.linalg.norm(new_embedding)
    if norm == 0:
        raise HTTPException(status_code=500, detail="Failed to generate a valid embedding from the new image.")
    
    normalized_new_embedding = new_embedding / norm
    
    # Tính toán khoảng cách cosine
    dist = await run_in_threadpool(cosine_distance, normalized_new_embedding, stored_embedding)

    # So sánh với ngưỡng
    is_matched = bool(dist < COSINE_DISTANCE_THRESHOLD)

    return {
        "matched": is_matched,
        "score": dist
    }

