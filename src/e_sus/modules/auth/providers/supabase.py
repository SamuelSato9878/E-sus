from supabase import create_client, Client

from e_sus.core.config import settings

class SupabaseAuthProvider:
    
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
        )
    def sign_up(self, email: str, password: str, name: str):
        return self.client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "name": name,
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

    def sign_out(self):
        return self.client.auth.sign_out
