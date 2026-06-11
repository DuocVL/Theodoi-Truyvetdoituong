import cv2
import numpy as np
from insightface.app import FaceAnalysis
import os

# =========================
# CONSTANTS CONFIGURATION
# =========================

# Đọc ID của thiết bị (context ID) từ biến môi trường.
# Mặc định là -1 (CPU). Đặt thành 0, 1,... để sử dụng GPU tương ứng.
CTX_ID = int(os.environ.get('INSIGHTFACE_CTX_ID', -1))

# Ngưỡng phát hiện của mô hình. Khuôn mặt có điểm tin cậy thấp hơn sẽ bị loại.
MIN_DETECTION_CONFIDENCE = 0.7

# Ngưỡng lọc góc mặt (pose filtering). Khuôn mặt có góc lệch quá lớn sẽ bị loại.
MAX_YAW_ANGLE = 20  # Lệch trái/phải
MAX_PITCH_ANGLE = 20 # Ngửa lên/cúi xuống

# === Các hằng số cho việc tính điểm chất lượng (Quality Score) ===
# Ngưỡng độ sáng (brightness). Ảnh quá tối hoặc quá sáng sẽ bị giảm điểm.
BRIGHTNESS_LOWER_BOUND = 50
BRIGHTNESS_UPPER_BOUND = 200

# Trọng số cho các thành phần trong công thức tính chất lượng.
# Tổng các trọng số nên bằng 1.0.
QUALITY_WEIGHT_BLUR = 0.4       # Trọng số của độ nét
QUALITY_WEIGHT_SIZE = 0.4       # Trọng số của kích thước khuôn mặt
QUALITY_WEIGHT_LIGHTING = 0.2   # Trọng số của điều kiện ánh sáng

# Hệ số để chuẩn hóa giá trị blur. Giá trị này phụ thuộc vào thực tế ảnh của bạn.
BLUR_NORMALIZATION_FACTOR = 100.0

# Điểm phạt nếu ánh sáng không tốt.
BAD_LIGHTING_PENALTY_SCORE = 0.3


# =========================
# MODEL INITIALIZATION
# =========================

# Khởi tạo mô hình FaceAnalysis.
# 'buffalo_l' là một mô hình cân bằng giữa tốc độ và độ chính xác.
app = FaceAnalysis(name='buffalo_l')
# Chuẩn bị mô hình để sẵn sàng hoạt động trên thiết bị đã chọn (CPU hoặc GPU).
app.prepare(ctx_id=CTX_ID)


def detect_and_embed(image: np.ndarray):
    """
    Phát hiện khuôn mặt trong ảnh, lọc các khuôn mặt không đạt chuẩn và trích xuất embedding.

    Args:
        image: Ảnh đầu vào dưới dạng một numpy array (định dạng BGR).

    Returns:
        Một tuple (data, error):
        - data (dict): Chứa "embedding", "quality", "bbox" nếu thành công.
        - error (str): Một chuỗi mô tả lỗi nếu thất bại.
    """
    # Sử dụng mô hình để phát hiện và phân tích các khuôn mặt trong ảnh
    faces = app.get(image)

    # Lỗi: Không tìm thấy khuôn mặt nào
    if len(faces) == 0:
        return None, "NO_FACE_DETECTED"

    # Lỗi: Tìm thấy nhiều hơn một khuôn mặt, không xác định được đối tượng chính
    if len(faces) > 1:
        return None, "MULTIPLE_FACES_DETECTED"

    face = faces[0]

    # --- Lọc khuôn mặt dựa trên các tiêu chí chất lượng ---

    # 1. Lọc dựa trên góc mặt (pose)
    yaw, pitch, _ = face.pose
    if abs(yaw) > MAX_YAW_ANGLE or abs(pitch) > MAX_PITCH_ANGLE:
        return None, "BAD_POSE"

    # 2. Lọc dựa trên điểm tin cậy (confidence score) của mô hình
    if face.det_score < MIN_DETECTION_CONFIDENCE:
        return None, "LOW_CONFIDENCE_SCORE"

    # Tính toán embedding và chất lượng
    embedding = face.embedding
    quality = _calculate_quality(image, face)
    
    # Chuyển đổi bounding box sang list số nguyên để đảm bảo an toàn khi serialize
    bbox = face.bbox.astype(int).tolist()

    return {
        "embedding": embedding,
        "quality": quality,
        "bbox": bbox
    }, None


def _calculate_quality(image: np.ndarray, face) -> float:
    """
    Hàm nội bộ, tính toán một điểm chất lượng tùy chỉnh cho khuôn mặt được phát hiện.
    Điểm này dựa trên sự kết hợp của:
    1. Độ nét (Blurriness): Dùng phương sai của ảnh Laplacian.
    2. Kích thước (Size): Tỷ lệ diện tích khuôn mặt so với toàn bộ ảnh.
    3. Ánh sáng (Lighting): Độ sáng trung bình của ảnh.
    """
    # Chuyển ảnh sang thang độ xám để tính toán độ sáng và độ mờ
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 1. Tính điểm độ nét (Blur Score)
    # Phương sai của toán tử Laplacian càng cao, ảnh càng nét.
    blur_variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    blur_score = min(1.0, blur_variance / BLUR_NORMALIZATION_FACTOR) # Chuẩn hóa về thang điểm [0, 1]

    # 2. Tính điểm kích thước (Size Score)
    bbox = face.bbox
    face_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
    img_area = image.shape[0] * image.shape[1]
    # Tỷ lệ diện tích khuôn mặt so với ảnh, đảm bảo không lớn hơn 1.
    size_score = min(1.0, face_area / img_area)

    # 3. Tính điểm ánh sáng (Lighting Score)
    brightness = np.mean(gray)
    if BRIGHTNESS_LOWER_BOUND < brightness < BRIGHTNESS_UPPER_BOUND:
        lighting_score = 1.0
    else:
        lighting_score = BAD_LIGHTING_PENALTY_SCORE

    # 4. Tính điểm chất lượng cuối cùng
    # Là một tổng có trọng số của các điểm thành phần.
    quality = (blur_score * QUALITY_WEIGHT_BLUR +
               size_score * QUALITY_WEIGHT_SIZE +
               lighting_score * QUALITY_WEIGHT_LIGHTING)
    
    # Đảm bảo điểm cuối cùng không vượt quá 1.0
    return float(min(1.0, quality))
