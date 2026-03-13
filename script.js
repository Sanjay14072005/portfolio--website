const typingText = document.getElementById("typingText");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

const roles = [
  "Full Stack AI Developer",
  "Machine Learning Engineer",
  "Cloud + Automation Builder"
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeLoop() {
  const currentRole = roles[roleIndex];
  const visible = currentRole.slice(0, charIndex);
  typingText.textContent = visible;

  if (!isDeleting) {
    charIndex += 1;
    if (charIndex > currentRole.length) {
      isDeleting = true;
      setTimeout(typeLoop, 1200);
      return;
    }
  } else {
    charIndex -= 1;
    if (charIndex < 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      charIndex = 0;
    }
  }

  const speed = isDeleting ? 45 : 85;
  setTimeout(typeLoop, speed);
}

typeLoop();

menuToggle?.addEventListener("click", () => {
  navLinks?.classList.toggle("open");
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});
