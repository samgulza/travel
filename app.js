(function () {
  const data = window.TRAVEL_DATA;
  const placeById = new Map(data.places.map((place) => [place.id, place]));
  const dayById = new Map(data.days.map((day) => [day.id, day]));
  let map;
  let markerGroup;
  let routeGroup;
  let toastTimer;

  document.addEventListener("DOMContentLoaded", () => {
    renderDday();
    renderQuickFacts();
    renderDayFilter();
    renderTimeline();
    loadKtxReturnAvailability();
    renderFoodGuides();
    renderRoutes();
    renderPlaces();
    renderWarnings();
    bindUi();
    initMap();
  });

  function renderDday() {
    const label = document.querySelector("#dday-label");
    const start = parseLocalDate(data.trip.startDate);
    const today = startOfDay(new Date());
    const diff = Math.round((start - today) / 86400000);
    let copy = "여행 완료";

    if (diff > 0) copy = `D-${diff}`;
    if (diff === 0) copy = "D-DAY";
    if (diff < 0 && new Date(data.trip.endDate) >= today) copy = "여행 중";

    label.textContent = copy;
  }

  function renderQuickFacts() {
    const target = document.querySelector("#quick-facts");
    target.innerHTML = [
      factCard("날짜", "6.21 - 6.23"),
      factCard("멤버", data.trip.people.join(" · ")),
      factCard("핵심", data.trip.themes.join(" · ")),
      factCard("확정 장소", `${knownPlaces().length}곳`)
    ].join("");
  }

  function renderDayFilter() {
    const target = document.querySelector("#day-filter");
    const buttons = [
      `<button type="button" class="is-active" data-day-filter="all">전체 일정</button>`,
      ...data.days.map((day) => {
        return `<button type="button" data-day-filter="${day.id}">${day.navLabel} · ${day.title}</button>`;
      })
    ];
    target.innerHTML = buttons.join("");
  }

  function renderTimeline() {
    const target = document.querySelector("#timeline");
    target.innerHTML = data.days.map(renderDaySection).join("");
  }

  function renderDaySection(day) {
    const pieces = [];
    day.events.forEach((event, index) => {
      pieces.push(renderEventCard(event));
      const route = findRouteForEventPair(day.id, event.placeId, day.events[index + 1]?.placeId);
      if (route) pieces.push(renderInlineRoute(route));
    });
    if (day.date === data.ktxReturnFallback?.query?.date) {
      pieces.push(renderKtxReturnCard(data.ktxReturnFallback));
    }

    return `
      <section class="day-section" id="${day.id}" data-day-section="${day.id}" data-tone="${day.tone}">
        <div class="day-title">
          <div>
            <span class="section-label">${day.label}</span>
            <h3>${day.title}</h3>
          </div>
          <span>${day.summary}</span>
        </div>
        ${pieces.join("")}
      </section>
    `;
  }

  async function loadKtxReturnAvailability() {
    const fallback = data.ktxReturnFallback;
    const target = document.querySelector("#ktx-return-card");
    if (!fallback || !target) return;

    try {
      const response = await fetch("data/ktx-return.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      updateKtxReturnCard(payload);
    } catch (error) {
      updateKtxReturnCard({
        ...fallback,
        message: "로컬 파일로 열었거나 최신 JSON을 읽지 못해 기본 상태를 보여줘요. 배포 페이지에서는 자동 조회 결과가 표시됩니다."
      });
    }
  }

  function updateKtxReturnCard(payload) {
    const target = document.querySelector("#ktx-return-card");
    if (!target) return;
    target.outerHTML = renderKtxReturnCard(payload);
  }

  function renderKtxReturnCard(payload) {
    const query = payload?.query || data.ktxReturnFallback.query;
    const trains = Array.isArray(payload?.trains) ? payload.trains : [];
    const isAvailable = payload?.status === "available";
    const statusLabel = isAvailable ? "조회 완료" : "확인 대기";
    const statusClass = isAvailable ? "is-live" : "is-muted";
    const updated = formatKtxCheckedAt(payload?.lastChecked);
    const windows = Array.isArray(query.windows) ? query.windows : [];
    const firstWindow = windows[0] || "12:00";
    const lastWindow = windows[windows.length - 1] || "22:00";
    const trainList = trains.length
      ? trains.map(renderKtxTrain).join("")
      : `
        <div class="ktx-empty">
          <strong>아직 표시할 열차가 없어요.</strong>
          <span>12:00-22:00 사이 전주→용산 KTX 좌석 신호가 들어오면 여기에 시간대별로 뜹니다.</span>
        </div>
      `;

    return `
      <article class="ktx-card ${statusClass}" id="ktx-return-card" aria-live="polite">
        <div class="ktx-head">
          <div>
            <span class="mini-label">6/23 복귀 KTX</span>
            <h4>${escapeHtml(query.from)} → ${escapeHtml(query.to)} · ${escapeHtml(query.passengers)}명</h4>
          </div>
          <span class="ktx-status">${statusLabel}</span>
        </div>
        <p>${escapeHtml(payload?.message || "KTX 좌석 상태를 확인하고 있어요.")}</p>
        <div class="ktx-meta">
          <span>조회 구간 ${escapeHtml(firstWindow)} - ${escapeHtml(lastWindow)}</span>
          <span>${updated}</span>
        </div>
        <div class="ktx-trains">${trainList}</div>
      </article>
    `;
  }

  function renderKtxTrain(train) {
    const title = [
      train.trainName || "KTX",
      train.trainNo ? `#${train.trainNo}` : ""
    ].filter(Boolean).join(" ");
    const badges = [
      renderSeatBadge(train.generalSeat, "seat-general"),
      renderSeatBadge(train.specialSeat, "seat-special"),
      renderSeatBadge(train.waitlist, "seat-waitlist")
    ].filter(Boolean).join("");

    return `
      <div class="ktx-train">
        <div>
          <strong>${escapeHtml(train.departureTime || train.window || "시간 미확인")} → ${escapeHtml(train.arrivalTime || "도착 미확인")}</strong>
          <span>${escapeHtml(title)}</span>
        </div>
        <div class="ktx-seat-list">${badges || `<span class="seat-badge is-unknown">좌석 정보 확인 필요</span>`}</div>
      </div>
    `;
  }

  function renderSeatBadge(seat, tone) {
    if (!seat) return "";
    let state = "is-unknown";
    if (seat.available === true) state = "is-open";
    if (seat.available === false) state = "is-closed";
    return `<span class="seat-badge ${tone} ${state}">${escapeHtml(seat.label || "확인 필요")}</span>`;
  }

  function renderEventCard(event) {
    const place = placeById.get(event.placeId);
    const isPlaceholder = place?.kind === "placeholder";
    const actions = renderEventActions(place, event);

    return `
      <article class="event-card${isPlaceholder ? " is-placeholder" : ""}" data-place-card="${event.placeId || ""}">
        <div class="event-time">
          <strong>${event.time}</strong>
          <span class="chip">${event.category}</span>
        </div>
        <div class="event-body">
          <h4>${event.title}</h4>
          <p>${event.note}</p>
          ${actions}
        </div>
      </article>
    `;
  }

  function renderEventActions(place, event) {
    if (!place || place.kind === "placeholder") {
      return `
        <div class="event-actions">
          <button class="small-button" type="button" data-note="${escapeAttr(event.note)}">메모 보기</button>
          <span class="small-button" aria-disabled="true">장소 대기</span>
        </div>
      `;
    }

    const callButton = place.phone
      ? `<a class="small-button" href="tel:${stripPhone(place.phone)}">전화</a>`
      : "";

    return `
      <div class="event-actions">
        <a class="small-button primary" href="${mapsPlaceUrl(place)}" target="_blank" rel="noopener">지도</a>
        <a class="small-button" href="${mapsDestinationUrl(place, "driving")}" target="_blank" rel="noopener">경로</a>
        ${callButton}
        <button class="small-button" type="button" data-note="${escapeAttr(event.note)}">메모</button>
      </div>
    `;
  }

  function renderInlineRoute(route) {
    const from = placeById.get(route.fromId);
    const to = placeById.get(route.toId);
    const label = route.pending
      ? "위치 확정 후 경로 표시"
      : `차 ${route.car} · 버스 ${route.bus} · 도보 ${route.walk}`;

    return `
      <div class="inline-route" aria-label="${from?.shortName || "출발지"}에서 ${to?.shortName || "도착지"} 이동">
        <span class="route-line" aria-hidden="true"></span>
        <div class="route-pill${route.pending ? " is-pending" : ""}">
          <span><strong>${from?.shortName || "미정"} → ${to?.shortName || "미정"}</strong><br>${label}</span>
          <span>${route.distance || "대기"}</span>
        </div>
      </div>
    `;
  }

  function renderFoodGuides() {
    const target = document.querySelector("#food-grid");
    target.innerHTML = data.foodGuides.map((guide) => {
      const place = placeById.get(guide.placeId);
      return `
        <article class="food-card">
          <h3>${place.name}</h3>
          <div class="place-meta">
            <span class="meta-pill">${place.category}</span>
            <span class="meta-pill">${dayLabels(place).join(" · ")}</span>
          </div>
          <p><strong>${guide.headline}</strong></p>
          <p>${guide.copy}</p>
          <ul class="order-list">
            ${guide.order.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <div class="caution">${guide.caution}</div>
          <div class="place-actions">
            <a class="small-button primary" href="${mapsPlaceUrl(place)}" target="_blank" rel="noopener">장소 보기</a>
            <a class="small-button" href="${mapsDestinationUrl(place, "driving")}" target="_blank" rel="noopener">차 경로</a>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderRoutes() {
    const target = document.querySelector("#route-board");
    target.innerHTML = data.days.map((day) => {
      const routes = data.routes.filter((route) => route.dayId === day.id);
      return `
        <section class="route-day" aria-label="${day.title} 이동 경로">
          <h3>${day.label} · ${day.title}</h3>
          ${routes.map(renderRouteCard).join("")}
        </section>
      `;
    }).join("");
  }

  function renderRouteCard(route) {
    const from = placeById.get(route.fromId);
    const to = placeById.get(route.toId);
    const pendingMetrics = `<span class="metric">위치 확정 대기</span>`;
    const metrics = route.pending
      ? pendingMetrics
      : `
        <span class="metric">차 ${route.car}</span>
        <span class="metric">버스 ${route.bus}</span>
        <span class="metric">도보 ${route.walk}</span>
        <span class="metric">${route.distance}</span>
      `;
    const actions = route.pending
      ? `<span class="small-button" aria-disabled="true">경로 대기</span>`
      : `
        <a class="small-button primary" href="${mapsDirectionsUrl(from, to, "driving")}" target="_blank" rel="noopener">차 경로</a>
        <a class="small-button" href="${mapsDirectionsUrl(from, to, "walking")}" target="_blank" rel="noopener">도보 경로</a>
        <a class="small-button" href="${mapsDirectionsUrl(from, to, "transit")}" target="_blank" rel="noopener">대중교통</a>
        <a class="small-button" href="${mapsPlaceUrl(to)}" target="_blank" rel="noopener">장소 보기</a>
      `;

    return `
      <article class="route-card" data-route-card>
        <button class="route-summary" type="button" aria-expanded="false">
          <div>
            <h4>${from?.shortName || "미정"} → ${to?.shortName || "미정"}</h4>
            <p>${route.pending ? "위치 확정 후 자동으로 경로 카드에 반영할 자리입니다." : "교통상황·대기시간에 따라 달라질 수 있어요."}</p>
            <div class="route-metrics">${metrics}</div>
          </div>
          <span class="route-chevron" aria-hidden="true">⌄</span>
        </button>
        <div class="route-details">
          <p>${route.note}</p>
          <div class="route-actions">${actions}</div>
        </div>
      </article>
    `;
  }

  function renderPlaces() {
    const target = document.querySelector("#places-grid");
    target.innerHTML = data.places.map((place) => {
      if (place.kind === "placeholder") return renderPlaceholderPlace(place);

      const phone = place.phone ? `<a class="small-button" href="tel:${stripPhone(place.phone)}">전화</a>` : "";
      return `
        <article class="place-card" data-place-card="${place.id}">
          <h3>${place.name}</h3>
          <div class="place-meta">
            <span class="meta-pill">${place.category}</span>
            <span class="meta-pill">${dayLabels(place).join(" · ")}</span>
          </div>
          <p>${place.address}</p>
          <p>${place.note}</p>
          <div class="place-actions">
            <a class="small-button primary" href="${mapsPlaceUrl(place)}" target="_blank" rel="noopener">Google Maps</a>
            <a class="small-button" href="${mapsDestinationUrl(place, "driving")}" target="_blank" rel="noopener">길찾기</a>
            ${phone}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderPlaceholderPlace(place) {
    return `
      <article class="placeholder-card" data-place-card="${place.id}">
        <h3>${place.name}</h3>
        <div class="place-meta">
          <span class="meta-pill">${place.category}</span>
          <span class="meta-pill">${dayLabels(place).join(" · ")}</span>
        </div>
        <p>${place.note}</p>
        <div class="place-actions">
          <span class="small-button" aria-disabled="true">지도 대기</span>
          <button class="small-button" type="button" data-note="${escapeAttr(place.note)}">메모</button>
        </div>
      </article>
    `;
  }

  function renderWarnings() {
    const target = document.querySelector("#warning-list");
    target.innerHTML = data.warnings.map((warning) => `<li>${warning}</li>`).join("");
  }

  function bindUi() {
    document.addEventListener("click", (event) => {
      const scrollTarget = event.target.closest("[data-scroll]");
      if (scrollTarget) {
        const selector = scrollTarget.getAttribute("href");
        const target = selector ? document.querySelector(selector) : null;
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      const filter = event.target.closest("[data-day-filter]");
      if (filter) {
        setActiveDay(filter.dataset.dayFilter);
      }

      const routeButton = event.target.closest(".route-summary");
      if (routeButton) {
        const card = routeButton.closest("[data-route-card]");
        const isOpen = card.classList.toggle("is-open");
        routeButton.setAttribute("aria-expanded", String(isOpen));
      }

      const noteButton = event.target.closest("[data-note]");
      if (noteButton) {
        showToast(noteButton.dataset.note);
      }
    });

    const fitButton = document.querySelector("#fit-map");
    fitButton.addEventListener("click", () => {
      fitMapToKnownPlaces();
    });
  }

  function setActiveDay(dayId) {
    document.querySelectorAll("[data-day-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.dayFilter === dayId);
    });

    document.querySelectorAll("[data-day-section]").forEach((section) => {
      section.classList.toggle("is-hidden", dayId !== "all" && section.dataset.daySection !== dayId);
    });

    if (dayId === "all") {
      fitMapToKnownPlaces();
      return;
    }

    const places = knownPlaces().filter((place) => place.dayRefs.includes(dayId));
    fitMapToPlaces(places);
  }

  function initMap() {
    const fallback = document.querySelector("#map-fallback");
    if (!window.L) {
      fallback.hidden = false;
      document.querySelector("#trip-map").hidden = true;
      return;
    }

    map = L.map("trip-map", {
      scrollWheelZoom: false,
      zoomControl: false
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    markerGroup = L.layerGroup().addTo(map);
    routeGroup = L.layerGroup().addTo(map);

    knownPlaces().forEach((place) => {
      const marker = L.marker([place.lat, place.lon], {
        icon: L.divIcon({
          className: "",
          html: `<span class="trip-marker ${markerToneClass(place)}">${place.markerLabel || "•"}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        })
      });
      marker.bindPopup(renderMapPopup(place));
      marker.addTo(markerGroup);
    });

    drawRouteLines();
    fitMapToKnownPlaces();
  }

  function drawRouteLines() {
    if (!routeGroup) return;
    routeGroup.clearLayers();

    data.routes
      .filter((route) => !route.pending)
      .forEach((route) => {
        const from = placeById.get(route.fromId);
        const to = placeById.get(route.toId);
        if (!hasCoords(from) || !hasCoords(to)) return;

        const day = dayById.get(route.dayId);
        L.polyline(
          [
            [from.lat, from.lon],
            [to.lat, to.lon]
          ],
          {
            color: day?.markerColor || "#0071e3",
            weight: route.variant === "fallback" ? 3 : 4,
            opacity: route.variant === "fallback" ? 0.42 : 0.62,
            dashArray: route.variant === "fallback" ? "7 8" : null
          }
        ).addTo(routeGroup);
      });
  }

  function fitMapToKnownPlaces() {
    fitMapToPlaces(knownPlaces());
  }

  function fitMapToPlaces(places) {
    if (!map || !places.length) return;
    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lon]));
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 14 });
  }

  function renderMapPopup(place) {
    return `
      <div class="map-popup">
        <strong>${place.name}</strong>
        <span>${place.address || place.note}</span>
        <div class="place-actions">
          <a class="small-button primary" href="${mapsPlaceUrl(place)}" target="_blank" rel="noopener">장소</a>
          <a class="small-button" href="${mapsDestinationUrl(place, "driving")}" target="_blank" rel="noopener">경로</a>
        </div>
      </div>
    `;
  }

  function findRouteForEventPair(dayId, fromId, toId) {
    if (!fromId || !toId) return null;
    return data.routes.find((route) => route.dayId === dayId && route.fromId === fromId && route.toId === toId);
  }

  function factCard(label, value) {
    return `
      <article class="fact-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `;
  }

  function dayLabels(place) {
    return place.dayRefs.map((id) => dayById.get(id)?.navLabel).filter(Boolean);
  }

  function knownPlaces() {
    return data.places.filter(hasCoords);
  }

  function hasCoords(place) {
    return Boolean(place && Number.isFinite(place.lat) && Number.isFinite(place.lon));
  }

  function markerToneClass(place) {
    if (place.kind === "stay") return "tone-stay";
    const firstDay = dayById.get(place.dayRefs[0]);
    if (firstDay?.tone === "ink") return "tone-ink";
    if (firstDay?.tone === "warm") return "tone-warm";
    return "tone-blue";
  }

  function mapsPlaceUrl(place) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery(place))}`;
  }

  function mapsDestinationUrl(place, mode) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQuery(place))}&travelmode=${mode}`;
  }

  function mapsDirectionsUrl(from, to, mode) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(placeQuery(from))}&destination=${encodeURIComponent(placeQuery(to))}&travelmode=${mode}`;
  }

  function placeQuery(place) {
    if (!place) return "전주";
    if (hasCoords(place)) return `${place.lat},${place.lon}`;
    return `${place.name} ${place.address || ""}`.trim();
  }

  function stripPhone(phone) {
    return phone.replace(/[^\d+]/g, "");
  }

  function parseLocalDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatKtxCheckedAt(value) {
    if (!value) return "마지막 확인 전";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "마지막 확인 시간 미확인";
    const formatter = new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    return `마지막 확인 ${formatter.format(date)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  }
})();
