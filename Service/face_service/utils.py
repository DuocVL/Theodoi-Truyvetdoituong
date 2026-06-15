
import numpy as np
import cv2
import logging
from typing import List, Optional, Tuple

# Cấu hình logging cơ bản để ghi lại các lỗi và cảnh báo
logging.basicConfig(level=logging.INFO)


def read_image(file_bytes: bytes) -> Optional[np.ndarray]:
    """
    Đọc dữ liệu byte của một file ảnh và chuyển đổi thành một numpy array (BGR).

    Args:
        file_bytes: Dữ liệu byte của file ảnh.

    Returns:
        Một numpy array đại diện cho ảnh nếu thành công, ngược lại trả về None.
    """
    try:
        np_arr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            logging.warning("Failed to decode image. File may be corrupt or in an unsupported format.")
        
        return img
    except Exception as e:
        logging.error(f"An unexpected error occurred in read_image: {e}")
        return None

def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    """
    Tính khoảng cách cosine giữa hai vector. 
    Hàm này giả định các vector đầu vào ĐÃ được chuẩn hóa (normalized).
    """
    # Khi vector đã được chuẩn hóa, dot product chính là cosine similarity
    cosine_similarity = np.dot(a, b)
    # Khoảng cách = 1 - độ tương đồng. Giới hạn giá trị trong khoảng [0, 2] để tránh lỗi float.
    return float(np.clip(1.0 - cosine_similarity, 0.0, 2.0))

def is_same_person(
    embeddings: List[np.ndarray], 
    threshold: float = 0.5 # Ngưỡng này có thể được truyền từ config
) -> bool:
    """
    Kiểm tra xem một danh sách các embedding có thuộc về cùng một người hay không.
    Logic: Tính embedding trung tâm (centroid) và kiểm tra khoảng cách từ mỗi
    embedding tới centroid có nằm trong ngưỡng cho phép hay không.
    
    Lưu ý: Hàm này giả định các embedding đầu vào đã được chuẩn hóa.

    Args:
        embeddings: Danh sách các vector embedding (đã được chuẩn hóa).
        threshold: Ngưỡng khoảng cách tối đa cho phép.

    Returns:
        True nếu tất cả embedding được coi là của cùng một người, ngược lại là False.
    """
    if not embeddings:
        return False # Không có embedding nào để kiểm tra
    if len(embeddings) == 1:
        return True # Nếu chỉ có 1, mặc định là đúng

    # Tính centroid và chuẩn hóa nó
    centroid = np.mean(embeddings, axis=0)
    centroid_norm = np.linalg.norm(centroid)
    if centroid_norm == 0:
        return False
    normalized_centroid = centroid / centroid_norm

    # Kiểm tra khoảng cách từ mỗi embedding tới centroid
    for emb in embeddings:
        dist = cosine_distance(emb, normalized_centroid)
        if dist > threshold:
            return False
            
    return True

def compute_weighted_centroid(embeddings: List[np.ndarray], qualities: List[float]) -> np.ndarray:
    """
    Tính toán embedding trung tâm (centroid) có trọng số từ một danh sách các embedding.
    Các embedding có chất lượng (quality) cao hơn sẽ có ảnh hưởng lớn hơn.

    Args:
        embeddings: Danh sách các vector embedding (nên được chuẩn hóa trước).
        qualities: Danh sách các điểm chất lượng tương ứng.

    Returns:
        Một vector embedding trung tâm đã được chuẩn hóa.
    """
    if not embeddings or not qualities:
        return np.array([])
        
    embeddings_arr = np.array(embeddings)
    qualities_arr = np.array(qualities)

    # Tính trung bình có trọng số
    weighted_centroid = np.average(embeddings_arr, axis=0, weights=qualities_arr)
    
    # Chuẩn hóa centroid cuối cùng
    centroid_norm = np.linalg.norm(weighted_centroid)
    
    if centroid_norm == 0:
        logging.warning("Weighted centroid norm is zero, falling back to unweighted average.")
        fallback_centroid = np.mean(embeddings_arr, axis=0)
        fallback_norm = np.linalg.norm(fallback_centroid)
        return fallback_centroid / fallback_norm if fallback_norm != 0 else np.array([])

    return weighted_centroid / centroid_norm
