#!/usr/bin/env bash
# Cut a screen recording into evenly spaced still frames for docs/references/.
#
# Usage:   ./scripts/frames.sh <video> <name> [count]
# Example: ./scripts/frames.sh ~/Desktop/mercury-zoom.mov hero-zoom 6
# Output:  docs/references/hero-zoom-01.png ... hero-zoom-06.png
#
# Needs ffmpeg and ffprobe:  brew install ffmpeg

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <video> <name> [count]" >&2
  exit 1
fi

video="$1"
name="$2"
count="${3:-6}"

if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  echo "ffmpeg is needed. Install it with: brew install ffmpeg" >&2
  exit 1
fi

if [ ! -f "$video" ]; then
  echo "Can't find video: $video" >&2
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/docs/references"
mkdir -p "$out"

duration="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$video")"

for i in $(seq 1 "$count"); do
  # Evenly spaced points, avoiding the very first and last instant.
  t="$(awk -v d="$duration" -v i="$i" -v n="$count" 'BEGIN { printf "%.3f", d * (i - 0.5) / n }')"
  file="$(printf "%s/%s-%02d.png" "$out" "$name" "$i")"
  ffmpeg -v error -y -ss "$t" -i "$video" -frames:v 1 -vf "scale='min(1600,iw)':-2" "$file"
  echo "saved ${file#$root/}"
done

echo "Done. Add a row for '$name' to docs/references/README.md."
