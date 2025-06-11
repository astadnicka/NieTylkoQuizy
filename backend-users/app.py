from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users as user
import uvicorn
import requests
import os
from sqlalchemy import create_engine, text
from fastapi.responses import JSONResponse

app = FastAPI()

print("Including user router:", user.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://frontend:3000", "http://localhost:3000", "http://localhost:5002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/api/users")

@app.get("/")
async def root():
    return {"message": "users backend dziala"}

@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/api/test-users")
async def test_users():
    return [
        {"id": "1", "username": "user1", "email": "user1@example.com", "name": "Jan Kowalski"},
        {"id": "2", "username": "user2", "email": "user2@example.com", "name": "Anna Nowak"}
    ]

@app.get("/users")
async def get_all_users():
    """Prosty publiczny endpoint zwracający wszystkich użytkowników z Keycloak"""
    try:
        keycloak_url = os.getenv("KEYCLOAK_URL", "http://keycloak:8080/")
        realm = os.getenv("KEYCLOAK_REALM", "NieTylkoQuizy")
        
        admin_token_url = f"{keycloak_url}/realms/master/protocol/openid-connect/token"
        admin_data = {
            "username": "admin",
            "password": "admin",
            "grant_type": "password",
            "client_id": "admin-cli"
        }
        
        print(f"Requesting admin token from: {admin_token_url}")
        token_response = requests.post(admin_token_url, data=admin_data)
        
        if token_response.status_code != 200:
            print(f"Failed to get admin token: {token_response.text}")
            return [{"id": "1", "username": "admin (fallback)"}]
            
        admin_token = token_response.json().get("access_token")
        
        users_url = f"{keycloak_url}/admin/realms/NieTylkoQuizy/users"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print(f"Requesting users from: {users_url}")
        users_response = requests.get(users_url, headers=headers)
        
        if users_response.status_code != 200:
            print(f"Failed to get users: {users_response.text}")
            return [{"id": "1", "username": "admin (fallback)"}]
            
        users_data = users_response.json()
        print(f"Found {len(users_data)} users")
        
        users = [
            {
                "id": user.get("id", ""),
                "username": user.get("username", ""),
                "email": user.get("email", ""),
                "first_name": user.get("firstName", ""),
                "last_name": user.get("lastName", "")
            }
            for user in users_data
        ]
        
        return users
    except Exception as e:
        print(f"Error fetching users from Keycloak: {str(e)}")
        return [{"id": "1", "username": f"admin (error: {str(e)})"}]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)