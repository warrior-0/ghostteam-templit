// Firebase import 및 초기화 (community.html 참고)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config (community.html에서 복붙)
const firebaseConfig = {
  apiKey: "AIzaSyAjHwHbHlCi4vgv-Ma0-3kqt-M3SLI_oF4",
  authDomain: "ghost-38f07.firebaseapp.com",
  projectId: "ghost-38f07",
  storageBucket: "ghost-38f07.firebasestorage.app",
  messagingSenderId: "776945022976",
  appId: "1:776945022976:web:105e545d39f12b5d0940e5",
  measurementId: "G-B758ZC971V"
};
const app = initializeApp(firebaseConfig);

// 로그인 상태 감지 및 UI 업데이트
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// ...기존 코드...

const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// 로그인 상태에 따라 괴담 화면 노출/숨김
onAuthStateChanged(auth, user => {
  currentUser = user;
  const mainContent = document.getElementById("urban-main-content");
  const loginCover = document.getElementById("urban-login-cover");
  if (user) {
    if (mainContent) mainContent.style.display = "";
    if (loginCover) loginCover.style.display = "none";
  } else {
    if (mainContent) mainContent.style.display = "none";
    if (loginCover) loginCover.style.display = "";
  }
});

// 로그인/회원가입 버튼 이벤트 바인딩 (예시)
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("urban-login-btn");
  const signupBtn = document.getElementById("urban-signup-btn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      // 간단한 예시: prompt로 로그인 (실제 서비스는 모달/폼 권장)
      const email = prompt("이메일 입력");
      const pw = prompt("비밀번호 입력");
      if (email && pw) {
        signInWithEmailAndPassword(auth, email, pw)
          .catch(e => alert("로그인 실패: " + e.message));
      }
    };
  }
  if (signupBtn) {
    signupBtn.onclick = () => {
      const email = prompt("이메일 입력");
      const pw = prompt("비밀번호 입력(6자 이상)");
      if (email && pw) {
        createUserWithEmailAndPassword(auth, email, pw)
          .then(() => alert("회원가입 성공! 다시 로그인 해주세요."))
          .catch(e => alert("회원가입 실패: " + e.message));
      }
    };
  }
});

    // 회원가입
    async function signUp() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const nickname = document.getElementById("nickname").value.trim();

  if (!nickname) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에 닉네임 저장
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      nickname: nickname,
    });

    alert("회원가입 완료! 로그인되었습니다.");
  } catch (error) {
    alert("회원가입 오류: " + error.message);
  }
}


    // 로그인
    async function signIn() {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("로그인 성공!");
      } catch (error) {
        alert("로그인 오류: " + error.message);
      }
    }

    // 로그아웃
    async function signOutUser() {
      await signOut(auth);
      alert("로그아웃 되었습니다.");
    }
// 좋아요 수 + 유저가 눌렀는지 확인
async function updateUrbanLikeUI(postId) {
  // 좋아요 개수
  const q = query(collection(db, "urbanLikes"), where("postId", "==", postId));
  const snap = await getDocs(q);
  document.getElementById("urban-like-count").textContent = `좋아요 ${snap.size}개`;

  // 내가 눌렀는지
  let liked = false;
  if (currentUser) {
    const docId = postId + "_" + currentUser.uid;
    const docRef = doc(db, "urbanLikes", docId);
    const docSnap = await getDoc(docRef);
    liked = docSnap.exists();
  }
  document.getElementById("urban-like-btn").style.color = liked ? "red" : "#fafafa";
}

// 좋아요 클릭 핸들러
async function handleUrbanLike(postId) {
  if (!currentUser) {
    alert("로그인 후 좋아요를 누를 수 있습니다.");
    return;
  }
  const docId = postId + "_" + currentUser.uid;
  const docRef = doc(db, "urbanLikes", docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await deleteDoc(docRef); // 좋아요 취소
  } else {
    await setDoc(docRef, { postId, uid: currentUser.uid, timestamp: new Date() });
  }
  updateUrbanLikeUI(postId);
}

// 댓글 목록 불러오기
async function loadUrbanComments(postId) {
  const q = query(
    collection(db, "urbanComments"),
    where("postId", "==", postId),
    orderBy("timestamp", "asc")
  );
  const snap = await getDocs(q);
  const list = document.getElementById("urban-comment-list");
  list.innerHTML = "";
  snap.forEach(docu => {
    const data = docu.data();
    const li = document.createElement("li");
    li.innerHTML = `<strong>${data.authorname || "익명"}</strong>: ${data.comment}`;
    if (currentUser && data.uid === currentUser.uid) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "삭제";
      delBtn.onclick = async () => {
        if (confirm("댓글을 삭제하시겠습니까?")) {
          await deleteDoc(doc(db, "urbanComments", docu.id));
          loadUrbanComments(postId);
        }
      };
      li.appendChild(delBtn);
    }
    list.appendChild(li);
  });
}

// 댓글 작성
async function submitUrbanComment(postId) {
  if (!currentUser) {
    alert("로그인 후 댓글 작성이 가능합니다.");
    return;
  }
  const comment = document.getElementById("urban-comment-input").value.trim();
  if (!comment) {
    alert("댓글을 입력하세요.");
    return;
  }
  // 닉네임 불러오기
  let nickname = "익명";
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  if (userDoc.exists()) nickname = userDoc.data().nickname;
  await addDoc(collection(db, "urbanComments"), {
    postId,
    comment,
    uid: currentUser.uid,
    authorname: nickname,
    timestamp: new Date(),
  });
  document.getElementById("urban-comment-input").value = "";
  loadUrbanComments(postId);
}
