def _create_analysis(client, sample_upload_file, filename="sample.jpg"):
    files = {"file": (filename, sample_upload_file["file"][1], "image/jpeg")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 201
    return response.json()


def test_history_empty_list(client):
    response = client.get("/api/v1/history")
    assert response.status_code == 200
    body = response.json()
    assert body == {"items": [], "total": 0, "page": 1, "page_size": 20}


def test_history_lists_created_analyses_newest_first(client, sample_upload_file):
    first = _create_analysis(client, sample_upload_file, "first.jpg")
    second = _create_analysis(client, sample_upload_file, "second.jpg")

    response = client.get("/api/v1/history")
    body = response.json()

    assert body["total"] == 2
    assert [item["id"] for item in body["items"]] == [second["id"], first["id"]]


def test_history_pagination(client, sample_upload_file):
    for i in range(3):
        _create_analysis(client, sample_upload_file, f"image-{i}.jpg")

    page1 = client.get("/api/v1/history?page=1&page_size=2").json()
    page2 = client.get("/api/v1/history?page=2&page_size=2").json()

    assert page1["total"] == 3
    assert len(page1["items"]) == 2
    assert len(page2["items"]) == 1


def test_history_search_by_filename(client, sample_upload_file):
    _create_analysis(client, sample_upload_file, "street-scene.jpg")
    _create_analysis(client, sample_upload_file, "workspace-photo.jpg")

    response = client.get("/api/v1/history?search=street")
    body = response.json()

    assert body["total"] == 1
    assert body["items"][0]["filename"] == "street-scene.jpg"


def test_history_detail_returns_full_analysis(client, sample_upload_file):
    created = _create_analysis(client, sample_upload_file)

    response = client.get(f"/api/v1/history/{created['id']}")

    assert response.status_code == 200
    assert response.json()["detections"] == created["detections"]


def test_history_detail_missing_returns_404(client):
    response = client.get("/api/v1/history/missing-id")
    assert response.status_code == 404


def test_history_delete_removes_analysis_and_files(client, sample_upload_file):
    created = _create_analysis(client, sample_upload_file)

    delete_response = client.delete(f"/api/v1/history/{created['id']}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/history/{created['id']}")
    assert get_response.status_code == 404

    image_response = client.get(created["original_image_url"])
    assert image_response.status_code == 404


def test_history_delete_missing_returns_404(client):
    response = client.delete("/api/v1/history/missing-id")
    assert response.status_code == 404


def test_history_rerun_creates_new_analysis(client, sample_upload_file):
    created = _create_analysis(client, sample_upload_file)

    rerun_response = client.post(f"/api/v1/history/{created['id']}/rerun")

    assert rerun_response.status_code == 201
    rerun_body = rerun_response.json()
    assert rerun_body["id"] != created["id"]
    assert rerun_body["filename"] == created["filename"]
    assert rerun_body["objects_detected"] == created["objects_detected"]

    # Both the original and the rerun copy must independently exist.
    assert client.get(f"/api/v1/history/{created['id']}").status_code == 200
    assert client.get(f"/api/v1/history/{rerun_body['id']}").status_code == 200


def test_history_rerun_missing_returns_404(client):
    response = client.post("/api/v1/history/missing-id/rerun")
    assert response.status_code == 404


def test_deleting_one_rerun_does_not_break_the_other(client, sample_upload_file):
    created = _create_analysis(client, sample_upload_file)
    rerun_body = client.post(f"/api/v1/history/{created['id']}/rerun").json()

    client.delete(f"/api/v1/history/{created['id']}")

    # The rerun copy owns an independent file, so it must still be servable.
    still_there = client.get(f"/api/v1/history/{rerun_body['id']}")
    assert still_there.status_code == 200
    image = client.get(rerun_body["original_image_url"])
    assert image.status_code == 200
