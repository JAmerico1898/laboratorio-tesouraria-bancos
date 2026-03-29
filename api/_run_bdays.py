"""Standalone script called by Next.js route handler. Prints JSON to stdout."""
import sys
import json
from datetime import datetime
import pyield as yd


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "start and end arguments required"}))
        sys.exit(1)

    start_str, end_str = sys.argv[1], sys.argv[2]
    try:
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_str, "%Y-%m-%d").date()
        count = yd.bday.count(start_date, end_date)
        print(json.dumps({"start": start_str, "end": end_str, "bdays": int(count)}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
