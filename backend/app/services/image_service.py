"""Saving uploaded originals and rendering annotated result images.

Annotated images are real Pillow-drawn artifacts (not client-side
overlays) so they can be downloaded as standalone PNGs/JPEGs, exactly
like a real YOLO/ResNet pipeline would produce.
"""
from __future__ import annotations

import logging
import zlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from app.services.model_adapter import MergedDetection
from app.utils.storage import new_stored_filename, resolve_result_path, resolve_upload_path, save_bytes
from app.config import settings

logger = logging.getLogger("visionai.image_service")

_BOX_COLORS = [
    (33, 112, 228),   # blue
    (16, 185, 129),   # emerald
    (245, 158, 11),   # amber
    (147, 51, 234),   # purple
    (244, 63, 94),    # rose
    (13, 148, 136),   # teal
]

_FONT_CANDIDATES = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in _FONT_CANDIDATES:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _color_for_class(class_name: str) -> tuple[int, int, int]:
    index = zlib.crc32(class_name.encode("utf-8")) % len(_BOX_COLORS)
    return _BOX_COLORS[index]


def save_original(analysis_id: str, image_format: str, data: bytes) -> str:
    """Persists the raw uploaded bytes and returns the stored filename
    (never a full path — callers resolve it back via `utils.storage`)."""
    filename = new_stored_filename(analysis_id, image_format, suffix="_original")
    save_bytes(settings.upload_path, filename, data)
    return filename


def render_annotated_image(
    analysis_id: str,
    original_filename: str,
    image_format: str,
    detections: list[MergedDetection],
) -> str:
    """Draws bounding boxes + labels + confidence onto a copy of the
    original image and saves it to the results directory. Returns the
    stored filename."""
    original_path = resolve_upload_path(original_filename)
    with Image.open(original_path) as original:
        canvas = original.convert("RGB")
        draw = ImageDraw.Draw(canvas)
        font = _load_font(size=max(14, canvas.width // 80))

        for detection in detections:
            color = _color_for_class(detection.class_name)
            box = detection.bbox
            x1, y1 = max(0, box.x1), max(0, box.y1)
            x2 = min(canvas.width - 1, box.x2)
            y2 = min(canvas.height - 1, box.y2)

            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

            label = f"{detection.class_name} {detection.confidence * 100:.1f}%"
            text_bbox = draw.textbbox((0, 0), label, font=font)
            text_w, text_h = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
            label_y1 = max(0, y1 - text_h - 6)
            draw.rectangle([x1, label_y1, x1 + text_w + 8, label_y1 + text_h + 6], fill=color)
            draw.text((x1 + 4, label_y1 + 2), label, fill=(255, 255, 255), font=font)

        filename = new_stored_filename(analysis_id, image_format, suffix="_annotated")
        target = resolve_result_path(filename)
        target.parent.mkdir(parents=True, exist_ok=True)
        save_format = "JPEG" if image_format.lower() in ("jpg", "jpeg") else image_format.upper()
        canvas.save(target, format=save_format, quality=90)

    return filename


def read_original_bytes(original_filename: str) -> bytes:
    return resolve_upload_path(original_filename).read_bytes()


def delete_analysis_images(original_filename: str | None, annotated_filename: str | None) -> None:
    from app.utils.storage import delete_file_if_exists

    if original_filename:
        delete_file_if_exists(resolve_upload_path(original_filename))
    if annotated_filename:
        delete_file_if_exists(resolve_result_path(annotated_filename))


def open_image_for_inference(path: Path) -> Image.Image:
    """Opens+loads an image fully into memory so the file handle can be
    closed before inference runs (Pillow's lazy loading otherwise keeps
    the file open)."""
    with Image.open(path) as img:
        img.load()
        return img.convert("RGB")
