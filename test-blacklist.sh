#!/bin/bash
# test-blacklist.sh

echo "🔐 BLACKLIST TOKEN TEST"
echo "======================"

# 1. Pobierz świeży token
echo "1️⃣ Getting fresh token..."
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/NieTylkoQuizy/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=NieTylkoQuizyClient" \
  -d "username=admin" \
  -d "password=admin1" | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:30}..."

# 2. Test tokenu PRZED blacklistingiem
echo -e "\n2️⃣ Testing token BEFORE logout:"
response=$(curl -s -w "\nHTTP:%{http_code}" \
  -X GET "http://localhost:5002/api/users/" \
  -H "Authorization: Bearer $TOKEN")

http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  user_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "unknown")
  echo "✅ SUCCESS: Found $user_count users"
else
  echo "❌ FAILED: HTTP $http_code"
  echo "Response: $body"
  exit 1
fi

# 3. Blacklist token (logout)
echo -e "\n3️⃣ Blacklisting token (logout)..."
logout_response=$(curl -s -w "\nHTTP:%{http_code}" \
  -X POST "http://localhost:5002/api/users/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

logout_http_code=$(echo "$logout_response" | tail -n1 | cut -d: -f2)
logout_body=$(echo "$logout_response" | sed '$d')

if [ "$logout_http_code" = "200" ]; then
  echo "✅ Logout successful: $(echo "$logout_body" | jq -r '.message' 2>/dev/null)"
else
  echo "❌ Logout failed: HTTP $logout_http_code"
  echo "Response: $logout_body"
  exit 1
fi

# 4. Test tokenu PO blacklistingu
echo -e "\n4️⃣ Testing same token AFTER logout:"
response2=$(curl -s -w "\nHTTP:%{http_code}" \
  -X GET "http://localhost:5002/api/users/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

http_code2=$(echo "$response2" | tail -n1 | cut -d: -f2)
body2=$(echo "$response2" | sed '$d')

if [ "$http_code2" = "401" ]; then
  error_detail=$(echo "$body2" | jq -r '.detail' 2>/dev/null)
  if [[ "$error_detail" == *"blacklisted"* ]]; then
    echo "✅ PERFECT! Token correctly blacklisted"
    echo "🔒 Error: $error_detail"
  else
    echo "⚠️  Token rejected but not due to blacklist: $error_detail"
  fi
else
  echo "❌ PROBLEM! Token still works (HTTP $http_code2)"
  echo "Response: $body2"
fi

echo -e "\n🎯 SUMMARY:"
echo "Before logout: HTTP 200 ✅"
echo "Logout call:   HTTP $logout_http_code $([ "$logout_http_code" = "200" ] && echo "✅" || echo "❌")"
echo "After logout:  HTTP $http_code2 $([ "$http_code2" = "401" ] && echo "✅" || echo "❌")"

if [ "$http_code2" = "401" ] && [[ "$error_detail" == *"blacklisted"* ]]; then
  echo -e "\n🎉 BLACKLIST WORKS PERFECTLY!"
else
  echo -e "\n❌ BLACKLIST NOT WORKING PROPERLY"
fi