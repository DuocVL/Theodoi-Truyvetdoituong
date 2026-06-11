from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from typing import List
import numpy as np
import json
from json import JSONDecodeError

from face_engine import detect_and_embed
from utils import read_image, cosine_distance, compute_weighted_centroid, is_same_person
from anti_spoof_model import anti_spoof_multi

# =========================
# CONSTANTS CONFIGURATION
# =========================
# Các hằng số được định nghĩa ở một nơi để dễ dàng quản lý và thay đổi.

# Ngưỡng chất lượng tối thiểu cho một ảnh khuôn mặt được chấp nhận.
# Ảnh có chất lượng thấp hơn sẽ bị bỏ qua.
MIN_FACE_QUALITY = 0.6

# Số lượng ảnh chất lượng tốt tối thiểu cần thiết để đăng ký.
MIN_IMAGES_FOR_REGISTER = 3

# Số lượng khung hình (frames) tối thiểu từ video/live stream để thực hiện xác thực.
MIN_FRAMES_FOR_VERIFY = 3

# Ngưỡng phương sai (variance) của các embedding.
# Nếu phương sai quá thấp, có khả năng đây là video phát lại (replay attack)
# vì các khung hình quá giống nhau.
VIDEO_REPLAY_VARIANCE_THRESHOLD = 1e-5

# Ngưỡng khoảng cách cosine. Hai khuôn mặt được coi là cùng một người nếu
# khoảng cách cosine giữa các embedding của chúng nhỏ hơn ngưỡng này.
COSINE_DISTANCE_THRESHOLD = 0.45

# Số lượng khung hình hợp lệ (có khoảng cách đủ nhỏ) tối thiểu để coi là khớp.
MIN_VALID_FRAMES_FOR_MATCH = 2


app = FastAPI()


# =========================
# DEPENDENCY FOR FILE SIZE LIMIT
# =========================
# Phụ thuộc này giúp giới hạn kích thước file upload để chống lại tấn công DoS.
# Bạn có thể điều chỉnh kích thước tối đa (MAX_FILE_SIZE_MB) nếu cần.
MAX_FILES_UPLOAD = 10
MAX_FILE_SIZE_MB = 5 * 1024 * 1024  # 5 MB

async def limit_file_uploads(files: List[UploadFile] = File(...)):
    """Dependency to limit number and size of uploaded files."""
    if len(files) > MAX_FILES_UPLOAD:
        raise HTTPException(status_code=413, detail=f"Too many files. Maximum {MAX_FILES_UPLOAD} files allowed.")
    for file in files:
        if file.size > MAX_FILE_SIZE_MB:
            raise HTTPException(status_code=413, detail=f"File '{file.filename}' is too large. Maximum size is {MAX_FILE_SIZE_MB / (1024*1024)}MB.")
    return files


# =========================
# REGISTER ENDPOINT
# =========================
@app.post("/register")
async def register(files: List[UploadFile] = Depends(limit_file_uploads)):
    """
    Endpoint để đăng ký khuôn mặt mới.
    - Nhận vào một danh sách các hình ảnh.
    - Trích xuất embedding từ các ảnh hợp lệ.
    - Kiểm tra xem các ảnh có phải của cùng một người không.
    - Nếu hợp lệ, tính toán và trả về một embedding trung tâm (centroid).
    """
    embeddings = []
    qualities = []

    for file in files:
        content = await file.read()
        
        # Hàm read_image có thể là I/O-bound, nhưng thường rất nhanh.
        # Nếu nó chậm, cũng có thể đưa vào threadpool.
        image = await run_in_threadpool(read_image, content)

        if image is None:
            continue

        # detect_and_embed là CPU-bound, chạy trong threadpool
        data, err = await run_in_threadpool(detect_and_embed, image)

        if err:
            continue
        
        # Bỏ qua các ảnh có chất lượng thấp
        if data["quality"] < MIN_FACE_QUALITY:
            continue

        emb = np.array(data["embedding"])
        norm = np.linalg.norm(emb)

        # Bỏ qua nếu norm của vector là 0 để tránh lỗi chia cho 0
        if norm == 0:
            continue

        # Chuẩn hóa embedding
        emb = emb / norm

        embeddings.append(emb)
        qualities.append(data["quality"])

    # Yêu cầu phải có đủ số lượng ảnh chất lượng tốt
    if len(embeddings) < MIN_IMAGES_FOR_REGISTER:
        return {"success": False, "message": f"NOT_ENOUGH_GOOD_IMAGES. Required at least {MIN_IMAGES_FOR_REGISTER}."}

    # Kiểm tra xem tất cả các embedding có thuộc về cùng một người không
    if not await run_in_threadpool(is_same_person, embeddings):
        return {"success": False, "message": "MULTIPLE_IDENTITIES_DETECTED"}

    # Tính toán centroid (embedding trung tâm) dựa trên các embedding và chất lượng của chúng
    centroid = await run_in_threadpool(compute_weighted_centroid, embeddings, qualities)

    return {
        "success": True,
        "centroid": centroid.tolist()
    }


