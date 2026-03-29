"""Standalone script called by Next.js route handler. Prints JSON to stdout."""
import sys
import json
from datetime import datetime, timedelta
import pyield as yd


def fetch_di1(date_str: str):
    ref_date = datetime.strptime(date_str, "%Y-%m-%d").date()

    for attempt in range(10):
        check_date = ref_date - timedelta(days=attempt)
        try:
            df = yd.futures(check_date, "DI1")
            if df is not None and len(df) > 0:
                contracts = []
                for row in df.iter_rows(named=True):
                    contracts.append({
                        "ticker": str(row["TickerSymbol"]),
                        "expiration": str(row["ExpirationDate"]),
                        "bdays": int(row["BDaysToExp"]),
                        "rate": float(row["SettlementRate"]),
                    })
                return {
                    "contracts": contracts,
                    "actual_date": str(check_date),
                    "requested_date": date_str,
                }
        except Exception:
            continue

    return {
        "error": f"Dados indisponíveis para {date_str}. Selecione uma data mais próxima do dia atual.",
        "contracts": [],
        "actual_date": None,
    }


if __name__ == "__main__":
    date_arg = sys.argv[1] if len(sys.argv) > 1 else None
    if not date_arg:
        print(json.dumps({"error": "date argument required"}))
        sys.exit(1)
    result = fetch_di1(date_arg)
    print(json.dumps(result, ensure_ascii=False))
