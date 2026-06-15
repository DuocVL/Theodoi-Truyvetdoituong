
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# =========================
# API RESPONSE MODELS
# =========================

class RegisterResponse(BaseModel):
    """
    Schema cho phản hồi của endpoint /register.
    """
    success: bool = Field(..., description="True nếu đăng ký thành công.")
    centroid: Optional[List[float]] = Field(None, description="Vector embedding trung tâm nếu đăng ký thành công.")
    message: str = Field(..., description="Thông điệp kết quả, ví dụ: 'Successfully registered' hoặc lý do thất bại.")


class VerifyResponse(BaseModel):
    """
    Schema cho phản hồi của endpoint /verify.
    """
    matched: bool = Field(..., description="True nếu khuôn mặt được xác thực thành công.")
    reason: Optional[str] = Field(None, description="Lý do thất bại (ví dụ: SPOOF_DETECTED, NOT_ENOUGH_FRAMES).")
    distances: Optional[List[float]] = Field(None, description="Danh sách các khoảng cách cosine từ các khung hình tới embedding đã lưu.")
    avg_distance: Optional[float] = Field(None, description="Khoảng cách cosine trung bình của các khung hình hợp lệ.")
    spoof_scores: Optional[List[float]] = Field(None, description="Danh sách điểm anti-spoofing cho mỗi khung hình (-1.0 nếu có lỗi). ")
    details: Optional[Dict[str, Any]] = Field(None, description="Các thông tin chi tiết khác về quá trình xác thực (cấp độ bảo mật, số frame khớp, ...).")


# =========================
# HTTP ERROR MODEL
# =========================

class HTTPError(BaseModel):
    """
    Schema cho các lỗi HTTP do client gây ra (ví dụ: 4xx).
    """
    detail: str

    class Config:
        schema_extra = {
            "example": {"detail": "Invalid input data"},
        }