# =========================
# VERIFY ENDPOINT
# =========================
@app.post("/verify")
async def verify(
    files: List[UploadFile] = Depends(limit_file_uploads),
    stored_embedding_str: str = Form(..., alias="stored_embedding")
):
    """
    Endpoint để xác thực khuôn mặt so với một embedding đã lưu.
    Thực hiện nhiều bước để đảm bảo tính toàn vẹn:
    1. Trích xuất embedding từ các khung hình.
    2. Chống giả mạo (Anti-spoofing) để đảm bảo đây là mặt người thật.
    3. Chống video replay attack.
    4. So sánh các embedding mới với embedding đã lưu.
    """
    try:
        stored_embedding_list = json.loads(stored_embedding_str)
        stored_embedding = np.array(stored_embedding_list)
    except (JSONDecodeError, TypeError):
        raise HTTPException(status_code=400, detail="INVALID_STORED_EMBEDDING_FORMAT")

    if stored_embedding.ndim != 1:
        raise HTTPException(status_code=400, detail="INVALID_STORED_EMBEDDING_DIMENSION")

    # Đọc tất cả các khung hình từ các file upload
    frames = []
    for file in files:
        content = await file.read()
        img = await run_in_threadpool(read_image, content)
        if img is not None:
            frames.append(img)

    if len(frames) < MIN_FRAMES_FOR_VERIFY:
        return {"matched": False, "reason": f"NOT_ENOUGH_FRAMES. Required at least {MIN_FRAMES_FOR_VERIFY}."}

    embeddings = []
    bboxes = []

    # ===== STEP 1: Detect, crop, and generate embeddings for each frame =====
    for img in frames:
        data, err = await run_in_threadpool(detect_and_embed, img)

        if err or data["quality"] < MIN_FACE_QUALITY:
            continue

        emb = np.array(data["embedding"])
        norm = np.linalg.norm(emb)
        if norm == 0:
            continue
        
        emb = emb / norm  # Normalize
        embeddings.append(emb)
        bboxes.append(data["bbox"])

    if len(embeddings) < MIN_FRAMES_FOR_VERIFY:
        return {"matched": False, "reason": f"NOT_ENOUGH_GOOD_FRAMES. Required at least {MIN_FRAMES_FOR_VERIFY} good quality frames."}

    # ===== STEP 2: Anti-spoofing check on cropped faces =====
    # Chạy trên một thread riêng vì đây là tác vụ CPU-bound
    is_live, scores = await run_in_threadpool(anti_spoof_multi, frames, bboxes)

    if not is_live:
        return {
            "matched": False,
            "reason": "SPOOF_DETECTED",
            "spoof_scores": scores
        }

    # ===== STEP 3: Video replay detection =====
    # Tính toán phương sai trung bình của các embedding.
    # Nếu các frame quá giống nhau, phương sai sẽ rất nhỏ, cho thấy có thể là video replay.
    embedding_array = np.array(embeddings)
    variance = await run_in_threadpool(embedding_array.var, axis=0)
    mean_variance = variance.mean()
    
    if mean_variance < VIDEO_REPLAY_VARIANCE_THRESHOLD:
        return {"matched": False, "reason": "VIDEO_REPLAY_DETECTED", "details": {"mean_variance": mean_variance}}

    # ===== STEP 4: Compare embeddings against the stored one =====
    # Tính toán khoảng cách cosine cho từng embedding hợp lệ
    distances = [await run_in_threadpool(cosine_distance, e, stored_embedding) for e in embeddings]

    # Đếm số lượng khung hình có khoảng cách đủ nhỏ (tức là khớp)
    valid_matches = [d for d in distances if d < COSINE_DISTANCE_THRESHOLD]
    
    # Quyết định là khớp nếu có đủ số lượng frame hợp lệ
    is_matched = len(valid_matches) >= MIN_VALID_FRAMES_FOR_MATCH

    return {
        "matched": is_matched,
        "distances": distances,
        "avg_distance": float(np.mean(distances)),
        "spoof_scores": scores,
        "details": {
            "valid_matches": len(valid_matches),
            "required_matches": MIN_VALID_FRAMES_FOR_MATCH
        }
    }
