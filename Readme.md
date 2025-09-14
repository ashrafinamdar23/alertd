Build UI
cd web
npm install
npm run build



$env:CGO_ENABLED = "0"
go build -trimpath -ldflags "-s -w" -o bin/alertd.exe ./cmd/alertd
.\bin\alertd.exe -config .\config.yaml