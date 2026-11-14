from supabase import create_client, Client

from e_sus.core.config import settings

class SupabaseAuthProvider:
    
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
        )
    def sign_up(self, email: str, password: str, user_name: str):
        return self.client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "name": user_name,
                }
            },
        })

    def sign_in(self, email: str, password: str):
        return self.client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        

    def get_user(self, acess_token: str):
        return self.client.auth.get_user(acess_token)

    def refresh_session(self, refresh_token: str):
        return self.client.auth.refresh_session(refresh_token)

    def sign_out(self, access_token: str) -> None:
        # Revoke only this session. Existing JWTs remain valid until exp.
        self.client.auth.admin.sign_out(access_token, "local")

    def request_password_recovery(self, email: str, redirect_to: str) -> None:
        self.client.auth.reset_password_for_email(
            email,
            options={"redirect_to": redirect_to},
        )

    def update_password(self, access_token: str, refresh_token: str, password: str):
        self.client.auth.set_session(access_token, refresh_token)
        return self.client.auth.update_user({"password": password})
