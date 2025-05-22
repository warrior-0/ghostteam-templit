document.addEventListener('DOMContentLoaded', function() {

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
