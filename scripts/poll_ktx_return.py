#!/usr/bin/env python3
"""Poll KTX return availability and write static JSON for the travel planner."""

from __future__ import annotations

import argparse
import importlib
import inspect
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


FROM_STATION = "전주"
TO_STATION = "용산"
TRAVEL_DATE = "2026-06-23"
PASSENGERS = 2
SEARCH_HOURS = list(range(12, 23))
SECRETS_PATH = Path("~/.config/k-skill/secrets.env").expanduser()
OUTPUT_PATH = Path("data/ktx-return.json")
KST = ZoneInfo("Asia/Seoul")


class SafeFailure(Exception):
    """Expected failure that should be serialized as unavailable status."""

    def __init__(self, code: str, message: str, detail: str | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.detail = detail


def main() -> int:
    parser = argparse.ArgumentParser(description="Poll KTX return availability for Jeonju to Yongsan.")
    parser.add_argument("--output", default=str(OUTPUT_PATH), help="JSON output path")
    parser.add_argument("--date", default=TRAVEL_DATE, help="Travel date as YYYY-MM-DD")
    parser.add_argument("--from-station", default=FROM_STATION, help="Departure station")
    parser.add_argument("--to-station", default=TO_STATION, help="Arrival station")
    parser.add_argument("--passengers", type=int, default=PASSENGERS, help="Adult passenger count")
    args = parser.parse_args()

    secrets = load_credentials()
    payload = base_payload(
        travel_date=args.date,
        from_station=args.from_station,
        to_station=args.to_station,
        passengers=args.passengers,
    )

    try:
        trains = poll_availability(
            travel_date=args.date,
            from_station=args.from_station,
            to_station=args.to_station,
            passengers=args.passengers,
            secrets=secrets,
        )
        payload.update(
            {
                "status": "available",
                "source": "korail2",
                "message": availability_message(trains),
                "trains": trains,
            }
        )
    except SafeFailure as exc:
        payload.update(
            {
                "status": "unavailable",
                "source": "korail2",
                "message": exc.message,
                "error": {"code": exc.code, "detail": sanitize_text(exc.detail or exc.message, secrets)},
                "trains": [],
            }
        )
    except Exception as exc:  # Defensive boundary: the scheduled job should still publish safe JSON.
        payload.update(
            {
                "status": "unavailable",
                "source": "korail2",
                "message": "KTX 좌석 조회 중 예상하지 못한 오류가 있어 최신 상태를 표시하지 못해요.",
                "error": {"code": "unexpected_error", "detail": sanitize_text(str(exc), secrets)},
                "trains": [],
            }
        )

    write_json_atomic(Path(args.output), payload)
    print(f"Wrote {args.output} with status={payload['status']} trains={len(payload.get('trains', []))}")
    return 0


def base_payload(travel_date: str, from_station: str, to_station: str, passengers: int) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "status": "unavailable",
        "source": "korail2",
        "lastChecked": datetime.now(KST).isoformat(timespec="seconds"),
        "query": {
            "date": travel_date,
            "from": from_station,
            "to": to_station,
            "passengers": passengers,
            "windows": [f"{hour:02d}:00" for hour in SEARCH_HOURS],
        },
        "message": "아직 KTX 좌석 조회가 실행되지 않았어요.",
        "trains": [],
    }


def load_credentials() -> dict[str, str]:
    file_values = parse_secrets_file(SECRETS_PATH)
    return {
        "KSKILL_KTX_ID": os.environ.get("KSKILL_KTX_ID") or file_values.get("KSKILL_KTX_ID", ""),
        "KSKILL_KTX_PASSWORD": os.environ.get("KSKILL_KTX_PASSWORD")
        or file_values.get("KSKILL_KTX_PASSWORD", ""),
    }


def parse_secrets_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}

    values: dict[str, str] = {}
    try:
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'\"")
            if key:
                values[key] = value
    except OSError:
        return {}
    return values


