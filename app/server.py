from __future__ import annotations

import json
import math
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent
DB = BASE / "data" / "app_parquing.sqlite3"
STATIC = BASE / "static"

app = FastAPI(title="App Parquing Demo", version="0.2.0")
app.mount("/static", StaticFiles(directory=STATIC), name="static")


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB.parent.mkdir(parents=True, exist_ok=True)
    conn = db()
    conn.executescript(
        """
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone_verified INTEGER NOT NULL DEFAULT 0,
          identity_verified INTEGER NOT NULL DEFAULT 0,
          license_verified INTEGER NOT NULL DEFAULT 0,
          vehicle_plate TEXT,
          vehicle_model TEXT,
          trust_score INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS spaces (
          id INTEGER PRIMARY KEY,
          city TEXT NOT NULL,
          neighborhood TEXT NOT NULL,
          address TEXT NOT NULL,
          approx_address TEXT NOT NULL,
          title TEXT NOT NULL,
          partner TEXT,
          price_hour REAL NOT NULL,
          price_day REAL NOT NULL,
          map_x REAL NOT NULL,
          map_y REAL NOT NULL,
          distance_m INTEGER NOT NULL,
          security_score INTEGER NOT NULL,
          rating REAL NOT NULL,
          reviews INTEGER NOT NULL,
          gated INTEGER NOT NULL,
          cctv INTEGER NOT NULL,
          lighting INTEGER NOT NULL,
          concierge INTEGER NOT NULL,
          indoor INTEGER NOT NULL,
          covered INTEGER NOT NULL,
          private_box INTEGER NOT NULL,
          shared_garage INTEGER NOT NULL,
          access_method TEXT NOT NULL,
          max_height_cm INTEGER,
          width_cm INTEGER,
          length_cm INTEGER,
          ev_charger INTEGER NOT NULL,
          vehicle_sizes TEXT NOT NULL,
          verified INTEGER NOT NULL,
          risk_level TEXT NOT NULL,
          description TEXT NOT NULL,
          public_access_note TEXT NOT NULL,
          private_access_note TEXT NOT NULL,
          bookings_count INTEGER NOT NULL DEFAULT 0,
          active INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          space_id INTEGER NOT NULL,
          start_at TEXT NOT NULL,
          end_at TEXT NOT NULL,
          hours REAL NOT NULL,
          subtotal REAL NOT NULL,
          service_fee REAL NOT NULL,
          total REAL NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          checkin_at TEXT,
          checkout_at TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(space_id) REFERENCES spaces(id)
        );
        CREATE TABLE IF NOT EXISTS favorites (
          user_id INTEGER NOT NULL,
          space_id INTEGER NOT NULL,
          PRIMARY KEY(user_id, space_id)
        );
        CREATE TABLE IF NOT EXISTS booking_access_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          space_id INTEGER NOT NULL,
          event_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(booking_id) REFERENCES bookings(id),
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(space_id) REFERENCES spaces(id)
        );
        CREATE TABLE IF NOT EXISTS space_weekly_availability (
          space_id INTEGER NOT NULL,
          weekday INTEGER NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 0,
          start_minute INTEGER NOT NULL DEFAULT 480,
          end_minute INTEGER NOT NULL DEFAULT 1080,
          PRIMARY KEY(space_id, weekday),
          FOREIGN KEY(space_id) REFERENCES spaces(id)
        );
        CREATE TABLE IF NOT EXISTS space_availability_exceptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          space_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          kind TEXT NOT NULL,
          start_minute INTEGER,
          end_minute INTEGER,
          note TEXT,
          UNIQUE(space_id, date),
          FOREIGN KEY(space_id) REFERENCES spaces(id)
        );
        CREATE TABLE IF NOT EXISTS space_manual_overrides (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          space_id INTEGER NOT NULL,
          kind TEXT NOT NULL,
          start_at TEXT NOT NULL,
          end_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(space_id) REFERENCES spaces(id)
        );
        """
    )
    user_columns = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "access_guarantee_amount" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN access_guarantee_amount REAL NOT NULL DEFAULT 0")
    if "access_guarantee_status" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN access_guarantee_status TEXT NOT NULL DEFAULT 'inactive'")

    space_columns = {row[1] for row in conn.execute("PRAGMA table_info(spaces)").fetchall()}
    if "owner_user_id" not in space_columns:
        conn.execute("ALTER TABLE spaces ADD COLUMN owner_user_id INTEGER")
    if "return_shield_minutes" not in space_columns:
        conn.execute("ALTER TABLE spaces ADD COLUMN return_shield_minutes INTEGER NOT NULL DEFAULT 45")
    conn.execute("UPDATE spaces SET owner_user_id=1 WHERE id=1 AND owner_user_id IS NULL")
    if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        conn.execute(
            """INSERT INTO users(
               id,name,email,phone_verified,identity_verified,license_verified,
               vehicle_plate,vehicle_model,trust_score,access_guarantee_amount,access_guarantee_status
               ) VALUES (1,?,?,?,?,?,?,?,?,?,?)""",
            ("Pau Demo", "pau@demo.local", 1, 1, 1, "4821 MZX", "Cupra Formentor", 96, 50.0, "active"),
        )
    else:
        conn.execute(
            "UPDATE users SET access_guarantee_amount=50.0, access_guarantee_status='active' WHERE id=1 AND access_guarantee_status='inactive'"
        )
    if conn.execute("SELECT COUNT(*) FROM spaces").fetchone()[0] == 0:
        spaces = [
            (1,"Barcelona","Eixample","C/ Aragó 182","Eixample · 3 min","Garaje protegido · Aragó", "Inmobiliaria Sol",2.55,18.0,49,42,180,97,4.9,126,1,1,1,0,1,1,0,1,"Apertura asistida",205,245,510,0,'["compacto","berlina","suv"]',1,"B","Garaje comunitario amplio, acceso directo y pasillos iluminados.","Dirección exacta tras reservar · entrada con control de acceso.","La agencia abre remotamente. Puerta peatonal separada. No se comparte ningún código permanente.",126,1),
            (2,"Barcelona","Gràcia","Travessera de Gràcia 91","Gràcia · 5 min","Parking interior · Gràcia", "Finques Nova",2.20,16.0,35,31,420,93,4.8,84,1,1,1,1,1,1,0,1,"Conserje",195,235,480,0,'["compacto","berlina"]',1,"B","Parking interior con conserje y cámaras declaradas.","Acceso atendido durante el horario de la reserva.","Identifícate con la matrícula de la reserva en conserjería.",84,1),
            (3,"Barcelona","Sants","C/ Numància 47","Sants · 4 min","Plaza privada · Sants Estació", None,1.85,13.5,62,66,260,86,4.7,51,1,0,1,0,1,1,0,1,"Mando controlado",190,230,470,0,'["compacto","berlina"]',1,"B","Plaza cómoda cerca de Sants, entrada ancha y buena iluminación.","Recogida del mando en caja segura próxima al acceso.","El código de la caja solo se muestra durante la ventana de reserva.",51,1),
            (4,"Madrid","Centro","C/ Atocha 76","Centro · 4 min","Garaje seguro · Atocha", "Grupo Centro",2.95,21.0,54,45,210,98,4.9,211,1,1,1,1,1,1,0,1,"Conserje 24 h",210,250,520,1,'["compacto","berlina","suv"]',1,"B","Garaje con atención 24 h, CCTV declarado y cargador disponible.","Acceso identificado por matrícula tras confirmar.","El personal valida la matrícula antes de permitir el acceso.",211,1),
            (5,"Madrid","Chamberí","C/ Santa Engracia 122","Chamberí · 6 min","Plaza cubierta · Chamberí", None,2.40,17.5,31,59,510,91,4.8,73,1,1,1,0,1,1,0,1,"Apertura por propietario",200,240,500,0,'["compacto","berlina","suv"]',1,"B","Plaza en garaje residencial, acceso sencillo y buena maniobra.","El propietario autoriza la entrada desde el móvil.","No se entrega mando ni código fijo.",73,1),
            (6,"Valencia","Ciutat Vella","C/ Guillem de Castro 34","Ciutat Vella · 3 min","Parking verificado · Centre", "Levante Homes",1.95,14.0,48,39,190,95,4.9,98,1,1,1,0,1,1,0,1,"Código temporal",205,245,500,1,'["compacto","berlina","suv"]',1,"B","Garaje cerrado cerca del centro histórico.","El PIN temporal aparece poco antes de la reserva.","El PIN caduca automáticamente al terminar la reserva.",98,1),
            (7,"Valencia","Ruzafa","C/ Sueca 51","Ruzafa · 5 min","Plaza interior · Ruzafa", None,1.65,12.0,64,57,350,88,4.7,44,1,0,1,0,1,1,0,1,"Apertura asistida",195,230,475,0,'["compacto","berlina"]',1,"B","Plaza interior económica en zona de alta demanda.","Apertura coordinada al llegar.","Tu matrícula queda asociada a la reserva.",44,1),
            (8,"Sevilla","Casco Antiguo","C/ Baños 23","Casco Antiguo · 4 min","Garaje privado · Centro", "Hispalis Gestión",2.10,15.0,46,44,230,96,4.9,112,1,1,1,0,1,1,0,1,"Apertura remota",205,245,505,0,'["compacto","berlina","suv"]',1,"B","Garaje cerrado y videovigilancia declarada, cerca del casco histórico.","La dirección completa se muestra tras confirmar.","La apertura se autoriza únicamente durante la reserva.",112,1),
            (9,"Sevilla","Nervión","Av. Eduardo Dato 69","Nervión · 3 min","Parking cubierto · Nervión", None,1.75,12.5,67,35,300,90,4.8,67,1,1,1,0,1,1,0,1,"Mando controlado",200,240,500,1,'["compacto","berlina","suv"]',1,"B","Plaza amplia junto a zona comercial y estadio.","Mando depositado en punto controlado.","Depósito y devolución registrados en la reserva.",67,1),
            (10,"Bilbao","Abando","C/ Ercilla 28","Abando · 4 min","Garaje cerrado · Abando", "Norte Inmobiliaria",2.35,17.0,50,48,240,94,4.8,103,1,1,1,1,1,1,0,1,"Conserje",200,240,495,0,'["compacto","berlina","suv"]',1,"B","Acceso controlado y conserjería en zona central.","Presenta la reserva y matrícula al llegar.","La puerta de garaje permanece controlada por el personal.",103,1),
            (11,"Málaga","Centro","C/ Carretería 40","Centro · 4 min","Parking seguro · Centro", "Costa Urbana",2.05,14.5,42,53,280,92,4.8,76,1,1,1,0,1,1,0,1,"Código temporal",195,235,485,0,'["compacto","berlina"]',1,"B","Garaje interior con acceso controlado.","Código temporal disponible cerca del inicio.","El código deja de ser válido al cerrar la reserva.",76,1),
            (12,"Zaragoza","Centro","P.º Independencia 31","Centro · 2 min","Plaza premium · Independencia", "Aragón Fincas",2.00,14.0,53,36,120,97,4.9,134,1,1,1,1,1,1,0,1,"Conserje",210,250,520,1,'["compacto","berlina","suv"]',1,"B","Garaje central con conserje, acceso amplio y cargador.","Entrada controlada por matrícula.","Acceso peatonal independiente y personal durante la reserva.",134,1),
        ]
        seed_columns = [
            "id","city","neighborhood","address","approx_address","title","partner",
            "price_hour","price_day","map_x","map_y","distance_m","security_score",
            "rating","reviews","gated","cctv","lighting","concierge","indoor","covered",
            "private_box","shared_garage","access_method","max_height_cm","width_cm",
            "length_cm","ev_charger","vehicle_sizes","verified","risk_level","description",
            "public_access_note","private_access_note","bookings_count","active"
        ]
        placeholders = ",".join(["?"] * len(seed_columns))
        conn.executemany(
            f"INSERT INTO spaces ({','.join(seed_columns)}) VALUES ({placeholders})",
            spaces,
        )
    conn.execute("UPDATE spaces SET owner_user_id=1, return_shield_minutes=45 WHERE id=1")
    if conn.execute("SELECT COUNT(*) FROM space_weekly_availability WHERE space_id=1").fetchone()[0] == 0:
        weekly = [(1, day, 1 if day < 5 else 0, 480, 1080) for day in range(7)]
        conn.executemany(
            "INSERT INTO space_weekly_availability(space_id,weekday,enabled,start_minute,end_minute) VALUES (?,?,?,?,?)",
            weekly,
        )
    conn.commit()
    conn.close()


