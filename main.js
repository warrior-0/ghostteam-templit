// ✅ main.js: 드롭다운 메뉴 + 홈 슬라이더 + 헤더 bgm/로그인·로그아웃 버튼 (로그인만 기본, 상태에 따라 로그아웃으로 토글)

document.addEventListener('DOMContentLoaded', function () {
  // ----------- 드롭다운 메뉴 -----------
  function setupDropdownMenus() {
    ['urbanMenu', 'communityMenu', 'aboutMenu'].forEach(menuId => {
      const menuLi = document.getElementById(menuId);
      if (menuLi) {
        const submenu = menuLi.querySelector('.submenu');
        const dropdown = menuLi.querySelector('.dropdown');
        let closeTimer = null;

        function openMenu() {
          clearTimeout(closeTimer);
          menuLi.classList.add('show-submenu');
          if (dropdown) dropdown.classList.add('open');
        }

        function closeMenu() {
          closeTimer = setTimeout(() => {
            menuLi.classList.remove('show-submenu');
            if (dropdown) dropdown.classList.remove('open');
          }, 350);
        }

        if (dropdown && submenu) {
          dropdown.addEventListener('mouseenter', openMenu);
          dropdown.addEventListener('focus', openMenu);
          menuLi.addEventListener('mouseleave', closeMenu);
          menuLi.addEventListener('mouseenter', openMenu);
          submenu.addEventListener('mouseenter', openMenu);
          submenu.addEventListener('mouseleave', closeMenu);
          dropdown.addEventListener('blur', closeMenu);
        }
      }
    });
  }

  setupDropdownMenus();

  // ----------- 홈 인기 괴담 슬라이더 -----------
  // ... (생략: urbanData 및 슬라이더 코드) ...

  // ----------- 헤더 BGM/로그인·로그아웃 버튼 추가(로그인만 기본, 상태에 따라 로그아웃) -----------
  if (!document.getElementById('bgmAudio')) {
    const audioEl = document.createElement('audio');
    audioEl.id = 'bgmAudio';
    audioEl.loop = true;
    audioEl.innerHTML = `<source src="bgm.mp3" type="audio/mpeg">브라우저가 오디오를 지원하지 않습니다.`;
    document.body.appendChild(audioEl);
  }

  // 항상 버튼을 새로 그리기
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
    <button id="loginLogoutBtn">로그인</button>
  `;

  // BGM 제어
  const bgmBtn = document.getElementById('bgmToggleBtn');
  const bgmAudio = document.getElementById('bgmAudio');
  const bgmStatus = document.getElementById('bgmStatus');
  if (bgmBtn && bgmAudio && bgmStatus) {
    let isPlaying = localStorage.getItem('bgmStatus') === 'on';
    function updateState(play) {
      if (play) {
        bgmAudio.play().catch(() => {});
        bgmStatus.textContent = 'ON';
        localStorage.setItem('bgmStatus', 'on');
      } else {
        bgmAudio.pause();
        bgmStatus.textContent = 'OFF';
        localStorage.setItem('bgmStatus', 'off');
      }
    }
    updateState(isPlaying);
    bgmBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      updateState(isPlaying);
    });
  }

  // ----------- 로그인/로그아웃 버튼 동작 + firebase 인증 상태 반영 -----------
  function setupAuthButton() {
    let firebaseAuth = null;
    if (window.firebase && window.firebase.auth) {
      firebaseAuth = window.firebase.auth();
    } else if (window.firebase && window.firebase.default && window.firebase.default.auth) {
      firebaseAuth = window.firebase.default.auth();
    } else {
      return; // firebase가 없으면 종료
    }

    const loginLogoutBtn = document.getElementById('loginLogoutBtn');

    // 버튼 동작
    function setLoginMode() {
      loginLogoutBtn.textContent = "로그인";
      loginLogoutBtn.onclick = function () {
        sessionStorage.setItem("redirectAfterAuth", window.location.pathname + window.location.search);
        window.location.href = "login.html";
      };
    }
    function setLogoutMode() {
      loginLogoutBtn.textContent = "로그아웃";
      loginLogoutBtn.onclick = function () {
        firebaseAuth.signOut().then(() => {
          alert("로그아웃 되었습니다.");
          // 새로고침 또는 상태 반영
          window.location.reload();
        });
      };
    }

    // 인증 상태 감지
    firebaseAuth.onAuthStateChanged(function(user) {
      if (user) {
        setLogoutMode();
      } else {
        setLoginMode();
      }
    });
  }

  // firebase-app.js, firebase-auth.js가 window에 올라올 때까지 대기 후 실행
  function waitForFirebaseAndSetup(cb, maxWait = 20) {
    if ((window.firebase && window.firebase.auth) || maxWait <= 0) {
      cb();
    } else {
      setTimeout(() => waitForFirebaseAndSetup(cb, maxWait - 1), 200);
    }
  }
  waitForFirebaseAndSetup(setupAuthButton);
});