def poll_availability(
    *,
    travel_date: str,
    from_station: str,
    to_station: str,
    passengers: int,
    secrets: dict[str, str],
) -> list[dict[str, Any]]:
    user_id = secrets.get("KSKILL_KTX_ID", "")
    password = secrets.get("KSKILL_KTX_PASSWORD", "")
    if not user_id or not password:
        raise SafeFailure(
            "missing_credentials",
            "KTX 조회용 Korail 계정 정보가 없어 최신 좌석 상태를 확인하지 못했어요.",
            "Set KSKILL_KTX_ID and KSKILL_KTX_PASSWORD as environment variables or in ~/.config/k-skill/secrets.env.",
        )

    try:
        korail2 = importlib.import_module("korail2")
    except Exception as exc:
        raise SafeFailure(
            "missing_package",
            "KTX 조회 패키지를 사용할 수 없어 최신 좌석 상태를 확인하지 못했어요.",
            str(exc),
        ) from exc

    client = create_korail_client(korail2, user_id, password, secrets)
    compact_date = travel_date.replace("-", "")
    passenger_options = build_passenger_options(korail2, passengers)
    train_type_options = build_train_type_options(korail2)

    by_key: dict[str, dict[str, Any]] = {}
    errors: list[str] = []

    for hour in SEARCH_HOURS:
        search_time = f"{hour:02d}0000"
        try:
            raw_trains = search_hour(
                client=client,
                from_station=from_station,
                to_station=to_station,
                date=compact_date,
                time=search_time,
                passenger_options=passenger_options,
                train_type_options=train_type_options,
            )
        except Exception as exc:
            errors.append(f"{hour:02d}:00 {sanitize_text(str(exc), secrets)}")
            continue

        for raw_train in raw_trains:
            train = normalize_train(raw_train, f"{hour:02d}:00")
            if not train:
                continue
            if not is_departure_in_window(train.get("departureTime"), hour):
                continue
            if not looks_like_ktx(train):
                continue
            key = "|".join(
                [
                    str(train.get("departureDate") or compact_date),
                    str(train.get("trainNo") or train.get("trainName") or ""),
                    str(train.get("departureTime") or ""),
                    str(train.get("arrivalTime") or ""),
                ]
            )
            by_key[key] = train

    if not by_key and errors:
        raise SafeFailure(
            "query_failed",
            "Korail 조회가 실패해 최신 KTX 좌석 상태를 표시하지 못해요.",
            "; ".join(errors[:3]),
        )

    return sorted(by_key.values(), key=lambda item: (item.get("departureTime") or "", item.get("trainNo") or ""))


def create_korail_client(korail2: Any, user_id: str, password: str, secrets: dict[str, str]) -> Any:
    korail_class = getattr(korail2, "Korail", None)
    if korail_class is None:
        raise SafeFailure("invalid_package", "korail2 패키지에서 Korail 클라이언트를 찾지 못했어요.")

    attempts = [
        (user_id, password),
        (user_id, password, True),
    ]
    last_error: Exception | None = None
    for args in attempts:
        try:
            client = korail_class(*args)
            login = getattr(client, "login", None)
            if callable(login):
                try:
                    login()
                except TypeError:
                    login(user_id, password)
            return client
        except TypeError as exc:
            last_error = exc
            continue
        except Exception as exc:
            raise SafeFailure(
                "login_failed",
                "Korail 로그인에 실패해 최신 KTX 좌석 상태를 확인하지 못했어요.",
                sanitize_text(str(exc), secrets),
            ) from exc

    raise SafeFailure(
        "login_failed",
        "Korail 로그인 클라이언트를 만들지 못해 최신 KTX 좌석 상태를 확인하지 못했어요.",
        sanitize_text(str(last_error), secrets) if last_error else None,
    )


def build_passenger_options(korail2: Any, passengers: int) -> list[Any]:
    options: list[Any] = []
    adult = getattr(korail2, "AdultPassenger", None)
    passenger = getattr(korail2, "Passenger", None)

    for cls in (adult, passenger):
        if cls is None:
            continue
        for value in passenger_instances(cls, passengers):
            if value not in options:
                options.append(value)

    options.extend([passengers, None])
    return options


