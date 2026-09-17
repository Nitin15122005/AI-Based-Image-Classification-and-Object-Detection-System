"""The single canonical 80-class COCO category list for this project.

Every other module (validation, mock inference, the real inference
adapter once it exists, and metrics) imports this list instead of
redefining class names, so there is exactly one place that can ever be
out of sync with the dataset. Order matches the standard COCO category
ordering (and the frontend's `src/data/cocoClasses.js`, kept in sync by
hand since the two apps don't share code).
"""

COCO_CLASSES: list[str] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator",
    "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
]

COCO_CLASS_SET: frozenset[str] = frozenset(COCO_CLASSES)


def is_valid_coco_class(class_name: str) -> bool:
    return class_name in COCO_CLASS_SET
