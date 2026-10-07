# Modelo de datos Partner v1

## Agency
id, legal_name, trade_name, tax_id, email, phone, city, province, status, created_at, partner_code.

## AgencyUser
id, agency_id, name, email, role, active.

## Owner
id, agency_id, name, email, phone, invitation_status, consent_at, created_at.

## ParkingSpace
id, agency_id, owner_id, reference, address, city, province, postal_code, latitude_optional, longitude_optional, vehicle_size, max_height, access_notes, hourly_price, status.

## Availability
id, parking_space_id, weekday, start_time, end_time, valid_from, valid_until, enabled.

## Booking
id, parking_space_id, customer_id, start_at, end_at, gross_amount, status, source_partner_code.

## PartnerAttribution
id, agency_id, source_type, source_code, first_touch_at, booking_id_optional.

## Settlement
id, agency_id, period_start, period_end, platform_revenue, partner_share, status, paid_at_optional.

## OwnerInvitation
id, agency_id, owner_id_optional, contact, token_hash, expires_at, accepted_at_optional, status.

## ImportBatch
id, agency_id, filename, row_count, accepted_count, rejected_count, created_at, status.

## Restricciones v1
- No almacenar secretos en cliente.
- Tokens de invitación solo como hash en servidor.
- CSV se valida antes de persistir.
- Coordenadas son opcionales hasta disponer de geocodificación propia o consentimiento para introducirlas manualmente.
- Toda entidad crítica lleva agency_id para aislamiento.


## Atributos físicos y de seguridad — v1
Añadir a ParkingSpace:
- is_indoor
- is_covered
- is_private_box
- is_shared_garage
- has_gate
- has_cctv
- has_concierge
- has_lighting
- pedestrian_access
- access_24h
- vehicle_size
- width_cm
- length_cm
- max_height_cm
- ev_charger
- access_method
- access_instructions
- owner_verified
- quality_score_optional

Estos campos son declarativos en v1; algunos podrán verificarse posteriormente mediante fotos, reservas completadas y feedback.
