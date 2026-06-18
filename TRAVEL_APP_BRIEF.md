# Jeonju Trip Planner HTML App Brief

## Goal
친구들과 전주 여행 일정표를 그냥 텍스트가 아니라, 모바일에서 보기 좋은 Apple-style itinerary web page로 만든다.

핵심은 세 가지다.
1. 날짜별 계획표를 한눈에 보기
2. 장소를 지도에서 보고 이동 경로/시간을 확인하기
3. 친구들한테 공유해도 예쁘고 동작이 편한 단일 HTML 앱 만들기

## Current Schedule

### 2026-06-21 Sun
- 10:20 조동/쩡짱 전주역 도착 → 조구 픽업
- 11:00 점심: 조기종의향미각 전주점
- 13:00-17:00 테니스 3인팟, 예약은 18:00까지
- 18:00 저녁: 지리산흑돈
- 집 복귀

### 2026-06-22 Mon
- 11:00 점심: 금암피순대
- 14:00-17:00 테니스 3인팟, 예약 13:00-18:00
- 18:00 사우나
- 19:00 저녁: 두거리우신탕 본점
- 2차: 미정
- 집 복귀

### 2026-06-23 Tue
- 해장: 오거리콩나물해장국
- 카페: 미정
- 서울 복귀

## Places Found / To Verify

### Confirmed-ish from Naver search snippets
- 전주역
  - OSM: 전주, 680, 동부대로, 우아동3가, 덕진구, 전주시
  - Approx coords: 35.8500537, 127.1623649

- 조기종의향미각 전주점
  - Address found: 전북 전주시 덕진구 건지3길 13-1
  - Hours snippet: 화-토 10:30-21:00, 브레이크 15:00-17:00, 일요일 16:00 마감, 월요일 휴무
  - Phone snippet: 063-273-8252
  - Note: Sunday lunch at 11:00 should be okay based on snippet, but Sunday closes early.
  - OSM geocode is street-level approximate, not exact POI.

- 지리산흑돈
  - Address found: 전북 전주시 완산구 홍산2길 5-10 1층
  - Phone snippet: 0507-1416-8611
  - Category: 돼지고기구이

- 금암피순대
  - Address found: 전북특별자치도 전주시 덕진구 기린대로 400-61
  - Phone snippet: 063-272-1394
  - Hours snippet from blog: 10:00-22:00

- 두거리우신탕 본점
  - Address found: 전북 전주시 덕진구 동부대로 1106
  - Phone snippet: 063-277-8188
  - Hours snippet: 10:00 open
  - Menu snippets: 우신전골 11,000 / 우신탕 14,000 / 특전골 19,000 / 우신찜 19,000

- 오거리콩나물해장국
  - Address found: 전북 전주시 완산구 공북로 83
  - Category: 해장국
  - Hours snippet: shown as open, closes 12:00 in Naver snapshot; needs final verification because this sounds like noon or midnight ambiguity.

### Newly fixed inputs
- 숙소: 전북 전주시 덕진구 기지로 70
  - Naver identifies this address as 전북 전주시 덕진구 중동 774-2 / 하모니시티오피스텔.
  - OSM coordinate is street-level approximate: 35.8381938, 127.0724281.
- 테니스: 전북대학교에서 진행
  - Use 전북대학교 전주캠퍼스 as the map point for now: 35.8466752, 127.1337209.
  - If exact tennis court coordinate is later found, replace campus-level point.

### Missing Inputs
- 사우나 정확한 이름/주소
- 2차 장소 후보
- 6/23 카페 후보
- 서울 복귀 출발점: 전주역인지, 다른 곳인지

## Route / Time Approach

### Important limitation
- Static HTML alone cannot reliably calculate live public-transit times without an API.
- Use cached estimates for known legs, and provide map buttons that open Google/Naver/Kakao Maps directions.
- Driving/walking can be estimated with OSRM/OpenStreetMap if coordinates are known.
- Bus/transit should be either manually entered or opened via external map link.

### Initial route estimates from OSRM/OSM
- 전주역 → 조기종의향미각 address
  - Driving estimate: 약 3.0km / 약 6분
  - OSM geocode is street-level; verify exact place coordinate later.

- 조기종의향미각 address → 지리산흑돈 address
  - Driving estimate: 약 5.5km / 약 10분
  - This is not actual schedule order unless tennis location is inserted.

### App behavior for route cards
Each transition between events should show:
- From → To
- distance
- car time
- walk time
- bus/transit time if available, otherwise `지도에서 확인`
- buttons:
  - `차 경로`
  - `도보 경로`
  - `대중교통`
  - `장소 보기`

Use external URL templates:
- Google Maps place/search: `https://www.google.com/maps/search/?api=1&query=<encoded place or lat,lon>`
- Google Maps directions: `https://www.google.com/maps/dir/?api=1&origin=<encoded>&destination=<encoded>&travelmode=driving|walking|transit`
- Naver/Kakao links can be added if place IDs are known later.

## Screen Definition

