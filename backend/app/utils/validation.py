"""Upload validation: extension, MIME type, real image content, and size.

Every check here is deliberately defense-in-depth — a client can lie about
`content_type` or use a wrong extension, so the actual bytes are always
decoded with Pillow before anything is trusted or persisted.
"""
from __future__ import annotations

import io
from dataclasses import dataclass

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}


@dataclass
class ImageInfo:
    width: int
    height: int
    format: str  # normalized lowercase: "jpeg" | "png" | "webp"


def _extension_of(filename: str) -> str:
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def validate_upload_metadata(file: UploadFile) -> None:
    """Cheap checks that don't require reading the file body."""
    if not file or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file was uploaded.")

    extension = _extension_of(file.filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{extension}'. Allowed: JPG, JPEG, PNG, WEBP.",
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{file.content_type}'. Allowed: JPG, JPEG, PNG, WEBP.",
        )


def validate_upload_size(size_bytes: int, max_bytes: int) -> None:
    if size_bytes <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the maximum upload size of {max_bytes // (1024 * 1024)}MB.",
        )


def validate_and_probe_image(data: bytes) -> ImageInfo:
    """Decode the actual bytes with Pillow to confirm it is a real, intact
    image of a supported format. Raises 400 on anything corrupt/unsupported.
    """
    try:
        with Image.open(io.BytesIO(data)) as probe:
            probe.verify()
        # verify() leaves the file object unusable, so re-open to read data.
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            width, height = image.size
            image_format = (image.format or "").upper()
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is not a valid image."
        ) from exc
    except Exception as exc:  # Pillow raises varied errors on truncated/corrupt files
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded image appears to be corrupted."
        ) from exc

    if image_format not in ALLOWED_PIL_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{image_format}'. Allowed: JPEG, PNG, WEBP.",
        )

    if width <= 0 or height <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image has invalid dimensions.")

    return ImageInfo(width=width, height=height, format=image_format.lower())
