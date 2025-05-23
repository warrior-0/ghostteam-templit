import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, orderBy, getDocs, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase 설정
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

export function initUrbanFirebase(postId) {
  // 댓글/좋아요 폼 요소
  const commentForm = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");
  const commentList = document.getElementById("commentList");
  const likeBtn = document.getElementById("likeBtn");
  const likeCount = document.getElementById("likeCount");

  // 이벤트 중복 방지
  if (!commentForm || !likeBtn) return;
  commentForm.onsubmit = null;
  likeBtn.onclick = null;

  // 댓글 불러오기
  async function loadComments() {
    try {
      const user = auth.currentUser;
      const commentsRef = collection(db, "posts", String(postId), "comments");
      const q = query(commentsRef, orderBy("timestamp", "asc"));
      const snapshot = await getDocs(q);
      commentList.innerHTML = "";
      snapshot.forEach(docSnap => {
        const c = docSnap.data();
        const li = document.createElement("li");
        li.innerHTML = `<strong>${c.authorname || "익명"}</strong>: ${c.comment}`;
        // 본인 댓글이면 수정/삭제 버튼
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
        commentList.appendChild(li);
      });
    } catch (err) {
      commentList.innerHTML = "<li>댓글을 불러오는 중 오류 발생</li>";
    }
  }

  // 댓글 수정
  function editComment(commentId, c) {
    const newComment = prompt("댓글을 수정하세요", c.comment);
    if (newComment !== null && newComment.trim() !== "") {
      const commentRef = doc(db, "posts", String(postId), "comments", commentId);
      setDoc(commentRef, { ...c, comment: newComment }, { merge: true })
        .then(() => {
          alert("댓글이 수정되었습니다.");
          loadComments();
        });
    }
  }

  // 댓글 삭제
  function deleteComment(commentId) {
    if (confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      const commentRef = doc(db, "posts", String(postId), "comments", commentId);
      deleteDoc(commentRef)
        .then(() => {
          alert("댓글이 삭제되었습니다.");
          loadComments();
        });
    }
  }

  // 좋아요 수 불러오기
  async function updateLikeCount() {
    try {
      const likesCol = collection(db, "posts", String(postId), "likes");
      const likesSnap = await getDocs(likesCol);
      likeCount.innerText = likesSnap.size;
    } catch (err) {
      likeCount.innerText = "오류";
    }
  }

  // 댓글 작성
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("로그인 후 댓글 작성 가능합니다.");
      return;
    }
    const comment = commentInput.value.trim();
    if (!comment) return alert("댓글을 입력하세요.");
    let nickname = "익명";
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) nickname = userDoc.data().nickname || "익명";
    } catch {}
    await addDoc(collection(db, "posts", String(postId), "comments"), {
      comment,
      authorname: nickname,
      uid: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    });
    commentInput.value = "";
    await loadComments();
  });

  // 좋아요 버튼
  likeBtn.addEventListener("click", async () => {
    if (!auth.currentUser) {
      alert("로그인 후 좋아요 가능합니다.");
      return;
    }
    const likeRef = doc(db, "posts", String(postId), "likes", auth.currentUser.uid);
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) {
      alert("이미 좋아요를 눌렀습니다.");
      return;
    }
    await setDoc(likeRef, { likedAt: serverTimestamp() });
    await updateLikeCount();
  });

  // 로그인 상태 바뀌면 댓글, 좋아요 다시 불러오기
  onAuthStateChanged(auth, () => {
    loadComments();
    updateLikeCount();
  });

  // 최초 로딩
  loadComments();
  updateLikeCount();
}
