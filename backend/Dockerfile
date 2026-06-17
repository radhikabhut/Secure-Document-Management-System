FROM golang:1.26.4-alpine3.24 AS builder

ENV APP_NAME=docuvoult
ENV GO111MODULE=on
ENV GOOS=linux

WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /app/${APP_NAME} ./cmd/server/main.go

FROM gcr.io/distroless/static-debian12

ENV APP_NAME=docuvoult
WORKDIR /app

COPY --from=builder /app/$APP_NAME /

EXPOSE 8080

CMD ["/docuvoult"]
