import torch
import cv2
import numpy as np
import os
from typing import List, Tuple

# Giả định file MiniFASNet.py đã được di chuyển đến cùng thư mục
# để có thể import một cách an toàn.
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
# Đặt thành 'cuda' hoặc 'cuda:0' để sử dụng GPU.
DEVICE_NAME = os.environ.get('TORCH_DEVICE', 'cpu')
DEVICE = torch.device(DEVICE_NAME)

# --- Model and Preprocessing Configuration ---
MODEL_INPUT_SIZE = (80, 80)
# Giá trị chuẩn hóa này là tiêu chuẩn cho nhiều mô hình xử lý ảnh,
# đưa pixel range từ [0, 255] về [-1, 1].
NORMALIZATION_MEAN = 127.5
NORMALIZATION_STD = 128.0

# --- Logic Thresholds ---
# Ngưỡng score để một khung hình được coi là "live" (người thật).
LIVE_SCORE_THRESHOLD = 0.6
# Tỷ lệ số khung hình "live" cần thiết trên tổng số khung hình để
# kết luận toàn bộ video/chuỗi ảnh là "live".
VOTING_RATIO_THRESHOLD = 0.7


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
    
    try:
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
    except FileNotFoundError:
        raise RuntimeError(f"Anti-spoofing model not found at path: {MODEL_PATH}")

    # Xử lý state_dict:
    # Đoạn code này cần thiết khi mô hình được huấn luyện bằng `torch.nn.DataParallel`,
    # khiến cho tên của mỗi layer có tiền tố "module.". Khi load mô hình trên một
    # thiết bị đơn (không có DataParallel), chúng ta cần xóa tiền tố này đi.
    new_state_dict = {}
    for k, v in state_dict.items():
        new_key = k.replace("module.", "")
        new_state_dict[new_key] = v

    model.load_state_dict(new_state_dict)
    model.eval()
    return model

model = _load_model()


# =========================
# IMAGE PROCESSING FUNCTIONS
# =========================
def _preprocess(image: np.ndarray) -> torch.Tensor:
    """Tiền xử lý ảnh trước khi đưa vào mô hình."""
    img = cv2.resize(image, MODEL_INPUT_SIZE)
    img = img.astype(np.float32)
    # Chuẩn hóa ảnh về khoảng [-1, 1]
    img = (img - NORMALIZATION_MEAN) / NORMALIZATION_STD
    
    # Thay đổi thứ tự trục từ (Height, Width, Channel) sang (Channel, Height, Width)
    img = np.transpose(img, (2, 0, 1))
    # Thêm một chiều (dimension) cho batch
    img = np.expand_dims(img, axis=0)
    
    return torch.from_numpy(img).float()

def _crop_face(image: np.ndarray, bbox: List[float]) -> np.ndarray | None:
    """Cắt vùng chứa khuôn mặt từ ảnh gốc dựa vào bounding box."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = map(int, bbox)

    # Giới hạn tọa độ để đảm bảo không vượt ra ngoài kích thước ảnh
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w - 1, x2)
    y2 = min(h - 1, y2)

    # Kiểm tra nếu bounding box không hợp lệ
    if x1 >= x2 or y1 >= y2:
        return None

    face = image[y1:y2, x1:x2]

    # Kiểm tra nếu vùng cắt ra bị rỗng
    if face.size == 0:
        return None

    return face


# =========================
# CORE PREDICTION FUNCTIONS
# =========================
def _get_spoof_score(image: np.ndarray) -> float:
    """
    Tính toán điểm "live" cho một ảnh khuôn mặt đã được cắt.

    Args:
        image: Ảnh khuôn mặt.

    Returns:
        Một score từ 0.0 (spoof) đến 1.0 (live).

    Raises:
        AntiSpoofingError: Nếu có lỗi xảy ra trong quá trình xử lý.
    """
    try:
        input_tensor = _preprocess(image).to(DEVICE)

        with torch.no_grad():
            output = model(input_tensor)
            # Dùng softmax để chuyển output thành xác suất
            probabilities = torch.softmax(output, dim=1)

        # Lấy xác suất của lớp "live" (giả sử lớp 1 là "live")
        live_probability = probabilities[0, 1].item()
        return float(live_probability)

    except Exception as e:
        # Ném ra một exception tùy chỉnh để lớp gọi có thể xử lý một cách tường minh
        raise AntiSpoofingError(f"Failed to get spoof score: {e}") from e


def anti_spoof_multi(images: List[np.ndarray], bboxes: List[List[float]]) -> Tuple[bool, List[float]]:
    """
    Thực hiện anti-spoofing trên một chuỗi các ảnh và bounding box tương ứng.

    Args:
        images: Danh sách các ảnh gốc.
        bboxes: Danh sách các bounding box cho mỗi ảnh.

    Returns:
        - is_live (bool): True nếu được xác định là người thật.
        - scores (list): Danh sách các điểm "live" cho mỗi khung hình.
    """
    scores = []

    for img, bbox in zip(images, bboxes):
        face = _crop_face(img, bbox)

        if face is None:
            scores.append(0.0)  # Gán score 0.0 cho các frame không cắt được mặt
            continue

        try:
            score = _get_spoof_score(face)
            scores.append(score)
        except AntiSpoofingError as e:
            # Ghi lại lỗi và coi như frame này không hợp lệ
            logging.warning(str(e))
            scores.append(-1.0) # Dùng giá trị âm để đánh dấu lỗi xử lý

    # Logic biểu quyết (voting):
    # Chỉ tính các score hợp lệ (không phải lỗi xử lý)
    valid_scores = [s for s in scores if s >= 0.0]
    if not valid_scores:
        return False, scores # Nếu không có frame nào xử lý được

    # Đếm số frame được coi là "live"
    live_frames_count = sum(1 for s in valid_scores if s > LIVE_SCORE_THRESHOLD)
    
    # Tổng số frame đã được xử lý thành công
    processed_frames_count = len(valid_scores)

    # Biểu quyết
    is_live = (live_frames_count / processed_frames_count) >= VOTING_RATIO_THRESHOLD if processed_frames_count > 0 else False

    return is_live, scores
