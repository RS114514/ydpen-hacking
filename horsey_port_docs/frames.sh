#!/usr/bin/env bash
# Build study contact sheets from a downloaded gameplay video, using only ffmpeg.
#
# Two passes:
#   s = scene-change frames  -> catches distinct screens / UI states
#   u = uniform grid         -> catches slow camera moves that never trip the detector
# Each is tiled 5x5 into numbered sheets, with the source timestamp burned in so a
# cell can be cited as "<label> sheet 03 cell 12 ~ 00:02:24".
#
# Usage: ./frames.sh <video> <label> [scene_threshold] [uniform_every_seconds]
set -euo pipefail

VIDEO="$1"
LABEL="$2"
THRESH="${3:-0.28}"
EVERY="${4:-12}"

OUT="/Volumes/500GB/Ydpen/horsey_port_docs/frames/$LABEL"
rm -rf "$OUT"
mkdir -p "$OUT"
export COPYFILE_DISABLE=1   # no AppleDouble ._ files on the exFAT volume

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO" | cut -d. -f1)
echo "=== $LABEL  ${DUR}s  thresh=$THRESH every=${EVERY}s"

# scene cuts -> sheets
ffmpeg -v error -y -i "$VIDEO" \
  -vf "select='gt(scene,$THRESH)',scale=480:-1,tile=5x5" \
  -an -vsync vfr -q:v 5 "$OUT/s_sheet_%02d.jpg"

# uniform grid -> sheets
# This ffmpeg build has no drawtext, so timestamps are derived, not burned in:
#   seconds = ((sheet-1)*25 + cell) * EVERY   (sheet and cell both 1-based,
#   counted across s_sheet_* first then u_sheet_*)
ffmpeg -v error -y -i "$VIDEO" \
  -vf "fps=1/$EVERY,scale=480:-1,tile=5x5" \
  -an -q:v 5 "$OUT/u_sheet_%02d.jpg"

{
  echo "# $LABEL"
  echo "source: $VIDEO"
  echo "duration: ${DUR}s"
  echo "scene threshold: $THRESH"
  echo "uniform interval: every ${EVERY}s"
  echo
  echo "To convert a u_sheet cell back to a time:"
  echo "  seconds = ((sheet_number - 1) * 25 + cell_number) * $EVERY"
  echo "  (sheets are 1-based; cells are numbered left-to-right, top-to-bottom, 1..25)"
  echo
  echo "s_sheet_* cells are scene changes and have no simple formula - cite the sheet and cell and it can be re-extracted."
} > "$OUT/MAP.md"

ls -la "$OUT" | tail -n +4 | awk '{printf "%-24s %8.0f KB\n", $9, $5/1024}'
echo "sheet count: $(ls "$OUT" | wc -l | tr -d ' ')"
