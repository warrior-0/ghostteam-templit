// Firestore 연동 커뮤니티 게시판 CRUD 완전체 예시

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, where, serverTimestamp
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
let isAdmin = false;

// 게시판 타입별 한글명
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

// Firestore에서 게시글 불러오기
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

// 게시글 렌더링
async function renderCommunityList(sortType, boardType) {
  const list = await fetchCommunityPosts(sortType, boardType);
  const communityList = document.getElementById('communityList');
  if (list.length === 0) {
    communityList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">등록된 게시글이 없습니다.</div>`;
  } else {
    communityList.innerHTML =
      list.map(item => `
        <div class="community-item" data-id="${item.id}" style="cursor:pointer;">
          <div class="community-item-title">${item.title}</div>
          <div class="community-item-meta">
            <span>좋아요 ${item.likes || 0}개</span>
            <span>${item.created?.toDate ? item.created.toDate().toISOString().slice(0, 10) : ''}</span>
            <span>${boardTitles[item.board]}</span>
            ${item.isAdminPost ? `<span style="color:#e01c1c;">[운영자]</span>` : ''}
          </div>
          <div class="community-item-body">${item.body}</div>
        </div>
      `).join('');

    // 클릭이벤트(상세)
    document.querySelectorAll('.community-item').forEach(itemElem => {
      itemElem.addEventListener('click', function () {
        const clickId = this.getAttribute('data-id');
        window.history.pushState({}, '', `?id=${clickId}`);
        renderCommunityDetail(clickId);
      });
    });
  }
}