def rowdict(row: sqlite3.Row) -> dict:
    out = dict(row)
    if "vehicle_sizes" in out:
        out["vehicle_sizes"] = json.loads(out["vehicle_sizes"])
    for key in ["gated","cctv","lighting","concierge","indoor","covered","private_box","shared_garage","ev_charger","verified","active"]:
        if key in out:
            out[key] = bool(out[key])
    return out


def public_space(row: sqlite3.Row) -> dict:
    out = rowdict(row)
    out.pop("address", None)
    out.pop("private_access_note", None)
    out.pop("owner_user_id", None)

    # Privacy by design: never expose a street/building identifier while browsing.
    # Public map coordinates are deliberately shifted to an approximate zone.
    out["title"] = f"Garaje privado · {out['neighborhood']}"
    out["approx_address"] = f"{out['neighborhood']} · ubicación aproximada"
    offset_x = ((int(out["id"]) * 17) % 9) - 4
    offset_y = ((int(out["id"]) * 23) % 9) - 4
    out["map_x"] = max(5, min(95, float(out["map_x"]) + offset_x))
    out["map_y"] = max(5, min(95, float(out["map_y"]) + offset_y))
    out["location_precision"] = "approximate"
    out["location_radius_m"] = 250
    return out


LOCAL_TZ = ZoneInfo("Europe/Madrid")


