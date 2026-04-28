import numpy as np
import cv2


def read_image(file_bytes):
    np_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

def cosine_distance(a, b):
    return 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def is_same_person(embeddings, threshold=0.45):
    centroid = np.mean(embeddings, axis=0)
    centroid = centroid / np.linalg.norm(centroid)

    for emb in embeddings:
        dist = cosine_distance(emb, centroid)
        if dist > threshold:
            return False, dist

    return True, None

def compute_weighted_centroid(embeddings, qualities):
    embeddings = np.array(embeddings)
    qualities = np.array(qualities)

    centroid = np.average(embeddings, axis=0, weights=qualities)
    centroid = centroid / np.linalg.norm(centroid)

    return centroid