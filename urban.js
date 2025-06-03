// urban.js: Firestore 기반 괴담 CRUD 및 상세/댓글/좋아요/신고/관리자
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
function renderLevelStars(level) {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}

// Firestore에서 괴담 목록
async function fetchUrbanPosts(sortType, filterType) {
  let q = collection(db, "urban");
  let constraints = [];
  if (filterType && filterType !== "all") {
    constraints.push(where("filter", "==", filterType));
  }
  if (sortType === "latest") {
    constraints.push(orderBy("created", "desc"));
  } else if (sortType === "popular") {
    constraints.push(orderBy("likes", "desc"));
  } else if (sortType === "level") {
    constraints.push(orderBy("level", "desc"));
  }
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function renderUrbanList(sortType, filterType) {
  const list = await fetchUrbanPosts(sortType, filterType);
  const urbanList = document.getElementById('urbanList');
  if (list.length === 0) {
    urbanList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">등록된 괴담이 없습니다.</div>`;
  } else {
    urbanList.innerHTML =
      list.map(item => `
        <div class="urban-item" data-id="${item.id}" style="cursor:pointer;">
          <div class="urban-item-title">${item.title}</div>
          <div class="urban-item-meta">
            <span>좋아요 ${item.likes || 0}개</span>
            <span>${item.created?.toDate ? item.created.toDate().toISOString().slice(0, 10) : ''}</span>
            <span>공포 난이도: <span class="level-stars">${renderLevelStars(item.level)}</span></span>
            ${item.isAdminPost ? `<span style="color:#e01c1c;">[운영자]</span>` : ''}
          </div>
          <div class="urban-item-body">${item.body}</div>
        </div>
      `).join('');
    document.querySelectorAll('.urban-item').forEach(itemElem => {
      itemElem.addEventListener('click', function () {
        const clickId = this.getAttribute('data-id');
        window.history.pushState({}, '', `?id=${clickId}`);
        renderUrbanDetail(clickId);
      });
    });
  }
}

// 상세
async function renderUrbanDetail(postId) {
  const urbanList = document.getElementById('urbanList');
  const ref = doc(db, "urban", postId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : null;
  if (!data) {
    urbanList.innerHTML = `<div style="color:#bbb; padding:2rem 0;">괴담을 찾을 수 없습니다.</div>`;
    updateUrbanTitle('괴담 모음');
    return;
  }
  // 관리 권한
  let canEdit = currentUser && (currentUser.uid === data.authorUid || isAdmin);

  urbanList.innerHTML = `
    <div class="urban-item urban-detail">
      <div class="urban-item-title" style="font-size:1.5rem;">${data.title}</div>
      <div class="urban-item-meta">
        <span>좋아요 <span id="likeCount">${data.likes || 0}</span>개</span>
        <button id="likeBtn">👍 좋아요</button>
        <button id="reportBtn" style="margin-left:10px;">🚨 신고</button>
        <span style="margin-left:16px;">${data.created?.toDate ? data.created.toDate().toISOString().slice(0, 10) : ''}</span>
        <span style="margin-left:16px;">공포 난이도: <span class="level-stars">${renderLevelStars(data.level)}</span></span>
        ${data.isAdminPost ? `<span style="color:#e01c1c;">[운영자]</span>` : ''}
      </div>
      <div class="urban-item-body" style="margin-top:1.5rem; font-size:1.1rem; line-height:1.7;">${data.detail || data.body}</div>
      ${canEdit ? `<button id="editBtn">수정</button><button id="deleteBtn" style="margin-left:10px;">삭제</button>` : ""}
      <form id="commentForm" style="margin-top:2rem; display:flex; gap:0.5rem;">
        <input id="commentInput" type="text" placeholder="댓글 입력" style="flex:1; padding:0.6rem;" required />
        <button type="submit">댓글 작성</button>
      </form>
      <ul id="commentList" style="margin-top:1rem; padding-left:0; list-style:none;"></ul>
      <button class="urban-back-btn" style="margin-top:2rem; background:#222;color:#fafafa;border:none;padding:0.7rem 1.6rem;border-radius:8px;cursor:pointer;">목록으로</button>
    </div>
  `;
  document.querySelector('.urban-back-btn').addEventListener('click', function () {
    window.history.back();
  });

  // 좋아요
  document.getElementById("likeBtn").onclick = async () => {
    if (!currentUser) return alert("로그인 필요");
    const likeRef = doc(db, "urban", postId, "likes", currentUser.uid);
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) return alert("이미 좋아요를 누름");
    await setDoc(likeRef, { likedAt: serverTimestamp() });
    await setDoc(ref, { likes: (data.likes || 0) + 1 }, { merge: true });
    document.getElementById("likeCount").innerText = (data.likes || 0) + 1;
  };
  // 신고
  document.getElementById("reportBtn").onclick = async () => {
    if (!currentUser) return alert("로그인 필요");
    const reason = prompt("신고 사유를 입력하세요.");
    if (!reason) return;
    await addDoc(collection(db, "reports"), {
      type: "post",
      targetId: postId,
      targetType: "urban",
      reason,
      reporterUid: currentUser.uid,
      reportedAt: serverTimestamp()
    });
    alert("신고가 접수되었습니다.");
  };
  // 수정/삭제
  if (canEdit) {
    document.getElementById("editBtn").onclick = async () => {
      const newTitle = prompt("새 제목", data.title);
      const newDetail = prompt("새 내용", data.detail || data.body);
      const newLevel = parseInt(prompt("새 난이도(1~5)", data.level), 10);
      if (newTitle && newDetail && newLevel) {
        await setDoc(ref, { ...data, title: newTitle, detail: newDetail, level: newLevel, updated: serverTimestamp() });
        alert("수정 완료"); renderUrbanDetail(postId);
      }
    };
    document.getElementById("deleteBtn").onclick = async () => {
      if (confirm("정말로 삭제하시겠습니까?")) {
        await deleteDoc(ref);
        alert("삭제 완료"); window.history.back();
      }
    };
  }
  // 댓글
  const commentForm = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");
  const commentList = document.getElementById("commentList");
  async function loadComments() {
    const q = query(collection(db, "urban", postId, "comments"), orderBy("created", "asc"));
    const snap = await getDocs(q);
    commentList.innerHTML = "";
    snap.forEach(docSnap => {
      const c = docSnap.data();
      const li = document.createElement("li");
      li.innerHTML = `<strong>${c.authorName || "익명"}</strong>: ${c.comment}`;
      if (currentUser && (c.authorUid === currentUser.uid || isAdmin)) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "수정";
        editBtn.onclick = async () => {
          const newComment = prompt("댓글 수정", c.comment);
          if (newComment) {
            const cref = doc(db, "urban", postId, "comments", docSnap.id);
            await setDoc(cref, { ...c, comment: newComment }, { merge: true });
            alert("수정 완료"); loadComments();
          }
        };
        li.appendChild(editBtn);
        const delBtn = document.createElement("button");
        delBtn.textContent = "삭제";
        delBtn.onclick = async () => {
          if (confirm("정말로 삭제?")) {
            const cref = doc(db, "urban", postId, "comments", docSnap.id);
            await deleteDoc(cref);
            alert("삭제 완료"); loadComments();
          }
        };
        li.appendChild(delBtn);
      }
      // 신고
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
          targetType: "urban",
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
    await addDoc(collection(db, "urban", postId, "comments"), {
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

async function createUrbanPost(filter) {
  if (!currentUser) return alert("로그인 후 작성");
  const title = prompt("제목을 입력하세요.");
  const detail = prompt("내용을 입력하세요.");
  const level = parseInt(prompt("공포 난이도(1~5)"), 10);
  if (!title || !detail || isNaN(level)) return;
  let nickname = "익명";
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) nickname = userDoc.data().nickname || "익명";
  } catch { }
  await addDoc(collection(db, "urban"), {
    title,
    body: detail,
    detail,
    authorUid: currentUser.uid,
    authorName: nickname,
    isAdminPost: isAdmin,
    created: serverTimestamp(),
    filter: filter || "korea",
    level: level,
    likes: 0
  });
  alert("등록 완료"); location.reload();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  isAdmin = false;
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().isAdmin) isAdmin = true;
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('urbanList')) {
    let sortType = 'latest';
    let filterType = getParamFromURL('filter') || 'all';
    const idParam = getParamFromURL('id');
    if (idParam) {
      renderUrbanDetail(idParam);
    } else {
      renderUrbanList(sortType, filterType);
      updateUrbanTitle(filterType);
    }
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        sortType = this.dataset.sort;
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      });
    });
    document.querySelectorAll('.submenu a').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const url = new URL(this.href);
        const newFilter = url.searchParams.get('filter') || 'all';
        filterType = newFilter;
        window.history.pushState({}, '', url.pathname + url.search);
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      });
    });
    window.addEventListener('popstate', function () {
      const idParam = getParamFromURL('id');
      filterType = getParamFromURL('filter') || 'all';
      if (idParam) {
        renderUrbanDetail(idParam);
      } else {
        renderUrbanList(sortType, filterType);
        updateUrbanTitle(filterType);
      }
    });

    // 게시글 등록 버튼 예시 (페이지에 직접 추가 필요)
    /*
    document.getElementById('newUrbanBtn').onclick = () => {
      createUrbanPost(filterType);
    };
    */
  }
});
