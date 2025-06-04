// urban.js
import { initUrbanFirebase } from './urban-firebase.js';

// 더미 데이터(초기 목록용, 실제 좋아요/댓글은 firestore 연동)
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
    detail: '이 이야기는 실제로 2021년 서울의 한 골목에서 벌어진 일입니다. 집에 가던 중, 뒤에서 발소리가 가까워지는 것을 느꼈지만 주위를 둘러봐도 [...]'
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
    detail: '실제로 친구는 늦게까지 교실에 남아 있었는데, 아무도 없는 음악실에서 피아노 소리가 났다고 합니다. 용기를 내어 가봤지만, 음악실에는   [...]'
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
    detail: '엘리베이터를 타고 가던 중, 목적지와는 전혀 상관없는 13층에서 멈췄고, 문이 열렸지만 아무도 없었습니다. 괜히 오싹해서 바로 닫힘 버튼을[...]'
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
    detail: '어릴 적 시골집에서 혼자 잠을 자는데 누군가 이불을 잡아당기는 느낌이 들었습니다. 눈을 떠보니 아무도 없었고, 이불은 그대로였습니다.   [...]'
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
    detail: '사용자 제보에 따르면, 한밤중에 집에서 혼자 있는데 누군가 문을 두드리는 소리가 들렸다고 합니다. 하지만 확인해보니 아무도 없었다고 합[...]'
  }
];

// 각 필터별 한글 제목
const filterTitles = {
  all: '전체 괴담 모음',
  korea: '한국 괴담',
  foreign: '해외 괴담',
  true: '실화 이야기',
  user: '사용자 제보 괴담'
};

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

// 별표 난이도
function renderLevelStars(level) {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}

// 목록 랜더링
function renderUrbanList(sortType, filterType) {
  let list = [...urbanData];
  if (filterType && filterType !== 'all') {
    list = list.filter(item => item.filter === filterType);
  }
  if (sortType === 'latest') {
    list.sort((a, b) => b.date.localeCompare(a.date));
  } else if (sortType === 'popular') {
    list.sort((a, b) => b.likes - a.likes);
  } else if (sortType === 'level') {
    list.sort((a, b) => b.level - a.level);
  }
  const urbanList = document.getElementById('urbanList');
  if (list.length === 0) {
    urbanList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">등록된 괴담이 없습니다.</div>`;
  } else {
    urbanList.innerHTML =
      list.map(item => `
        <div class="urban-item" data-id="${item.id}" style="cursor:pointer;">
          <div class="urban-item-title">${item.title}</div>
          <div class="urban-item-meta">
            <span>좋아요 ${item.likes}개</span>
            <span>${item.date}</span>
            <span>공포 난이도: <span class="level-stars">${renderLevelStars(item.level)}</span></span>
          </div>
          <div class="urban-item-body">${item.body}</div>
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

// 상세 랜더링
function renderUrbanDetail(id) {
  const urbanList = document.getElementById('urbanList');
  const data = urbanData.find(item => item.id === id);
  if (!data) {
    urbanList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">괴담을 찾을 수 없습니다.</div>`;
    updateUrbanTitle('괴담 모음');
    return;
  }
  // 제목
  const titleElem = document.querySelector('.urban-title');
  if (titleElem) titleElem.textContent = data.title;

  urbanList.innerHTML = `
    <div class="urban-item urban-detail">
      <div class="urban-item-title" style="font-size:1.5rem;">${data.title}</div>
      <div class="urban-item-meta">
        <span>좋아요 <span id="likeCount">0</span>개</span>
        <button id="likeBtn" style="margin-left:8px;">👍 좋아요</button>
        <span style="margin-left:16px;">${data.date}</span>
        <span style="margin-left:16px;">공포 난이도: <span class="level-stars">${renderLevelStars(data.level)}</span></span>
      </div>
      <div class="urban-item-body" style="margin-top:1.5rem; font-size:1.1rem; line-height:1.7;">${data.detail || data.body}</div>
      
      <!-- 댓글 입력 폼 -->
      <form id="commentForm" style="margin-top:2rem; display:flex; gap:0.5rem;">
        <input id="commentInput" type="text" placeholder="댓글 입력" style="flex:1; padding:0.6rem;" required />
        <button type="submit">댓글 작성</button>
      </form>
      <!-- 댓글 리스트 -->
      <ul id="commentList" style="margin-top:1rem; padding-left:0; list-style:none;"></ul>
      
      <button class="urban-back-btn" style="margin-top:2rem; background:#222;color:#fafafa;border:none;padding:0.7rem 1.6rem;border-radius:8px;cursor:pointer;">목록으로</button>
    </div>
  `;
  document.querySelector('.urban-back-btn').addEventListener('click', function(){
    window.history.back();
  });
  // ★ 댓글/좋아요 기능 연결(필수!)
  initUrbanFirebase(id);
}

// 페이지 로딩시
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('urbanList')) {
    let sortType = 'latest';
    let filterType = getParamFromURL('filter') || 'all';
    const idParam = getParamFromURL('id');
    if (idParam) {
      renderUrbanDetail(parseInt(idParam, 10));
    } else {
      renderUrbanList(sortType, filterType);
      updateUrbanTitle(filterType);
    }
    // 정렬 버튼
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', function(){
        document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        sortType = this.dataset.sort;
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      });
    });
    // 세부 메뉴 클릭시
    document.querySelectorAll('.submenu a').forEach(link => {
      link.addEventListener('click', function(e){
        e.preventDefault();
        const url = new URL(this.href);
        const newFilter = url.searchParams.get('filter') || 'all';
        filterType = newFilter;
        window.history.pushState({}, '', url.pathname + url.search);
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      });
    });
    // 뒤로가기/앞으로가기 지원
    window.addEventListener('popstate', function() {
      const idParam = getParamFromURL('id');
      filterType = getParamFromURL('filter') || 'all';
      if (idParam) {
        renderUrbanDetail(parseInt(idParam, 10));
      } else {
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      }
    });
  }
});
