import torch
import cv2
import numpy as np
import sys
import os

# =========================
# PATH SETUP
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SPOOF_DIR = os.path.join(BASE_DIR, "Silent-Face-Anti-Spoofing")

sys.path.append(SPOOF_DIR)

from src.model_lib.MiniFASNet import MiniFASNetV2

MODEL_PATH = os.path.join(
    SPOOF_DIR,
    "resources",
    "anti_spoof_models",
    "2.7_80x80_MiniFASNetV2.pth"
)

DEVICE = torch.device("cpu")


# =========================
# LOAD MODEL (FIXED)
# =========================
model = MiniFASNetV2(conv6_kernel=(5, 5)).to(DEVICE)

state_dict = torch.load(MODEL_PATH, map_location=DEVICE)

# 🔥 FIX: remove "module." prefix nếu có
new_state_dict = {}
for k, v in state_dict.items():
    new_key = k.replace("module.", "")
    new_state_dict[new_key] = v

model.load_state_dict(new_state_dict)
model.eval()


# =========================
# PREPROCESS (CHUẨN)
# =========================
def preprocess(image):
    img = cv2.resize(image, (80, 80))

    img = img.astype(np.float32)
    img = (img - 127.5) / 128.0   # 🔥 chuẩn repo

    img = np.transpose(img, (2, 0, 1))  # HWC → CHW
    img = np.expand_dims(img, axis=0)

    return torch.tensor(img, dtype=torch.float32)


# =========================
# FACE CROP (QUAN TRỌNG)
# =========================
def crop_face(image, bbox):
    h, w = image.shape[:2]

    x1, y1, x2, y2 = map(int, bbox)

    # clamp tránh out of range
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w, x2)
    y2 = min(h, y2)

    face = image[y1:y2, x1:x2]

    if face.size == 0:
        return None

    return face


# =========================
# SINGLE SCORE
# =========================
def anti_spoof_score(image):
    try:
        input_tensor = preprocess(image).to(DEVICE)

        with torch.no_grad():
            output = model(input_tensor)

        prob = torch.softmax(output, dim=1)

        # class 1 = live
        return float(prob[0][1].item())

    except Exception as e:
        print("Anti-spoof error:", e)
        return 0.0


# =========================
# MULTI FRAME (CHUẨN)
# =========================
def anti_spoof_multi(images, bboxes):
    scores = []

    for img, bbox in zip(images, bboxes):
        face = crop_face(img, bbox)

        if face is None:
            scores.append(0.0)
            continue

        score = anti_spoof_score(face)
        scores.append(score)

    # voting
    valid = [s for s in scores if s > 0.6]

    is_live = len(valid) >= int(len(scores) * 0.7)

    return is_live, scores