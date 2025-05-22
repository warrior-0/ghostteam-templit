// Firebase import 및 초기화 (community.html 참고)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
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
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
// 로그인 상태 감지 및 UI 업데이트
    onAuthStateChanged(auth, (user) => {

      currentUser = user;
      if (user) {
        document.getElementById("userStatus").innerText = `로그인: ${user.email}`;
        document.getElementById("authSection").style.display = "none";
        document.getElementById("postSection").style.display = "block";
        loadPosts();
        loadComments();
        calculateAverageRating();
      } else {
        document.getElementById("userStatus").innerText = "로그인 필요";
        document.getElementById("authSection").style.display = "block";
        document.getElementById("postSection").style.display = "none";
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
