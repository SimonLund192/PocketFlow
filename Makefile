BACKEND_DIR := backend
BACKEND_VENV := $(BACKEND_DIR)/.venv
BACKEND_PYTHON := $(BACKEND_VENV)/bin/python
BACKEND_PIP := $(BACKEND_VENV)/bin/pip
BACKEND_PYTHON_VERSION := python3.11

.PHONY: backend-venv backend-install-dev backend-test backend-pytest

backend-venv:
	$(BACKEND_PYTHON_VERSION) -m venv $(BACKEND_VENV)
	$(BACKEND_PIP) install --upgrade pip

backend-install-dev: backend-venv
	$(BACKEND_PIP) install -r $(BACKEND_DIR)/requirements-dev.txt

backend-test: backend-install-dev
	cd $(BACKEND_DIR) && ../$(BACKEND_PYTHON) -m pytest

backend-pytest: backend-test
