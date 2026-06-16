
import numpy as np
import cv2

def def read_image(content: bytes) -> np.ndarray | None:
    """
    Đọc nội dung của một file ảnh (dạng bytes) và chuyển nó thành một numpy array mà cv2 có thể sử dụng.

    Args:
        content: Nội dung của file ảnh.

    Returns:
        Một numpy array đại diện cho ảnh, hoặc None nếu không thể giải mã.
    """
    try:
        # Chuyển đổi bytes thành một numpy array
        np_arr = np.frombuffer(content, np.uint8)
        # Giải mã array đó thành một ảnh (với định dạng màu BGR mặc định của OpenCV)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        # Nếu có lỗi xảy ra trong quá trình giải mã (ví dụ: file không phải là ảnh)
        print(f"[ERROR] in read_image: Could not decode image - {e}")
        return None

def cosine_distance(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Tính toán khoảng cách cosine giữa hai vector embedding đã được chuẩn hóa.

    Args:
        embedding1: Vector embedding thứ nhất (đã được chuẩn hóa L2).
        embedding2: Vector embedding thứ hai (đã được chuẩn hóa L2).

    Returns:
        Một số float đại diện cho khoảng cách cosine. 
        Giá trị càng gần 0, hai vector càng giống nhau.
    """
    # Phép nhân tích vô hướng (dot product) của hai vector đã chuẩn hóa chính là cosine similarity
    similarity = np.dot(embedding1, embedding2)
    
    # Khoảng cách Cosine = 1 - Độ tương đồng Cosine
    # Giới hạn giá trị trong khoảng [0, 2] để tránh các lỗi số học nhỏ
    distance = 1 - similarity
    return max(0, min(distance, 2)) # Đảm bảo kết quả không âm
