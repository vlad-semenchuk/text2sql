#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Text2SQL Application ===${NC}"

# Build and start all services
echo -e "\n${YELLOW}Building and starting all services...${NC}"
docker-compose up --build

echo -e "\n${GREEN}=== Application stopped ===${NC}"
