// main.js: 헤더에 로그인/회원가입/닉네임/이메일/비밀번호 입력 폼 직접 구현 (모달/폼 내장, 별도 페이지 없이 처리)
// 참고: community.html 방식의 DOM 조작/대응, Firebase 연동

document.addEventListener('DOMContentLoaded', function () {
  // ----- 드롭다운 메뉴 -----
  document.querySelectorAll('.dropdown').forEach(menu => {
    menu.addEventListener('mouseenter', function () {
      this.querySelector('.submenu').style.display = 'block';
    });
    menu.addEventListener('mouseleave', function () {
      this.querySelector('.submenu').style.display = 'none';
    });
  });

  // ----- BGM 토글 -----
  let bgmPlaying = false;
  let audio = document.getElementById('bgmAudio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'bgmAudio';
    audio.src = './bgm.mp3';
    audio.loop = true;
    document.body.appendChild(audio);
  }
  function updateBgmStatus() {
    document.getElementById('bgmStatus').textContent = bgmPlaying ? 'ON' : 'OFF';
  }
  const headerInner = document.querySelector('.header-inner');
  let btnWrapper = document.getElementById('bgmToggleContainer');
  if (!btnWrapper) {
    btnWrapper = document.createElement('div');
    btnWrapper.className = 'bgm-header-control';
    btnWrapper.id = 'bgmToggleContainer';
    headerInner.appendChild(btnWrapper);
  }
  btnWrapper.innerHTML = `
    <button id="bgmToggleBtn">🎵 <span id="bgmStatus">OFF</span></button>
    <button id="inlineLoginBtn">로그인</button>
    <button id="inlineSignUpBtn" style="display:none;">회원가입</button>
    <button id="inlineLogoutBtn" style="display:none;">로그아웃</button>
  `;
  document.getElementById('bgmToggleBtn').onclick = function () {
    if (bgmPlaying) {
      audio.pause();
      bgmPlaying = false;
    } else {
      audio.play();
      bgmPlaying = true;
    }
    updateBgmStatus();
  };
  updateBgmStatus();

  // ----- 헤더 인증 모달 -----
  if (!document.getElementById('headerAuthModal')) {
    const modal = document.createElement('div');
    modal.id = 'headerAuthModal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '60px';
    modal.style.right = '40px';
    modal.style.background = '#232323';
    modal.style.color = '#fafafa';
    modal.style.padding = '1.7rem 1.5rem 1.3rem 1.5rem';
    modal.style.borderRadius = '14px';
    modal.style.boxShadow = '0 4px 18px rgba(0,0,0,0.22)';
    modal.style.zIndex = 9999;
    document.body.appendChild(modal);
  }

  // ----- Firebase 연결 -----
  let auth = null, db = null;
  function waitForFirebaseAndSetup(cb, maxWait = 20) {
    if (window.firebase && window.firebase.auth && window.firebase.firestore) {
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      cb();
    } else if (maxWait <= 0) {
      alert("Firebase 로드 실패");
    } else {
      setTimeout(() => waitForFirebaseAndSetup(cb, maxWait - 1), 200);
    }
  }
  waitForFirebaseAndSetup(setupHeaderAuth);

  function setupHeaderAuth() {
    const loginBtn = document.getElementById('inlineLoginBtn');
    const signUpBtn = document.getElementById('inlineSignUpBtn');
    const logoutBtn = document.getElementById('inlineLogoutBtn');
    const modal = document.getElementById('headerAuthModal');

    // 인증 상태
    auth.onAuthStateChanged(function(user) {
      if (user) {
        loginBtn.style.display = "none";
        signUpBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
      } else {
        loginBtn.style.display = "inline-block";
        signUpBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
      }
    });

    // 로그인 폼
    function showLoginForm() {
      modal.innerHTML = `
        <div style="font-size:1.2rem;font-weight:600;margin-bottom:1rem;">로그인</div>
        <form id="headerLoginForm" autocomplete="on">
          <input type="email" id="headerLoginEmail" placeholder="이메일" required autocomplete="username"
            style="width:100%;margin-bottom:0.6rem;padding:0.6rem;border-radius:6px;border:1px solid #333;background:#181818;color:#fafafa;">
          <input type="password" id="headerLoginPw" placeholder="비밀번호" required autocomplete="current-password"
            style="width:100%;margin-bottom:0.8rem;padding:0.6rem;border-radius:6px;border:1px solid #333;background:#181818;color:#fafafa;">
          <button type="submit" style="width:100%;padding:0.7rem;background:#e01c1c;color:white;font-weight:bold;border:none;border-radius:8px;">로그인</button>
        </form>
        <div id="headerLoginError" style="color:#ff5959;margin-top:0.7rem;min-height:20px;"></div>
        <div style="margin-top:0.5rem;">
          <a href="#" id="moveSignUpFromLogin" style="color:#bbb;text-decoration:underline;">회원가입</a>
        </div>
      `;
      modal.style.display = 'block';

      // 폼 제출
      document.getElementById('headerLoginForm').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('headerLoginEmail').value.trim();
        const password = document.getElementById('headerLoginPw').value;
        const errorBox = document.getElementById('headerLoginError');
        errorBox.textContent = "";
        try {
          const userCred = await auth.signInWithEmailAndPassword(email, password);
          if (!userCred.user.emailVerified) {
            errorBox.textContent = "이메일 인증 후 로그인 가능합니다. 메일함 확인!";
            await auth.signOut();
            return;
          }
          modal.style.display = 'none';
          window.location.reload();
        } catch (err) {
          errorBox.textContent = err.message.replace("Firebase:", "");
        }
      };
      // 회원가입 이동
      document.getElementById('moveSignUpFromLogin').onclick = (e) => {
        e.preventDefault();
        showSignUpForm();
      };
    }

    // 회원가입 폼 (이메일, 비밀번호, 닉네임 입력)
    function showSignUpForm() {
      modal.innerHTML = `
        <div style="font-size:1.2rem;font-weight:600;margin-bottom:1rem;">회원가입</div>
        <form id="headerSignUpForm" autocomplete="on">
          <input type="email" id="headerSignUpEmail" placeholder="이메일" required autocomplete="username"
            style="width:100%;margin-bottom:0.6rem;padding:0.6rem;border-radius:6px;border:1px solid #333;background:#181818;color:#fafafa;">
          <input type="password" id="headerSignUpPw" placeholder="비밀번호" required autocomplete="new-password"
            style="width:100%;margin-bottom:0.6rem;padding:0.6rem;border-radius:6px;border:1px solid #333;background:#181818;color:#fafafa;">
          <input type="text" id="headerSignUpNick" placeholder="닉네임" required
            style="width:100%;margin-bottom:0.8rem;padding:0.6rem;border-radius:6px;border:1px solid #333;background:#181818;color:#fafafa;">
          <button type="submit" style="width:100%;padding:0.7rem;background:#e01c1c;color:white;font-weight:bold;border:none;border-radius:8px;">회원가입</button>
        </form>
        <div id="headerSignUpError" style="color:#ff5959;margin-top:0.7rem;min-height:20px;"></div>
        <div style="margin-top:0.5rem;">
          <a href="#" id="moveLoginFromSignUp" style="color:#bbb;text-decoration:underline;">로그인</a>
        </div>
      `;
      modal.style.display = 'block';

      document.getElementById('headerSignUpForm').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('headerSignUpEmail').value.trim();
        const password = document.getElementById('headerSignUpPw').value;
        const nickname = document.getElementById('headerSignUpNick').value.trim();
        const errorBox = document.getElementById('headerSignUpError');
        errorBox.textContent = "";
        if (!nickname) {
          errorBox.textContent = "닉네임을 입력해주세요.";
          return;
        }
        try {
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;
          await db.collection("users").doc(user.uid).set({
            email: user.email,
            nickname: nickname,
            isAdmin: false,
            createdAt: new Date()
          });
          await user.sendEmailVerification();
          errorBox.style.color = "#4caf50";
          errorBox.textContent = "회원가입 완료! 이메일 인증 후 로그인하세요.";
        } catch (err) {
          errorBox.textContent = err.message.replace("Firebase:", "");
        }
      };
      // 로그인 이동
      document.getElementById('moveLoginFromSignUp').onclick = (e) => {
        e.preventDefault();
        showLoginForm();
      };
    }

    // 로그인/회원가입 모달 열기
    loginBtn.onclick = () => {
      showLoginForm();
    };
    signUpBtn.onclick = () => {
      showSignUpForm();
    };
    // 로그아웃
    logoutBtn.onclick = async () => {
      await auth.signOut();
      window.location.reload();
    };
    // 모달 외부 클릭시 닫힘
    window.addEventListener('mousedown', (e) => {
      const modal = document.getElementById('headerAuthModal');
      if (!modal || modal.style.display === 'none') return;
      if (!modal.contains(e.target) && !loginBtn.contains(e.target) && !signUpBtn.contains(e.target)) {
        modal.style.display = 'none';
      }
    });
  }
});