def to_local(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=LOCAL_TZ)
    return value.astimezone(LOCAL_TZ)


def overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return a_start < b_end and a_end > b_start


def parse_dt(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=LOCAL_TZ)
    return parsed


def get_routine_window(conn: sqlite3.Connection, space_id: int, target_date) -> tuple[int, int] | None:
    exception = conn.execute(
        "SELECT * FROM space_availability_exceptions WHERE space_id=? AND date=?",
        (space_id, target_date.isoformat()),
    ).fetchone()
    if exception:
        if exception["kind"] == "unavailable":
            return None
        start_minute = exception["start_minute"] if exception["start_minute"] is not None else 0
        end_minute = exception["end_minute"] if exception["end_minute"] is not None else 1440
        apply_shield = True
    else:
        rows = conn.execute(
            "SELECT * FROM space_weekly_availability WHERE space_id=?",
            (space_id,),
        ).fetchall()
        if not rows:
            return (0, 1440)
        weekday = target_date.weekday()
        row = next((r for r in rows if r["weekday"] == weekday), None)
        if not row or not row["enabled"]:
            return None
        start_minute, end_minute = row["start_minute"], row["end_minute"]
        apply_shield = True

    if apply_shield:
        shield_row = conn.execute(
            "SELECT return_shield_minutes FROM spaces WHERE id=?",
            (space_id,),
        ).fetchone()
        shield = int(shield_row["return_shield_minutes"] or 0) if shield_row else 0
        end_minute = max(start_minute, end_minute - shield)
    return (start_minute, end_minute)


