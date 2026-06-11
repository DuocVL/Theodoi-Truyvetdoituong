from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# =========================
# API REQUEST MODELS
# =========================
# Các model này không thực sự cần thiết vì dữ liệu được gửi qua Form,
# nhưng việc định nghĩa chúng giúp làm rõ ràng hơn những gì API mong đợi.
class VerifyRequestForm(BaseModel):
    stored_embedding: str = Field(
        ...,
        description="Chuỗi JSON của một list các số thực, đại diện cho embedding đã lưu."
    )

# =========================
# API RESPONSE MODELS
# =========================

class RegisterResponse(BaseModel):
    """
    Schema cho phản hồi của endpoint /register.
    """
    success: bool = Field(..., description="True nếu đăng ký thành công.")
    centroid: Optional[List[float]] = Field(None, description="Vector embedding trung tâm nếu thành công.")
    message: Optional[str] = Field(None, description="Thông điệp lỗi nếu thất bại.")

class VerifyDetails(BaseModel):
    """
    Schema cho các thông tin chi tiết trong quá trình xác thực.
    """
    valid_matches: Optional[int] = Field(None, description="Số lượng khung hình khớp với embedding đã lưu.")
    required_matches: int = Field(description="Số lượng khung hình khớp tối thiểu được yêu cầu.")
    mean_variance: Optional[float] = Field(None, description="Phương sai trung bình của các embedding (để phát hiện replay attack).")


class VerifyResponse(BaseModel):
    """
    Schema cho phản hồi của endpoint /verify.
    """
    matched: bool = Field(..., description="True nếu khuôn mặt được xác thực thành công.")
    reason: Optional[str] = Field(None, description="Lý do thất bại (ví dụ: SPOOF_DETECTED, VIDEO_REPLAY_DETECTED).")
    distances: Optional[List[float]] = Field(None, description="Danh sách các khoảng cách cosine từ các khung hình tới embedding đã lưu.")
    avg_distance: Optional[float] = Field(None, description="Khoảng cách cosine trung bình.")
    spoof_scores: Optional[List[float]] = Field(None, description="Danh sách điểm anti-spoofing cho mỗi khung hình.")
    details: Optional[Dict[str, Any]] = Field(None, description="Các thông tin chi tiết khác về quá trình xác thực.")

# Bạn có thể thêm các schema cho các lỗi HTTP phổ biến nếu cần
class HTTPError(BaseModel):
    detail: str

    class Config:
        schema_extra = {
            "example": {"detail": "HTTP Exception"},
        }
