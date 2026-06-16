
import numpy as np
import cv2
import insightface
from insightface.app import FaceAnalysis

# =========================
# MODEL INITIALIZATION
# =========================
# Chỉ cần thực hiện một lần khi service khởi động

# Khởi tạo FaceAnalysis. Đây là model chính để xử lý khuôn mặt.
# 'buffalo_l' là một model tổng hợp mạnh mẽ của insightface.
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640)) # ctx_id=0 cho CPU

print("InsightFace model loaded successfully on CPU.")

# =========================
# CORE FUNCTION
# =========================

def detect_and_embed(image: np.ndarray):
    """
    Phát hiện khuôn mặt trong ảnh và trích xuất vector embedding.

    Args:
        image: Ảnh đầu vào dưới dạng một numpy array (đã được đọc bằng cv2).

    Returns:
        Một tuple (data, error):
        - data (dict): Chứa embedding nếu thành công.
        - error (str): Thông báo lỗi nếu thất bại.
    """
    try:
        # Sử dụng model để tìm tất cả các khuôn mặt trong ảnh
        faces = app.get(image)

        # Xử lý các trường hợp không tìm thấy hoặc tìm thấy quá nhiều khuôn mặt
        if not faces:
            return None, "NO_FACE_DETECTED: Không tìm thấy khuôn mặt nào trong ảnh."
        
        if len(faces) > 1:
            return None, f"MULTIPLE_FACES_DETECTED: Tìm thấy {len(faces)} khuôn mặt. Vui lòng chỉ cung cấp ảnh có một khuôn mặt."

        # Lấy embedding từ khuôn mặt duy nhất đã tìm thấy
        face = faces[0]
        embedding = face.normed_embedding

        return {"embedding": embedding}, None

    except Exception as e:
        # Bắt các lỗi không mong muốn khác trong quá trình xử lý
        print(f"[ERROR] in detect_and_embed: {e}")
        return None, f"INTERNAL_ERROR: Đã có lỗi xảy ra trong quá trình xử lý ảnh: {e}"

