(function () {
  const data = window.TRAVEL_DATA;
  const placeById = new Map(data.places.map((place) => [place.id, place]));
  const dayById = new Map(data.days.map((day) => [day.id, day]));
  const tripMembers = data.trip.people;
  const expenseCategories = data.expenses?.categories || ["식당", "카페", "숙소/집", "술/간식", "교통", "기타"];
  const expenseStorageKey = data.expenses?.storageKey || "jeonju-trip-expenses-v1";
  let map;
  let markerGroup;
  let routeGroup;
  let toastTimer;
  let flashTimer;
  let activeDayId = "all";
  let expenses = [];

  document.addEventListener("DOMContentLoaded", () => {
    expenses = loadExpenses();
    renderDday();
    renderQuickFacts();
    renderDayFilter();
    renderMapDayTabs();
    renderTimeline();
    loadKtxReturnAvailability();
    renderFoodGuides();
    renderRoutes();
    renderExpenseFormOptions();
    renderExpenses();
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
    const isAllActive = activeDayId === "all";
    const buttons = [
      `<button type="button" class="${isAllActive ? "is-active" : ""}" aria-pressed="${isAllActive}" data-day-filter="all">전체 일정</button>`,
      ...data.days.map((day) => {
        const isActive = activeDayId === day.id;
        return `<button type="button" class="${isActive ? "is-active" : ""}" aria-pressed="${isActive}" data-day-filter="${day.id}">${day.navLabel} · ${day.title}</button>`;
      })
    ];
    target.innerHTML = buttons.join("");
  }

  function renderMapDayTabs() {
    const target = document.querySelector("#map-day-tabs");
    const tabs = [
      { id: "all", label: "전체" },
      ...data.days.map((day) => ({ id: day.id, label: day.navLabel }))
    ];

    target.innerHTML = tabs.map((tab) => {
      const isActive = activeDayId === tab.id;
      return `<button type="button" class="${isActive ? "is-active" : ""}" aria-pressed="${isActive}" data-map-day-filter="${tab.id}">${tab.label}</button>`;
    }).join("");
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

  function renderExpenseFormOptions() {
    const category = document.querySelector("#expense-category");
    const day = document.querySelector("#expense-day");
    const paidBy = document.querySelector("#expense-paid-by");

    category.innerHTML = expenseCategories.map((item) => `<option value="${escapeAttr(item)}">${escapeHtml(item)}</option>`).join("");
    day.innerHTML = data.days.map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.navLabel)} · ${escapeHtml(item.title)}</option>`).join("");
    paidBy.innerHTML = tripMembers.map((member) => `<option value="${escapeAttr(member)}">${escapeHtml(member)}</option>`).join("");
  }

  function renderExpenses() {
    renderExpenseSummary();
    renderExpenseList();
    updateExpenseSaveState("브라우저에 자동 저장됩니다.");
  }

  function renderExpenseSummary() {
    const summaryTarget = document.querySelector("#expense-summary");
    const balanceTarget = document.querySelector("#expense-balances");
    const settlementTarget = document.querySelector("#expense-settlements");
    const totals = calculateExpenseTotals();
    const enteredCount = totals.validRows.length;
    const plannedCount = expenses.filter((row) => row.source === "planned").length;

    summaryTarget.innerHTML = [
      expenseMetricCard("총 지출", formatWon(totals.totalSpend), `${enteredCount}건 입력됨`),
      expenseMetricCard("전체 /3 기준 1인", formatWon(totals.equalShare), "모든 금액을 셋이 똑같이 보면"),
      expenseMetricCard("입력 대기", `${Math.max(expenses.length - enteredCount, 0)}건`, `기본 예정 ${plannedCount}건 포함`),
      expenseMetricCard("정산 상태", totals.settlements.length ? `${totals.settlements.length}건 송금` : "정산 완료", "금액 입력 시 자동 계산")
    ].join("");

    balanceTarget.innerHTML = tripMembers.map((member) => renderMemberBalance(totals.members[member])).join("");
    settlementTarget.innerHTML = renderSettlementPanel(totals);
  }

  function renderExpenseList() {
    const target = document.querySelector("#expense-list");
    target.innerHTML = expenses.map(renderExpenseRow).join("");
  }

  function expenseMetricCard(label, value, note) {
    return `
      <article class="expense-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(note)}</small>
      </article>
    `;
  }

  function renderMemberBalance(member) {
    const tone = member.balance > 0.5 ? "is-credit" : member.balance < -0.5 ? "is-debt" : "is-even";
    const balanceCopy = member.balance > 0.5
      ? `${formatWon(member.balance)} 받을 돈`
      : member.balance < -0.5
        ? `${formatWon(Math.abs(member.balance))} 보낼 돈`
        : "정산 완료";

    return `
      <article class="balance-card ${tone}">
        <div>
          <span>${escapeHtml(member.name)}</span>
          <strong>${escapeHtml(balanceCopy)}</strong>
        </div>
        <dl>
          <div>
            <dt>결제</dt>
            <dd>${formatWon(member.paid)}</dd>
          </div>
          <div>
            <dt>부담</dt>
            <dd>${formatWon(member.owed)}</dd>
          </div>
        </dl>
      </article>
    `;
  }

  function renderSettlementPanel(totals) {
    if (!totals.validRows.length) {
      return `
        <div>
          <span class="mini-label">Settlement</span>
          <h3>아직 입력된 금액이 없어요</h3>
          <p>각 예정 항목에 실제 결제 금액과 결제자를 넣으면 받을 사람과 보낼 금액이 여기에 떠요.</p>
        </div>
      `;
    }

    if (!totals.settlements.length) {
      return `
        <div>
          <span class="mini-label">Settlement</span>
          <h3>지금은 서로 보낼 돈이 없어요</h3>
          <p>현재 입력값 기준으로 결제액과 부담액이 거의 맞습니다.</p>
        </div>
      `;
    }

    return `
      <div>
        <span class="mini-label">Settlement</span>
        <h3>이렇게 보내면 끝</h3>
        <p>각 행의 체크된 멤버만 나눠 내는 기준으로 계산했어요.</p>
      </div>
      <ul class="settlement-list">
        ${totals.settlements.map((item) => `
          <li>
            <strong>${escapeHtml(item.from)} → ${escapeHtml(item.to)}</strong>
            <span>${formatWon(item.amount)}</span>
          </li>
        `).join("")}
      </ul>
    `;
  }

  function renderExpenseRow(row) {
    const source = renderExpenseSource(row);
    const amountValue = Number.isFinite(row.amount) && row.amount > 0 ? formatNumber(row.amount) : "";
    const perPerson = formatRowSplit(row);
    const rowKind = row.source === "planned" ? "예정" : "추가";
    const deleteAction = row.source === "custom"
      ? `<button class="small-button danger" type="button" data-expense-delete="${escapeAttr(row.id)}">삭제</button>`
      : `<span class="small-button" aria-disabled="true">기본 항목</span>`;

    return `
      <article class="expense-row" data-expense-row="${escapeAttr(row.id)}">
        <div class="expense-row-head">
          <div>
            <span class="expense-kind">${rowKind}</span>
            <strong>${escapeHtml(row.title || "제목 없음")}</strong>
          </div>
          <div class="expense-row-total">
            <span data-expense-split-preview>${perPerson}</span>
            ${deleteAction}
          </div>
        </div>

        <div class="expense-row-grid">
          <label>
            <span>분류</span>
            <select data-expense-id="${escapeAttr(row.id)}" data-expense-field="category">
              ${expenseCategories.map((item) => `<option value="${escapeAttr(item)}"${item === row.category ? " selected" : ""}>${escapeHtml(item)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>장소/제목</span>
            <input type="text" value="${escapeAttr(row.title)}" data-expense-id="${escapeAttr(row.id)}" data-expense-field="title" autocomplete="off">
          </label>
          <label>
            <span>날짜</span>
            <select data-expense-id="${escapeAttr(row.id)}" data-expense-field="dayId">
              ${data.days.map((day) => `<option value="${escapeAttr(day.id)}"${day.id === row.dayId ? " selected" : ""}>${escapeHtml(day.navLabel)} · ${escapeHtml(day.title)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>금액</span>
            <input type="text" inputmode="numeric" value="${escapeAttr(amountValue)}" placeholder="0" data-expense-id="${escapeAttr(row.id)}" data-expense-field="amount" autocomplete="off">
            <small class="field-error" data-expense-error></small>
          </label>
          <label>
            <span>결제자</span>
            <select data-expense-id="${escapeAttr(row.id)}" data-expense-field="paidBy">
              ${tripMembers.map((member) => `<option value="${escapeAttr(member)}"${member === row.paidBy ? " selected" : ""}>${escapeHtml(member)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>나눌 인원</span>
            <input type="number" min="1" max="${tripMembers.length}" step="1" value="${escapeAttr(row.splitCount)}" data-expense-id="${escapeAttr(row.id)}" data-expense-field="splitCount">
          </label>
        </div>

        <div class="expense-row-foot">
          <div class="expense-members" role="group" aria-label="${escapeAttr(row.title)} 정산 대상">
            ${tripMembers.map((member) => `
              <label class="member-toggle${row.participants.includes(member) ? " is-checked" : ""}">
                <input type="checkbox" value="${escapeAttr(member)}" data-expense-id="${escapeAttr(row.id)}" data-expense-participant${row.participants.includes(member) ? " checked" : ""}>
                <span>${escapeHtml(member)}</span>
              </label>
            `).join("")}
          </div>
          <label class="expense-memo-field">
            <span>메모</span>
            <input type="text" value="${escapeAttr(row.memo)}" placeholder="선택 입력" data-expense-id="${escapeAttr(row.id)}" data-expense-field="memo" autocomplete="off">
          </label>
          <div class="expense-source">${source}</div>
        </div>
      </article>
    `;
  }

  function renderExpenseSource(row) {
    const day = dayById.get(row.dayId);
    const place = placeById.get(row.placeId);
    const sourceText = [
      day?.navLabel,
      place?.shortName || place?.name
    ].filter(Boolean).join(" · ");

    if (!sourceText) return `<span class="source-muted">직접 추가</span>`;

    return `
      <span class="source-muted">${escapeHtml(sourceText)}</span>
      <button class="small-button" type="button" data-expense-jump-place="${escapeAttr(row.placeId || "")}" data-expense-jump-day="${escapeAttr(row.dayId || "")}">일정 보기</button>
    `;
  }

  function calculateExpenseTotals() {
    const members = Object.fromEntries(tripMembers.map((member) => [
      member,
      { name: member, paid: 0, owed: 0, balance: 0 }
    ]));
    const validRows = [];
    let totalSpend = 0;

    expenses.forEach((row) => {
      if (!Number.isFinite(row.amount) || row.amount <= 0) return;
      if (!members[row.paidBy]) return;
      const participants = normalizeParticipants(row.participants, row.splitCount);
      if (!participants.length) return;

      const splitCount = participants.length;
      const share = row.amount / splitCount;
      totalSpend += row.amount;
      validRows.push(row);
      members[row.paidBy].paid += row.amount;
      participants.forEach((member) => {
        members[member].owed += share;
      });
    });

    Object.values(members).forEach((member) => {
      member.balance = member.paid - member.owed;
    });

    return {
      totalSpend,
      equalShare: totalSpend / tripMembers.length,
      members,
      validRows,
      settlements: calculateSettlements(members)
    };
  }

  function calculateSettlements(members) {
    const creditors = Object.values(members)
      .map((member) => ({ name: member.name, amount: roundWon(member.balance) }))
      .filter((member) => member.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    const debtors = Object.values(members)
      .map((member) => ({ name: member.name, amount: roundWon(Math.abs(member.balance)) }))
      .filter((member) => member.amount > 0 && members[member.name].balance < 0)
      .sort((a, b) => b.amount - a.amount);
    const settlements = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0) {
        settlements.push({ from: debtor.name, to: creditor.name, amount });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount <= 0) debtorIndex += 1;
      if (creditor.amount <= 0) creditorIndex += 1;
    }

    return settlements.filter((item) => item.amount > 0);
  }

  function formatRowSplit(row) {
    if (!Number.isFinite(row.amount) || row.amount <= 0) return `1인 금액 대기 /${row.splitCount}`;
    return `1인 ${formatWon(row.amount / row.splitCount)} /${row.splitCount}`;
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

      const mapFilter = event.target.closest("[data-map-day-filter]");
      if (mapFilter) {
        setActiveDay(mapFilter.dataset.mapDayFilter);
      }

      const routeButton = event.target.closest(".route-summary");
      if (routeButton) {
        const card = routeButton.closest("[data-route-card]");
        const isOpen = card.classList.toggle("is-open");
        routeButton.setAttribute("aria-expanded", String(isOpen));
      }

      const jumpButton = event.target.closest("[data-expense-jump-place]");
      if (jumpButton) {
        jumpToExpenseSource(jumpButton.dataset.expenseJumpPlace, jumpButton.dataset.expenseJumpDay);
      }

      const deleteButton = event.target.closest("[data-expense-delete]");
      if (deleteButton) {
        deleteExpenseRow(deleteButton.dataset.expenseDelete);
      }

      if (event.target.closest("#clear-expense-amounts")) {
        clearExpenseAmounts();
      }

      if (event.target.closest("#reset-expenses")) {
        resetExpenseRows();
      }

      const noteButton = event.target.closest("[data-note]");
      if (noteButton) {
        showToast(noteButton.dataset.note);
      }
    });

    document.addEventListener("input", (event) => {
      const field = event.target.closest("[data-expense-field]");
      if (field) handleExpenseFieldInput(field);
    });

    document.addEventListener("change", (event) => {
      const field = event.target.closest("[data-expense-field]");
      if (field) handleExpenseFieldChange(field);

      const participant = event.target.closest("[data-expense-participant]");
      if (participant) handleExpenseParticipantChange(participant);
    });

    const fitButton = document.querySelector("#fit-map");
    fitButton.addEventListener("click", () => {
      fitMapToActivePlaces();
    });

    const expenseForm = document.querySelector("#expense-form");
    expenseForm.addEventListener("submit", handleExpenseSubmit);
    expenseForm.elements.amount.addEventListener("input", () => {
      validateExpenseFormAmount(expenseForm);
    });
    expenseForm.elements.amount.addEventListener("blur", () => {
      const parsed = parseCurrency(expenseForm.elements.amount.value);
      if (parsed.valid && !parsed.empty) {
        expenseForm.elements.amount.value = formatNumber(parsed.amount);
      }
    });
  }

  function handleExpenseSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = form.elements.title.value.trim();
    const amount = parseCurrency(form.elements.amount.value);
    const splitCount = clampSplitCount(form.elements.splitCount.value);

    if (!title) {
      showToast("장소나 제목을 먼저 적어주세요.");
      form.elements.title.focus();
      return;
    }

    if (!amount.valid || amount.empty || amount.amount <= 0) {
      showToast("금액은 0보다 큰 숫자로 입력해주세요.");
      form.elements.amount.classList.add("is-invalid");
      form.elements.amount.focus();
      return;
    }

    expenses.push(normalizeExpense({
      id: createExpenseId(),
      source: "custom",
      category: form.elements.category.value,
      title,
      dayId: form.elements.dayId.value,
      amount: amount.amount,
      paidBy: form.elements.paidBy.value,
      splitCount,
      participants: tripMembers.slice(0, splitCount),
      memo: form.elements.memo.value.trim()
    }));

    saveExpenses();
    renderExpenses();
    form.reset();
    form.elements.splitCount.value = tripMembers.length;
    form.elements.amount.classList.remove("is-invalid");
    showToast("새 지출을 추가했어요.");
  }

  function handleExpenseFieldInput(field) {
    const row = findExpense(field.dataset.expenseId);
    if (!row) return;

    if (field.dataset.expenseField === "amount") {
      updateExpenseAmount(row, field);
      return;
    }

    if (field.dataset.expenseField === "title" || field.dataset.expenseField === "memo") {
      row[field.dataset.expenseField] = field.value.trim();
      saveExpenses();
      updateExpenseSaveState("저장됨");
    }
  }

  function handleExpenseFieldChange(field) {
    const row = findExpense(field.dataset.expenseId);
    if (!row) return;

    const fieldName = field.dataset.expenseField;
    if (fieldName === "amount") {
      if (updateExpenseAmount(row, field) && Number.isFinite(row.amount) && row.amount > 0) {
        field.value = formatNumber(row.amount);
      }
      return;
    }

    if (fieldName === "splitCount") {
      row.splitCount = clampSplitCount(field.value);
      row.participants = normalizeParticipants(row.participants, row.splitCount);
      saveExpenses();
      renderExpenses();
      return;
    }

    if (fieldName === "category") {
      row.category = validCategory(field.value);
    }

    if (fieldName === "dayId") {
      row.dayId = validDayId(field.value);
    }

    if (fieldName === "paidBy") {
      row.paidBy = validMember(field.value);
    }

    if (fieldName === "title" || fieldName === "memo") {
      row[fieldName] = field.value.trim();
    }

    saveExpenses();
    renderExpenseSummary();
    updateExpenseSaveState("저장됨");
  }

  function handleExpenseParticipantChange(input) {
    const row = findExpense(input.dataset.expenseId);
    if (!row) return;

    const rowElement = input.closest("[data-expense-row]");
    const checked = Array.from(rowElement.querySelectorAll("[data-expense-participant]:checked"))
      .map((item) => item.value)
      .filter((member) => tripMembers.includes(member));

    if (!checked.length) {
      input.checked = true;
      showToast("정산 대상은 최소 1명이어야 해요.");
      return;
    }

    row.participants = uniqueMembers(checked);
    row.splitCount = row.participants.length;
    saveExpenses();
    renderExpenses();
  }

  function updateExpenseAmount(row, field) {
    const parsed = parseCurrency(field.value);
    const rowElement = field.closest("[data-expense-row]");
    const error = rowElement?.querySelector("[data-expense-error]");

    field.classList.toggle("is-invalid", !parsed.valid);
    if (error) error.textContent = parsed.valid ? "" : "숫자만 입력해주세요.";

    if (!parsed.valid) return false;

    row.amount = parsed.empty ? null : parsed.amount;
    saveExpenses();
    updateExpenseRowPreview(rowElement, row);
    renderExpenseSummary();
    updateExpenseSaveState("저장됨");
    return true;
  }

  function updateExpenseRowPreview(rowElement, row) {
    const preview = rowElement?.querySelector("[data-expense-split-preview]");
    if (preview) preview.textContent = formatRowSplit(row);
  }

  function validateExpenseFormAmount(form) {
    const parsed = parseCurrency(form.elements.amount.value);
    form.elements.amount.classList.toggle("is-invalid", !parsed.valid);
    return parsed.valid;
  }

  function deleteExpenseRow(id) {
    const row = findExpense(id);
    if (!row || row.source !== "custom") return;
    if (!window.confirm(`"${row.title || "추가 지출"}" 항목을 삭제할까요?`)) return;

    expenses = expenses.filter((item) => item.id !== id);
    saveExpenses();
    renderExpenses();
    showToast("추가 지출을 삭제했어요.");
  }

  function clearExpenseAmounts() {
    if (!window.confirm("모든 항목의 금액만 비울까요? 제목, 메모, 결제자와 나눌 멤버는 그대로 둡니다.")) return;

    expenses = expenses.map((row) => ({ ...row, amount: null }));
    saveExpenses();
    renderExpenses();
    showToast("금액만 비웠어요.");
  }

  function resetExpenseRows() {
    if (!window.confirm("직접 추가한 항목과 입력 금액을 지우고 기본 예정 항목으로 되돌릴까요?")) return;

    expenses = seedExpenseRows();
    saveExpenses();
    renderExpenses();
    showToast("기본 정산 항목으로 되돌렸어요.");
  }

  function jumpToExpenseSource(placeId, dayId) {
    if (dayId) setActiveDay(dayId);

    const cards = Array.from(document.querySelectorAll("#timeline [data-place-card], #places-grid [data-place-card]"));
    const target = cards.find((card) => card.dataset.placeCard === placeId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    clearTimeout(flashTimer);
    document.querySelectorAll(".is-flashed").forEach((item) => item.classList.remove("is-flashed"));
    target.classList.add("is-flashed");
    flashTimer = setTimeout(() => {
      target.classList.remove("is-flashed");
    }, 1800);
  }

  function loadExpenses() {
    const seed = seedExpenseRows();
    let saved = null;

    try {
      saved = JSON.parse(window.localStorage.getItem(expenseStorageKey));
    } catch (error) {
      saved = null;
    }

    if (!saved || !Array.isArray(saved.items)) return seed;

    const savedById = new Map(saved.items.map((row) => [row.id, row]));
    const mergedSeed = seed.map((row) => normalizeExpense({
      ...row,
      ...(savedById.get(row.id) || {}),
      source: "planned",
      id: row.id,
      placeId: row.placeId
    }));
    const seedIds = new Set(seed.map((row) => row.id));
    const customRows = saved.items
      .filter((row) => !seedIds.has(row.id))
      .map((row) => normalizeExpense({ ...row, source: row.source === "planned" ? "custom" : row.source }));

    return [...mergedSeed, ...customRows];
  }

  function saveExpenses() {
    try {
      window.localStorage.setItem(expenseStorageKey, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        items: expenses.map(serializeExpense)
      }));
    } catch (error) {
      updateExpenseSaveState("저장 실패: 브라우저 저장 공간을 확인해주세요.");
    }
  }

  function serializeExpense(row) {
    return {
      id: row.id,
      source: row.source,
      category: row.category,
      title: row.title,
      dayId: row.dayId,
      placeId: row.placeId || "",
      amount: Number.isFinite(row.amount) ? row.amount : null,
      paidBy: row.paidBy,
      splitCount: row.splitCount,
      participants: row.participants,
      memo: row.memo
    };
  }

  function seedExpenseRows() {
    return (data.expenses?.plannedItems || []).map((item) => normalizeExpense({
      ...item,
      source: "planned",
      amount: null,
      paidBy: tripMembers[0],
      splitCount: tripMembers.length,
      participants: tripMembers,
      memo: item.memo || ""
    }));
  }

  function normalizeExpense(row) {
    const splitCount = clampSplitCount(row.splitCount);
    return {
      id: row.id || createExpenseId(),
      source: row.source === "planned" ? "planned" : "custom",
      category: validCategory(row.category),
      title: String(row.title || "").trim() || "제목 없음",
      dayId: validDayId(row.dayId),
      placeId: row.placeId || "",
      amount: sanitizeAmount(row.amount),
      paidBy: validMember(row.paidBy),
      splitCount,
      participants: normalizeParticipants(row.participants, splitCount),
      memo: String(row.memo || "").trim()
    };
  }

  function findExpense(id) {
    return expenses.find((row) => row.id === id);
  }

  function updateExpenseSaveState(message) {
    const target = document.querySelector("#expense-save-state");
    if (target) target.textContent = message;
  }

  function setActiveDay(dayId) {
    activeDayId = normalizeActiveDayId(dayId);

    document.querySelectorAll("[data-day-filter]").forEach((button) => {
      const isActive = button.dataset.dayFilter === activeDayId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll("[data-map-day-filter]").forEach((button) => {
      const isActive = button.dataset.mapDayFilter === activeDayId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll("[data-day-section]").forEach((section) => {
      section.classList.toggle("is-hidden", activeDayId !== "all" && section.dataset.daySection !== activeDayId);
    });

    renderMapLayers();
    fitMapToActivePlaces();
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

    renderMapLayers();
    fitMapToActivePlaces();
  }

  function renderMapLayers() {
    drawMapMarkers();
    drawRouteLines();
  }

  function drawMapMarkers() {
    if (!markerGroup) return;
    markerGroup.clearLayers();

    knownPlacesForDay(activeDayId).forEach((place) => {
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
  }

  function drawRouteLines() {
    if (!routeGroup) return;
    routeGroup.clearLayers();

    routesForDay(activeDayId)
      .forEach((route) => {
        const from = placeById.get(route.fromId);
        const to = placeById.get(route.toId);

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

  function fitMapToActivePlaces() {
    fitMapToPlaces(knownPlacesForDay(activeDayId));
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

  function parseCurrency(value) {
    const raw = String(value || "").trim();
    if (!raw) return { valid: true, empty: true, amount: null };

    const cleaned = raw.replace(/[,\s원₩]/g, "");
    if (!/^\d+$/.test(cleaned)) return { valid: false, empty: false, amount: null };

    const amount = Number(cleaned);
    if (!Number.isSafeInteger(amount) || amount < 0) return { valid: false, empty: false, amount: null };
    return { valid: true, empty: false, amount };
  }

  function sanitizeAmount(value) {
    if (value === null || value === undefined || value === "") return null;
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return null;
    return Math.round(amount);
  }

  function formatWon(value) {
    return `${formatNumber(roundWon(value))}원`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("ko-KR").format(roundWon(value));
  }

  function roundWon(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value);
  }

  function clampSplitCount(value) {
    const count = Number.parseInt(value, 10);
    if (!Number.isFinite(count)) return tripMembers.length;
    return Math.min(Math.max(count, 1), tripMembers.length);
  }

  function validCategory(value) {
    return expenseCategories.includes(value) ? value : expenseCategories[0];
  }

  function validDayId(value) {
    return dayById.has(value) ? value : data.days[0].id;
  }

  function validMember(value) {
    return tripMembers.includes(value) ? value : tripMembers[0];
  }

  function normalizeParticipants(value, splitCount) {
    const requestedCount = clampSplitCount(splitCount);
    const unique = uniqueMembers(Array.isArray(value) ? value : []);
    const filled = [
      ...unique,
      ...tripMembers.filter((member) => !unique.includes(member))
    ];

    return filled.slice(0, requestedCount);
  }

  function uniqueMembers(value) {
    const seen = new Set();
    return value.filter((member) => {
      if (!tripMembers.includes(member) || seen.has(member)) return false;
      seen.add(member);
      return true;
    });
  }

  function createExpenseId() {
    return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function dayLabels(place) {
    return place.dayRefs.map((id) => dayById.get(id)?.navLabel).filter(Boolean);
  }

  function knownPlaces() {
    return data.places.filter(hasCoords);
  }

  function knownPlacesForDay(dayId) {
    if (dayId === "all") return knownPlaces();

    const dayPlaceIds = new Set();
    const day = dayById.get(dayId);
    day?.events.forEach((event) => {
      if (event.placeId) dayPlaceIds.add(event.placeId);
    });
    data.routes
      .filter((route) => route.dayId === dayId)
      .forEach((route) => {
        dayPlaceIds.add(route.fromId);
        dayPlaceIds.add(route.toId);
      });

    return knownPlaces().filter((place) => place.dayRefs.includes(dayId) || dayPlaceIds.has(place.id));
  }

  function routesForDay(dayId) {
    return data.routes.filter((route) => {
      if (dayId !== "all" && route.dayId !== dayId) return false;
      if (route.pending) return false;
      return hasCoords(placeById.get(route.fromId)) && hasCoords(placeById.get(route.toId));
    });
  }

  function hasCoords(place) {
    return Boolean(place && Number.isFinite(place.lat) && Number.isFinite(place.lon));
  }

  function normalizeActiveDayId(value) {
    if (value === "all") return "all";
    return dayById.has(value) ? value : "all";
  }

  function markerToneClass(place) {
    if (place.kind === "stay") return "tone-stay";
    const firstDay = activeDayId === "all" ? dayById.get(place.dayRefs[0]) : dayById.get(activeDayId);
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
