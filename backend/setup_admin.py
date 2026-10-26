
import getpass
import re
import secrets
import sys

from sqlalchemy import func, select

from backend.auth import hash_password
from backend.database import SessionLocal
from backend.models import Clinic, Staff


def main():
    print("=== Initial Clinic Admin Setup ===")

    clinic_name = input("Clinic name: ").strip()
    if not clinic_name or len(clinic_name) > 150:
        print("Enter a clinic name between 1 and 150 characters.")
        sys.exit(1)

    username = input("Admin username: ").strip()
    if not username or len(username) > 100:
        print("Enter a username between 1 and 100 characters.")
        sys.exit(1)

    password = getpass.getpass("Admin password (minimum 12 characters): ")
    confirm = getpass.getpass("Confirm admin password: ")

    if password != confirm:
        print("Passwords do not match.")
        sys.exit(1)

    try:
        password_hash = hash_password(password)
    except ValueError as error:
        print(error)
        sys.exit(1)

    # A random clinic code is generated; it is not a login password.
    clinic_code = "CLN-" + secrets.token_hex(4).upper()

    with SessionLocal() as db:
        try:
            existing_clinics = db.scalar(select(func.count()).select_from(Clinic))
            existing_staff = db.scalar(select(func.count()).select_from(Staff))

            if existing_clinics or existing_staff:
                print(
                    "Setup stopped: clinic or staff records already exist. "
                    "Use the normal admin-management process instead."
                )
                sys.exit(1)

            clinic = Clinic(
                clinic_code=clinic_code,
                name=clinic_name,
                is_active=True,
            )
            db.add(clinic)
            db.flush()

            admin = Staff(
                clinic_id=clinic.id,
                username=username,
                password_hash=password_hash,
                full_name=username,
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()

            print("\nInitial setup successful!")
            print(f"Clinic name: {clinic_name}")
            print(f"Clinic code: {clinic_code}")
            print(f"Admin username: {username}")
            print("Keep the clinic code and credentials somewhere secure.")

        except Exception:
            db.rollback()
            raise


if __name__ == "__main__":
    main()
