import hashlib


# def str2int(string: str) -> int:
#     """Hash url to integer representation"""
#     return int(hashlib.md5(string.encode("utf8")).hexdigest(), 16) % 1000000000000000

# NOTE: RM - according to GPT3 this is a better function because the sha256 hash is more secure in that it is less likely to collide with other hashes; also the modulo operator is used to reduce the size of the integer to 15 digits which should prevent the javascript bigint issue on the frontend (unlike the modulo operator used in the above function) 
def str2int(string: str) -> int:
    """Hash url to integer representation"""
    # Generate a cryptographic hash of the string using SHA-256
    hash_value = hashlib.sha256(string.encode("utf8")).hexdigest()
    # Convert the hash value to an integer
    integer = int(hash_value, 16)
    # Use the modulo operator to reduce the size of the integer to 15 digits
    return integer % 100000000000000






