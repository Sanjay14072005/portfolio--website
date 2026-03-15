const typingText = document.getElementById("typingText");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const contactForm = document.getElementById("contactForm");
const contactFormMsg = document.getElementById("contactFormMsg");

const roles = [
  "AIML Engineer",
  "Software Developer",
  "Problem Solver"
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

function setContactMessage(text, type = "info") {
  if (!contactFormMsg) return;
  contactFormMsg.classList.remove("success", "error");
  if (type === "success") contactFormMsg.classList.add("success");
  if (type === "error") contactFormMsg.classList.add("error");
  contactFormMsg.textContent = text;
}

contactForm?.addEventListener("submit", (event) => {
  const nameField = contactForm.querySelector('input[name="name"]');
  const emailField = contactForm.querySelector('input[name="email"]');
  const messageField = contactForm.querySelector('textarea[name="message"]');
  const honeyField = contactForm.querySelector('input[name="_honey"]');
  const name = String(nameField?.value || "").trim();
  const email = String(emailField?.value || "").trim();
  const message = String(messageField?.value || "").trim();
  const honey = String(honeyField?.value || "").trim();

  if (!name || !email || !message) {
    event.preventDefault();
    setContactMessage("Please fill all fields.", "error");
    return;
  }

  if (honey) {
    event.preventDefault();
    setContactMessage("Message blocked.", "error");
  }
});
