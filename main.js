document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('menuContainer')) {
    fetch('menu.html')
      .then(response => response.text())
      .then(html => {
        document.getElementById('menuContainer').innerHTML = html;
        // 햄버거 메뉴 토글
        const menuToggle = document.querySelector('.menu-toggle');
        const sideMenu = document.getElementById('sideMenu');
        if(menuToggle && sideMenu){
          menuToggle.addEventListener('click', () => {
            sideMenu.style.display = sideMenu.style.display === 'flex' ? 'none' : 'flex';
          });
          document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetId = btn.dataset.target;
              const submenu = document.getElementById(targetId);
              const isOpen = submenu.style.display === 'flex';
              submenu.style.display = isOpen ? 'none' : 'flex';
              btn.textContent = isOpen ? '+' : '−';
            });
          });
        }
      });
  }

  // 괴담 메뉴 드롭다운 오래 보이게
  const menuLi = document.getElementById('urbanMenu');
  if (menuLi) {
    let submenu = menuLi.querySelector('.submenu');
    let dropdown = menuLi.querySelector('.dropdown');
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