### 1. Hero / Overview
Apple-style cinematic top section.
- Title: `전주 2박 3일`
- Subtitle: `6.21 Sun – 6.23 Tue · friends trip`
- Big compact summary cards:
  - D-? / dates
  - people: 조동 · 쩡짱 · 조구
  - main activities: 맛집 · 테니스 · 사우나 · 해장
- CTA buttons:
  - `오늘 일정 보기`
  - `전체 지도 보기`

### 2. Sticky Glass Navigation
Apple-style translucent nav.
- Left: `Jeonju Trip`
- Tabs: `6/21`, `6/22`, `6/23`, `Map`, `Places`
- Mobile: horizontal scroll pills

### 3. Day Timeline
A vertical iOS-style timeline per day.
Each event card:
- Time block: `10:20`, `11:00`, etc.
- Category chip: arrival / lunch / tennis / dinner / sauna / cafe
- Title: place/activity
- Small note: reservation, closed-day warning, menu hint
- Action row:
  - `지도`
  - `전화`
  - `경로`
  - `메모`

Visual: large rounded cards, #f5f5f7 surfaces, black/white alternation by day.

### 4. Route Between Events
Between timeline cards, show route mini-card.
- Thin connector line
- route summary: `차 8분 · 도보 28분 · 버스 확인 필요`
- expandable detail drawer with buttons

### 5. Map Section
Use Leaflet + OpenStreetMap tiles.
- One map per full itinerary, with numbered markers.
- Marker colors by day:
  - Day 1: Apple Blue
  - Day 2: Near Black
  - Day 3: Warm gray
- Polylines connect known locations.
- Unknown places appear as dashed placeholder cards, not map markers.

Implementation option:
- Use Leaflet CDN for map.
- Store places in JS array with name/address/lat/lon/day/category.
- If lat/lon missing, still render in Places list but exclude from map.

### 6. Places Directory
A clean list of all food/activity spots.
Each place card:
- name
- address
- day used
- open/closed note
- phone if found
- quick buttons: map / directions / call

### 7. Smart Warnings
Small tasteful warnings, not scary.
Examples:
- `조기종의향미각: 월요일 휴무라 6/21 일요일 점심 배치가 좋음. 다만 일요일은 16:00 마감으로 보임.`
- `두거리우신탕: 일요일 휴무라고 사용자가 메모함. 6/22 월요일 저녁 배치 OK.`
- `테니스장/숙소/사우나/카페는 위치 확정 전이라 경로 계산 대기.`

## Visual Direction: Apple-style, not clone-heavy

Use Apple-inspired tokens:
- Font: system-ui, -apple-system, BlinkMacSystemFont, `SF Pro` fallback
- Backgrounds:
  - light: #f5f5f7
  - white: #ffffff
  - dark: #000000 / #1d1d1f
- Accent: Apple Blue #0071e3 only for main interactive elements
- Radius:
  - cards: 22-28px for modern iOS feel, even though classic Apple web uses smaller cards
  - buttons/pills: 999px
- Typography:
  - hero: 48-64px desktop, 36-44px mobile, weight 650-700, tight line-height
  - day headings: 32-44px
  - body: 15-17px
- Motion:
  - smooth tab scroll
  - card reveal / route drawer expand
  - hover lift subtle only
- Avoid:
  - loud gradients
  - too many colors
  - fake 3D
  - dense table layout

## Suggested File Structure
Single-page static app first:
- `/Volumes/app/travel/index.html`
- `/Volumes/app/travel/styles.css`
- `/Volumes/app/travel/app.js`
- `/Volumes/app/travel/data.js`

Optional later:
- `places.json` if editing data separately is easier.

## Implementation Requirements for Codex
- Build as plain HTML/CSS/JS, no framework unless user asks.
- Mobile-first, works on iPhone.
- Use Leaflet CDN for map.
- No build step required.
- Must run locally by opening `index.html`, or via `python3 -m http.server`.
- Include graceful fallbacks for unknown locations.
- All Korean text should be natural, friendly, and shareable.
- Design should feel like Apple/iOS travel card, not admin dashboard.

## Supporting docs created
- `FOOD_REVIEW_ANALYSIS.md`: review/menu synthesis and best-order recommendations.
- `STATIC_ROUTE_ESTIMATES.md`: precomputed rough car/bus/walk estimates for route cards.

## First Build Scope
Include:
- Full schedule from user
- Known place cards
- Map with markers for known approximate coords
- 숙소 marker: 기지로 70 / 하모니시티오피스텔 area
- Tennis marker: 전북대학교
- Static route cards using `STATIC_ROUTE_ESTIMATES.md`; do not attempt live routing.
- Food recommendation cards using `FOOD_REVIEW_ANALYSIS.md`.
- Placeholder cards for missing sauna/cafe/2차
- Google Maps buttons for place and route
- Apple-style visual polish

Do not include yet:
- Login
- Database
- Live GPS tracking
- Live traffic/transit calculation
- Complex route optimization
- Reservation management
