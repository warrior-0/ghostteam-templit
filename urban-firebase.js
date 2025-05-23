import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

if (!postId) {
  document.getElementById("postTitle").innerText = "글 ID가 없습니다.";
  throw new Error("No postId in URL");
}

async function loadPost() {
  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const data = postSnap.data();
      document.getElementById("postTitle").innerText = data.title || "(제목 없음)";
      document.getElementById("postContent").innerText = data.content || "(내용 없음)";
    } else {
      document.getElementById("postTitle").innerText = "존재하지 않는 게시글입니다.";
      document.getElementById("postContent").innerText = "";
    }
  } catch (err) {
    document.getElementById("postTitle").innerText = "오류 발생!";
    document.getElementById("postContent").innerText = err.message;
  }
}

async function loadComments() {
  try {
    // 항상 최신 로그인 상태의 유저 정보를 사용해야 함
    const user = auth.currentUser;
    const commentsRef = collection(db, "posts", postId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "asc"));
    const snapshot = await getDocs(q);
    const list = document.getElementById("commentList");
    list.innerHTML = "";
    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      const li = document.createElement("li");
      li.innerHTML = `<strong>${c.authorname || "익명"}</strong>: ${c.comment}`;
      // 본인 댓글이면 수정/삭제 버튼 추가
      if (user && c.uid === user.uid) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "수정";
        editBtn.className = "comment-action-btn";
        editBtn.onclick = () => editComment(docSnap.id, c);
        li.appendChild(editBtn);

        const delBtn = document.createElement("button");
        delBtn.textContent = "삭제";
        delBtn.className = "comment-action-btn";
        delBtn.onclick = () => deleteComment(docSnap.id);
        li.appendChild(delBtn);
      }
      list.appendChild(li);
    });
  } catch (err) {
    document.getElementById("commentList").innerHTML = "<li>댓글을 불러오는 중 오류 발생</li>";
  }
}

// 댓글 수정 함수
function editComment(commentId, c) {
  const newComment = prompt("댓글을 수정하세요", c.comment);
  if (newComment !== null && newComment.trim() !== "") {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    setDoc(commentRef, { ...c, comment: newComment }, { merge: true })
      .then(() => {
        alert("댓글이 수정되었습니다.");
        loadComments();
      });
  }
}

// 댓글 삭제 함수
function deleteComment(commentId) {
  if (confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    deleteDoc(commentRef)
      .then(() => {
        alert("댓글이 삭제되었습니다.");
        loadComments();
      });
  }
}

async function updateLikeCount() {
  try {
    const likesCol = collection(db, "posts", postId, "likes");
    const likesSnap = await getDocs(likesCol);
    document.getElementById("likeCount").innerText = likesSnap.size;
  } catch (err) {
    document.getElementById("likeCount").innerText = "오류";
  }
}

// 댓글/좋아요 등록 이벤트 내부 예시 (onAuthStateChanged 내부)
document.getElementById("commentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth.currentUser) {
    alert("로그인 후 댓글 작성 가능합니다.");
    return;
  }
  const comment = document.getElementById("commentInput").value.trim();
  if (!comment) return alert("댓글을 입력하세요.");

  // 닉네임 가져오기 (생략 시 "익명")
  let nickname = "익명";
  try {
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userDoc.exists()) nickname = userDoc.data().nickname || "익명";
  } catch {}

  await addDoc(collection(db, "posts", postId, "comments"), {
    comment,
    authorname: nickname,
    uid: auth.currentUser.uid,
    timestamp: serverTimestamp(),
  });
  document.getElementById("commentInput").value = "";
  await loadComments();
});

document.getElementById("likeBtn").addEventListener("click", async () => {
  if (!auth.currentUser) {
    alert("로그인 후 좋아요 가능합니다.");
    return;
  }
  const likeRef = doc(db, "posts", postId, "likes", auth.currentUser.uid);
  const likeSnap = await getDoc(likeRef);
  if (likeSnap.exists()) {
    alert("이미 좋아요를 눌렀습니다.");
    return;
  }
  await setDoc(likeRef, { likedAt: serverTimestamp() });
  await updateLikeCount();
});

// 아래처럼 onAuthStateChanged 사용
onAuthStateChanged(auth, (user) => {
  document.getElementById("commentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!user) {
      alert("로그인 후 댓글 작성 가능합니다.");
      return;
    }
    // ... 이하 생략
  });

  document.getElementById("likeBtn").addEventListener("click", async () => {
    if (!user) {
      alert("로그인 후 좋아요 가능합니다.");
      return;
    }
  });
});

// 페이지 로딩 시 데이터 불러오기
window.onload = async () => {
  await loadPost();
  await loadComments();
  await updateLikeCount();
};
