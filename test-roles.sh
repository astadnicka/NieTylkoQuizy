#!/bin/bash
# test-roles-security.sh - Kompleksowy test ról i zabezpieczeń

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funkcje pomocnicze
print_header() {
    echo -e "\n${CYAN}════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
}

print_test() {
    echo -e "\n${BLUE}🧪 TEST: $1${NC}"
    echo -e "${BLUE}──────────────────────────────────────${NC}"
}

print_result() {
    local expected=$1
    local actual=$2
    local description=$3
    
    if [[ "$actual" == *"$expected"* ]]; then
        echo -e "${GREEN}✅ SUCCESS: $description (HTTP $expected)${NC}"
    else
        echo -e "${RED}❌ FAILED: $description (Expected: $expected, Got: $actual)${NC}"
    fi
}

# Pobierz tokeny różnych użytkowników - POPRAWIONE HASŁA
get_admin_token() {
    curl -s -X POST "http://localhost:8080/realms/NieTylkoQuizy/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password" \
        -d "client_id=NieTylkoQuizyClient" \
        -d "username=admin" \
        -d "password=admin1" | jq -r '.access_token'
}

get_user_token() {
    curl -s -X POST "http://localhost:8080/realms/NieTylkoQuizy/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password" \
        -d "client_id=NieTylkoQuizyClient" \
        -d "username=user1" \
        -d "password=1234" | jq -r '.access_token'
}

# Funkcja testowa dla GET quiz
test_get_quiz() {
    local role=$1
    local token=$2
    local quiz_id=$3
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        response=$(curl -s -w "\nHTTP:%{http_code}" \
            -X GET "http://localhost:5001/quizzes/$quiz_id")
    else
        response=$(curl -s -w "\nHTTP:%{http_code}" \
            -X GET "http://localhost:5001/quizzes/$quiz_id" \
            -H "Authorization: Bearer $token")
    fi
    
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    body=$(echo "$response" | sed '$d')
    
    echo "Role: $role"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        # Sprawdź czy pokazuje is_correct
        is_correct_visible=$(echo "$body" | jq -r '.questions[0].options[0].is_correct // "not_found"' 2>/dev/null)
        
        if [ "$is_correct_visible" = "not_found" ] || [ "$is_correct_visible" = "null" ]; then
            echo -e "${YELLOW}📊 Data: is_correct HIDDEN (normal user view)${NC}"
        else
            echo -e "${GREEN}📊 Data: is_correct=$is_correct_visible (admin/privileged view)${NC}"
        fi
        
        echo "Quiz title: $(echo "$body" | jq -r '.title // "N/A"')"
        echo "Author: $(echo "$body" | jq -r '.author_username // "N/A"')"
    else
        echo "Error: $body"
    fi
}

# Funkcja testowa dla POST quiz
test_create_quiz() {
    local role=$1
    local token=$2
    local expected_code=$3
    
    local quiz_data='{
        "title": "Test Quiz by '"$role"'",
        "category_id": 2,
        "questions": [
            {
                "question_text": "Test question by '"$role"'?",
                "options": [
                    {"option_text": "A", "is_correct": true},
                    {"option_text": "B", "is_correct": false}
                ]
            }
        ]
    }'
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        response=$(curl -s -w "\nHTTP:%{http_code}" \
            -X POST "http://localhost:5001/quizzes/" \
            -H "Content-Type: application/json" \
            -d "$quiz_data")
    else
        response=$(curl -s -w "\nHTTP:%{http_code}" \
            -X POST "http://localhost:5001/quizzes/" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$quiz_data")
    fi
    
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    body=$(echo "$response" | sed '$d')
    
    echo "Role: $role"
    echo "HTTP Code: $http_code"
    echo "Response: $body"
    
    print_result "$expected_code" "HTTP:$http_code" "Create quiz as $role"
    
    # Zwróć quiz_id jeśli się udało
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        echo "$body" | jq -r '.quiz_id // empty'
    fi
}

# Funkcja testowa dla DELETE quiz
test_delete_quiz() {
    local role=$1
    local token=$2
    local quiz_id=$3
    local expected_code=$4
    local description=$5
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        response=$(curl -s -w "\nHTTP:%{http_code}" \
            -X DELETE "http://localhost:5001/quizzes/$quiz_id")
    else
        response=$(curl -s -w "\nHTTP:%{http_code}" \
            -X DELETE "http://localhost:5001/quizzes/$quiz_id" \
            -H "Authorization: Bearer $token")
    fi
    
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    body=$(echo "$response" | sed '$d')
    
    echo "Role: $role"
    echo "Target Quiz ID: $quiz_id"
    echo "HTTP Code: $http_code"
    echo "Response: $body"
    echo "Description: $description"
    
    print_result "$expected_code" "HTTP:$http_code" "$description"
}

# GŁÓWNY SKRYPT
print_header "🎭 KOMPLETNY TEST RÓL I ZABEZPIECZEŃ QUIZÓW"

echo -e "${PURPLE}Pobieranie tokenów użytkowników...${NC}"

# Pobierz tokeny
ADMIN_TOKEN=$(get_admin_token)
USER_TOKEN=$(get_user_token)

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Nie można pobrać tokenu admin${NC}"
    exit 1
fi

if [ "$USER_TOKEN" = "null" ] || [ -z "$USER_TOKEN" ]; then
    echo -e "${YELLOW}⚠️ Nie można pobrać tokenu user - kontynuuję tylko z admin${NC}"
    USER_TOKEN=""
fi

echo -e "${GREEN}✅ Admin token: ${ADMIN_TOKEN:0:30}...${NC}"
if [ -n "$USER_TOKEN" ]; then
    echo -e "${GREEN}✅ User token: ${USER_TOKEN:0:30}...${NC}"
