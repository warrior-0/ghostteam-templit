const urbanData = [
  {
    id: 1,
    title: '밤길에 들리는 발소리',
    likes: 13,
    date: '2025-05-20',
    filter: 'korea',
    level: 3,
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    body: '어두운 밤, 골목길을 걷다가 누군가 따라오는 듯한 기분에 뒤를 돌아봤지만 아무도 없었다. 하지만 발소리는 점점 가까워졌다...',
    detail: '이 이야기는 실제로 2021년 서울의 한 골목에서 벌어진 일입니다. 집에 가던 중, 뒤에서 발소리가 가까워지는 것을 느꼈지만 주위를 둘러봐도 아무도 없어서'
  },
  {
    id: 2,
    title: '학교의 괴담',
    likes: 25,
    date: '2025-05-18',
    filter: 'korea',
    level: 2,
    thumb: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    body: '우리 학교에는 밤마다 혼자 남아 있으면 들린다는 피아노 소리에 대한 소문이 있다. 실제로 경험한 친구의 이야기를 들었다...',
    detail: '실제로 친구는 늦게까지 교실에 남아 있었는데, 아무도 없는 음악실에서 피아노 소리가 났다고 합니다. 용기를 내어 가봤지만, 음악실에는 아무도 없었다고 합니다.'
  },
  {
    id: 3,
    title: '기묘한 아파트 엘리베이터',
    likes: 9,
    date: '2025-05-21',
    filter: 'foreign',
    level: 4,
    thumb: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3f41?auto=format&fit=crop&w=400&q=80',
    body: '엘리베이터에 홀로 타고 있는데, 누군가 버튼을 누른 것도 아닌데 갑자기 13층에 멈췄다. 문이 열리고 아무도 없었다...',
    detail: '엘리베이터를 타고 가던 중, 목적지와는 전혀 상관없는 13층에서 멈췄고, 문이 열렸지만 아무도 없었습니다. 괜히 오싹해서 바로 닫힘 버튼을 눌렀습니다.'
  },
  {
    id: 4,
    title: '실제로 겪은 이야기',
    likes: 18,
    date: '2025-05-19',
    filter: 'true',
    level: 5,
    thumb: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
    body: '이 이야기는 실제로 내가 겪은 일이다...',
    detail: '어릴 적 시골집에서 혼자 잠을 자는데 누군가 이불을 잡아당기는 느낌이 들었습니다. 눈을 떠보니 아무도 없었고, 이불은 그대로였습니다.'
  },
  {
    id: 5,
    title: '사용자 제보 괴담',
    likes: 11,
    date: '2025-05-17',
    filter: 'user',
    level: 1,
    thumb: 'https://images.unsplash.com/photo-1510936111840-6cef99faf2a9?auto=format&fit=crop&w=400&q=80',
    body: '이 괴담은 사용자에게 제보받은 내용입니다...',
    detail: '사용자 제보에 따르면, 한밤중에 집에서 혼자 있는데 누군가 문을 두드리는 소리가 들렸다고 합니다. 하지만 확인해보니 아무도 없었다고 합니다.'
  }
];

const filterTitles = {
  all: '전체 괴담',
  korea: '한국 괴담',
  foreign: '해외 괴담',
  true: '실화 이야기',
  user: '사용자 제보 괴담'
};

/**
 * 상단 흰색 제목(.urban-title)과 정렬 버튼(.urban-sort)을 보이게 하는 함수
 */
function showUrbanHeader() {
  const titleElem = document.querySelector('.urban-title');
  const sortElem  = document.querySelector('.urban-sort');
  if (titleElem) titleElem.style.display = '';
  if (sortElem)  sortElem.style.display  = '';
}

/**
 * 상단 흰색 제목(.urban-title)과 정렬 버튼(.urban-sort)을 숨기는 함수
 */
function hideUrbanHeader() {
  const titleElem = document.querySelector('.urban-title');
  const sortElem  = document.querySelector('.urban-sort');
  if (titleElem) titleElem.style.display = 'none';
  if (sortElem)  sortElem.style.display  = 'none';
}

