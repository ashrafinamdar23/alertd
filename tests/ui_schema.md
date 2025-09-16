# 1) create a schema (inactive)
curl -sS -X POST http://localhost:8080/api/v1/schema/list \
  -H "Content-Type: application/json" \
  -d '{"model":"customer"}' | jq

# 2) add fields
curl -sS -X POST http://localhost:8080/api/v1/schema/list/1/fields \
  -H "Content-Type: application/json" \
  -d '{"field_name":"id","field_label":"ID","field_type":"number","width":100,"align":"right","sortable":true,"order_no":10,"visible":true}' | jq

curl -sS -X POST http://localhost:8080/api/v1/schema/list/1/fields \
  -H "Content-Type: application/json" \
  -d '{"field_name":"name","field_label":"Name","field_type":"string","searchable":true,"sortable":true,"order_no":20,"visible":true}' | jq

# 3) activate it
curl -sS -X POST http://localhost:8080/api/v1/schema/list/1/activate | jq

# 4) UI read endpoint (what the frontend uses)
curl -sS "http://localhost:8080/api/v1/schema/list?model=customer" | jq


# create an inactive schema for "customer"
curl -sS -X POST http://localhost:8080/api/v1/schema/list \
  -H "Content-Type: application/json" \
  -d '{"model":"customer","isActive":false}' | jq

# add fields (repeat for each you want)
curl -sS -X POST http://localhost:8080/api/v1/schema/list/<SCHEMA_ID>/fields \
  -H "Content-Type: application/json" \
  -d '{"field_name":"id","field_label":"ID","field_type":"number","width":100,"align":"right","sortable":true,"order_no":10,"visible":true}' | jq

# activate it
curl -sS -X POST http://localhost:8080/api/v1/schema/list/<SCHEMA_ID>/activate | jq