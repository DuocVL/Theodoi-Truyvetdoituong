import cv2
import numpy as np


def read_image(file_bytes):

    np_arr = np.frombuffer(
        file_bytes,
        np.uint8
    )

    return cv2.imdecode(
        np_arr,
        cv2.IMREAD_COLOR
    )


def cosine_distance(a, b):

    a = np.array(a)
    b = np.array(b)

    return float(
        1 -
        (
            np.dot(a, b)
            /
            (
                np.linalg.norm(a)
                *
                np.linalg.norm(b)
            )
        )
    )