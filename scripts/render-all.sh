#!/bin/bash
set -e

OUTPUT_DIR="out"
mkdir -p "$OUTPUT_DIR"

# episodes.ts에서 id 목록 추출
EPISODE_IDS=$(grep -o '"id": *"[^"]*"' src/data/episodes.ts | sed 's/"id": *"//;s/"//')

if [ -z "$EPISODE_IDS" ]; then
  echo "No episodes found in src/data/episodes.ts"
  exit 1
fi

# 에피소드별 렌더링
for ID in $EPISODE_IDS; do
  echo "=== Rendering $ID ==="
  npx remotion render "$ID" "$OUTPUT_DIR/$ID.mp4"
done

# ffmpeg concat
echo "=== Concatenating all episodes ==="
CONCAT_INPUT=""
for ID in $EPISODE_IDS; do
  CONCAT_INPUT="$CONCAT_INPUT -i $OUTPUT_DIR/$ID.mp4"
done

COUNT=$(echo "$EPISODE_IDS" | wc -w | tr -d ' ')

if [ "$COUNT" -eq 1 ]; then
  ID=$(echo "$EPISODE_IDS" | head -1)
  cp "$OUTPUT_DIR/$ID.mp4" "$OUTPUT_DIR/compilation.mp4"
else
  FILTER=""
  for i in $(seq 0 $((COUNT - 1))); do
    FILTER="${FILTER}[$i:v:0][$i:a:0]"
  done
  FILTER="${FILTER}concat=n=${COUNT}:v=1:a=1[outv][outa]"

  ffmpeg $CONCAT_INPUT -filter_complex "$FILTER" -map "[outv]" -map "[outa]" "$OUTPUT_DIR/compilation.mp4" -y
fi

echo "=== Done: $OUTPUT_DIR/compilation.mp4 ==="
