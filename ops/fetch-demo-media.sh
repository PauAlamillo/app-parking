#!/bin/sh
set -eu
BASE="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DEST="$BASE/app/static/media"
mkdir -p "$DEST"

curl -L --fail -sS 'https://images.pexels.com/photos/18612570/pexels-photo-18612570.jpeg?cs=srgb&fm=jpg&w=1400' -o "$DEST/garage-interior.jpg"
curl -L --fail -sS 'https://images.pexels.com/photos/4327564/pexels-photo-4327564.jpeg?cs=srgb&fm=jpg&w=1400' -o "$DEST/garage-ramp.jpg"
curl -L --fail -sS 'https://images.pexels.com/photos/34034749/pexels-photo-34034749.jpeg?cs=srgb&fm=jpg&w=1400' -o "$DEST/garage-entry.jpg"
curl -L --fail -sS 'https://images.pexels.com/photos/11500969/pexels-photo-11500969.jpeg?cs=srgb&fm=jpg&w=1400' -o "$DEST/garage-car.jpg"

echo "Demo media downloaded to $DEST"
