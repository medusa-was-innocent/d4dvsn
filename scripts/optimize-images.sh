#!/usr/bin/env bash

# Rebuild the delivery-sized artwork in public/optimized from the backed-up
# source artwork. Originals are intentionally not removed here.
set -euo pipefail

project_root=$(cd "$(dirname "$0")/.." && pwd)
source_root="$project_root/public"
output_root="$source_root/optimized"
cwebp_bin="${CWEBP_BIN:-/opt/homebrew/bin/cwebp}"

if [[ ! -x "$cwebp_bin" ]]; then
  echo "cwebp was not found at $cwebp_bin. Set CWEBP_BIN to continue." >&2
  exit 1
fi

webp() {
  local source_path=$1
  local output_path=$2
  local width=$3
  local height=$4
  local quality=$5

  mkdir -p "$(dirname "$output_path")"
  "$cwebp_bin" -quiet -mt -m 6 -af -sharp_yuv -q "$quality" -alpha_q 100 \
    -resize "$width" "$height" "$source_path" -o "$output_path"
}

# Full-bleed painted backgrounds. 2048–2560 px is sufficient for their
# viewport roles without sending the original 17–20 MP source files.
webp "$source_root/backgrounds/mountains.jpg" "$output_root/backgrounds/mountains.webp" 2560 0 88
webp "$source_root/backgrounds/room.jpg" "$output_root/backgrounds/room.webp" 2560 0 88
webp "$source_root/backgrounds/sky.jpg" "$output_root/backgrounds/sky.webp" 2048 0 88

webp "$source_root/awards/sky.jpg" "$output_root/awards/sky.webp" 2048 0 88
webp "$source_root/awards/clouds.png" "$output_root/awards/clouds.webp" 1920 0 90
# The lily is presented as a bounded foreground painting, so a 1440 px source
# preserves fine lines at its maximum rendered size.
webp "$source_root/awards/trophy.png" "$output_root/awards/lily.webp" 1440 0 90

webp "$source_root/contact/sky.jpeg" "$output_root/contact/sky.webp" 2048 0 88
webp "$source_root/contact/mountains.png" "$output_root/contact/mountains.webp" 2560 0 90
webp "$source_root/contact/path.png" "$output_root/contact/path.webp" 2048 0 90
# body.png, arm.png, and full.png are byte-identical current assets. Export one
# transparent figure only; the view uses a single parallax layer.
webp "$source_root/contact/body.png" "$output_root/contact/pain-figure.webp" 1440 0 90

# The checked-in favicon is a 5504×3072 PNG under an .ico extension. Create a
# real delivery-sized PNG; index.html can point to this file.
mkdir -p "$output_root"
sips -Z 128 "$source_root/favicon.ico" --out "$output_root/favicon.png" >/dev/null
