from __future__ import annotations

import json
import math
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

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
        """
    )
    if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        conn.execute(
            "INSERT INTO users VALUES (1,?,?,?,?,?,?,?,?)",
            ("Pau Demo", "pau@demo.local", 1, 1, 1, "4821 MZX", "Cupra Formentor", 96),
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
        placeholders = ",".join(["?"] * len(spaces[0]))
        conn.executemany(f"INSERT INTO spaces VALUES ({placeholders})", spaces)
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
    return out


class BookingCreate(BaseModel):
    space_id: int
    start_at: datetime
    end_at: datetime


class FavoriteToggle(BaseModel):
    space_id: int


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
    conn.close()
    data = dict(row)
    data["phone_verified"] = bool(data["phone_verified"])
    data["identity_verified"] = bool(data["identity_verified"])
    data["license_verified"] = bool(data["license_verified"])
    data["favorites"] = favs
    return data


@app.get("/api/spaces")
def spaces(
    city: Optional[str] = None,
    max_price: Optional[float] = Query(default=None, ge=0),
    security_min: int = Query(default=0, ge=0, le=100),
    gated: bool = False,
    cctv: bool = False,
    ev: bool = False,
    vehicle: Optional[str] = None,
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
    conn.close()
    return [public_space(r) for r in rows]


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
    if space["risk_level"] in ("B","C") and not (user["identity_verified"] and user["license_verified"] and user["vehicle_plate"]):
        conn.close()
        raise HTTPException(403, "Esta plaza requiere identidad, permiso y matrícula verificados")
    conflict = conn.execute(
        """SELECT 1 FROM bookings WHERE space_id=? AND status IN ('confirmed','active')
           AND NOT (end_at<=? OR start_at>=?) LIMIT 1""",
        (payload.space_id, payload.start_at.isoformat(), payload.end_at.isoformat()),
    ).fetchone()
    if conflict:
        conn.close()
        raise HTTPException(409, "La plaza ya está reservada en esa franja")
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


@app.get("/api/bookings/{booking_id}/access")
def booking_access(booking_id: int):
    conn = db()
    row = conn.execute(
        """SELECT b.*,s.address,s.private_access_note,s.access_method
           FROM bookings b JOIN spaces s ON s.id=b.space_id
           WHERE b.id=? AND b.user_id=1""",
        (booking_id,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Reserva no encontrada")
    start = datetime.fromisoformat(row["start_at"])
    now = datetime.now(start.tzinfo) if start.tzinfo else datetime.now()
    unlock_at = start - timedelta(minutes=30)
    if now < unlock_at:
        return {"locked":True,"unlock_at":unlock_at.isoformat(),"message":"Por seguridad, el acceso se muestra 30 minutos antes."}
    return {
        "locked":False,
        "address":row["address"],
        "access_method":row["access_method"],
        "instructions":row["private_access_note"],
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
