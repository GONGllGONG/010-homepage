// -----------------------------
// 1. 배경색 바꾸기 버튼 (이미 있던 기능)
// -----------------------------
const colorBtn = document.getElementById("colorToggle");
let isDark = false;

if (colorBtn) {
  colorBtn.addEventListener("click", () => {
    if (isDark) {
      document.body.style.background = "#f4f4f5"; // 밝은 배경
      document.body.style.color = "#111827";
      colorBtn.textContent = "다크모드로 변경";
    } else {
      document.body.style.background = "#111827"; // 어두운 배경
      document.body.style.color = "#f9fafb";
      colorBtn.textContent = "라이트모드로 변경";
    }
    isDark = !isDark;
  });
}

// -----------------------------
// 2. 메뉴 클릭하면 섹션으로 부드럽게 이동
// -----------------------------
const menuLinks = document.querySelectorAll("header nav a");
const nav = document.querySelector("header nav");
const menuToggle = document.getElementById("menuToggle");

menuLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const targetId = link.getAttribute("href").replace("#", "");
    const target = document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    // 모바일에서 메뉴 닫기
    if (nav) nav.classList.remove("open");
  });
});

// -----------------------------
// 3. 햄버거 버튼 클릭 시 메뉴 열고 닫기
// -----------------------------
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}