def space_is_available(
    conn: sqlite3.Connection,
    space_id: int,
    start_at: datetime,
    end_at: datetime,
    ignore_booking_id: int | None = None,
) -> bool:
    if end_at <= start_at:
        return False

    start_local, end_local = to_local(start_at), to_local(end_at)

    overrides = conn.execute(
        "SELECT * FROM space_manual_overrides WHERE space_id=? ORDER BY id DESC",
        (space_id,),
    ).fetchall()
    release_covers = False
    for override in overrides:
        o_start, o_end = parse_dt(override["start_at"]), parse_dt(override["end_at"])
        if override["kind"] == "block" and overlaps(start_local, end_local, to_local(o_start), to_local(o_end)):
            return False
        if override["kind"] == "release" and to_local(o_start) <= start_local and to_local(o_end) >= end_local:
            release_covers = True

    if not release_covers:
        cursor_date = start_local.date()
        final_date = (end_local - timedelta(microseconds=1)).date()
        while cursor_date <= final_date:
            day_start = datetime.combine(cursor_date, datetime.min.time(), tzinfo=LOCAL_TZ)
            next_day = day_start + timedelta(days=1)
            segment_start = max(start_local, day_start)
            segment_end = min(end_local, next_day)
            window = get_routine_window(conn, space_id, cursor_date)
            if not window:
                return False
            start_minute, end_minute = window
            seg_start_min = (segment_start - day_start).total_seconds() / 60
            seg_end_min = (segment_end - day_start).total_seconds() / 60
            if seg_start_min < start_minute or seg_end_min > end_minute:
                return False
            cursor_date += timedelta(days=1)

    bookings = conn.execute(
        "SELECT id,start_at,end_at FROM bookings WHERE space_id=? AND status IN ('confirmed','active')",
        (space_id,),
    ).fetchall()
    for booking in bookings:
        if ignore_booking_id is not None and booking["id"] == ignore_booking_id:
            continue
        b_start, b_end = parse_dt(booking["start_at"]), parse_dt(booking["end_at"])
        if overlaps(start_local, end_local, to_local(b_start), to_local(b_end)):
            return False
    return True


def management_space(conn: sqlite3.Connection, space_id: int) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM spaces WHERE id=? AND owner_user_id=1",
        (space_id,),
    ).fetchone()
    if not row:
        raise HTTPException(404, "Plaza de gestión no encontrada")
    return row


def clear_overlapping_overrides(
    conn: sqlite3.Connection,
    space_id: int,
    start_at: datetime,
    end_at: datetime,
) -> None:
    rows = conn.execute(
        "SELECT id,start_at,end_at FROM space_manual_overrides WHERE space_id=?",
        (space_id,),
    ).fetchall()
    for row in rows:
        if overlaps(
            to_local(start_at), to_local(end_at),
            to_local(parse_dt(row["start_at"])), to_local(parse_dt(row["end_at"])),
        ):
            conn.execute("DELETE FROM space_manual_overrides WHERE id=?", (row["id"],))


class BookingCreate(BaseModel):
    space_id: int
    start_at: datetime
    end_at: datetime


class FavoriteToggle(BaseModel):
    space_id: int


class BookingExtend(BaseModel):
    end_at: datetime


class WeeklyAvailabilityItem(BaseModel):
    weekday: int = Field(ge=0, le=6)
    enabled: bool
    start_minute: int = Field(ge=0, le=1439)
    end_minute: int = Field(ge=1, le=1440)


class AvailabilityUpdate(BaseModel):
    return_shield_minutes: int = Field(ge=0, le=180)
    weekly: list[WeeklyAvailabilityItem]


class AvailabilityExceptionCreate(BaseModel):
    date: str
    kind: str
    start_minute: Optional[int] = Field(default=None, ge=0, le=1439)
    end_minute: Optional[int] = Field(default=None, ge=1, le=1440)
    note: Optional[str] = None


