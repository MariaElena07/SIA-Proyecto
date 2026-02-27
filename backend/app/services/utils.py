def timedelta_to_str(td):
    if td is None:
        return None
    total = int(td.total_seconds())
    return f"{total//3600:02d}:{(total%3600)//60:02d}:00"