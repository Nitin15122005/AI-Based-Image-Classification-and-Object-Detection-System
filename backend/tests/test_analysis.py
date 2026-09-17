from app.config import settings
from app.models import Analysis


def test_analyze_valid_image_returns_full_result(client, sample_upload_file):
    response = client.post("/api/v1/analyze", files=sample_upload_file, data={"confidence_threshold": "0.2"})

    assert response.status_code == 201
    body = response.json()

    assert body["status"] == "completed"
    assert body["filename"] == "sample.jpg"
    assert body["objects_detected"] == len(body["detections"])
    assert body["objects_detected"] > 0
    assert 0.0 <= body["average_confidence"] <= 1.0
    assert body["models"]["detection"]
    assert body["models"]["classification"]
    assert body["original_image_url"].endswith(f"/results/{body['id']}/original-image")
    assert body["annotated_image_url"].endswith(f"/results/{body['id']}/annotated-image")
    assert body["summary"]

    for detection in body["detections"]:
        assert set(detection["bbox"].keys()) == {"x1", "y1", "x2", "y2"}
        assert 0.0 <= detection["detection_confidence"] <= 1.0
        assert detection["classification"]["class_name"]

    assert len(body["top_classifications"]) <= 5


def test_analyze_respects_detection_disabled(client, sample_upload_file):
    response = client.post("/api/v1/analyze", files=sample_upload_file, data={"detection_enabled": "false"})

    assert response.status_code == 201
    body = response.json()
    assert body["objects_detected"] == 0
    assert body["detections"] == []


def test_analyze_respects_classification_disabled_top_list(client, sample_upload_file):
    response = client.post(
        "/api/v1/analyze", files=sample_upload_file, data={"classification_enabled": "false"}
    )

    assert response.status_code == 201
    body = response.json()
    # Per-detection classification is still computed by the pipeline; only
    # the whole-image "top classifications" summary responds to the toggle.
    assert body["top_classifications"] == []
    assert body["objects_detected"] > 0


def test_analyze_missing_file_is_rejected(client):
    response = client.post("/api/v1/analyze")
    assert response.status_code == 422


def test_analyze_unsupported_extension_returns_400(client):
    files = {"file": ("notes.txt", b"just some text", "text/plain")}
    response = client.post("/api/v1/analyze", files=files)

    assert response.status_code == 400
    assert "extension" in response.json()["detail"].lower()


def test_analyze_corrupt_image_returns_400(client):
    files = {"file": ("fake.jpg", b"this is not actually a jpeg", "image/jpeg")}
    response = client.post("/api/v1/analyze", files=files)

    assert response.status_code == 400
    assert "valid image" in response.json()["detail"].lower()


def test_analyze_oversized_upload_returns_413(client, sample_image_bytes, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_mb", 0)
    files = {"file": ("sample.jpg", sample_image_bytes, "image/jpeg")}

    response = client.post("/api/v1/analyze", files=files)

    assert response.status_code == 413


def test_analyze_empty_file_returns_400(client):
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400


def test_annotated_image_is_generated_and_downloadable(client, sample_upload_file):
    created = client.post("/api/v1/analyze", files=sample_upload_file).json()

    annotated = client.get(created["annotated_image_url"])
    original = client.get(created["original_image_url"])

    assert annotated.status_code == 200
    assert original.status_code == 200
    assert annotated.headers["content-type"].startswith("image/")
    # The annotated copy has boxes/labels drawn on it, so it must differ
    # from a byte-for-byte copy of the original.
    assert annotated.content != original.content
    assert len(annotated.content) > 0


def test_analysis_is_persisted_in_database(client, sample_upload_file, db_session):
    created = client.post("/api/v1/analyze", files=sample_upload_file).json()

    row = db_session.get(Analysis, created["id"])
    assert row is not None
    assert row.filename == "sample.jpg"
    assert row.objects_detected == created["objects_detected"]
    assert len(row.detections) == created["objects_detected"]


def test_get_result_json_matches_analyze_response(client, sample_upload_file):
    created = client.post("/api/v1/analyze", files=sample_upload_file).json()

    fetched = client.get(f"/api/v1/results/{created['id']}/json")

    assert fetched.status_code == 200
    assert fetched.json()["id"] == created["id"]
    assert fetched.json()["detections"] == created["detections"]


def test_missing_analysis_returns_404(client):
    response = client.get("/api/v1/results/does-not-exist/json")
    assert response.status_code == 404

    response = client.get("/api/v1/results/does-not-exist/annotated-image")
    assert response.status_code == 404