class ManualOverrideCreate(BaseModel):
    start_at: datetime
    end_at: datetime


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/gestion")
def gestion():
    return FileResponse(STATIC / "gestion.html")


@app.get("/partner")
def partner_legacy():
    return FileResponse(STATIC / "gestion.html")


@app.get("/api/health")
def health():
    return {"status":"ok","service":"app-parquing","db":DB.name}


@app.get("/api/me")
def me():
    conn = db()
    row = conn.execute("SELECT * FROM users WHERE id=1").fetchone()
    favs = [r[0] for r in conn.execute("SELECT space_id FROM favorites WHERE user_id=1").fetchall()]
    cancel_after_reveal_count = conn.execute(
        "SELECT COUNT(*) FROM booking_access_events WHERE user_id=1 AND event_type='cancel_after_reveal'"
    ).fetchone()[0]
    conn.close()
    data = dict(row)
    data["phone_verified"] = bool(data["phone_verified"])
    data["identity_verified"] = bool(data["identity_verified"])
    data["license_verified"] = bool(data["license_verified"])
    data["favorites"] = favs
    data["cancel_after_reveal_count"] = cancel_after_reveal_count
    data["access_review_required"] = cancel_after_reveal_count >= 3
    return data


@app.get("/api/management/spaces")
def management_spaces():
    conn = db()
    rows = conn.execute(
        "SELECT * FROM spaces WHERE owner_user_id=1 ORDER BY id"
    ).fetchall()
    out = []
    for row in rows:
        item = rowdict(row)
        item["private_access_note"] = None
        now = datetime.now(LOCAL_TZ)
        item["bookable_now"] = space_is_available(conn, row["id"], now, now + timedelta(minutes=15))
        item["return_shield_minutes"] = int(row["return_shield_minutes"] or 0)
        out.append(item)
    conn.close()
    return out


@app.get("/api/management/spaces/{space_id}/availability")
def get_management_availability(space_id: int):
    conn = db()
    space = management_space(conn, space_id)
    weekly_rows = conn.execute(
        "SELECT * FROM space_weekly_availability WHERE space_id=? ORDER BY weekday",
        (space_id,),
    ).fetchall()
    by_day = {r["weekday"]: r for r in weekly_rows}
    weekly = []
    for day in range(7):
        row = by_day.get(day)
        weekly.append({
            "weekday": day,
            "enabled": bool(row["enabled"]) if row else False,
            "start_minute": row["start_minute"] if row else 480,
            "end_minute": row["end_minute"] if row else 1080,
        })

    today = datetime.now(LOCAL_TZ)
    routine = get_routine_window(conn, space_id, today.date())
    current_booking = conn.execute(
        """SELECT id,start_at,end_at FROM bookings
           WHERE space_id=? AND status IN ('confirmed','active')
           ORDER BY start_at""",
        (space_id,),
    ).fetchall()
    active_booking = None
    for booking in current_booking:
        if parse_dt(booking["start_at"]) <= today <= parse_dt(booking["end_at"]):
            active_booking = dict(booking)
            break
    status = {
        "bookable_now": space_is_available(conn, space_id, today, today + timedelta(minutes=15)),
        "active_booking": active_booking,
        "today_start_minute": routine[0] if routine else None,
        "today_end_minute": routine[1] if routine else None,
    }
    exceptions = [
        dict(r) for r in conn.execute(
            "SELECT * FROM space_availability_exceptions WHERE space_id=? ORDER BY date",
            (space_id,),
        ).fetchall()
    ]
    conn.close()
    return {
        "space_id": space_id,
        "return_shield_minutes": int(space["return_shield_minutes"] or 0),
        "weekly": weekly,
        "exceptions": exceptions,
        "status": status,
    }


@app.put("/api/management/spaces/{space_id}/availability")
def update_management_availability(space_id: int, payload: AvailabilityUpdate):
    conn = db()
    management_space(conn, space_id)
    if len({item.weekday for item in payload.weekly}) != len(payload.weekly):
        conn.close()
        raise HTTPException(400, "No repitas días en el horario")
    for item in payload.weekly:
        if item.enabled and item.end_minute <= item.start_minute:
            conn.close()
            raise HTTPException(400, "La hora de fin debe ser posterior a la de inicio")
    conn.execute(
        "UPDATE spaces SET return_shield_minutes=? WHERE id=?",
        (payload.return_shield_minutes, space_id),
    )
    for item in payload.weekly:
        conn.execute(
            """INSERT INTO space_weekly_availability(space_id,weekday,enabled,start_minute,end_minute)
               VALUES (?,?,?,?,?)
               ON CONFLICT(space_id,weekday) DO UPDATE SET
               enabled=excluded.enabled,start_minute=excluded.start_minute,end_minute=excluded.end_minute""",
            (space_id, item.weekday, int(item.enabled), item.start_minute, item.end_minute),
        )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/api/management/spaces/{space_id}/exceptions")
