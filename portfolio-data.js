(function () {
  const store = window.PortfolioStore;
  const skillsContainer = document.getElementById("skillsContainer");
  const projectsContainer = document.getElementById("projectsContainer");
  const certificatesContainer = document.getElementById("certificatesContainer");
  const achievementsContainer = document.getElementById("achievementsContainer");
  const interestsContainer = document.getElementById("interestsContainer");
  const tones = ["tone-cyan", "tone-violet", "tone-teal", "tone-amber"];

  if (!store) {
    const message = "Data module failed to load. Press Ctrl+F5 and retry.";
    renderError(skillsContainer, message);
    renderError(projectsContainer, message);
    renderError(certificatesContainer, message);
    renderError(achievementsContainer, message);
    renderError(interestsContainer, message);
    return;
  }

  function normalizeTags(raw) {
    if (Array.isArray(raw)) {
      return raw.map((tag) => String(tag || "").trim()).filter(Boolean);
    }

    return String(raw || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function createTag(tagText) {
    const item = document.createElement("span");
    item.textContent = tagText;
    return item;
  }

  function renderError(container, message) {
    if (!container) return;
    container.innerHTML = "";
    const error = document.createElement("p");
    error.className = "empty-state";
    error.textContent = message;
    container.appendChild(error);
  }

  function renderSkills(skills) {
    if (!skillsContainer) return;
    skillsContainer.innerHTML = "";

    if (!skills.length) {
      renderError(skillsContainer, "No skills added yet.");
      return;
    }

    skills.forEach((skill, index) => {
      const card = document.createElement("article");
      card.className = `skill-planet ${tones[index % tones.length]}`;

      const title = document.createElement("h3");
      title.textContent = skill.category || "Skill Category";

      const tagsWrap = document.createElement("div");
      tagsWrap.className = "skill-tag-row";
      normalizeTags(skill.tags).forEach((tag) => tagsWrap.appendChild(createTag(tag)));

      card.append(title, tagsWrap);
      skillsContainer.appendChild(card);
    });
  }

  function renderProjects(projects) {
    if (!projectsContainer) return;
    projectsContainer.innerHTML = "";

    if (!projects.length) {
      renderError(projectsContainer, "No projects added yet.");
      return;
    }

    projects.forEach((project) => {
      const card = document.createElement("article");

      if (project.image) {
        const media = document.createElement("img");
        media.className = "card-media";
        media.src = project.image;
        media.alt = project.title || "Project image";
        card.appendChild(media);
      }

      const title = document.createElement("h3");
      title.textContent = project.title || "Untitled Project";

      const description = document.createElement("p");
      description.textContent = project.description || "No project description.";

      card.append(title, description);

      if (project.stack) {
        const stack = document.createElement("p");
        stack.className = "meta-text";
        stack.textContent = `Stack: ${project.stack}`;
        card.appendChild(stack);
      }

      if (project.link) {
        const link = document.createElement("a");
        link.href = project.link;
        link.className = "meta-link";
        link.textContent = "View Link";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.appendChild(link);
      }

      projectsContainer.appendChild(card);
    });
  }

  function renderCertificates(certificates) {
    if (!certificatesContainer) return;
    certificatesContainer.innerHTML = "";

    if (!certificates.length) {
      renderError(certificatesContainer, "No certificates added yet.");
      return;
    }

    certificates.forEach((certificate) => {
      const card = document.createElement("article");
      card.className = "certificate-card";

      if (certificate.image) {
        const media = document.createElement("img");
        media.className = "certificate-media";
        media.src = certificate.image;
        media.alt = certificate.title || "Certificate image";
        card.appendChild(media);
      }

      const title = document.createElement("h3");
      title.textContent = certificate.title || "Certificate";

      const issuer = document.createElement("p");
      issuer.textContent = certificate.issuer ? `Issuer: ${certificate.issuer}` : "Issuer: N/A";

      card.append(title, issuer);

      if (certificate.year) {
        const year = document.createElement("p");
        year.className = "meta-text";
        year.textContent = `Year: ${certificate.year}`;
        card.appendChild(year);
      }

      if (certificate.link) {
        const link = document.createElement("a");
        link.href = certificate.link;
        link.className = "meta-link verify-link";
        link.textContent = "Verify";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.appendChild(link);
      }

      certificatesContainer.appendChild(card);
    });
  }

  function renderAchievements(achievements) {
    if (!achievementsContainer) return;
    achievementsContainer.innerHTML = "";

    if (!achievements.length) {
      renderError(achievementsContainer, "No achievements added yet.");
      return;
    }

    achievements.forEach((achievement, index) => {
      const card = document.createElement("article");
      card.className = "achievement-card";

      const kicker = document.createElement("p");
      kicker.className = "achievement-kicker";
      kicker.textContent = `Achievement ${String(index + 1).padStart(2, "0")}`;

      const title = document.createElement("h3");
      title.textContent = achievement.title || "Achievement";

      const description = document.createElement("p");
      description.textContent = achievement.description || "No details added.";

      card.append(kicker, title, description);
      achievementsContainer.appendChild(card);
    });
  }

  function renderInterests(interests) {
    if (!interestsContainer) return;
    interestsContainer.innerHTML = "";

    if (!interests.length) {
      renderError(interestsContainer, "No interests added yet.");
      return;
    }

    interests.forEach((interest) => {
      const chip = document.createElement("span");
      chip.textContent = interest.title || "Interest";
      interestsContainer.appendChild(chip);
    });
  }

  async function renderAll() {
    try {
      await store.ensureDatabase();

      let skills = await store.getCollection("skills");
      let projects = await store.getCollection("projects");
      let certificates = await store.getCollection("certificates");
      let achievements = await store.getCollection("achievements");
      let interests = await store.getCollection("interests");

      const localAutoSeed =
        store.getMode && store.getMode() === "local" && !skills.length && !projects.length && !certificates.length;
      if (localAutoSeed && !achievements.length && !interests.length) {
        const reset = await store.resetDatabase();
        skills = reset.skills || [];
        projects = reset.projects || [];
        certificates = reset.certificates || [];
        achievements = reset.achievements || [];
        interests = reset.interests || [];
      }

      renderSkills(skills);
      renderProjects(projects);
      renderCertificates(certificates);
      renderAchievements(achievements);
      renderInterests(interests);
    } catch (error) {
      const message = (error && error.message) || "Unable to load portfolio data.";
      renderError(skillsContainer, message);
      renderError(projectsContainer, message);
      renderError(certificatesContainer, message);
      renderError(achievementsContainer, message);
      renderError(interestsContainer, message);
    }
  }

  renderAll();
  window.addEventListener("focus", renderAll);
  window.addEventListener("storage", (event) => {
    if (event.key === "portfolio_json_db_v1") {
      renderAll();
    }
  });
})();
