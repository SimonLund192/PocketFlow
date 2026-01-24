import logging
import sys

def setup_ai_logger():
    logger = logging.getLogger("pocketflow.ai")
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    logger.addHandler(handler)
    return logger

ai_logger = setup_ai_logger()
