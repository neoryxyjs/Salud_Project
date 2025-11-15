#!/bin/bash

# Script de Prueba para Verificar el API
# Uso: ./test-api.sh https://tu-api-production.up.railway.app

API_URL="${1:-http://localhost:3001}"

echo "🧪 Testing API at: $API_URL"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para probar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -b cookies.txt)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ OK (HTTP $http_code)${NC}"
        return 0
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "${YELLOW}⚠️  Client Error (HTTP $http_code)${NC}"
        echo "   Response: $body"
        return 1
    else
        echo -e "${RED}❌ Server Error (HTTP $http_code)${NC}"
        echo "   Response: $body"
        return 1
    fi
}

# 1. Probar endpoint de Insurers
echo "📋 Testing Insurers Endpoints"
test_endpoint "GET" "/insurers" "" "GET /insurers"
echo ""

# 2. Probar endpoint de Plans
echo "💼 Testing Plans Endpoints"
test_endpoint "GET" "/plans" "" "GET /plans"
echo ""

# 3. Probar registro de usuario
echo "🔐 Testing Auth Endpoints"
test_endpoint "POST" "/auth/register" '{
  "email": "test@example.com",
  "password": "test123456",
  "name": "Test User"
}' "POST /auth/register"

# Guardar cookies para siguientes requests
curl -s -c cookies.txt -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "test123456"
    }' > /dev/null

test_endpoint "GET" "/auth/me" "" "GET /auth/me (with auth)"
echo ""

# 4. Probar creación de Lead
echo "📝 Testing Leads Endpoints"
test_endpoint "POST" "/leads" '{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+56912345678",
  "region": "Metropolitana"
}' "POST /leads"
echo ""

# 5. Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tests completed!"
echo ""
echo "If all tests passed, your API is working correctly!"
echo "Check VERIFICACION_COMPLETA.md for detailed verification steps."

