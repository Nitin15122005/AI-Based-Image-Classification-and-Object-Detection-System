def test_get_models_returns_detection_and_classification_info(client):
    response = client.get("/api/v1/models")

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "mock"
    assert body["detection"]["name"] == "YOLO11s"
    assert body["detection"]["class_count"] == 80
    assert "mock" in body["detection"]["status"]
    assert body["classification"]["name"] == "ResNet50"
    assert body["classification"]["class_count"] == 80


def test_get_metrics_returns_labeled_mock_data(client):
    response = client.get("/api/v1/metrics")

    assert response.status_code == 200
    body = response.json()

    assert body["is_mock"] is True
    assert "mock" in body["note"].lower() or "placeholder" in body["note"].lower()

    detection = body["detection"]
    assert {"precision", "recall", "map50", "map50_95"} <= detection.keys()

    classification = body["classification"]
    assert {"top1_accuracy", "top5_accuracy", "balanced_accuracy", "macro_f1", "weighted_f1"} <= classification.keys()

    assert len(body["training_history"]["detection"]) > 0
    assert len(body["training_history"]["classification"]) > 0
    assert len(body["confusion_matrix"]["classes"]) == len(body["confusion_matrix"]["matrix"])
    assert len(body["per_class_metrics"]) > 0
    assert body["dataset"]["num_classes"] == 80
    assert body["device"]["training_hardware"]