// 상세 보기
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

  // 관리/삭제 권한
  let canEdit = currentUser && (currentUser.uid === data.authorUid || isAdmin);

  communityList.innerHTML = `
    <div class="community-item community-detail">
      <div class="community-item-title" style="font-size:1.5rem;">${data.title}</div>
      <div class="community-item-meta">
        <span>좋아요 <span id="likeCount">${data.likes || 0}</span>개</span>
        <button id="likeBtn">👍 좋아요</button>
        <button id="reportBtn" style="margin-left:10px;">🚨 신고</button>
        <span style="margin-left:16px;">${data.created?.toDate ? data.created.toDate().toISOString().slice(0, 10) : ''}</span>
        <span style="margin-left:16px;">${boardTitles[data.board]}</span>
        ${data.isAdminPost ? `<span style="color:#e01c1c;">[운영자]</span>` : ''}
      </div>
      <div class="community-item-body" style="margin-top:1.5rem; font-size:1.1rem; line-height:1.7;">${data.body}</div>
      ${canEdit ? `<button id="editBtn">수정</button><button id="deleteBtn" style="margin-left:10px;">삭제</button>` : ""}
      <form id="commentForm" style="margin-top:2rem; display:flex; gap:0.5rem;">
        <input id="commentInput" type="text" placeholder="댓글 입력" style="flex:1; padding:0.6rem;" required />
        <button type="submit">댓글 작성</button>
      </form>
      <ul id="commentList" style="margin-top:1rem; padding-left:0; list-style:none;"></ul>
      <button class="community-back-btn" style="margin-top:2rem; background:#222;color:#fafafa;border:none;padding:0.7rem 1.6rem;border-radius:8px;cursor:pointer;">목록으로</button>
    </div>
  `;
  document.querySelector('.community-back-btn').addEventListener('click', function () {
    window.history.back();
  });

  // 좋아요 버튼
  document.getElementById("likeBtn").onclick = async () => {
    if (!currentUser) return alert("로그인 필요");
    const likeRef = doc(db, "posts", postId, "likes", currentUser.uid);
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) return alert("이미 좋아요를 누름");
    await setDoc(likeRef, { likedAt: serverTimestamp() });
    await setDoc(ref, { likes: (data.likes || 0) + 1 }, { merge: true });
    document.getElementById("likeCount").innerText = (data.likes || 0) + 1;
  };

  // 신고 버튼
  document.getElementById("reportBtn").onclick = async () => {
    if (!currentUser) return alert("로그인 필요");
    const reason = prompt("신고 사유를 입력하세요.");
    if (!reason) return;
    await addDoc(collection(db, "reports"), {
      type: "post",
      targetId: postId,
      targetType: "community",
      reason,
      reporterUid: currentUser.uid,
      reportedAt: serverTimestamp()
    });
    alert("신고가 접수되었습니다.");
  };

  // 수정/삭제 버튼
  if (canEdit) {
    document.getElementById("editBtn").onclick = async () => {
      const newTitle = prompt("새 제목", data.title);
      const newBody = prompt("새 내용", data.body);
      if (newTitle && newBody) {
        await setDoc(ref, { ...data, title: newTitle, body: newBody, updated: serverTimestamp() });
        alert("수정 완료");
        renderCommunityDetail(postId);
      }
    };
    document.getElementById("deleteBtn").onclick = async () => {
      if (confirm("정말로 삭제하시겠습니까?")) {
        await deleteDoc(ref);
        alert("삭제 완료");
        window.history.back();
      }
    };
  }
  // 댓글
  const commentForm = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");
  const commentList = document.getElementById("commentList");
  async function loadComments() {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("created", "asc"));
    const snap = await getDocs(q);
    commentList.innerHTML = "";
    snap.forEach(docSnap => {
      const c = docSnap.data();
      const li = document.createElement("li");
      li.innerHTML = `<strong>${c.authorName || "익명"}</strong>: ${c.comment}`;
      // 본인/관리자만 수정/삭제
      if (currentUser && (c.authorUid === currentUser.uid || isAdmin)) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "수정";
        editBtn.onclick = async () => {
          const newComment = prompt("댓글 수정", c.comment);
          if (newComment) {
            const cref = doc(db, "posts", postId, "comments", docSnap.id);
            await setDoc(cref, { ...c, comment: newComment }, { merge: true });
            alert("수정 완료"); loadComments();
          }
        };
        li.appendChild(editBtn);
        const delBtn = document.createElement("button");
        delBtn.textContent = "삭제";
        delBtn.onclick = async () => {
          if (confirm("정말로 삭제?")) {
            const cref = doc(db, "posts", postId, "comments", docSnap.id);
            await deleteDoc(cref);
            alert("삭제 완료"); loadComments();
          }
        };
        li.appendChild(delBtn);
      }
      // 신고 버튼
      const reportBtn = document.createElement("button");
      reportBtn.textContent = "🚨";
      reportBtn.onclick = async () => {
        if (!currentUser) return alert("로그인 필요");
        const reason = prompt("신고 사유를 입력하세요.");
        if (!reason) return;
        await addDoc(collection(db, "reports"), {
          type: "comment",
          targetId: docSnap.id,
          postId,
          targetType: "community",
          reason,
          reporterUid: currentUser.uid,
          reportedAt: serverTimestamp()
        });
        alert("신고가 접수됨");
      };
      li.appendChild(reportBtn);

      commentList.appendChild(li);
    });
  }
  commentForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("로그인 필요");
    const comment = commentInput.value.trim();
    if (!comment) return;
    let nickname = "익명";
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) nickname = userDoc.data().nickname || "익명";
    } catch { }
    await addDoc(collection(db, "posts", postId, "comments"), {
      comment,
      authorName: nickname,
      authorUid: currentUser.uid,
      created: serverTimestamp(),
    });
    commentInput.value = "";
    await loadComments();
  };
  await loadComments();
}

// 게시글 작성
async function createCommunityPost(boardType) {
  if (!currentUser) return alert("로그인 후 작성");
  const title = prompt("제목을 입력하세요.");
  const body = prompt("내용을 입력하세요.");
  if (!title || !body) return;
  let nickname = "익명";
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) nickname = userDoc.data().nickname || "익명";
  } catch { }
  await addDoc(collection(db, "posts"), {
    title,
    body,
    authorUid: currentUser.uid,
    authorName: nickname,
    isAdminPost: isAdmin,
    created: serverTimestamp(),
    board: boardType || "free",
    likes: 0
  });
  alert("등록 완료"); location.reload();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  isAdmin = false;
  if (user) {
    // 관리자 권한 체크
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().isAdmin) isAdmin = true;
  }
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

    // 게시글 작성 버튼 예시(페이지에 추가 필요)
    /*
    document.getElementById('newPostBtn').onclick = () => {
      createCommunityPost(boardType);
    };
    */
  }
});
