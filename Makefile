FRONTEND_DIR := frontend
BACKEND_DIR := backend
BACKEND_VENV := $(BACKEND_DIR)/venv
BACKEND_VENV_DONE := $(BACKEND_DIR)/venv/.done
PYTHON := python3
PUSH_VENV := push-venv
PUSH_VENV_PYTHON := $(PUSH_VENV)/bin/$(PYTHON)
PUSH_VENV_DONE := $(PUSH_VENV)/.done
PUSH_REQ := req-push.txt

help:
	@echo Usage:
	@echo "make backend-venv -- create development environment"
	@echo "make local-deploy -- run backend server?"
	@echo "make push -- deploy current branch"
	@echo "make clean -- remove development environment"

backend-venv: $(BACKEND_VENV_DONE)

$(BACKEND_VENV_DONE): $(BACKEND_DIR)/requirements.txt
	@echo "Creating backend virtualenv and installing requirements..."
	cd $(BACKEND_DIR) && $(PYTHON) -m venv venv && . venv/bin/activate && pip install -r requirements.txt

local-deploy: $(BACKEND_VENV_DONE)
	npm --prefix $(FRONTEND_DIR) ci
	npm --prefix $(FRONTEND_DIR) run build
	cd $(BACKEND_DIR) && . venv/bin/activate && FLASK_APP=app:create_app flask run --port 5000

push:	$(PUSH_VENV_DONE)
	$(PUSH_VENV_PYTHON) dokku-scripts/deploy.py -dn deploy

# for manually building push-venv:
.PHONY:	push-venv
push-venv: $(PUSH_VENV_DONE)

$(PUSH_VENV_DONE): $(PUSH_REQ)
	python -m venv $(PUSH_VENV)
	$(PUSH_VENV_PYTHON) -m pip install -r $(PUSH_REQ)
	touch $(PUSH_VENV_DONE)

clean:
	rm -rf $(BACKEND_VENV) $(PUSH_VENV)
