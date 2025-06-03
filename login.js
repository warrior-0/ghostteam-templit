// login.js: 로그인/회원가입/리다이렉트
const firebaseConfig = {
  apiKey: "AIzaSyAjHwHbHlCi4vgv-Ma0-3kqt-M3SLI_oF4",
  authDomain: "ghost-38f07.firebaseapp.com",
  projectId: "ghost-38f07",
  storageBucket: "ghost-38f07.appspot.com",
  messagingSenderId: "776945022976",
  appId: "1:776945022976:web:105e545d39f12b5d0940e5",
  measurementId: "G-B758ZC971V"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


const authForm = document.getElementById("authForm");
const toggleMode = document.getElementById("toggleMode");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const nicknameBox = document.getElementById("nicknameBox");
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");

let mode = "login"; // or "register"

// 이전 페이지 기억
const prevUrl = sessionStorage.getItem("redirectAfterAuth") || "/";

// 모드 전환
toggleMode.onclick = function () {
  if (mode === "login") {
    mode = "register";
    formTitle.textContent = "회원가입";
    submitBtn.textContent = "회원가입";
    nicknameBox.style.display = "block";
    toggleMode.textContent = "로그인";
    formError.textContent = "";
    formSuccess.textContent = "";
  } else {
    mode = "login";
    formTitle.textContent = "로그인";
    submitBtn.textContent = "로그인";
    nicknameBox.style.display = "none";
    toggleMode.textContent = "회원가입";
    formError.textContent = "";
    formSuccess.textContent = "";
  }
};

authForm.onsubmit = async (e) => {
  e.preventDefault();
  formError.textContent = "";
  formSuccess.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (mode === "login") {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      formSuccess.textContent = "로그인 성공! 이동 중...";
      setTimeout(() => {
        window.location.href = prevUrl;
      }, 700);
    } catch (err) {
      formError.textContent = err.message.replace("Firebase:", "");
    }
  } else {
    const nickname = document.getElementById("nickname").value.trim();
    if (!nickname) {
      formError.textContent = "닉네임을 입력해주세요.";
      return;
    }
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await db.collection("users").doc(user.uid).set({
        email: user.email,
        nickname: nickname,
      });
      formSuccess.textContent = "회원가입 완료! 이동 중...";
      setTimeout(() => {
        window.location.href = prevUrl;
      }, 800);
    } catch (err) {
      formError.textContent = err.message.replace("Firebase:", "");
    }
  }
};

// 인증 상태 유지시 바로 리다이렉트(이미 로그인된 경우)
auth.onAuthStateChanged((user) => {
  if (user) {
    setTimeout(() => {
      window.location.href = prevUrl;
    }, 400);
  }
});
