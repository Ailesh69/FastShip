from fastapi.testclient import TestClient

def test_app(client : TestClient):
    response = client.get("/")
    print("[Response]:",response.json())
    assert response.status_code == 200 
    