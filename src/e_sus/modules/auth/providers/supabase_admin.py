from supabase import Client, create_client

from e_sus.core.config import settings


class SupabaseAdminProvider:
    def __init__(self):
        if not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY não está configurada no backend.")
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )

    def create_user(self, user_name: str, email: str, password: str):
        response = self.client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": user_name},
        })
        return response.user

    def delete_user(self, supabase_user_id: str) -> None:
        self.client.auth.admin.delete_user(supabase_user_id)