def passenger_instances(cls: Any, passengers: int) -> list[Any]:
    values: list[Any] = []
    try:
        values.append(cls(passengers))
    except Exception:
        pass
    try:
        values.append([cls() for _ in range(passengers)])
    except Exception:
        pass
    try:
        values.append([cls(1) for _ in range(passengers)])
    except Exception:
        pass
    return values


def build_train_type_options(korail2: Any) -> list[Any]:
    train_type = getattr(korail2, "TrainType", None)
    options: list[Any] = []
    if train_type is not None:
        for attr in ("KTX", "ktx"):
            if hasattr(train_type, attr):
                options.append(getattr(train_type, attr))
    options.append(None)
    return options


def search_hour(
    *,
    client: Any,
    from_station: str,
    to_station: str,
    date: str,
    time: str,
    passenger_options: list[Any],
    train_type_options: list[Any],
) -> list[Any]:
    method = getattr(client, "search_train", None)
    if not callable(method):
        raise SafeFailure("invalid_package", "korail2 클라이언트에서 search_train 메서드를 찾지 못했어요.")

    candidate_kwargs = [
        {"include_no_seats": True, "include_waiting_list": True},
        {"include_no_seat": True, "include_waiting_list": True},
        {"include_no_seats": True},
        {},
    ]
    supports_any_kwarg = method_supports_any_kwarg(method)
    last_error: Exception | None = None
    attempts: list[dict[str, Any]] = []

    for passenger in passenger_options:
        for train_type in train_type_options:
            for extra_kwargs in candidate_kwargs:
                for passenger_key in ("passengers", "passenger"):
                    kwargs = supported_kwargs(method, supports_any_kwarg, extra_kwargs)
                    if passenger is not None and supports_kwarg(method, supports_any_kwarg, passenger_key):
                        kwargs[passenger_key] = passenger
                    if train_type is not None and supports_kwarg(method, supports_any_kwarg, "train_type"):
                        kwargs["train_type"] = train_type
                    attempts.append(kwargs)

    attempts.append({})

    seen: set[str] = set()
    for kwargs in attempts:
        fingerprint = repr(sorted((key, repr(value)) for key, value in kwargs.items()))
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        try:
            return list(method(from_station, to_station, date, time, **kwargs) or [])
        except TypeError as exc:
            last_error = exc
            continue
        except Exception as exc:
            raise exc

    if last_error is not None:
        raise last_error
    return []


def method_supports_any_kwarg(method: Any) -> bool:
    try:
        signature = inspect.signature(method)
    except (TypeError, ValueError):
        return True
    return any(param.kind == inspect.Parameter.VAR_KEYWORD for param in signature.parameters.values())


def supports_kwarg(method: Any, supports_any_kwarg: bool, name: str) -> bool:
    if supports_any_kwarg:
        return True
    try:
        return name in inspect.signature(method).parameters
    except (TypeError, ValueError):
        return True


def supported_kwargs(method: Any, supports_any_kwarg: bool, values: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in values.items() if supports_kwarg(method, supports_any_kwarg, key)}


def normalize_train(raw_train: Any, window: str) -> dict[str, Any] | None:
    values = object_values(raw_train)
    departure_time = normalize_time(first_value(values, "departureTime", "departure_time", "dep_time", "dpt_tm", "h_dpt_tm"))
    arrival_time = normalize_time(first_value(values, "arrivalTime", "arrival_time", "arr_time", "arv_tm", "h_arv_tm"))
    train_no = clean_scalar(first_value(values, "trainNo", "train_no", "trn_no", "h_trn_no", "no"))
    train_name = clean_scalar(first_value(values, "trainName", "train_name", "train_type", "type", "name", "h_trn_clsf_nm"))

    if not departure_time and not train_no and not train_name:
        return None

    general = normalize_seat(
        first_value(
            values,
            "generalSeat",
            "general_seat",
            "general",
            "reserve_possible",
            "reserve_possible_name",
            "h_gen_rsv_nm",
            "h_gen_rsv_cd",
        ),
        "일반실",
    )
    special = normalize_seat(
        first_value(
            values,
            "specialSeat",
            "special_seat",
            "special",
            "special_reserve_possible",
            "h_spe_rsv_nm",
            "h_spe_rsv_cd",
        ),
        "특실",
    )
    waitlist = normalize_seat(
        first_value(values, "waitlist", "waiting_list", "wait_reserve", "wait_reserve_flag", "h_wait_rsv_flg"),
        "예약대기",
    )

    train: dict[str, Any] = {
        "window": window,
        "departureTime": departure_time,
        "arrivalTime": arrival_time,
        "trainNo": train_no,
        "trainName": train_name or "KTX",
        "generalSeat": general,
        "specialSeat": special,
        "waitlist": waitlist,
    }
    return {key: value for key, value in train.items() if value not in (None, "")}


