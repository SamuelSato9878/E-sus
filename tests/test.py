import pytest


def python_tests() -> int:
    return pytest.main(["tests"])


if __name__ == "__main__":
    raise SystemExit(python_tests())
