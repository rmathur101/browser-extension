from .tag import Tag, TagRead, TagCreate
from .url import Url, UrlRead, UrlCreate
from .user import User, UserRead, UserCreate, UserUpdate, UserReadWithUrls
from .url_user import (
    UrlUser,
    UrlUserRead,
    UrlUserCreateApi,
    UrlUserUpdate,
    UrlUserUpdateApi,
)

# Solving circular imports hack, see: https://github.com/tiangolo/sqlmodel/issues/121
Tag.update_forward_refs(UrlUser=UrlUser)
Url.update_forward_refs(UrlUser=UrlUser)
User.update_forward_refs(UrlUser=UrlUser)
Tag.update_forward_refs(User=User, Url=Url, Tag=Tag)

UserReadWithUrls.update_forward_refs(UrlUser=UrlUser, UrlUserRead=UrlUserRead)
UrlUserRead.update_forward_refs(UrlRead=UrlRead, TagRead=TagRead)
