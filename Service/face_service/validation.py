import numpy as np

from utils import cosine_distance


IDENTITY_THRESHOLD = 0.45


def validate_same_person(
    embeddings,
    threshold=IDENTITY_THRESHOLD
):
    n = len(embeddings)

    for i in range(n):
        for j in range(i + 1, n):

            dist = cosine_distance(
                embeddings[i],
                embeddings[j]
            )

            if dist > threshold:
                return False, dist

    return True, None


def calculate_centroid(
    embeddings
):
    centroid = np.mean(
        embeddings,
        axis=0
    )

    centroid = (
        centroid /
        np.linalg.norm(centroid)
    )

    return centroid.tolist()