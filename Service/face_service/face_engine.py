import cv2
import numpy as np
from insightface.app import FaceAnalysis

app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0)  # CPU: -1


def detect_and_embed(image: np.ndarray):
    faces = app.get(image)

    if len(faces) == 0:
        return None, "NO_FACE"

    if len(faces) > 1:
        return None, "MULTIPLE_FACES"

    face = faces[0]

    # pose filter
    yaw, pitch, roll = face.pose
    if abs(yaw) > 20 or abs(pitch) > 20:
        return None, "BAD_POSE"

    if face.det_score < 0.7:
        return None, "LOW_CONFIDENCE"

    embedding = face.embedding.tolist()
    quality = calc_quality(image, face)

    return {
        "embedding": embedding,
        "quality": quality,
        "bbox": face.bbox
    }, None


def calc_quality(image, face):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur = cv2.Laplacian(gray, cv2.CV_64F).var()

    bbox = face.bbox
    face_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
    img_area = image.shape[0] * image.shape[1]

    size_score = face_area / img_area

    brightness = np.mean(gray)
    light_score = 1.0 if 50 < brightness < 200 else 0.3

    quality = min(1.0, (blur / 100) * 0.4 + size_score * 0.4 + light_score * 0.2)

    return float(quality)