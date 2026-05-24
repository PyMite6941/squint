import os
from upstash_redis import Redis

_redis: Redis | None = None


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis(
            url=os.environ["UPSTASH_REDIS_REST_URL"],
            token=os.environ["UPSTASH_REDIS_REST_TOKEN"],
        )
    return _redis


WINDOW_SECONDS = 60
MAX_REQUESTS_PER_MINUTE = 10  # per user, well under Groq's 30 RPM org limit


def check_rate_limit(user_id: str) -> bool:
    """Returns True if request is allowed, False if rate limited."""
    redis = get_redis()
    key = f"rl:{user_id}"
    count = redis.incr(key)
    if count == 1:
        redis.expire(key, WINDOW_SECONDS)
    return count <= MAX_REQUESTS_PER_MINUTE