def upsert_management_exception(space_id: int, payload: AvailabilityExceptionCreate):
    conn = db()
    management_space(conn, space_id)
    try:
        datetime.fromisoformat(payload.date)
    except ValueError:
        conn.close()
        raise HTTPException(400, "Fecha no válida")
    if payload.kind not in ("unavailable", "available"):
        conn.close()
        raise HTTPException(400, "Tipo de excepción no válido")
    if payload.kind == "available":
        if payload.start_minute is None or payload.end_minute is None:
            conn.close()
            raise HTTPException(400, "Indica inicio y fin para una disponibilidad especial")
        if payload.end_minute <= payload.start_minute:
            conn.close()
            raise HTTPException(400, "La hora de fin debe ser posterior a la de inicio")
    conn.execute(
        """INSERT INTO space_availability_exceptions(space_id,date,kind,start_minute,end_minute,note)
           VALUES (?,?,?,?,?,?)
           ON CONFLICT(space_id,date) DO UPDATE SET
           kind=excluded.kind,start_minute=excluded.start_minute,end_minute=excluded.end_minute,note=excluded.note""",
        (space_id, payload.date, payload.kind, payload.start_minute, payload.end_minute, payload.note),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.delete("/api/management/spaces/{space_id}/exceptions/{exception_date}")
def delete_management_exception(space_id: int, exception_date: str):
    conn = db()
    management_space(conn, space_id)
    conn.execute(
        "DELETE FROM space_availability_exceptions WHERE space_id=? AND date=?",
        (space_id, exception_date),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/api/management/spaces/{space_id}/release")
def release_management_space(space_id: int, payload: ManualOverrideCreate):
    conn = db()
    management_space(conn, space_id)
    if payload.end_at <= payload.start_at:
        conn.close()
        raise HTTPException(400, "La hora de fin debe ser posterior")
    clear_overlapping_overrides(conn, space_id, payload.start_at, payload.end_at)
    conn.execute(
        "INSERT INTO space_manual_overrides(space_id,kind,start_at,end_at,created_at) VALUES (?,'release',?,?,?)",
        (space_id, payload.start_at.isoformat(), payload.end_at.isoformat(), datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/api/management/spaces/{space_id}/need")
def need_management_space(space_id: int, payload: ManualOverrideCreate):
    conn = db()
    management_space(conn, space_id)
    if payload.end_at <= payload.start_at:
        conn.close()
        raise HTTPException(400, "La hora de fin debe ser posterior")
    bookings = conn.execute(
        "SELECT id,start_at,end_at FROM bookings WHERE space_id=? AND status IN ('confirmed','active')",
        (space_id,),
    ).fetchall()
    for booking in bookings:
        if overlaps(
            to_local(payload.start_at), to_local(payload.end_at),
            to_local(parse_dt(booking["start_at"])), to_local(parse_dt(booking["end_at"])),
        ):
            conn.close()
            raise HTTPException(409, "Ya hay una reserva confirmada dentro de esa franja")
    clear_overlapping_overrides(conn, space_id, payload.start_at, payload.end_at)
    conn.execute(
        "INSERT INTO space_manual_overrides(space_id,kind,start_at,end_at,created_at) VALUES (?,'block',?,?,?)",
        (space_id, payload.start_at.isoformat(), payload.end_at.isoformat(), datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/spaces")
def spaces(
    city: Optional[str] = None,
    max_price: Optional[float] = Query(default=None, ge=0),
    security_min: int = Query(default=0, ge=0, le=100),
    gated: bool = False,
    cctv: bool = False,
    ev: bool = False,
    vehicle: Optional[str] = None,
    start_at: Optional[datetime] = None,
    end_at: Optional[datetime] = None,
):
    clauses = ["active=1", "security_score>=?"]
    args: list[object] = [security_min]
    if city:
        clauses.append("LOWER(city)=LOWER(?)")
        args.append(city)
    if max_price is not None:
        clauses.append("price_hour<=?")
        args.append(max_price)
    if gated:
        clauses.append("gated=1")
    if cctv:
        clauses.append("cctv=1")
    if ev:
        clauses.append("ev_charger=1")
    if vehicle:
        clauses.append("vehicle_sizes LIKE ?")
        args.append(f'%"{vehicle}"%')
    conn = db()
    rows = conn.execute(
        "SELECT * FROM spaces WHERE " + " AND ".join(clauses) + " ORDER BY security_score DESC, distance_m ASC",
        args,
    ).fetchall()
    if (start_at is None) != (end_at is None):
        conn.close()
        raise HTTPException(400, "Indica entrada y salida para filtrar por disponibilidad")
    if start_at is not None and end_at is not None:
        rows = [r for r in rows if space_is_available(conn, r["id"], start_at, end_at)]
    out = [public_space(r) for r in rows]
    conn.close()
    return out


@app.get("/api/spaces/{space_id}")
def space_detail(space_id: int):
    conn = db()
    row = conn.execute("SELECT * FROM spaces WHERE id=? AND active=1", (space_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Plaza no encontrada")
    return public_space(row)


@app.get("/api/bookings")
def list_bookings():
    conn = db()
    rows = conn.execute(
        """SELECT b.*, s.title, s.city, s.neighborhood, s.approx_address, s.security_score, s.access_method
           FROM bookings b JOIN spaces s ON s.id=b.space_id
           WHERE b.user_id=1 ORDER BY b.start_at DESC"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/bookings")
def create_booking(payload: BookingCreate):
    if payload.end_at <= payload.start_at:
        raise HTTPException(400, "La salida debe ser posterior a la entrada")
    hours = (payload.end_at - payload.start_at).total_seconds() / 3600
    if hours < 1:
        raise HTTPException(400, "La reserva mínima es de 1 hora")
    if hours > 72:
        raise HTTPException(400, "La demo admite hasta 72 horas")
    conn = db()
    user = conn.execute("SELECT * FROM users WHERE id=1").fetchone()
    space = conn.execute("SELECT * FROM spaces WHERE id=? AND active=1", (payload.space_id,)).fetchone()
    if not space:
        conn.close()
        raise HTTPException(404, "Plaza no encontrada")
    if space["risk_level"] in ("B","C"):
        if not (user["identity_verified"] and user["license_verified"] and user["vehicle_plate"]):
            conn.close()
            raise HTTPException(403, "Esta plaza requiere identidad, permiso y matrícula verificados")
        if user["access_guarantee_status"] != "active" or float(user["access_guarantee_amount"] or 0) < 50:
            conn.close()
            raise HTTPException(403, "Esta plaza requiere una garantía de acceso activa de 50 €")
    if not space_is_available(conn, payload.space_id, payload.start_at, payload.end_at):
        conn.close()
        raise HTTPException(409, "La plaza no está disponible en esa franja")
    subtotal = round(space["price_hour"] * hours, 2)
    service_fee = round(max(0.75, subtotal * 0.10), 2)
    total = round(subtotal + service_fee, 2)
    created = datetime.now(timezone.utc).isoformat()
    cur = conn.execute(
        """INSERT INTO bookings(user_id,space_id,start_at,end_at,hours,subtotal,service_fee,total,status,created_at)
           VALUES (1,?,?,?,?,?,?,?,'confirmed',?)""",
        (payload.space_id,payload.start_at.isoformat(),payload.end_at.isoformat(),round(hours,2),subtotal,service_fee,total,created),
    )
    conn.execute("UPDATE spaces SET bookings_count=bookings_count+1 WHERE id=?", (payload.space_id,))
    conn.commit()
    booking_id = cur.lastrowid
    row = conn.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()
    conn.close()
    return dict(row)


@app.post("/api/bookings/{booking_id}/checkin")
def checkin(booking_id: int):
    conn = db()
    row = conn.execute("SELECT * FROM bookings WHERE id=? AND user_id=1", (booking_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Reserva no encontrada")
    now = datetime.now(timezone.utc).isoformat()
    conn.execute("UPDATE bookings SET status='active', checkin_at=? WHERE id=?", (now, booking_id))
    conn.commit()
    conn.close()
    return {"ok":True,"checkin_at":now}


@app.post("/api/bookings/{booking_id}/checkout")
def checkout(booking_id: int):
    conn = db()
    row = conn.execute("SELECT * FROM bookings WHERE id=? AND user_id=1", (booking_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Reserva no encontrada")
    now = datetime.now(timezone.utc).isoformat()
    conn.execute("UPDATE bookings SET status='completed', checkout_at=? WHERE id=?", (now, booking_id))
    conn.commit()
    conn.close()
    return {"ok":True,"checkout_at":now}


@app.post("/api/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: int):
    conn = db()
    row = conn.execute(
        "SELECT * FROM bookings WHERE id=? AND user_id=1",
        (booking_id,),
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Reserva no encontrada")
    if row["status"] != "confirmed":
        conn.close()
        raise HTTPException(409, "Solo puedes cancelar una reserva que aún no ha empezado")
    had_reveal = conn.execute(
        "SELECT 1 FROM booking_access_events WHERE booking_id=? AND event_type='location_revealed' LIMIT 1",
        (booking_id,),
    ).fetchone()
    conn.execute("UPDATE bookings SET status='cancelled' WHERE id=?", (booking_id,))
    if had_reveal:
        conn.execute(
            """INSERT INTO booking_access_events(booking_id,user_id,space_id,event_type,created_at)
               VALUES (?,?,?,?,?)""",
            (booking_id, row["user_id"], row["space_id"], "cancel_after_reveal", datetime.now(timezone.utc).isoformat()),
        )
    conn.commit()
    conn.close()
    return {"ok": True, "status": "cancelled", "cancel_after_reveal": bool(had_reveal)}


@app.post("/api/bookings/{booking_id}/extend")
def extend_booking(booking_id: int, payload: BookingExtend):
    conn = db()
    row = conn.execute(
        """SELECT b.*, s.price_hour
           FROM bookings b JOIN spaces s ON s.id=b.space_id
           WHERE b.id=? AND b.user_id=1""",
        (booking_id,),
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Reserva no encontrada")
    if row["status"] not in ("confirmed", "active"):
        conn.close()
        raise HTTPException(409, "Esta reserva ya no se puede ampliar")

    current_end = datetime.fromisoformat(row["end_at"])
    new_end = payload.end_at
    if current_end.tzinfo and not new_end.tzinfo:
        new_end = new_end.replace(tzinfo=current_end.tzinfo)
    if new_end <= current_end:
        conn.close()
        raise HTTPException(400, "La nueva hora de salida debe ser posterior a la actual")

    start = datetime.fromisoformat(row["start_at"])
    hours = (new_end - start).total_seconds() / 3600
    if hours > 72:
        conn.close()
        raise HTTPException(400, "La demo admite hasta 72 horas")

    if not space_is_available(conn, row["space_id"], start, new_end, ignore_booking_id=booking_id):
        conn.close()
        raise HTTPException(409, "No se puede ampliar: la plaza deja de estar disponible antes")

    subtotal = round(row["price_hour"] * hours, 2)
    service_fee = round(max(0.75, subtotal * 0.10), 2)
    total = round(subtotal + service_fee, 2)
    conn.execute(
        """UPDATE bookings
           SET end_at=?, hours=?, subtotal=?, service_fee=?, total=?
           WHERE id=?""",
        (new_end.isoformat(), round(hours, 2), subtotal, service_fee, total, booking_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()
    conn.close()
    return dict(updated)


@app.get("/api/bookings/{booking_id}/access")
def booking_access(booking_id: int):
    conn = db()
    row = conn.execute(
        """SELECT b.*,s.address,s.private_access_note,s.access_method
           FROM bookings b JOIN spaces s ON s.id=b.space_id
           WHERE b.id=? AND b.user_id=1""",
        (booking_id,),
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Reserva no encontrada")
    if row["status"] == "cancelled":
        conn.close()
        return {"locked":True,"message":"La reserva está cancelada y el acceso ya no está disponible."}

    start = parse_dt(row["start_at"])
    end = parse_dt(row["end_at"])
    now = datetime.now(start.tzinfo) if start.tzinfo else datetime.now()
    unlock_at = start - timedelta(minutes=30)
    expire_at = end + timedelta(minutes=15)

    if now < unlock_at:
        conn.close()
        return {
            "locked":True,
            "unlock_at":unlock_at.isoformat(),
            "message":"Por seguridad, la dirección exacta se muestra 30 minutos antes."
        }
    if now > expire_at:
        conn.close()
        return {
            "locked":True,
            "expired":True,
            "message":"La ventana de acceso ha terminado. La dirección vuelve a quedar protegida."
        }

    already_revealed = conn.execute(
        "SELECT 1 FROM booking_access_events WHERE booking_id=? AND event_type='location_revealed' LIMIT 1",
        (booking_id,),
    ).fetchone()
    if not already_revealed:
        conn.execute(
            """INSERT INTO booking_access_events(booking_id,user_id,space_id,event_type,created_at)
               VALUES (?,?,?,?,?)""",
            (booking_id, row["user_id"], row["space_id"], "location_revealed", datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
    conn.close()
    return {
        "locked":False,
        "address":row["address"],
        "access_method":row["access_method"],
        "instructions":row["private_access_note"],
        "expires_at":expire_at.isoformat(),
    }


@app.post("/api/favorites")
def toggle_favorite(payload: FavoriteToggle):
    conn = db()
    exists = conn.execute("SELECT 1 FROM favorites WHERE user_id=1 AND space_id=?", (payload.space_id,)).fetchone()
    if exists:
        conn.execute("DELETE FROM favorites WHERE user_id=1 AND space_id=?", (payload.space_id,))
        active = False
    else:
        conn.execute("INSERT OR IGNORE INTO favorites(user_id,space_id) VALUES (1,?)", (payload.space_id,))
        active = True
    conn.commit()
    conn.close()
    return {"active":active}


@app.get("/api/partner/summary")
def partner_summary():
    conn = db()
    active = conn.execute("SELECT COUNT(*) FROM spaces WHERE partner IS NOT NULL AND active=1").fetchone()[0]
    bookings = conn.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
    revenue = conn.execute("SELECT COALESCE(SUM(subtotal),0) FROM bookings").fetchone()[0]
    conn.close()
    return {"active_spaces":active,"bookings":bookings,"owner_revenue":round(revenue,2),"partner_status":"verified"}


init_db()