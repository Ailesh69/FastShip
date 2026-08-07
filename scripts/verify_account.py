"""Mark an account's email as verified, without the emailed link.

For local testing only. The verification link in an email points at
APP_BASE_URL, so a tester on another device cannot open it unless that address
is reachable from their machine. This flips the same flag the link would.

Usage:
    python -m scripts.verify_account seller swyamkapoor.cse@gmail.com
    python -m scripts.verify_account --list seller
"""

import argparse
import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from config import db_settings

TABLES = {"seller": "seller", "partner": "delivery_partner", "client": "client"}


async def list_accounts(engine, table: str) -> None:
    async with engine.connect() as conn:
        rows = (
            await conn.execute(
                text(f"SELECT id, name, email, email_verified FROM {table} ORDER BY email")
            )
        ).all()
    if not rows:
        print(f"No rows in {table}.")
        return
    print(f"{'email':<38} {'verified':<9} {'name':<16} id")
    for r in rows:
        print(f"{r.email:<38} {str(r.email_verified):<9} {r.name:<16} {r.id}")


async def verify(engine, table: str, email: str) -> int:
    async with engine.begin() as conn:
        rows = (
            await conn.execute(
                text(f"SELECT id, name, email_verified FROM {table} WHERE email = :e"),
                {"e": email},
            )
        ).all()

        if not rows:
            print(f"No {table} found with email {email!r}.")
            print("Check the spelling — run with --list to see what is actually stored.")
            return 1

        # seller and delivery_partner have no unique index on email, so the same
        # address can appear more than once. login() looks the account up with a
        # plain SELECT and takes whichever row comes back first, so verifying
        # just one of them can still leave the user unable to sign in. Flip them
        # all and say so.
        if len(rows) > 1:
            print(f"WARNING: {len(rows)} {table} rows share {email!r}:")
            for r in rows:
                print(f"  {r.id}  verified={r.email_verified}")
            print("Verifying all of them. Delete the extras once you have logged in.")

        await conn.execute(
            text(f"UPDATE {table} SET email_verified = true WHERE email = :e"),
            {"e": email},
        )

    print(f"Verified {len(rows)} {table} row(s) for {email}. They can log in now.")
    return 0


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("role", choices=sorted(TABLES), help="account type")
    parser.add_argument("email", nargs="?", help="email address to verify")
    parser.add_argument("--list", action="store_true", help="list accounts instead")
    args = parser.parse_args()

    if not args.list and not args.email:
        parser.error("give an email address, or pass --list")

    engine = create_async_engine(db_settings.POSTGRES_URL)
    try:
        if args.list:
            await list_accounts(engine, TABLES[args.role])
            return 0
        return await verify(engine, TABLES[args.role], args.email)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