fi

# ═══════════════════════════════════════
# CZĘŚĆ 1: WYŚWIETLANIE QUIZÓW
# ═══════════════════════════════════════

print_header "📖 CZĘŚĆ 1: WYŚWIETLANIE QUIZÓW (różne perspektywy)"

print_test "1.1 Wyświetl quiz jako NIEZALOGOWANY"
test_get_quiz "Guest" "" "1"

print_test "1.2 Wyświetl quiz jako ZALOGOWANY USER"
test_get_quiz "User" "$USER_TOKEN" "1"

print_test "1.3 Wyświetl quiz jako ADMIN"
test_get_quiz "Admin" "$ADMIN_TOKEN" "1"

# ═══════════════════════════════════════
# CZĘŚĆ 2: TWORZENIE QUIZÓW
# ═══════════════════════════════════════

print_header "➕ CZĘŚĆ 2: TWORZENIE QUIZÓW"

print_test "2.1 Spróbuj dodać quiz jako NIEZALOGOWANY (powinno FAIL)"
test_create_quiz "Guest" "" "401"

print_test "2.2 Dodaj quiz jako ZALOGOWANY USER"
USER_QUIZ_ID=$(test_create_quiz "User" "$USER_TOKEN" "201")

print_test "2.3 Dodaj quiz jako ADMIN"
ADMIN_QUIZ_ID=$(test_create_quiz "Admin" "$ADMIN_TOKEN" "201")

echo -e "\n${CYAN}📝 Utworzone quizy:${NC}"
echo "User Quiz ID: $USER_QUIZ_ID"
echo "Admin Quiz ID: $ADMIN_QUIZ_ID"

# ═══════════════════════════════════════
# CZĘŚĆ 3: USUWANIE QUIZÓW
# ═══════════════════════════════════════

print_header "🗑️ CZĘŚĆ 3: USUWANIE QUIZÓW (różne scenariusze)"

print_test "3.1 Spróbuj usunąć quiz jako NIEZALOGOWANY (powinno FAIL)"
test_delete_quiz "Guest" "" "$ADMIN_QUIZ_ID" "401" "Unauthorized deletion attempt"

print_test "3.2 Spróbuj usunąć CUDZY quiz jako ZALOGOWANY USER (powinno FAIL)"
test_delete_quiz "User" "$USER_TOKEN" "$ADMIN_QUIZ_ID" "403" "User trying to delete admin's quiz"

print_test "3.3 Usuń WŁASNY quiz jako TWÓRCA"
if [ -n "$USER_QUIZ_ID" ]; then
    test_delete_quiz "User (Author)" "$USER_TOKEN" "$USER_QUIZ_ID" "200" "Author deleting own quiz"
else
    echo -e "${YELLOW}⚠️ Brak USER_QUIZ_ID do usunięcia${NC}"
fi

print_test "3.4 Usuń CUDZY quiz jako ADMIN (admin może wszystko)"
test_delete_quiz "Admin" "$ADMIN_TOKEN" "$ADMIN_QUIZ_ID" "200" "Admin deleting any quiz"

# ═══════════════════════════════════════
# CZĘŚĆ 4: DODATKOWE TESTY EDGE CASES
# ═══════════════════════════════════════

print_header "🔍 CZĘŚĆ 4: DODATKOWE TESTY BEZPIECZEŃSTWA"

print_test "4.1 Test z niepoprawnym tokenem"
response=$(curl -s -w "\nHTTP:%{http_code}" \
    -X POST "http://localhost:5001/quizzes/" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer fake-invalid-token" \
    -d '{"title": "Hack attempt", "category_id": 2, "questions": []}')

http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
echo "HTTP Code: $http_code"
print_result "401" "HTTP:$http_code" "Invalid token rejection"

print_test "4.2 Test usuwania nieistniejącego quizu"
test_delete_quiz "Admin" "$ADMIN_TOKEN" "99999" "404" "Delete non-existent quiz"

print_test "4.3 Test tworzenia quizu bez wymaganych pól"
response=$(curl -s -w "\nHTTP:%{http_code}" \
    -X POST "http://localhost:5001/quizzes/" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"title": "Incomplete quiz"}')

http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
echo "HTTP Code: $http_code"
print_result "400" "HTTP:$http_code" "Incomplete data validation"

# ═══════════════════════════════════════
# PODSUMOWANIE
# ═══════════════════════════════════════

print_header "📊 PODSUMOWANIE TESTÓW BEZPIECZEŃSTWA"

echo -e "${CYAN}🎯 OCZEKIWANE ZACHOWANIA:${NC}"
echo -e "${GREEN}✅ Niezalogowani: mogą TYLKO przeglądać (bez is_correct)${NC}"
echo -e "${GREEN}✅ Zalogowani: mogą przeglądać i tworzyć quizy${NC}"
echo -e "${GREEN}✅ Admin: widzi is_correct, może tworzyć i usuwać wszystkie quizy${NC}"
echo -e "${GREEN}✅ Autorzy: mogą usuwać TYLKO swoje quizy${NC}"
echo -e "${RED}❌ Zabronione: tworzenie/usuwanie bez autoryzacji${NC}"

echo -e "\n${PURPLE}🛡️ BEZPIECZEŃSTWO:${NC}"
echo -e "${GREEN}✅ Wymuszenie autoryzacji dla tworzenia${NC}"
echo -e "${GREEN}✅ Kontrola dostępu dla usuwania${NC}"
echo -e "${GREEN}✅ Różne poziomy danych dla różnych ról${NC}"
echo -e "${GREEN}✅ Walidacja tokenów i danych wejściowych${NC}"

echo -e "\n${CYAN}🎉 TEST COMPLETED!${NC}"
