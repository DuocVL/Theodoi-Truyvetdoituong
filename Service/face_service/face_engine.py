
import cv2
import numpy as np
from insightface.app import FaceAnalysis
import os

# =========================
# CONSTANTS AND CONFIGURATION
# =========================

# Đọc ID của thiết bị (context ID) từ biến môi trường.
# Mặc định là -1 (CPU). Đặt biến môi trường INSIGHTFACE_CTX_ID=0 để dùng GPU.
CTX_ID = int(os.environ.get('INSIGHTFACE_CTX_ID', -1))

# --- Ngưỡng lọc khuôn mặt ---
MIN_DETECTION_CONFIDENCE = 0.7  # Ngưỡng tin cậy tối thiểu của mô hình phát hiện mặt.
MAX_POSE_ANGLE = 20             # Góc lệch tối đa (yaw, pitch) cho phép.

# --- Các hằng số cho việc tính điểm chất lượng (Quality Score) ---
BRIGHTNESS_LOWER_BOUND = 50
BRIGHTNESS_UPPER_BOUND = 200
BAD_LIGHTING_PENALTY_SCORE = 0.3
BLUR_NORMALIZATION_FACTOR = 100.0

# Trọng số cho các thành phần trong công thức tính chất lượng.
QUALITY_WEIGHT_BLUR = 0.4
QUALITY_WEIGHT_SIZE = 0.4
QUALITY_WEIGHT_LIGHTING = 0.2


# =========================
# MODEL INITIALIZATION
# =========================

# Khởi tạo mô hình FaceAnalysis. 'buffalo_l' là mô hình cân bằng tốc độ và độ chính xác.
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=CTX_ID)


def detect_and_embed(image: np.ndarray):
    """
    Phát hiện khuôn mặt, lọc và trích xuất embedding.

    Args:
        image: Ảnh đầu vào (định dạng BGR).

    Returns:
        Một tuple (data, error): `data` chứa thông tin nếu thành công, `error` chứa thông báo lỗi.
    """
    faces = app.get(image)

    if not faces:
        return None, "NO_FACE_DETECTED"

    if len(faces) > 1:
        return None, "MULTIPLE_FACES_DETECTED"

    face = faces[0]

    # 1. Lọc dựa trên góc mặt
    yaw, pitch, _ = face.pose
    if abs(yaw) > MAX_POSE_ANGLE or abs(pitch) > MAX_POSE_ANGLE:
        return None, "BAD_POSE"

    # 2. Lọc dựa trên độ tin cậy
    if face.det_score < MIN_DETECTION_CONFIDENCE:
        return None, "LOW_CONFIDENCE_SCORE"

    embedding = face.embedding
    quality = _calculate_quality(image, face)
    
    # Đảm bảo bbox là kiểu dữ liệu an toàn cho JSON (list of ints)
    bbox = face.bbox.astype(int).tolist()

    return {
        "embedding": embedding,
        "quality": quality,
        "bbox": bbox
    }, None


def _calculate_quality(image: np.ndarray, face) -> float:
    """
    Hàm nội bộ, tính điểm chất lượng cho khuôn mặt dựa trên:
    1. Độ nét (Blurriness): Dùng phương sai của ảnh Laplacian.
    2. Kích thước (Size): Tỷ lệ diện tích khuôn mặt so với toàn bộ ảnh.
    3. Ánh sáng (Lighting): Độ sáng trung bình.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 1. Tính điểm độ nét
    blur_variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    blur_score = min(1.0, blur_variance / BLUR_NORMALIZATION_FACTOR)

    # 2. Tính điểm kích thước
    bbox = face.bbox
    face_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
    img_area = image.shape[0] * image.shape[1]
    size_score = min(1.0, face_area / img_area if img_area > 0 else 0)

    # 3. Tính điểm ánh sáng
    brightness = np.mean(gray)
    lighting_score = 1.0 if BRIGHTNESS_LOWER_BOUND < brightness < BRIGHTNESS_UPPER_BOUND else BAD_LIGHTING_PENALTY_SCORE

    # 4. Tính điểm chất lượng cuối cùng theo trọng số
    quality = (
        blur_score * QUALITY_WEIGHT_BLUR +
        size_score * QUALITY_WEIGHT_SIZE +
        lighting_score * QUALITY_WEIGHT_LIGHTING
    )
    
    return float(min(1.0, quality))
