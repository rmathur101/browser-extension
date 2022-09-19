import hashlib


def str2int(string: str) -> int:
    """Hash url to integer representation"""
    return int(hashlib.md5(string.encode("utf8")).hexdigest(), 16) % 1000000000000000

