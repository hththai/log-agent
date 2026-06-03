# --- Stage 1: Build the Go Binary ---
FROM golang:1.25-alpine AS builder

# Install git if your go modules require it (optional but recommended)
RUN apk add --no-cache git

# Set the working directory inside the builder container
WORKDIR /app

# Copy go.mod and go.sum files first to leverage Docker caching for dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of your Go source code
COPY . .

# Compile the Go application into a statically-linked binary named "agent"
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o agent .

# --- Stage 2: Final Lightweight Runtime ---
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /root/

# Copy the compiled binary from the builder stage
COPY --from=builder /app/agent .

# Ensure the directory where Docker will mount your logs exists
RUN mkdir -p /incoming-logs/client

# Command to run the agent when the container starts
CMD ["./agent"]