# Variables
NODE_SCRIPT = get-binaries.js
RVM_INSTALL_URL = https://get.rvm.io
RVM_CHECK = $(HOME)/.rvm/bin/rvm

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
	node $(NODE_SCRIPT)
