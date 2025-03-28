# Variables
NODE_SCRIPT = get-binaries.js
RVM_INSTALL_URL = https://get.rvm.io
RVM_CHECK = $(shell which rvm)
PREFIX := $(shell uname -s)-$(shell uname -m)
SHELL := /bin/bash

# Default target
all: check-rvm run-node-script

# Check if RVM exists, install if not
check-rvm:
	@if [ ! -f "$(RVM_CHECK)" ]; then \
		echo "RVM not found. Installing RVM..."; \
		curl -sSL $(RVM_INSTALL_URL) | bash -s master; \
		echo "RVM installed successfully."; \
	else \
		echo "RVM is already installed."; \
	fi

# Run the Node.js script
run-node-script:
	bash -lc "node $(NODE_SCRIPT) $(PREFIX)"

clean:
	rm -rf $(shell dirname $(shell dirname $(shell which rvm)))/rubies/*
	rm -rf ./public/*.tar.gz
