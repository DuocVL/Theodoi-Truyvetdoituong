Cách chạy dự án
cd Service/face_service
venv
venv\Scripts\activate
pip install --upgrade pip

pip install fastapi uvicorn insightface opencv-python numpy python-multipart onnxruntime
pip install onnxruntime-gpu
chạy
uvicorn main:app --host 0.0.0.0 --port 8000

- khắc phục lỗi đường dẫn
cd Slient-Face-Anti-Spoofing
- Cấu hình Git chấp nhận đường dẫn lạ
git config core.protectNTFS false
- Khôi phục lại tập tin
git checkout -f HEAD