import torch
import cv2
import numpy as np
import os

# ===== CONFIG =====
MODEL_PATH = "Silent-Face-Anti-Spoofing/resources/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth"
DEVICE = "cpu"

# ===== LOAD MODEL =====
model = torch.jit.load(MODEL_PATH, map_location=DEVICE)
model.eval()


# ===== PREPROCESS =====
def preprocess(image):
    img = cv2.resize(image, (80, 80))
    img = img.astype(np.float32) / 255.0
    img = (img - 0.5) / 0.5  # normalize [-1,1]

    img = np.transpose(img, (2, 0, 1))  # HWC → CHW
    img = np.expand_dims(img, axis=0)

    return torch.tensor(img, dtype=torch.float32)


# ===== PREDICT =====
def anti_spoof_score(image):
    """
    return: score [0,1] (càng cao càng là người thật)
    """
    try:
        input_tensor = preprocess(image)

        with torch.no_grad():
            output = model(input_tensor)

        prob = torch.softmax(output, dim=1)

        # class 1 = live
        live_score = prob[0][1].item()

        return live_score

    except Exception as e:
        return 0.0


def anti_spoof_multi(frames):
    scores = [anti_spoof_score(f) for f in frames]

    valid = [s for s in scores if s > 0.6]

    return len(valid) >= int(len(frames) * 0.7), scores