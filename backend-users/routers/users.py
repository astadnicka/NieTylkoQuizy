from fastapi import APIRouter, Depends, HTTPException
import mysql.connector
from keycloak import KeycloakOpenID
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import os

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

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        public_key = KEYCLOAK_OPENID.public_key()
        print(f"Raw public key: {public_key}")
        public_key = f"-----BEGIN PUBLIC KEY-----\n{public_key}\n-----END PUBLIC KEY-----"
        print(f"Formatted public key: {public_key}")

        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_audience": False}  
        )
        print(f"Decoded token: {decoded_token}")  
        return decoded_token
    except Exception as e:
        print(f"Token verification error: {str(e)}")  
        raise HTTPException(status_code=401, detail=f"Token invalid: {str(e)}")
    
def require_admin_user(token: dict = Depends(verify_token)):
    roles = token.get("realm_access", {}).get("roles", [])
    print(f"User roles: {roles}")  # Debug roles
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
async def get_users(token_data: dict = Depends(verify_token)):
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
        
        user_query = "SELECT * FROM USER_ENTITY WHERE REALM_ID = %s"
        mycursor.execute(user_query, (realm_id,))
        results = mycursor.fetchall()
        print(f"Found {len(results)} users in realm {KEYCLOAK_REALM}")

        users = []
        for row in results:
            try:
                user_data = {
                    "id": row[0], 
                    "username": row[1],  
                    "email": row[2],
                    "first_name": row[3], 
                    "last_name": row[4]
                }
                print(f"Adding user: {user_data}")
                users.append(user_data)
            except Exception as e:
                print(f"Error processing user row: {e}")

        mycursor.close()
        mydb.close()

        roles = token_data.get("realm_access", {}).get("roles", [])
    
        if "admin" in roles:
            return [
                {
                    "id": user["id"], 
                    "username": user["username"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "created_at": user["created_at"],
                    "status": user["status"]
                }
                for user in users
            ]
        else:
            return [
                {
                    "username": user["username"],
                    "first_name": user["first_name"]
                }
                for user in users
            ]
    except mysql.connector.Error as err:
        print(f"Database error: {str(err)}")
        return [{"id": "1", "username": "admin (error fallback)"}]


@router.get('/public')
async def get_keycloak_users():
    """Pobiera użytkowników z Keycloak za pomocą API administracyjnego"""
    try:
        import requests
        
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
        
        # Pobierz użytkowników z API Keycloak
        users_url = f"{keycloak_url}/admin/realms/{realm}/users"
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print(f"Requesting users from: {users_url}")
        users_response = requests.get(users_url, headers=headers)
        
        if users_response.status_code != 200:
            print(f"Failed to get users: {users_response.text}")
            return [{"id": "1", "username": "admin (fallback)"}]
            
        users_data = users_response.json()
        print(f"Found {len(users_data)} users")
        
        # Przekształć dane do oczekiwanego formatu
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
        return [{"id": "1", "username": "admin (error fallback)"}]


# Dopiero potem zdefiniuj ścieżki z parametrami
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