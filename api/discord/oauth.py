import requests
import urllib


class Oauth:
    def __init__(self, client_id, client_secret, redirect_uri, scope):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.scope = scope

    def get_authorization_url(self):
        return "https://discordapp.com/api/oauth2/authorize?client_id={}&redirect_uri={}&response_type=code&scope={}".format(
            self.client_id,
            urllib.parse.quote(self.redirect_uri, safe=""),
            urllib.parse.quote(self.scope, safe=""),
        )

    def get_access_token(self, code):
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        r = requests.post(
            "https://discordapp.com/api/oauth2/token", data=data, headers=headers
        )
        return r.json()

    def refresh_access_token(self, refresh_token):
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        r = requests.post(
            "https://discordapp.com/api/oauth2/token", data=data, headers=headers
        )
        return r.json()

    def revoke_access_token(self, access_token):
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "token": access_token,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        r = requests.post(
            "https://discordapp.com/api/oauth2/token/revoke", data=data, headers=headers
        )
        return r.json()

    def get_user(self, access_token):
        headers = {"Authorization": "Bearer {}".format(access_token)}
        r = requests.get("https://discordapp.com/api/users/@me", headers=headers)
        return r.json()

    def get_guilds(self, access_token):
        headers = {"Authorization": "Bearer {}".format(access_token)}
        r = requests.get("https://discordapp.com/api/users/@me/guilds", headers=headers)
        return r.json()
