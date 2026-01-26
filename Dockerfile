# Build stage
FROM golang:1.24-alpine AS builder
WORKDIR /app

# Install build dependencies if needed (e.g. gcc for CGO)
# RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main ./cmd/api/main.go

# Run stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]
