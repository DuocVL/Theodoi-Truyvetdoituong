
import cv2
import os
import numpy as np
import argparse
from typing import List, Tuple

# =========================
# CONSTANTS
# =========================
DEFAULT_BASE_DIR = "test_data"

# =========================
# IMAGE CAPTURE UTILITY
# =========================
def capture_images(save_dir: str, count: int, user_id: str, show_gui: bool = True):
    """Mở webcam và chụp 'count' tấm ảnh, lưu vào 'save_dir'"""
    os.makedirs(save_dir, exist_ok=True)
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    saved_count = 0
    print(f"\n[INFO] Capturing {count} images for user '{user_id}' into '{save_dir}'.")
    print("Press 'c' to capture, 'q' to quit.")

    while saved_count < count:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame from webcam.")
            break

        if show_gui:
            display_text = f"Capturing: {saved_count+1}/{count}. Press 'c' to save."
            cv2.putText(frame, display_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.imshow(f"Capture for {user_id}", frame)

        key = cv2.waitKey(1) & 0xFF

        if key == ord('c'):
            path = os.path.join(save_dir, f"{user_id}_{saved_count}.jpg")
            cv2.imwrite(path, frame)
            print(f"Saved: {path}")
            saved_count += 1
        elif key == ord('q'):
            print("Capture cancelled by user.")
            break

    cap.release()
    if show_gui:
        cv2.destroyAllWindows()

# =========================
# DATA AUGMENTATION
# =========================
def augment_image(img: np.ndarray) -> List[Tuple[str, np.ndarray]]:
    """Tạo ra các phiên bản biến đổi của một ảnh."""
    augmentations = []
    augmentations.append(("blur", cv2.GaussianBlur(img, (21, 21), 0)))
    augmentations.append(("bright", cv2.convertScaleAbs(img, alpha=1.5, beta=50)))
    augmentations.append(("dark", cv2.convertScaleAbs(img, alpha=0.6, beta=0)))
    
    # Salt and Pepper Noise
    noise = np.random.randint(0, 255, img.shape, dtype=np.uint8)
    noisy_img = np.where(noise < 10, 0, np.where(noise > 245, 255, img))
    augmentations.append(("noise", noisy_img))
    
    return augmentations

def generate_augmented_data(src_dir: str, dst_dir: str):
    """Tạo dữ liệu biến đổi từ một thư mục nguồn."""
    os.makedirs(dst_dir, exist_ok=True)
    print(f"\n[INFO] Generating augmented data from '{src_dir}' to '{dst_dir}'...")
    for filename in os.listdir(src_dir):
        img_path = os.path.join(src_dir, filename)
        img = cv2.imread(img_path)
        if img is None: continue

        base_name = os.path.splitext(filename)[0]
        for aug_name, aug_img in augment_image(img):
            new_filename = f"{base_name}_{aug_name}.jpg"
            path = os.path.join(dst_dir, new_filename)
            cv2.imwrite(path, aug_img)
    print("Augmented data generation complete.")

# =========================
# VIDEO FRAME EXTRACTION
# =========================
def extract_video_frames(video_path: str, dst_dir: str, frame_interval: int):
    """Trích xuất các khung hình từ video."""
    os.makedirs(dst_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return

    print(f"\n[INFO] Extracting frames from '{video_path}' to '{dst_dir}'...")
    frame_count, saved_count = 0, 0
    while True:
        ret, frame = cap.read()
        if not ret: break
        if frame_count % frame_interval == 0:
            path = os.path.join(dst_dir, f"frame_{saved_count:04d}.jpg")
            cv2.imwrite(path, frame)
            saved_count += 1
        frame_count += 1
    cap.release()
    print(f"Extracted {saved_count} frames.")

# =========================
# MAIN CLI LOGIC
# =========================
def main():
    parser = argparse.ArgumentParser(description="Test Data Generation Script for Face Service")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # --- Capture Command ---
    parser_capture = subparsers.add_parser("capture", help="Capture images from webcam.")
    parser_capture.add_argument("--user", required=True, help="User ID (e.g., user_01).")
    parser_capture.add_argument("--type", required=True, choices=["enroll", "verify_same", "verify_diff", "verify_pose"], help="Type of data to capture.")
    parser_capture.add_argument("--count", type=int, default=5, help="Number of images to capture.")
    parser_capture.add_argument("--base_dir", default=DEFAULT_BASE_DIR, help="Base directory for test data.")

    # --- Augment Command ---
    parser_augment = subparsers.add_parser("augment", help="Generate augmented images.")
    parser_augment.add_argument("--src", required=True, help="Source directory.")
    parser_augment.add_argument("--dst", required=True, help="Destination directory.")

    # --- Extract Command ---
    parser_extract = subparsers.add_parser("extract", help="Extract frames from a video.")
    parser_extract.add_argument("--video", required=True, help="Path to the video file.")
    parser_extract.add_argument("--output", required=True, help="Output directory for frames.")
    parser_extract.add_argument("--interval", type=int, default=10, help="Frame interval.")

    args = parser.parse_args()

    if args.command == "capture":
        dir_map = {
            "enroll": f"enroll/{args.user}",
            "verify_same": f"verify/{args.user}/same_person",
            "verify_diff": f"verify/{args.user}/different_person",
            "verify_pose": f"verify/{args.user}/bad_pose",
        }
        save_dir = os.path.join(args.base_dir, dir_map[args.type])
        capture_images(save_dir, args.count, args.user)

    elif args.command == "augment":
        generate_augmented_data(args.src, args.dst)

    elif args.command == "extract":
        extract_video_frames(args.video, args.output, args.interval)

if __name__ == "__main__":
    main()