def object_values(obj: Any) -> dict[str, Any]:
    if isinstance(obj, dict):
        values = dict(obj)
    else:
        values = {}
        try:
            values.update(vars(obj))
        except TypeError:
            pass

    for name in dir(obj):
        if name.startswith("_") or name in values:
            continue
        try:
            attr = getattr(obj, name)
        except Exception:
            continue
        if callable(attr):
            continue
        if isinstance(attr, (str, int, float, bool)) or attr is None:
            values[name] = attr
    return values


def first_value(values: dict[str, Any], *names: str) -> Any:
    normalized = {normalize_key(key): value for key, value in values.items()}
    for name in names:
        value = normalized.get(normalize_key(name))
        if value not in (None, ""):
            return value
    return None


def normalize_key(value: str) -> str:
    return "".join(char for char in value.lower() if char.isalnum())


def clean_scalar(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def normalize_time(value: Any) -> str | None:
    text = clean_scalar(value)
    if not text:
        return None
    digits = "".join(char for char in text if char.isdigit())
    if len(digits) >= 6:
        return f"{digits[-6:-4]}:{digits[-4:-2]}"
    if len(digits) == 4:
        return f"{digits[:2]}:{digits[2:]}"
    return text


def normalize_seat(value: Any, label: str) -> dict[str, Any] | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return {"available": value, "label": f"{label} {'가능' if value else '매진'}"}

    text = str(value).strip()
    positive_tokens = ("가능", "있", "예약", "Y", "YES", "true", "True", "1")
    negative_tokens = ("매진", "없", "불가", "N", "NO", "false", "False", "0")
    available: bool | None = None
    if any(token in text for token in positive_tokens):
        available = True
    if any(token in text for token in negative_tokens):
        available = False

    if available is True:
        normalized = f"{label} 가능"
    elif available is False:
        normalized = f"{label} 매진"
    else:
        normalized = f"{label} {text}"

    return {"available": available, "label": normalized}


def is_departure_in_window(departure_time: Any, hour: int) -> bool:
    if not departure_time:
        return True
    try:
        dep_hour = int(str(departure_time).split(":", 1)[0])
    except (TypeError, ValueError):
        return True
    return dep_hour == hour


def looks_like_ktx(train: dict[str, Any]) -> bool:
    name = f"{train.get('trainName', '')} {train.get('trainNo', '')}".upper()
    return "KTX" in name or not train.get("trainName")


def availability_message(trains: list[dict[str, Any]]) -> str:
    if not trains:
        return "Korail 조회는 완료됐지만 12:00-22:00 구간에 표시할 KTX 열차가 없어요."
    available_count = sum(
        1
        for train in trains
        if any(
            (train.get(key) or {}).get("available") is True
            for key in ("generalSeat", "specialSeat", "waitlist")
        )
    )
    if available_count:
        return f"12:00-22:00 구간에서 좌석 또는 예약대기 가능 신호가 있는 KTX {available_count}편을 찾았어요."
    return f"12:00-22:00 구간 KTX {len(trains)}편을 확인했지만 좌석 가능 신호는 아직 없어요."


def sanitize_text(value: str | None, secrets: dict[str, str]) -> str:
    text = str(value or "")
    for secret in secrets.values():
        if secret:
            text = text.replace(secret, "[redacted]")
    return text


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as tmp:
        tmp.write(data)
        tmp.flush()
        os.fsync(tmp.fileno())
        temp_name = tmp.name
    os.replace(temp_name, path)
    os.chmod(path, 0o644)


if __name__ == "__main__":
    raise SystemExit(main())
