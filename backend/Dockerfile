FROM golang:1.24-alpine AS builder

WORKDIR /src

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -buildvcs=false -trimpath -ldflags="-s -w" -o /out/docuvault ./cmd/server

FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata wget \
    && addgroup -S app \
    && adduser -S app -G app \
    && mkdir -p /app/storage/documents \
    && chown -R app:app /app

COPY --from=builder /out/docuvault /app/docuvault
COPY --chown=app:app migrations /app/migrations

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["/app/docuvault"]
