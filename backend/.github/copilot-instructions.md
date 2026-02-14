// filepath: backend/.github/copilot-instructions.md
- Python 3.11, FastAPI, Motor async driver.
- Pydantic v2: use `model_dump()`, not `.dict()`.
- Always filter DB queries by `user_id` from `get_user_context()`.
- Routes in `app/routes/<feature>.py`, services in `app/services/`.
- Use `logging` stdlib. AI module uses `pocketflow.ai` logger.
- Run tests: `pytest` or `docker compose run --rm backend pytest`.