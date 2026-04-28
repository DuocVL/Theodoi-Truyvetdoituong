import cv2
import os
import numpy as np
import random

BASE_DIR = "test_data"

# =========================
# CREATE FOLDERS
# =========================
folders = [
    "enroll/user_01",
    "verify/same_person",
    "verify/different_person",
    "verify/spoof_image",
    "verify/replay_video",
    "verify/low_quality",
    "verify/bad_pose",
    "verify/multi_faces",
    "verify/no_face"
]

for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)


# =========================
# CAPTURE IMAGES FROM WEBCAM
# =========================
def capture_images(save_dir, count=10, label="Capture"):
    cap = cv2.VideoCapture(0)
    saved = 0

    print(f"[INFO] Capturing {count} images for {save_dir}")

    while saved < count:
        ret, frame = cap.read()
        if not ret:
            break

        cv2.imshow(label, frame)

        key = cv2.waitKey(1)

        if key == ord('c'):
            path = os.path.join(save_dir, f"{saved}.jpg")
            cv2.imwrite(path, frame)
            print("Saved:", path)
            saved += 1

        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


# =========================
# AUGMENTATION
# =========================
def augment_image(img):
    results = []

    # blur
    results.append(cv2.GaussianBlur(img, (15, 15), 0))

    # brightness up
    results.append(cv2.convertScaleAbs(img, alpha=1.2, beta=40))

    # dark
    results.append(cv2.convertScaleAbs(img, alpha=0.5, beta=0))

    # noise
    noise = np.random.normal(0, 25, img.shape).astype(np.uint8)
    noisy = cv2.add(img, noise)
    results.append(noisy)

    return results


# =========================
# GENERATE LOW QUALITY
# =========================
def generate_low_quality(src_dir, dst_dir):
    for file in os.listdir(src_dir):
        img = cv2.imread(os.path.join(src_dir, file))
        if img is None:
            continue

        aug_imgs = augment_image(img)

        for i, aug in enumerate(aug_imgs):
            path = os.path.join(dst_dir, f"{file}_aug_{i}.jpg")
            cv2.imwrite(path, aug)


# =========================
# EXTRACT VIDEO FRAMES
# =========================
def extract_video_frames(video_path, dst_dir):
    cap = cv2.VideoCapture(video_path)
    count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if count % 10 == 0:
            path = os.path.join(dst_dir, f"frame_{count}.jpg")
            cv2.imwrite(path, frame)

        count += 1

    cap.release()


# =========================
# GENERATE RANDOM NO FACE
# =========================
def generate_no_face(dst_dir, count=10):
    for i in range(count):
        img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        cv2.imwrite(os.path.join(dst_dir, f"{i}.jpg"), img)


# =========================
# MAIN FLOW
# =========================
if __name__ == "__main__":

    # 1. ENROLL (user_01)
    capture_images(os.path.join(BASE_DIR, "enroll/user_01"), 5)

    # 2. SAME PERSON (khác thời điểm)
    capture_images(os.path.join(BASE_DIR, "verify/same_person"), 8)

    # 3. LOW QUALITY
    generate_low_quality(
        os.path.join(BASE_DIR, "verify/same_person"),
        os.path.join(BASE_DIR, "verify/low_quality")
    )

    # 4. NO FACE
    generate_no_face(os.path.join(BASE_DIR, "verify/no_face"))

    print("\n=== DONE BASIC DATA ===")

    print("""
    BẠN CẦN TỰ LÀM THÊM:
    - different_person (nhờ người khác chụp)
    - spoof_image (chụp lại từ màn hình)
    - replay_video (dùng video rồi extract)
    - multi_faces (chụp 2 người)
    - bad_pose (quay ngang đầu)
    """)