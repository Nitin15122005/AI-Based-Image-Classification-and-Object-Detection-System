def test_health_check_reports_connected_database(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["database"] == "connected"
    assert body["inference_mode"] == "mock"
    assert body["service"]
    assert body["version"]
