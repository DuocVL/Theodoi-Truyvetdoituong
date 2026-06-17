import cv2
import numpy as np
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_s")
app.prepare(ctx_id=0)


def detect_and_embed(image):

    faces = app.get(image)

    if len(faces) == 0:
        return None, "NO_FACE"

    if len(faces) > 1:
        return None, "MULTIPLE_FACES"

    face = faces[0]

    embedding = face.embedding.astype(np.float32)

    embedding = (
        embedding /
        np.linalg.norm(embedding)
    )

    quality = calc_quality(
        image,
        face
    )

    return {
        "embedding": embedding.tolist(),
        "quality": quality
    }, None


def calc_quality(image, face):

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    blur_score = cv2.Laplacian(
        gray,
        cv2.CV_64F
    ).var()

    bbox = face.bbox

    face_area = (
        (bbox[2] - bbox[0]) *
        (bbox[3] - bbox[1])
    )

    image_area = (
        image.shape[0] *
        image.shape[1]
    )

    size_score = (
        face_area /
        image_area
    )

    quality = (
        min(blur_score / 100.0, 1.0)
        * 0.5
        +
        min(size_score * 5, 1.0)
        * 0.5
    )

    return float(quality)