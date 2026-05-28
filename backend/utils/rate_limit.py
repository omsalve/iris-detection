import time
from collections import defaultdict, deque
from typing import Deque, Dict

from utils.logger import get_logger

log = get_logger("ratelimit")

# key -> timestamps of the recent hits
_hits: Dict[str, Deque[float]] = defaultdict(deque)


def allow(key: str, limit: int, window_seconds: int) -> bool:
    """Sliding window, in memory. Resets on redeploy which is fine for now."""
    now = time.time()
    bucket = _hits[key]

    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()

    if len(bucket) >= limit:
        log.warning("Rate limited %s (%s hits in %ss)", key, len(bucket), window_seconds)
        return False

    bucket.append(now)
    return True
