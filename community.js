// Firestore 연동 커뮤니티 게시판: 게시글 작성(CREATE), 신고 기능 없음

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, query, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAjHwHbHlCi4vgv-Ma0-3kqt-M3SLI_oF4",
  authDomain: "ghost-38f07.firebaseapp.com",
  projectId: "ghost-38f07",
  storageBucket: "ghost-38f07.appspot.com",
  messagingSenderId: "776945022976",
  appId: "1:776945022976:web:105e545d39f12b5d0940e5",
  measurementId: "G-B758ZC971V"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

const boardTitles = {
  free: '자유게시판',
  notice: '이벤트/공지',
  archive: '자료실'
};

function getParamFromURL(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function updateCommunityTitle(boardTypeOrTitle) {
  const titleElem = document.querySelector('.community-title');
  if (titleElem) {
    titleElem.textContent = boardTitles[boardTypeOrTitle] || boardTypeOrTitle || '자유게시판';
  }
}

async function fetchCommunityPosts(sortType, boardType) {
  let q = collection(db, "posts");
  let constraints = [];
  if (boardType && boardType !== "all") {
    constraints.push(where("board", "==", boardType));
  }
  if (sortType === "latest") {
    constraints.push(orderBy("created", "desc"));
  } else if (sortType === "popular") {
    constraints.push(orderBy("likes", "desc"));
  }
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function renderCommunityList(sortType, boardType) {
  const list = await fetchCommunityPosts(sortType, boardType);
  const communityList = document.getElementById('communityList');
  let btnHtml = "";
  if (currentUser) {
    btnHtml = `<button id="newPostBtn" style="margin-bottom:1.5rem;">게시글 작성</button>`;
  }
  if (list.length === 0) {
    communityList.innerHTML = btnHtml + `<div style="color:#bbb; padding:2rem 0;">등록된 게시글이 없습니다.</div>`;
  } else {
    communityList.innerHTML =
      btnHtml +
      list.map(item => `
        <div class="community-item" data-id="${item.id}" style="cursor:pointer;">
          <div class="community-item-title">${item.title}</div>
          <div class="community-item-meta">
            <span>좋아요 ${item.likes || 0}개</span>
            <span>${item.created?.toDate ? item.created.toDate().toISOString().slice(0, 10) : ''}</span>
            <span>${boardTitles[item.board]}</span>
          </div>
          <div class="community-item-body">${item.body}</div>
        </div>
      `).join('');

    // 상세 클릭
    document.querySelectorAll('.community-item').forEach(itemElem => {
      itemElem.addEventListener('click', function () {
        const clickId = this.getAttribute('data-id');
        window.history.pushState({}, '', `?id=${clickId}`);
        renderCommunityDetail(clickId);
      });
    });
  }

  // 게시글 작성 버튼 이벤트
  if (document.getElementById('newPostBtn')) {
    document.getElementById('newPostBtn').onclick = () => {
      showCreatePostForm(boardType);
    };
  }
}

// 게시글 상세(작성/수정/삭제 없이 읽기만, 신고 없음)
async function renderCommunityDetail(postId) {
  const communityList = document.getElementById('communityList');
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : null;
  if (!data) {
    communityList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">게시글을 찾을 수 없습니다.</div>`;
    updateCommunityTitle('자유게시판');
    return;
  }
  // 제목 변경
  const titleElem = document.querySelector('.community-title');
  if (titleElem) titleElem.textContent = data.title;

  communityList.innerHTML = `
    <div class="community-item community-detail">
      <div class="community-item-title" style="font-size:1.5rem;">${data.title}</div>
      <div class="community-item-meta">
        <span>좋아요 ${data.likes || 0}개</span>
        <span style="margin-left:16px;">${data.created?.toDate ? data.created.toDate().toISOString().slice(0, 10) : ''}</span>
        <span style="margin-left:16px;">${boardTitles[data.board]}</span>
      </div>
      <div class="community-item-body" style="margin-top:1.5rem; font-size:1.1rem; line-height:1.7;">${data.body}</div>
      <button class="community-back-btn" style="margin-top:2rem; background:#222;color:#fafafa;border:none;padding:0.7rem 1.6rem;border-radius:8px;cursor:pointer;">목록으로</button>
    </div>
  `;
  document.querySelector('.community-back-btn').addEventListener('click', function () {
    window.history.back();
  });
}

// 게시글 작성 폼
function showCreatePostForm(boardType) {
  const communityList = document.getElementById('communityList');
  communityList.innerHTML = `
    <div class="community-item">
      <div class="community-item-title" style="font-size:1.3rem;">게시글 작성</div>
      <form id="postCreateForm" style="margin-top:1.2rem;">
        <label>제목<input type="text" id="createTitle" required style="width:100%;padding:0.5rem;margin-top:0.2rem;margin-bottom:0.8rem;" maxlength="60"/></label>
        <label>내용<textarea id="createBody" required rows="6" style="width:100%;padding:0.5rem;margin-top:0.2rem;margin-bottom:0.8rem;" maxlength="2000"></textarea></label>
        <button type="submit" style="margin-top:1rem;">등록</button>
        <button type="button" id="cancelCreateBtn" style="margin-left:1rem;">취소</button>
        <div id="createError" style="color:#e01c1c;margin-top:0.9rem;"></div>
      </form>
    </div>
  `;
  document.getElementById('cancelCreateBtn').onclick = () => window.history.back();

  document.getElementById('postCreateForm').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('createTitle').value.trim();
    const body = document.getElementById('createBody').value.trim();
    const errorBox = document.getElementById('createError');
    errorBox.textContent = "";
    if (!title || !body) {
      errorBox.textContent = "제목과 내용을 모두 입력하세요.";
      return;
    }
    if (!currentUser) {
      errorBox.textContent = "로그인 후 작성 가능합니다.";
      return;
    }
    let nickname = "익명";
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) nickname = userDoc.data().nickname || "익명";
    } catch {}
    try {
      await addDoc(collection(db, "posts"), {
        title,
        body,
        authorUid: currentUser.uid,
        authorName: nickname,
        board: boardType || "free",
        created: serverTimestamp(),
        likes: 0
      });
      alert("게시글이 등록되었습니다!");
      window.location.reload();
    } catch (err) {
      errorBox.textContent = err.message.replace("Firebase:", "");
    }
  };
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
});

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('communityList')) {
    let sortType = 'latest';
    let boardType = getParamFromURL('board') || 'free';
    const idParam = getParamFromURL('id');
    if (idParam) {
      renderCommunityDetail(idParam);
    } else {
      renderCommunityList(sortType, boardType);
      updateCommunityTitle(boardType);
    }

    // 정렬 버튼
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        sortType = this.dataset.sort;
        renderCommunityList(sortType, boardType);
        updateCommunityTitle(boardType);
      });
    });

    // 드롭다운 메뉴
    const communityMenu = document.getElementById('communityMenu');
    if (communityMenu) {
      communityMenu.querySelectorAll('.submenu a').forEach(link => {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          const url = new URL(this.href);
          const newBoard = url.searchParams.get('board') || 'free';
          boardType = newBoard;
          window.history.pushState({}, '', url.pathname + url.search);
          renderCommunityList(sortType, boardType);
          updateCommunityTitle(boardType);
        });
      });
    }

    // 뒤로가기 지원
    window.addEventListener('popstate', function () {
      const idParam = getParamFromURL('id');
      boardType = getParamFromURL('board') || 'free';
      if (idParam) {
        renderCommunityDetail(idParam);
      } else {
        renderCommunityList(sortType, boardType);
        updateCommunityTitle(boardType);
      }
    });
  }
});
