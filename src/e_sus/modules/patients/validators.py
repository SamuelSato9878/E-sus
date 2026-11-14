import re


def normalize_and_validate_cpf(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("CPF inválido.")

    cpf = re.sub(r"[.\-\s]", "", value)
    if not cpf.isascii() or not cpf.isdigit() or len(cpf) != 11 or len(set(cpf)) == 1:
        raise ValueError("CPF inválido.")

    digits = [int(digit) for digit in cpf]
    first_sum = sum(digit * weight for digit, weight in zip(digits[:9], range(10, 1, -1)))
    first_check = (first_sum * 10) % 11
    if first_check == 10:
        first_check = 0

    second_sum = sum(digit * weight for digit, weight in zip(digits[:10], range(11, 1, -1)))
    second_check = (second_sum * 10) % 11
    if second_check == 10:
        second_check = 0

    if digits[9:] != [first_check, second_check]:
        raise ValueError("CPF inválido.")
    return cpf
