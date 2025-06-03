// login.js: 회원가입/로그인/관리자, 이메일 인증, 비밀번호 재설정, UX 개선

const auth = firebase.auth();
const db = firebase.firestore();

const authForm = document.getElementById("authForm");
const toggleMode = document.getElementById("toggleMode");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const nicknameBox = document.getElementById("nicknameBox");
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");

// 관리자 이메일(운영자만 직접 지정, 예시)
const ADMIN_EMAILS = ["admin@ghosthell.com"];

let mode = "login"; // or "register" or "reset"

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
  } else if (mode === "register") {
    mode = "reset";
    formTitle.textContent = "비밀번호 재설정";
    submitBtn.textContent = "비밀번호 재설정 메일 발송";
    nicknameBox.style.display = "none";
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
      const userCred = await auth.signInWithEmailAndPassword(email, password);
      if (!userCred.user.emailVerified) {
        formError.textContent = "이메일 인증 후 로그인 가능합니다. 메일함을 확인하세요.";
        await auth.signOut();
        return;
      }
      formSuccess.textContent = "로그인 성공! 이동 중...";
      setTimeout(() => {
        window.location.href = prevUrl;
      }, 700);
    } catch (err) {
      formError.textContent = err.message.replace("Firebase:", "");
    }
  } else if (mode === "register") {
    const nickname = document.getElementById("nickname").value.trim();
    if (!nickname) {
      formError.textContent = "닉네임을 입력해주세요.";
      return;
    }
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      // Firestore에 닉네임/관리자 저장
      await db.collection("users").doc(user.uid).set({
        email: user.email,
        nickname: nickname,
        isAdmin: ADMIN_EMAILS.includes(user.email),
        createdAt: new Date()
      });
      // 이메일 인증 발송
      await user.sendEmailVerification();
      formSuccess.textContent = "회원가입 완료! 이메일 인증 후 로그인해주세요.";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      formError.textContent = err.message.replace("Firebase:", "");
    }
  } else if (mode === "reset") {
    if (!email) {
      formError.textContent = "이메일을 입력해주세요.";
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      formSuccess.textContent = "비밀번호 재설정 메일이 발송되었습니다.";
    } catch (err) {
      formError.textContent = err.message.replace("Firebase:", "");
    }
  }
};

// 인증 상태 유지시 바로 리다이렉트(이미 로그인된 경우)
auth.onAuthStateChanged((user) => {
  if (user && user.emailVerified) {
    setTimeout(() => {
      window.location.href = prevUrl;
    }, 400);
  }
});

// 추가: Enter로 모드 전환 가능
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Tab' || e.key === 'Enter') && document.activeElement === toggleMode) {
    toggleMode.click();
    e.preventDefault();
  }
});

// 이메일 인증 재발송(옵션)
window.resendEmailVerification = async function() {
  const email = document.getElementById("email").value.trim();
  if (!email) return alert("이메일 입력");
  try {
    const user = auth.currentUser;
    if (user) {
      await user.sendEmailVerification();
      alert("인증 메일을 재발송 했습니다.");
    }
  } catch (e) {
    alert("오류: " + e.message);
  }
};
