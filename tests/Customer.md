# create
curl -sS -X POST http://localhost:8080/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Omantel"}'

# duplicate (should 409)
curl -i -sS -X POST http://localhost:8080/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Omantel"}'

# list
curl -sS "http://localhost:8080/api/v1/customers?limit=10&offset=0&q=acme"