function getParamFromURL(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function updateUrbanTitle(filterTypeOrTitle) {
  const titleElem = document.querySelector('.urban-title');
  if (titleElem) {
    titleElem.textContent = filterTitles[filterTypeOrTitle] || filterTypeOrTitle || '괴담 모음';
  }
}

function renderLevelStars(level) {
  let stars = '';
  for (let i = 0; i < level; i++) {
    stars += '★';
  }
  return stars;
}

function renderUrbanList(sortType, filterType) {
  // (1) 리스트 페이지 진입 시, 상단 흰색 제목 및 정렬 버튼 보이기
  showUrbanHeader();

  // (2) 데이터 필터링 및 정렬
  let list = urbanData.filter(item => filterType === 'all' ? true : item.filter === filterType);
  if (sortType === 'latest') {
    list.sort((a, b) => b.date.localeCompare(a.date));
  } else if (sortType === 'popular') {
    list.sort((a, b) => b.likes - a.likes);
  } else if (sortType === 'level') {
    list.sort((a, b) => b.level - a.level);
  }

  // (3) 카드 렌더링
  const urbanList = document.getElementById('urbanList');
  if (list.length === 0) {
    urbanList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">등록된 괴담이 없습니다.</div>`;
  } else {
    urbanList.innerHTML =
      list.map(item => `
        <div class="product-card urban-item" data-id="${item.id}" style="cursor:pointer;">
          <img src="${item.thumb}" alt="${item.title}" style="width:100%; height:115px; object-fit:cover; border-radius:8px; margin-bottom:0.8rem;">
          <div class="urban-item-title" style="margin-bottom:0.5rem;">${item.title}</div>
          <div class="urban-item-meta" style="margin-bottom:0.4rem;">
            <span>좋아요 ${item.likes}개</span>
            <span>${item.date}</span>
          </div>
          <div style="color:#e01c1c; font-size:0.95rem; margin-bottom:0.4rem;">
            공포 난이도: <span class="level-stars">${renderLevelStars(item.level)}</span>
          </div>
        </div>
      `).join('');

    document.querySelectorAll('.urban-item').forEach(itemElem => {
      itemElem.addEventListener('click', function(){
        const clickId = this.getAttribute('data-id');
        window.history.pushState({}, '', `?id=${clickId}`);
        renderUrbanDetail(parseInt(clickId, 10));
      });
    });
  }
}

function renderUrbanDetail(id) {
  const data = urbanData.find(item => item.id === id);
  const urbanList = document.getElementById('urbanList');

  // (0) 데이터가 없으면 처리
  if (!data) {
    urbanList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">괴담을 찾을 수 없습니다.</div>`;
    updateUrbanTitle('괴담 모음');
    showUrbanHeader();   // 헤더 복원
    return;
  }

  // (1) 상세 페이지 진입 시: 상단 흰색 제목과 정렬 버튼 숨기기
  hideUrbanHeader();

  // (2) 헤더 제목을 해당 괴담 제목으로 업데이트
  updateUrbanTitle(data.title);

  // (3) 상세 본문 렌더
  urbanList.innerHTML = `
    <div class="product-card urban-item urban-detail" style="width:100%; max-width:1200px; margin:0 auto; position:relative;">
      <!-- 음성 모드 버튼 -->
      <div class="voice-mode" style="position:absolute; top:1rem; right:1rem;">
        <button id="playVoiceBtn" style="background:#444; color:#fff; border:none; padding:0.5rem 1rem; border-radius:6px; cursor:pointer;">
          🎧 음성 모드
        </button>
        <audio id="urbanVoiceAudio" style="display:none; margin-top:0.5rem; width:100%;">
          <source src="urban${id}.mp3" type="audio/mpeg">
          브라우저가 오디오를 지원하지 않습니다.
        </audio>
      </div>

      <!-- 제목 및 메타 정보 -->
      <div class="urban-item-title" style="font-size:1.5rem; margin-bottom:0.6rem;">${data.title}</div>
      <div class="urban-item-meta" style="margin-bottom:0.6rem;">
        <span>좋아요 ${data.likes}개</span>
        <span style="margin-left:1rem;">${data.date}</span>
      </div>
      <div style="color:#e01c1c; font-size:1rem; margin-bottom:0.8rem;">
        공포 난이도: <span class="level-stars">${renderLevelStars(data.level)}</span>
      </div>

      <!-- 본문 내용 -->
      <div class="urban-item-body" style="margin-top:1.2rem; font-size:1.1rem; line-height:1.7; margin-bottom:1.5rem;">
        ${data.detail || data.body}
      </div>

      <!-- 목록으로 돌아가기 -->
      <button class="urban-back-btn" style="background:#444; color:#fff; border:none; padding:0.7rem 1.6rem; border-radius:8px; cursor:pointer;">
        목록으로
      </button>
    </div>
  `;

  // (4) 음성 모드 토글 로직
  const playBtn = document.getElementById('playVoiceBtn');
  const audioEl = document.getElementById('urbanVoiceAudio');
  let voicePlaying = localStorage.getItem('voiceModeStatus') === 'on';
  function updateVoiceState(play) {
    if (play) {
      audioEl.style.display = 'block';
      audioEl.currentTime = 0;
      audioEl.play().catch(() => {});
      playBtn.textContent = '🎧 음성 모드 ON';
      localStorage.setItem('voiceModeStatus', 'on');
    } else {
      audioEl.pause();
      audioEl.style.display = 'none';
      playBtn.textContent = '🎧 음성 모드 OFF';
      localStorage.setItem('voiceModeStatus', 'off');
    }
  }
  updateVoiceState(voicePlaying);
  if (playBtn && audioEl) {
    playBtn.addEventListener('click', () => {
      voicePlaying = !voicePlaying;
      updateVoiceState(voicePlaying);
    });
  }

  // (5) “목록으로” 클릭 시: 헤더 복원 + 리스트 렌더
  const backBtn = document.querySelector('.urban-back-btn');
  backBtn.addEventListener('click', () => {
    window.history.pushState({}, '', window.location.pathname);
    let sortType   = 'latest';
    let filterType = getParamFromURL('filter') || 'all';
    renderUrbanList(sortType, filterType);
    updateUrbanTitle(filterType);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('urbanList')) {
    let sortType   = 'latest';
    let filterType = getParamFromURL('filter') || 'all';
    const idParam  = getParamFromURL('id');

    if (idParam) {
      renderUrbanDetail(parseInt(idParam, 10));
    } else {
      renderUrbanList(sortType, filterType);
      updateUrbanTitle(filterType);
    }

    // 정렬 버튼 클릭 이벤트
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', function(){
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        sortType = this.dataset.sort;
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      });
    });

    // 브라우저 뒤로/앞 버튼 처리
    window.addEventListener('popstate', function() {
      const idParamInside = getParamFromURL('id');
      filterType = getParamFromURL('filter') || 'all';
      if (idParamInside) {
        renderUrbanDetail(parseInt(idParamInside, 10));
      } else {
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      }
    });
  }
});
