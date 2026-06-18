window.TRAVEL_DATA = {
  trip: {
    title: "전주 2박 3일",
    subtitle: "6.21 Sun - 6.23 Tue · friends trip",
    startDate: "2026-06-21",
    endDate: "2026-06-23",
    people: ["조동", "쩡짱", "조구"],
    themes: ["맛집", "테니스", "사우나", "해장"],
    basePlaceId: "stay-gijiro70"
  },
  ktxOutbound: {
    date: "2026-06-21",
    route: "용산 → 전주",
    departureStation: "용산",
    arrivalStation: "전주",
    departureTime: "08:40",
    arrivalTime: "10:19",
    trainLabel: "KTX 확정",
    meetupNote: "조구는 전주에서 합류",
    seats: [
      { name: "쩡짱", car: "11호차", seat: "14A" },
      { name: "조동", car: "11호차", seat: "14B" }
    ],
    accessPlan: {
      title: "상봉역 → 용산역 권장 출발 플랜",
      summary: "08:40 KTX라 용산역에는 08:15-08:20쯤 도착하는 걸 목표로 잡기.",
      caution: "실시간/당일 열차 간격은 바뀔 수 있어 출발 전 네이버지도·코레일에서 한 번 더 확인.",
      steps: [
        "07:25-07:30 상봉역 도착",
        "07:35-07:45 경의중앙선 용산/문산 방면 탑승",
        "08:10-08:20 용산역 도착 목표",
        "KTX 승강장 이동 후 08:40 전주행 탑승"
      ]
    }
  },
  ktxReturnFallback: {
    schemaVersion: 1,
    status: "unavailable",
    source: "embedded",
    lastChecked: null,
    query: {
      date: "2026-06-23",
      from: "전주",
      to: "용산",
      passengers: 2,
      windows: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]
    },
    message: "아직 KTX 좌석 조회 데이터가 없어요. GitHub Actions가 돌면 이 카드가 최신 상태로 바뀝니다.",
    trains: []
  },
  expenses: {
    storageKey: "jeonju-trip-expenses-v1",
    categories: ["식당", "카페", "숙소/집", "술/간식", "교통", "기타"],
    plannedItems: [
      {
        id: "plan-day1-lunch-hyangmigak",
        category: "식당",
        title: "조기종의향미각 전주점",
        dayId: "day1",
        placeId: "hyangmigak",
        memo: "6/21 점심. 꼬막짬뽕과 탕수육 후보."
      },
      {
        id: "plan-day1-dinner-black-pork",
        category: "식당",
        title: "지리산흑돈",
        dayId: "day1",
        placeId: "jirisan-black-pork",
        memo: "6/21 저녁 고기."
      },
      {
        id: "plan-day1-home-snacks",
        category: "술/간식",
        title: "숙소 맥주/간식",
        dayId: "day1",
        placeId: "stay-gijiro70",
        memo: "숙소 복귀 후 편의점/배달 비용 자리."
      },
      {
        id: "plan-day2-lunch-pisundae",
        category: "식당",
        title: "금암피순대",
        dayId: "day2",
        placeId: "geumam-pisundae",
        memo: "6/22 점심 순대국밥."
      },
      {
        id: "plan-day2-sauna",
        category: "기타",
        title: "사우나",
        dayId: "day2",
        placeId: "unknown-sauna",
        memo: "장소 확정 후 실제 결제 금액 입력."
      },
      {
        id: "plan-day2-dinner-woosintang",
        category: "식당",
        title: "두거리우신탕 본점",
        dayId: "day2",
        placeId: "dugeori-woosintang",
        memo: "6/22 저녁 우신전골."
      },
      {
        id: "plan-day2-after-drinks",
        category: "술/간식",
        title: "2차 술/간식",
        dayId: "day2",
        placeId: "unknown-after",
        memo: "2차 장소 정해지면 이름을 바꿔도 돼요."
      },
      {
        id: "plan-day2-home-supplies",
        category: "숙소/집",
        title: "숙소 장보기/배달",
        dayId: "day2",
        placeId: "stay-gijiro70",
        memo: "집/숙소에서 같이 쓴 비용."
      },
      {
        id: "plan-day3-breakfast-kongnamul",
        category: "식당",
        title: "오거리콩나물해장국",
        dayId: "day3",
        placeId: "ogori-kongnamul",
        memo: "6/23 해장."
      },
      {
        id: "plan-day3-cafe",
        category: "카페",
        title: "카페",
        dayId: "day3",
        placeId: "unknown-cafe",
        memo: "후보 확정 후 이름을 바꿔도 돼요."
      },
      {
        id: "plan-day3-return-transport",
        category: "교통",
        title: "복귀 교통/KTX",
        dayId: "day3",
        placeId: "jeonju-station",
        memo: "KTX 카드와 별도로 실제 결제한 복귀 교통비를 적는 자리."
      }
    ]
  },
  days: [
    {
      id: "day1",
      date: "2026-06-21",
      navLabel: "6/21",
      label: "6.21 Sun",
      title: "첫째 날",
      summary: "도착 · 점심 · 테니스 · 흑돈",
      tone: "blue",
      markerColor: "#0071e3",
      events: [
        {
          time: "10:20",
          category: "도착",
          title: "전주역 도착",
          placeId: "jeonju-station",
          note: "조동/쩡짱 전주역 도착, 조구 픽업."
        },
        {
          time: "11:00",
          category: "점심",
          title: "조기종의향미각 전주점",
          placeId: "hyangmigak",
          note: "대표는 꼬막짬뽕. 일요일은 16:00 마감 정보가 있어 점심 배치가 좋음."
        },
        {
          time: "13:00-17:00",
          category: "테니스",
          title: "전북대학교 tennis",
          placeId: "jbnu-tennis",
          note: "3인팟. 예약은 18:00까지라 여유 1시간."
        },
        {
          time: "18:00",
          category: "저녁",
          title: "지리산흑돈",
          placeId: "jirisan-black-pork",
          note: "첫 타임이면 안정적. 인기 시간대라 전화 확인 추천."
        },
        {
          time: "저녁 후",
          category: "숙소",
          title: "숙소 복귀",
          placeId: "stay-gijiro70",
          note: "기지로 70 / 하모니시티오피스텔 권역."
        }
      ]
    },
    {
      id: "day2",
      date: "2026-06-22",
      navLabel: "6/22",
      label: "6.22 Mon",
      title: "둘째 날",
      summary: "피순대 · 테니스 · 사우나 · 우신탕",
      tone: "ink",
      markerColor: "#1d1d1f",
      events: [
        {
          time: "11:00",
          category: "점심",
          title: "금암피순대",
          placeId: "geumam-pisundae",
          note: "피순대가 핵심. 내장 호불호가 있으면 일반 순대국밥과 섞기."
        },
        {
          time: "14:00-17:00",
          category: "테니스",
          title: "전북대학교 tennis",
          placeId: "jbnu-tennis",
          note: "3인팟. 예약은 13:00-18:00."
        },
        {
          time: "18:00",
          category: "사우나",
          title: "사우나",
          placeId: "unknown-sauna",
          note: "정확한 이름/주소가 정해지면 경로 카드에 바로 반영."
        },
        {
          time: "19:00",
          category: "저녁",
          title: "두거리우신탕 본점",
          placeId: "dugeori-woosintang",
          note: "우신전골이 가장 안정적. 매운맛 자신 있으면 우신찜 추가 후보."
        },
        {
          time: "2차",
          category: "미정",
          title: "2차 장소",
          placeId: "unknown-after",
          note: "동선 보고 가볍게 정할 자리. 아직 지도 마커는 없음."
        },
        {
          time: "마무리",
          category: "숙소",
          title: "숙소 복귀",
          placeId: "stay-gijiro70",
          note: "두거리우신탕에서 숙소까지는 정적 경로 기준 차 약 12분."
        }
      ]
    },
    {
      id: "day3",
      date: "2026-06-23",
      navLabel: "6/23",
      label: "6.23 Tue",
      title: "셋째 날",
      summary: "해장 · 카페 · 서울 복귀",
      tone: "warm",
      markerColor: "#8e8e93",
      events: [
        {
          time: "오전",
          category: "해장",
          title: "오거리콩나물해장국",
          placeId: "ogori-kongnamul",
          note: "오전 장사라 늦잠 자면 놓칠 수 있음. 오징어 추가 추천."
        },
        {
          time: "식후",
          category: "카페",
          title: "카페",
          placeId: "unknown-cafe",
          note: "후보가 정해지면 장소 버튼과 복귀 경로를 연결."
        },
        {
          time: "복귀",
          category: "이동",
          title: "서울 복귀",
          placeId: "jeonju-station",
          note: "출발점은 전주역 기준으로 임시 표시. 다른 출발지면 교체."
        }
      ]
    }
  ],
  places: [
    {
      id: "jeonju-station",
      name: "전주역",
      shortName: "전주역",
      kind: "station",
      category: "역",
      address: "전북 전주시 덕진구 동부대로 680",
      lat: 35.8500537,
      lon: 127.1623649,
      dayRefs: ["day1", "day3"],
      markerLabel: "1",
      note: "전주 도착과 서울 복귀의 기본 기준점."
    },
    {
      id: "stay-gijiro70",
      name: "숙소 기지로 70",
      shortName: "숙소",
      kind: "stay",
      category: "숙소",
      address: "전북 전주시 덕진구 기지로 70",
      lat: 35.8381938,
      lon: 127.0724281,
      dayRefs: ["day1", "day2", "day3"],
      markerLabel: "H",
      note: "하모니시티오피스텔 권역. OSM 기준 street-level approximate."
    },
    {
      id: "jbnu-tennis",
      name: "전북대학교 tennis",
      shortName: "전북대 tennis",
      kind: "activity",
      category: "테니스",
      address: "전북대학교 전주캠퍼스",
      lat: 35.8466752,
      lon: 127.1337209,
      dayRefs: ["day1", "day2"],
      markerLabel: "T",
      note: "정확한 코트 좌표가 확인되기 전까지 캠퍼스 기준으로 표시."
    },
    {
      id: "hyangmigak",
      name: "조기종의향미각 전주점",
      shortName: "향미각",
      kind: "restaurant",
      category: "중식",
      address: "전북 전주시 덕진구 건지3길 13-1",
      phone: "063-273-8252",
      lat: 35.8450173,
      lon: 127.1445063,
      dayRefs: ["day1"],
      markerLabel: "2",
      note: "월요일 휴무, 일요일 16:00 마감 정보가 있어 6/21 점심 배치가 좋음."
    },
    {
      id: "jirisan-black-pork",
      name: "지리산흑돈",
      shortName: "지리산흑돈",
      kind: "restaurant",
      category: "돼지고기구이",
      address: "전북 전주시 완산구 홍산2길 5-10 1층",
      phone: "0507-1416-8611",
      lat: 35.8153357,
      lon: 127.1099986,
      dayRefs: ["day1"],
      markerLabel: "4",
      note: "고기 질과 직접 구워주는 편의성이 강점. 예약/전화 확인 추천."
    },
    {
      id: "geumam-pisundae",
      name: "금암피순대",
      shortName: "금암피순대",
      kind: "restaurant",
      category: "순대국밥",
      address: "전북특별자치도 전주시 덕진구 기린대로 400-61",
      phone: "063-272-1394",
      lat: 35.865904,
      lon: 127.0786339,
      dayRefs: ["day2"],
      markerLabel: "5",
      note: "피순대와 특순대국밥이 핵심. 내장 호불호만 체크."
    },
    {
      id: "dugeori-woosintang",
      name: "두거리우신탕 본점",
      shortName: "두거리우신탕",
      kind: "restaurant",
      category: "우신탕",
      address: "전북 전주시 덕진구 동부대로 1106",
      phone: "063-277-8188",
      lat: 35.8725698,
      lon: 127.0941843,
      dayRefs: ["day2"],
      markerLabel: "7",
      note: "사용자 메모상 일요일 휴무. 6/22 월요일 저녁 배치 OK."
    },
    {
      id: "ogori-kongnamul",
      name: "오거리콩나물해장국",
      shortName: "오거리콩나물",
      kind: "restaurant",
      category: "해장국",
      address: "전북 전주시 완산구 공북로 83",
      lat: 35.8257,
      lon: 127.143,
      dayRefs: ["day3"],
      markerLabel: "8",
      note: "06:30-12:00 정보가 있어 아침/이른 점심으로만 넣는 게 맞음."
    },
    {
      id: "unknown-sauna",
      name: "사우나",
      shortName: "사우나",
      kind: "placeholder",
      category: "위치 미정",
      dayRefs: ["day2"],
      markerLabel: "",
      note: "정확한 이름/주소를 정하면 지도와 경로에 반영할 자리."
    },
    {
      id: "unknown-after",
      name: "2차 장소",
      shortName: "2차",
      kind: "placeholder",
      category: "후보 미정",
      dayRefs: ["day2"],
      markerLabel: "",
      note: "저녁 이후 컨디션과 숙소 방향을 보고 고르면 좋음."
    },
    {
      id: "unknown-cafe",
      name: "카페",
      shortName: "카페",
      kind: "placeholder",
      category: "후보 미정",
      dayRefs: ["day3"],
      markerLabel: "",
      note: "오거리콩나물해장국 이후 동선에 맞춰 선택."
    }
  ],
  routes: [
    {
      id: "r-day1-1",
      dayId: "day1",
      fromId: "jeonju-station",
      toId: "hyangmigak",
      distance: "약 3.0km",
      car: "약 6분",
      bus: "약 22분",
      walk: "약 40분",
      note: "OSM geocode는 street-level 기준이라 실제 입구 위치는 지도에서 한 번 더 확인."
    },
    {
      id: "r-day1-2",
      dayId: "day1",
      fromId: "hyangmigak",
      toId: "jbnu-tennis",
      distance: "약 1.7km",
      car: "약 6분",
      bus: "약 18분",
      walk: "약 22분",
      note: "점심 후 테니스장까지 짧은 이동."
    },
    {
      id: "r-day1-3",
      dayId: "day1",
      fromId: "jbnu-tennis",
      toId: "jirisan-black-pork",
      distance: "약 5.2km",
      car: "약 11분",
      bus: "약 29분",
      walk: "약 69분",
      note: "테니스 뒤라 차량 이동 기준으로 보는 게 현실적."
    },
    {
      id: "r-day1-4",
      dayId: "day1",
      fromId: "jirisan-black-pork",
      toId: "stay-gijiro70",
      distance: "약 6.2km",
      car: "약 11분",
      bus: "약 33분",
      walk: "약 83분",
      note: "저녁 후 숙소 복귀."
    },
    {
      id: "r-day2-1",
      dayId: "day2",
      fromId: "stay-gijiro70",
      toId: "geumam-pisundae",
      distance: "약 5.2km",
      car: "약 8분",
      bus: "약 29분",
      walk: "약 69분",
      note: "숙소 출발 기준 점심 이동."
    },
    {
      id: "r-day2-2",
      dayId: "day2",
      fromId: "geumam-pisundae",
      toId: "jbnu-tennis",
      distance: "약 6.7km",
      car: "약 12분",
      bus: "약 34분",
      walk: "약 89분",
      note: "점심 후 테니스장 이동. 예약 시작 시간은 13:00."
    },
    {
      id: "r-day2-3",
      dayId: "day2",
      fromId: "jbnu-tennis",
      toId: "unknown-sauna",
      pending: true,
      note: "사우나 위치가 정해지면 자동으로 경로 카드에 반영할 자리."
    },
    {
      id: "r-day2-4",
      dayId: "day2",
      fromId: "unknown-sauna",
      toId: "dugeori-woosintang",
      pending: true,
      note: "사우나 이름/주소가 필요."
    },
    {
      id: "r-day2-5",
      dayId: "day2",
      fromId: "dugeori-woosintang",
      toId: "stay-gijiro70",
      distance: "약 7.1km",
      car: "약 12분",
      bus: "약 36분",
      walk: "약 95분",
      note: "저녁 후 숙소 복귀. 2차가 정해지면 이 구간 앞에 추가."
    },
    {
      id: "r-day3-1",
      dayId: "day3",
      fromId: "stay-gijiro70",
      toId: "ogori-kongnamul",
      distance: "약 9.2km",
      car: "약 15분",
      bus: "약 43분",
      walk: "약 122분",
      note: "오전 영업이라 출발 시간을 넉넉히 잡기."
    },
    {
      id: "r-day3-2",
      dayId: "day3",
      fromId: "ogori-kongnamul",
      toId: "unknown-cafe",
      pending: true,
      note: "카페 후보가 정해지면 거리/시간을 채울 자리."
    },
    {
      id: "r-day3-3",
      dayId: "day3",
      fromId: "unknown-cafe",
      toId: "jeonju-station",
      pending: true,
      note: "카페와 서울 복귀 출발점 확정 필요."
    },
    {
      id: "r-day3-direct",
      dayId: "day3",
      fromId: "ogori-kongnamul",
      toId: "jeonju-station",
      distance: "약 5.2km",
      car: "약 10분",
      bus: "약 29분",
      walk: "약 70분",
      variant: "fallback",
      note: "카페를 건너뛰고 전주역으로 바로 갈 때의 임시 경로."
    }
  ],
  foodGuides: [
    {
      placeId: "hyangmigak",
      headline: "짬뽕 2종 + 사이드가 베스트",
      copy: "대표는 꼬막짬뽕. 국물 진한 쪽은 소고기짬뽕, 같이 나눠먹을 사이드는 탕수육이 베스트.",
      order: ["꼬막짬뽕 1", "소고기짬뽕 1", "유니짜장 또는 꼬막짬뽕밥 1", "소화 시간 괜찮으면 탕수육 1"],
      caution: "월요일 휴무. 일요일은 16:00 마감 정보가 보여 저녁 후보로는 부적합."
    },
    {
      placeId: "jirisan-black-pork",
      headline: "고기 질로 가는 저녁",
      copy: "고기 질로 가는 집. 흑돈/목살 먼저 깔고, 사이드는 짜글이 or 순두부찌개로 가면 안정적.",
      order: ["흑돈 또는 흑돈생목살 3인분 이상", "짜글이 또는 버섯순두부찌개", "가능하면 국수류 하나로 마무리"],
      caution: "18:00 첫 타임은 좋지만 인기 시간대라 예약/전화 확인 추천."
    },
    {
      placeId: "geumam-pisundae",
      headline: "피순대 중심으로 든든하게",
      copy: "피순대가 핵심. 내장 괜찮으면 특순대국밥, 호불호 걱정되면 일반 순대국밥과 피순대국밥을 섞자.",
      order: ["특순대국밥 2", "피순대국밥 1", "가능하면 피순대 또는 막창모듬 소/중 공유"],
      caution: "내장/암뽕 호불호가 있으면 주문 전 취향 확인."
    },
    {
      placeId: "dugeori-woosintang",
      headline: "우신전골이 가장 안정적",
      copy: "저녁은 우신전골이 가장 안정적. 매운맛 자신 있으면 우신찜을 추가 후보로.",
      order: ["우신전골 2-3인 기준", "매운맛 가능하면 우신찜 공유", "무난하게 가려면 우신탕/우신전골 위주"],
      caution: "사용자 메모상 일요일 휴무. 피크타임 웨이팅/응대 리스크는 여유 있게."
    },
    {
      placeId: "ogori-kongnamul",
      headline: "늦기 전에 해장",
      copy: "해장은 콩나물국밥에 오징어 추가. 오전 장사라 늦잠 자면 놓친다.",
      order: ["콩나물국밥 3", "오징어 추가 1-2개 공유", "맵기 약하면 순한맛/덜맵게 가능 여부 확인"],
      caution: "12:00 종료 정보가 있어 아침/이른 점심으로만 넣는 게 맞음."
    }
  ],
  warnings: [
    "조기종의향미각은 월요일 휴무라 6/21 일요일 점심 배치가 좋고, 일요일 16:00 마감 정보가 보여요.",
    "두거리우신탕은 사용자 메모상 일요일 휴무라 6/22 월요일 저녁 배치가 자연스러워요.",
    "오거리콩나물해장국은 오전 장사 정보가 있어 6/23에는 늦잠만 조심하면 돼요.",
    "사우나, 카페, 2차는 위치가 정해지면 지도 마커와 경로 카드에 바로 넣을 수 있어요.",
    "모든 이동 시간은 정적 추정치라 교통상황·대기시간에 따라 달라질 수 있어요."
  ]
};
