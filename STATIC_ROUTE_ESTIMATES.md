# Static Route Estimates

These are precomputed rough estimates for the static HTML app. They are intentionally not live traffic/transit calculations.

## Coordinate assumptions

- 전주역: 35.8500537, 127.1623649
- 조기종의향미각: 35.8450173, 127.1445063 — OSM street-level approximate for 건지3길 13-1
- 전북대학교 전주캠퍼스 / tennis: 35.8466752, 127.1337209 — campus-level coordinate; adjust to exact tennis court if found
- 지리산흑돈: 35.8153357, 127.1099986 — street-level approximate for 홍산2길 5-10
- 숙소 기지로 70: 35.8381938, 127.0724281 — Nominatim street-level approximate; Naver identifies as 전북 전주시 덕진구 중동 774-2 / 하모니시티오피스텔
- 금암피순대: 35.865904, 127.0786339 — OSM street-level approximate for 기린대로 400-61; verify exact POI later
- 두거리우신탕 본점: 35.8725698, 127.0941843 — OSM street-level approximate for 동부대로 1106
- 오거리콩나물해장국: 35.8257, 127.1430 — manually approximate around 공북로 83; verify exact coordinate later

## Estimation method

- Car: OSRM driving route when possible.
- Walk: distance / 4.5km/h rounded.
- Bus/transit: rough city estimate using driving time + waiting/walking buffer. Display as `대략` or `지도 확인` in UI.

## Day 1 — 2026-06-21 Sun

1. 전주역 → 조기종의향미각
   - Distance: ~3.0km
   - Car: ~6분
   - Bus: ~22분
   - Walk: ~40분

2. 조기종의향미각 → 전북대학교 tennis
   - Distance: ~1.7km
   - Car: ~6분
   - Bus: ~18분
   - Walk: ~22분

3. 전북대학교 tennis → 지리산흑돈
   - Distance: ~5.2km
   - Car: ~11분
   - Bus: ~29분
   - Walk: ~69분

4. 지리산흑돈 → 숙소
   - Distance: ~6.2km
   - Car: ~11분
   - Bus: ~33분
   - Walk: ~83분

## Day 2 — 2026-06-22 Mon

1. 숙소 → 금암피순대
   - Distance: ~5.2km
   - Car: ~8분
   - Bus: ~29분
   - Walk: ~69분

2. 금암피순대 → 전북대학교 tennis
   - Distance: ~6.7km
   - Car: ~12분
   - Bus: ~34분
   - Walk: ~89분

3. 전북대학교 tennis → 사우나
   - Pending: 사우나 위치 필요

4. 사우나 → 두거리우신탕 본점
   - Pending: 사우나 위치 필요

5. 두거리우신탕 본점 → 숙소
   - Distance: ~7.1km
   - Car: ~12분
   - Bus: ~36분
   - Walk: ~95분

## Day 3 — 2026-06-23 Tue

1. 숙소 → 오거리콩나물해장국
   - Distance: ~9.2km
   - Car: ~15분
   - Bus: ~43분
   - Walk: ~122분

2. 오거리콩나물해장국 → 카페
   - Pending: 카페 위치 필요

3. 카페 → 전주역 or 서울 복귀 출발지
   - Pending: 카페/출발지 필요

4. 오거리콩나물해장국 → 전주역, if direct
   - Distance: ~5.2km
   - Car: ~10분
   - Bus: ~29분
   - Walk: ~70분

## UI rule

Show estimates as static text:

- `차 약 6분`
- `버스 약 22분`
- `도보 약 40분`

Under the numbers, include small copy:
`교통상황·대기시간에 따라 달라질 수 있어요.`

For missing locations:
`위치 확정 후 자동으로 경로 카드에 반영할 자리입니다.`
