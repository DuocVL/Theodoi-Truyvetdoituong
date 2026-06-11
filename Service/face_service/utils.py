import numpy as np
import cv2
import logging
from typing import List, Optional, Tuple

# Cấu hình logging để ghi lại các lỗi tiềm ẩn
logging.basicConfig(level=logging.INFO)

# Định nghĩa một hằng số cho ngưỡng khoảng cách, giúp quản lý tập trung.
# Giá trị này có thể được import từ một file config chung.
MAX_INTRA_PERSON_DISTANCE_THRESHOLD = 0.55

def read_image(file_bytes: bytes) -> Optional[np.ndarray]:
    """
    Đọc dữ liệu byte của một file ảnh và chuyển đổi thành một numpy array (BGR).

    Args:
        file_bytes: Dữ liệu byte của file ảnh.

    Returns:
        Một numpy array đại diện cho ảnh nếu thành công, ngược lại trả về None.
    """
    try:
        # Chuyển đổi buffer byte thành một mảng uint8
        np_arr = np.frombuffer(file_bytes, np.uint8)
        # Decode mảng thành ảnh màu (BGR)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            logging.warning("Failed to decode image. The file may be corrupt or in an unsupported format.")
        
        return img
    except Exception as e:
        logging.error(f"An unexpected error occurred in read_image: {e}")
        return None

def cosine_distance(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Tính khoảng cách cosine giữa hai vector embedding.
    Lưu ý: Hàm này giả định các vector đầu vào CHƯA được chuẩn hóa.

    Args:
        embedding1: Vector embedding thứ nhất.
        embedding2: Vector embedding thứ hai.

    Returns:
        Khoảng cách cosine (giá trị từ 0.0 đến 2.0).
    """
    # Tính toán dot product
    dot_product = np.dot(embedding1, embedding2)
    
    # Tính toán norm (độ dài) của mỗi vector
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    
    # Tránh chia cho zero nếu một trong các vector có độ dài bằng 0
    if norm1 == 0 or norm2 == 0:
        return 1.0 # Trả về khoảng cách trung bình nếu có lỗi
        
    # Cosine similarity = dot / (norm1 * norm2)
    # Cosine distance = 1 - similarity
    return 1.0 - (dot_product / (norm1 * norm2))

def is_same_person(embeddings: List[np.ndarray], threshold: float = MAX_INTRA_PERSON_DISTANCE_THRESHOLD) -> bool:
    """
    Kiểm tra xem một danh sách các embedding có thuộc về cùng một người hay không.
    Logic: Tính embedding trung tâm (centroid) và kiểm tra xem khoảng cách từ mỗi
    embedding tới centroid có nằm trong một ngưỡng cho phép hay không.
    
    Lưu ý: Hàm này giả định các embedding đầu vào đã được chuẩn hóa.

    Args:
        embeddings: Danh sách các vector embedding (đã được chuẩn hóa).
        threshold: Ngưỡng khoảng cách tối đa cho phép.

    Returns:
        True nếu tất cả embedding đều của cùng một người, ngược lại là False.
    """
    if len(embeddings) < 2:
        return True # Nếu chỉ có 1 hoặc 0 embedding, mặc định là đúng

    # Tính centroid. Vì các vector đã được chuẩn hóa, centroid cũng cần được chuẩn hóa lại.
    centroid = np.mean(embeddings, axis=0)
    centroid_norm = np.linalg.norm(centroid)
    if centroid_norm == 0:
        return False # Trường hợp hiếm gặp

    normalized_centroid = centroid / centroid_norm

    for emb in embeddings:
        # Vì cả `emb` và `normalized_centroid` đều đã được chuẩn hóa,
        # np.dot(emb, normalized_centroid) chính là cosine similarity.
        similarity = np.dot(emb, normalized_centroid)
        distance = 1.0 - similarity
        
        if distance > threshold:
            logging.info(f"Inconsistent identity detected. Distance to centroid: {distance} > threshold: {
