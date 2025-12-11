// -----------------------------
// 1. 배경색 바꾸기 버튼
// -----------------------------
const colorBtn = document.getElementById("colorToggle");
let isDark = false;

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


// -----------------------------
// 2. 메뉴 클릭하면 해당 섹션으로 부드럽게 이동
// -----------------------------
const menuLinks = document.querySelectorAll("header nav a");

menuLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault(); // 기본 동작 막기 (페이지 튀는 것 방지)

    const targetId = link.getAttribute("href").replace("#", "");
    const target = document.getElementById(targetId);

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});
