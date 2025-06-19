from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import users as user
import uvicorn
import os
import time
from jose import jwt
from fastapi import HTTPException
import redis

# Redis configuration
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'redis'), 
    port=int(os.getenv('REDIS_PORT', '6379')), 
    decode_responses=True
)

app = FastAPI()

def blacklist_token(token: str, expiration: int):
    """Dodaj token do blacklisty z TTL"""
    try:
        ttl = max(0, expiration - int(time.time()))
        if ttl > 0:
            redis_client.setex(f"bl:{token}", ttl, "1")
            print(f"✅ Token blacklisted in Redis for {ttl}s")
            return True
        else:
            print(f"❌ Token already expired, not blacklisting")
            return False
    except Exception as e:
        print(f"❌ Redis blacklist error: {e}")
        return False

def is_token_blacklisted(token: str) -> bool:
    """Sprawdź czy token jest na blackliście"""
    try:
        result = redis_client.exists(f"bl:{token}") > 0
        print(f"🔍 Checking Redis blacklist for token: {'blacklisted' if result else 'not blacklisted'}")
        return result
    except Exception as e:
        print(f"❌ Redis check error: {e}")
        return False

def get_blacklist_size():
    """Pobierz liczbę tokenów na blackliście"""
    try:
        keys = redis_client.keys("bl:*")
        return len(keys)
    except Exception as e:
        print(f"❌ Redis count error: {e}")
        return 0

# Udostępnij funkcje dla routera
app.state.is_token_blacklisted = is_token_blacklisted
app.state.blacklist_token = blacklist_token

print("Including user router:", user.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://frontend:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"]
)

app.include_router(user.router, prefix="/api/users")

# Podłącz funkcję blacklisty do routera
from routers.users import set_blacklist_function
set_blacklist_function(is_token_blacklisted)

@app.get("/")
async def root():
    return {"message": "users backend działa"}

@app.get("/health")
async def health(request: Request):
    """Health check endpoint"""
    user_agent = request.headers.get("user-agent", "")
    if "kube-probe" in user_agent.lower():
        pass
    
    # Sprawdź Redis
    try:
        redis_client.ping()
        redis_status = "connected"
    except:
        redis_status = "disconnected"
    
    return {
        "status": "ok", 
        "redis": redis_status,
        "blacklisted_tokens": get_blacklist_size()
    }

@app.post('/logout')
async def logout(request: Request):
    """Global logout endpoint - blacklist token"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(status_code=401, detail="Authorization header required")

        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid Authorization header format")
        
        token = auth_header[7:]  # Remove "Bearer "
        
        print(f"🚪 Logout - token to blacklist (first 20): {token[:20]}...")
        
        try:
            # Dekoduj token bez weryfikacji podpisu żeby dostać expiration
            unverified_token = jwt.decode(
                token, 
                key="dummy", 
                algorithms=["RS256"], 
                options={
                    "verify_signature": False,  
                    "verify_aud": False,      
                    "verify_exp": False        
                }
            )
            expiration = unverified_token.get('exp', 0)
            username = unverified_token.get('preferred_username', 'unknown')
            
            if expiration == 0:
                expiration = int(time.time()) + 3600  # 1 hour fallback
                
        except Exception as e:
            print(f"❌ Error parsing token for expiration: {e}")
            expiration = int(time.time()) + 3600
            username = "unknown"

        # Blacklist token
        success = blacklist_token(token, expiration)
        
        if success:
            print(f"✅ Token blacklisted successfully for user: {username}")
            return {
                "message": "Logged out successfully",
                "username": username,
                "blacklisted_until": time.ctime(expiration),
                "blacklisted_tokens_count": get_blacklist_size()
            }
        else:
            raise HTTPException(status_code=400, detail="Token already expired")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)