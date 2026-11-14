"""Promote an existing, verified Supabase-backed patient to the first admin.

Run from the backend environment:
    uv run python scripts/bootstrap_admin.py --email operator@example.com

This is an operator-only command. It is not exposed as an HTTP endpoint.
Verify the person's identity and Supabase account before running it.
"""

import argparse
from getpass import getpass

from sqlalchemy import select

from e_sus.core.database import SessionLocal
from e_sus.modules.users.models import User, UserRole


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True, help="Email of an existing local user")
    args = parser.parse_args()
    expected_confirmation = f"PROMOVER {args.email}"

    if getpass(f"Digite '{expected_confirmation}' para confirmar: ") != expected_confirmation:
        print("Confirmação incorreta; nenhuma alteração foi feita.")
        return 1

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == args.email))
        if user is None:
            print("Usuário local não encontrado; nenhuma alteração foi feita.")
            return 1
        if not user.supabase_user_id:
            print("Usuário sem identidade Supabase; nenhuma alteração foi feita.")
            return 1
        if user.role == UserRole.PROFESSIONAL:
            print("Usuário com papel legado PROFESSIONAL não pode ser promovido.")
            return 1
        if user.role == UserRole.ADMIN:
            print("O usuário já é ADMIN.")
            return 0

        user.role = UserRole.ADMIN
        db.commit()
        print(f"{args.email} foi promovido a ADMIN.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
