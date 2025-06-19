from fastapi import APIRouter, Depends, HTTPException
import mysql.connector
from keycloak import KeycloakOpenID
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import os
import redis

KEYCLOAK_SERVER_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080/")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "NieTylkoQuizy")  
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "NieTylkoQuizyClient")  
KEYCLOAK_OPENID = KeycloakOpenID(
    server_url=KEYCLOAK_SERVER_URL,
    client_id=KEYCLOAK_CLIENT_ID,
    realm_name=KEYCLOAK_REALM
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{KEYCLOAK_SERVER_URL}realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
)

# Redis configuration - prosty i bezpieczny
try:
    redis_host = os.getenv('REDIS_HOST', 'redis')
    redis_port_str = os.getenv('REDIS_PORT', '6379')
    
    # Obsługa przypadku gdy REDIS_PORT może zawierać URL
    if redis_port_str.startswith('tcp://'):
        redis_port = int(redis_port_str.split(':')[-1])
    else:
        redis_port = int(redis_port_str)
    
    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5
    )
    
    # Test connection
    redis_client.ping()
    print(f"✅ Redis connected: {redis_host}:{redis_port}")
    REDIS_AVAILABLE = True
    
except Exception as e:
    print(f"❌ Redis connection failed: {e}")
    print("Using local blacklist fallback")
    REDIS_AVAILABLE = False
    redis_client = None

# Globalna blacklista tokenów (w produkcji użyj Redis)
blacklisted_tokens = set()

def blacklist_token(token: str):
    """Dodaj token do blacklisty w Redis"""
    try:
        # Ustaw token na blackliście z TTL (czas życia tokenu)
        redis_client.setex(f"blacklist:{token}", 3600, "blacklisted")  # 1 godzina
        print(f"Token blacklisted in Redis: {token[:20]}...")
    except Exception as e:
        print(f"Error blacklisting token in Redis: {e}")

def is_token_blacklisted(token: str) -> bool:
    """Sprawdź czy token jest na blackliście w Redis"""
    try:
        result = redis_client.exists(f"blacklist:{token}")
        print(f"Token blacklist check: {result}")
        return bool(result)
    except Exception as e:
        print(f"Error checking blacklist in Redis: {e}")
        return False

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        # SPRAWDŹ BLACKLISTĘ NAJPIERW
        if is_token_blacklisted(token):
            raise HTTPException(status_code=401, detail="Token blacklisted - user logged out")
        
        public_key = KEYCLOAK_OPENID.public_key()
        public_key = f"-----BEGIN PUBLIC KEY-----\n{public_key}\n-----END PUBLIC KEY-----"

        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience="account",  
            options={"verify_exp": True}
        )
        return decoded_token
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token invalid: {str(e)}")
    
def require_admin_user(token: dict = Depends(verify_token)):
    roles = token.get("realm_access", {}).get("roles", [])
    if "admin" not in roles:
        raise HTTPException(status_code=403, detail="Admin role required")
    return token

router =  APIRouter()

from mysql.connector import pooling

DB_CONFIG = {
    'user': os.getenv('DB_USER', 'root'),         
    'password': os.getenv('DB_PASSWORD', 'rootpassword'),  
    'host': os.getenv('DB_HOST', 'mysql'),
    'database': os.getenv('DB_NAME', 'quizdb'),   
    'port': int(os.getenv('DB_PORT', '3306')),
    'pool_name': os.getenv('DB_POOL_NAME', 'quizdb_pool'),  
    'pool_size': int(os.getenv('DB_POOL_SIZE', '5'))
}

def get_db_connection():
    try:
        cnx_pool = pooling.MySQLConnectionPool(**DB_CONFIG)
        return cnx_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        raise HTTPException(status_code=500, detail="Database connection failed")

@router.get('/')
async def get_users(token_data=Depends(require_admin_user)):
    try:
        keycloak_db_config = {
            'user': 'keycloak',         
            'password': 'keycloak',    
            'host': 'mysql',
            'database': 'keycloak',   
            'port': 3306
        }
        
        mydb = mysql.connector.connect(**keycloak_db_config)
        mycursor = mydb.cursor()
        
        realm_query = "SELECT ID FROM REALM WHERE NAME = %s"
        mycursor.execute(realm_query, (KEYCLOAK_REALM,))
        realm_result = mycursor.fetchone()
        
        if not realm_result:
            print(f"Realm {KEYCLOAK_REALM} not found")
            return []
        
        realm_id = realm_result[0]
        print(f"Found realm ID: {realm_id}")
        
        # POPRAWIONA KWERENDA - wybieramy konkretne kolumny
        user_query = """
            SELECT ID, USERNAME, EMAIL, FIRST_NAME, LAST_NAME, ENABLED 
            FROM USER_ENTITY 
            WHERE REALM_ID = %s
        """
        mycursor.execute(user_query, (realm_id,))
        results = mycursor.fetchall()
        print(f"Found {len(results)} users in realm {KEYCLOAK_REALM}")

        users = []
        for row in results:
            try:
                user_data = {
                    "id": row[0],           # ID
                    "username": row[1],     # USERNAME 
                    "email": row[2],        # EMAIL
                    "first_name": row[3],   # FIRST_NAME
                    "last_name": row[4],    # LAST_NAME
                    "enabled": bool(row[5]) if row[5] is not None else True  # ENABLED
                }
                print(f"Adding user: {user_data}")
                users.append(user_data)
            except Exception as e:
                print(f"Error processing user row: {e}")
                print(f"Row data: {row}")

        mycursor.close()
        mydb.close()

        # Sprawdź role użytkownika
        roles = token_data.get("realm_access", {}).get("roles", [])
    
        if "admin" in roles:
            return users  # Zwróć pełne dane dla adminów
        else:
            # Dla zwykłych użytkowników zwróć ograniczone dane
            return [
                {
                    "username": user_from_db["username"],
                    "first_name": user_from_db["first_name"]
                }
                for user_from_db in users
            ]
            
    except mysql.connector.Error as err:
        print(f"Database error: {str(err)}")
        return [{"id": "1", "username": "admin (error fallback)"}]




@router.get('/{user_id}')
async def get_user(user_id: str, user=Depends(verify_token)):
    try:
        mydb = get_db_connection()
        mycursor = mydb.cursor()
        
        mycursor.execute("SELECT * FROM USER_ENTITY WHERE ID = %s", (user_id,))
        result = mycursor.fetchone()

        print(f"Query result: {result}")

        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = {
            "id": result[0],
            "username": result[9],
            "email": result[1],
            "first_name": result[6],
            "last_name": result[7]
        }

        print(f"Returning user data: {user_data}") 

        

        mycursor.close()
        mydb.close()

        return user_data
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# Endpoint do wylogowania
@router.post('/logout')
async def logout(token: str = Depends(oauth2_scheme)):
    """Endpoint do wylogowania - dodaje token do blacklisty"""
    blacklist_token(token)
    return {"message": "Successfully logged out"}