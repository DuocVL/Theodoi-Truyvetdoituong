
import torch
import cv2
import numpy as np
import os
import logging
from typing import List, Tuple

# Import trực tiếp MiniFASNet.py, giả định nó nằm cùng cấp thư mục.
# Điều này giúp loại bỏ nhu cầu sử dụng sys.path.append.
from MiniFASNet import MiniFASNetV2

# =========================
# CONSTANTS AND CONFIGURATION
# =========================

# --- Path and Device Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(
    BASE_DIR,
    "Silent-Face-Anti-Spoofing",
    "resources",
    "anti_spoof_models",
    "2.7_80x80_MiniFASNetV2.pth"
)

# Đọc cấu hình thiết bị từ biến môi trường. Mặc định là 'cpu'.
# Đặt biến TORCH_DEVICE=cuda để dùng GPU.
DEVICE_NAME = os.environ.get('TORCH_DEVICE', 'cpu')
DEVICE = torch.device(DEVICE_NAME)

# --- Model and Preprocessing Configuration ---
MODEL_INPUT_SIZE = (80, 80)
NORMALIZATION_MEAN = 127.5
NORMALIZATION_STD = 128.0

# --- Logic Thresholds (Đã được chuyển sang file main.py để quản lý theo security_level) ---
# Các giá trị này chỉ còn mang tính tham khảo hoặc mặc định.
# LIVE_SCORE_THRESHOLD = 0.6
# VOTING_RATIO_THRESHOLD = 0.7


# =========================
# EXCEPTION DEFINITION
# =========================
class AntiSpoofingError(Exception):
    """Exception tùy chỉnh cho các lỗi xảy ra trong quá trình anti-spoofing."""
    pass


# =========================
# MODEL INITIALIZATION
# =========================
def _load_model() -> MiniFASNetV2:
    """Tải và chuẩn bị mô hình anti-spoofing."""
    model = MiniFASNetV2(conv6_kernel=(5, 5)).to(DEVICE)
    
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Anti-spoofing model not found at path: {MODEL_PATH}")

    state_dict = torch.load(MODEL_PATH, map_location=DEVICE)

    # Xử lý state_dict: Xóa tiền tố "module." nếu có.
    # Điều này cần thiết khi mô hình được train với `torch.nn.DataParallel` 
    # nhưng lại được load trên một thiết bị đơn.
    new_state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}

    model.load_state_dict(new_state_dict)
    model.eval()
    logging.info(f"Anti-spoofing model loaded on device: {DEVICE_NAME}")
    return model

model = _load_model()


# =========================
# IMAGE PROCESSING FUNCTIONS
# =========================
def _preprocess(image: np.ndarray) -> torch.Tensor:
    """Tiền xử lý ảnh trước khi đưa vào mô hình."""
    img = cv2.resize(image, MODEL_INPUT_SIZE)
    img = img.astype(np.float32)
    img = (img - NORMALIZATION_MEAN) / NORMALIZATION_STD
    img = np.transpose(img, (2, 0, 1)) # HWC -> CHW
    img = np.expand_dims(img, axis=0) # Add batch dimension
    return torch.from_numpy(img).float()

def _crop_face(image: np.ndarray, bbox: List[float]) -> Optional[np.ndarray]:
    """Cắt vùng chứa khuôn mặt từ ảnh gốc."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = map(int, bbox)

    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w - 1, x2)
    y2 = min(h - 1, y2)

    if x1 >= x2 or y1 >= y2: return None
    face = image[y1:y2, x1:x2]
    return face if face.size > 0 else None


# =========================
# CORE PREDICTION FUNCTIONS
# =========================
def _get_spoof_score(image: np.ndarray) -> float:
    """
    Tính toán điểm "live" cho một ảnh khuôn mặt đã được cắt.
    Raises: AntiSpoofingError nếu có lỗi.
    """
    try:
        input_tensor = _preprocess(image).to(DEVICE)
        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.softmax(output, dim=1)
        # Lớp 1 (index 1) là "live"
        return float(probabilities[0, 1].item())
    except Exception as e:
        raise AntiSpoofingError(f"Failed to get spoof score: {e}") from e

def anti_spoof_multi(images: List[np.ndarray], bboxes: List[List[float]]) -> Tuple[bool, List[float]]:
    """
    Thực hiện anti-spoofing trên một chuỗi các ảnh.
    Trả về một cờ is_live chung (để tham khảo) và danh sách các score chi tiết.
    """
    scores = []
    for img, bbox in zip(images, bboxes):
        face = _crop_face(img, bbox)
        if face is None:
            scores.append(0.0) # Gán score 0.0 cho frame không cắt được mặt
            continue

        try:
            score = _get_spoof_score(face)
            scores.append(score)
        except AntiSpoofingError as e:
            logging.warning(str(e))
            scores.append(-1.0) # Dùng giá trị âm để đánh dấu lỗi xử lý

    # Logic biểu quyết chung (có thể không được dùng trong main.py mới)
    valid_scores = [s for s in scores if s >= 0.0]
    if not valid_scores: return False, scores
    live_frames_count = sum(1 for s in valid_scores if s > 0.6)
    is_live = (live_frames_count / len(valid_scores)) >= 0.7 if valid_scores else False
    return is_live, scores
