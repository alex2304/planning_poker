IMAGE_NAME := planning_poker
CONTAINER_NAME := planning_poker
PORT := 8000

.PHONY: build start stop check-image-built check-not-running

build:
	docker build -t $(IMAGE_NAME):latest .

check-image-built:
	@if [ -z "$$(docker images -q $(IMAGE_NAME):latest 2> /dev/null)" ]; then \
		echo "Image $(IMAGE_NAME):latest not found. Building..."; \
		make build; \
	fi

check-not-running:
	@if lsof -i :$(PORT) > /dev/null 2>&1; then \
		echo "Port $(PORT) is already in use. Attempting to stop existing container..."; \
		make stop; \
	fi

start: check-image-built check-not-running
	docker run -d --name=$(CONTAINER_NAME) -p $(PORT):$(PORT) $(IMAGE_NAME) -b 0.0.0.0:$(PORT) -w 1 "planning_poker:create_app()"

stop:
	docker stop $(CONTAINER_NAME) && docker rm $(CONTAINER_NAME)
