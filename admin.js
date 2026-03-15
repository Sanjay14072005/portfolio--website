(function () {
  const store = window.PortfolioStore;
  const config = window.AdminConfig || {};
  if (!store) return;

  const SESSION_KEY = "portfolio_admin_session_v1";

  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginMsg = document.getElementById("loginMsg");
  const configHint = document.getElementById("configHint");
  const panelMsg = document.getElementById("panelMsg");

  const skillForm = document.getElementById("skillForm");
  const projectForm = document.getElementById("projectForm");
  const certificateForm = document.getElementById("certificateForm");
  const achievementForm = document.getElementById("achievementForm");
  const interestForm = document.getElementById("interestForm");

  const skillSubmitBtn = document.getElementById("skillSubmitBtn");
  const projectSubmitBtn = document.getElementById("projectSubmitBtn");
  const certificateSubmitBtn = document.getElementById("certificateSubmitBtn");
  const achievementSubmitBtn = document.getElementById("achievementSubmitBtn");
  const interestSubmitBtn = document.getElementById("interestSubmitBtn");

  const skillCancelBtn = document.getElementById("skillCancelBtn");
  const projectCancelBtn = document.getElementById("projectCancelBtn");
  const certificateCancelBtn = document.getElementById("certificateCancelBtn");
  const achievementCancelBtn = document.getElementById("achievementCancelBtn");
  const interestCancelBtn = document.getElementById("interestCancelBtn");

  const skillsAdminList = document.getElementById("skillsAdminList");
  const projectsAdminList = document.getElementById("projectsAdminList");
  const certificatesAdminList = document.getElementById("certificatesAdminList");
  const achievementsAdminList = document.getElementById("achievementsAdminList");
  const interestsAdminList = document.getElementById("interestsAdminList");
  const exportBtn = document.getElementById("exportDbBtn");
  const importFileInput = document.getElementById("importDbFile");

  const editState = {
    skills: null,
    projects: null,
    certificates: null,
    achievements: null,
    interests: null
  };
  let hasRunLegacySkillCleanup = false;

  function setMessage(target, message, isError) {
    if (!target) return;
    target.textContent = message;
    target.style.color = isError ? "#ff8a8a" : "#9ceeff";
  }

  function clearMessage(target) {
    if (!target) return;
    target.textContent = "";
  }

  function setLoggedInLocal(value) {
    if (value) {
      sessionStorage.setItem(SESSION_KEY, "1");
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  async function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  async function updateView() {
    const loggedIn = await isLoggedIn();
    if (loginSection) loginSection.classList.toggle("hidden", loggedIn);
    if (panelSection) panelSection.classList.toggle("hidden", !loggedIn);
    if (loggedIn) {
      if (!hasRunLegacySkillCleanup) {
        await cleanupLegacySkillSummaries();
        hasRunLegacySkillCleanup = true;
      }
      await renderAllAdminLists();
    }
  }

  async function cleanupLegacySkillSummaries() {
    try {
      const skills = await store.getCollection("skills");
      const legacy = skills.filter((item) =>
        Object.prototype.hasOwnProperty.call(item || {}, "summary")
      );
      if (!legacy.length) return;

      await Promise.all(
        legacy.map((item) => {
          const { id, summary, ...payload } = item || {};
          return store.updateCollectionItem("skills", id, payload);
        })
      );
      setMessage(panelMsg, `Removed legacy summary field from ${legacy.length} skill record(s).`, false);
    } catch (error) {
      setMessage(panelMsg, (error && error.message) || "Failed legacy skill cleanup.", true);
    }
  }

  function resetSkillEditMode() {
    editState.skills = null;
    if (skillForm) skillForm.reset();
    if (skillSubmitBtn) skillSubmitBtn.textContent = "Add Skill";
    if (skillCancelBtn) skillCancelBtn.classList.add("hidden");
  }

  function resetProjectEditMode() {
    editState.projects = null;
    if (projectForm) {
      projectForm.reset();
      projectForm.dataset.editingId = "";
      const editIdInput = projectForm.querySelector('input[name="editId"]');
      if (editIdInput) editIdInput.value = "";
    }
    if (projectSubmitBtn) projectSubmitBtn.textContent = "Add Project";
    if (projectCancelBtn) projectCancelBtn.classList.add("hidden");
  }

  function resetCertificateEditMode() {
    editState.certificates = null;
    if (certificateForm) certificateForm.reset();
    if (certificateSubmitBtn) certificateSubmitBtn.textContent = "Add Certificate";
    if (certificateCancelBtn) certificateCancelBtn.classList.add("hidden");
  }

  function resetAchievementEditMode() {
    editState.achievements = null;
    if (achievementForm) achievementForm.reset();
    if (achievementSubmitBtn) achievementSubmitBtn.textContent = "Add Achievement";
    if (achievementCancelBtn) achievementCancelBtn.classList.add("hidden");
  }

  function resetInterestEditMode() {
    editState.interests = null;
    if (interestForm) interestForm.reset();
    if (interestSubmitBtn) interestSubmitBtn.textContent = "Add Interest";
    if (interestCancelBtn) interestCancelBtn.classList.add("hidden");
  }

  function resetAllEditModes() {
    resetSkillEditMode();
    resetProjectEditMode();
    resetCertificateEditMode();
    resetAchievementEditMode();
    resetInterestEditMode();
  }

  async function getCollectionItem(collectionName, id) {
    const list = await store.getCollection(collectionName);
    return list.find((item) => item.id === id) || null;
  }

  function startSkillEdit(item) {
    if (!skillForm || !item) return;
    editState.skills = item.id;
    const categoryInput = skillForm.querySelector('input[name="category"]');
    const tagsInput = skillForm.querySelector('input[name="tags"]');
    if (categoryInput) categoryInput.value = item.category || "";
    if (tagsInput) {
      tagsInput.value = Array.isArray(item.tags) ? item.tags.join(", ") : String(item.tags || "");
    }
    if (skillSubmitBtn) skillSubmitBtn.textContent = "Update Skill";
    if (skillCancelBtn) skillCancelBtn.classList.remove("hidden");
    setMessage(panelMsg, "Editing skill card. Click Update Skill to save.", false);
    skillForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startProjectEdit(item) {
    if (!projectForm || !item) return;
    editState.projects = item.id;
    projectForm.dataset.editingId = item.id;
    const titleInput = projectForm.querySelector('input[name="title"]');
    const descriptionInput = projectForm.querySelector('textarea[name="description"]');
    const stackInput = projectForm.querySelector('input[name="stack"]');
    const linkInput = projectForm.querySelector('input[name="link"]');
    const editIdInput = projectForm.querySelector('input[name="editId"]');
    const imageInput = projectForm.querySelector('input[name="imageFile"]');
    if (titleInput) titleInput.value = item.title || "";
    if (descriptionInput) descriptionInput.value = item.description || "";
    if (stackInput) stackInput.value = item.stack || "";
    if (linkInput) linkInput.value = item.link || "";
    if (editIdInput) editIdInput.value = item.id || "";
    if (imageInput) imageInput.value = "";
    if (projectSubmitBtn) projectSubmitBtn.textContent = "Update Project";
    if (projectCancelBtn) projectCancelBtn.classList.remove("hidden");
    setMessage(panelMsg, "Editing project. Upload a new image only if you want to replace it.", false);
    projectForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startCertificateEdit(item) {
    if (!certificateForm || !item) return;
    editState.certificates = item.id;
    const titleInput = certificateForm.querySelector('input[name="title"]');
    const issuerInput = certificateForm.querySelector('input[name="issuer"]');
    const yearInput = certificateForm.querySelector('input[name="year"]');
    const linkInput = certificateForm.querySelector('input[name="link"]');
    const imageInput = certificateForm.querySelector('input[name="imageFile"]');
    if (titleInput) titleInput.value = item.title || "";
    if (issuerInput) issuerInput.value = item.issuer || "";
    if (yearInput) yearInput.value = item.year || "";
    if (linkInput) linkInput.value = item.link || "";
    if (imageInput) imageInput.value = "";
    if (certificateSubmitBtn) certificateSubmitBtn.textContent = "Update Certificate";
    if (certificateCancelBtn) certificateCancelBtn.classList.remove("hidden");
    setMessage(panelMsg, "Editing certificate. Upload a new image only if you want to replace it.", false);
    certificateForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startAchievementEdit(item) {
    if (!achievementForm || !item) return;
    editState.achievements = item.id;
    const titleInput = achievementForm.querySelector('input[name="title"]');
    const descriptionInput = achievementForm.querySelector('textarea[name="description"]');
    if (titleInput) titleInput.value = item.title || "";
    if (descriptionInput) descriptionInput.value = item.description || "";
    if (achievementSubmitBtn) achievementSubmitBtn.textContent = "Update Achievement";
    if (achievementCancelBtn) achievementCancelBtn.classList.remove("hidden");
    setMessage(panelMsg, "Editing achievement. Click Update Achievement to save.", false);
    achievementForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startInterestEdit(item) {
    if (!interestForm || !item) return;
    editState.interests = item.id;
    const titleInput = interestForm.querySelector('input[name="title"]');
    if (titleInput) titleInput.value = item.title || "";
    if (interestSubmitBtn) interestSubmitBtn.textContent = "Update Interest";
    if (interestCancelBtn) interestCancelBtn.classList.remove("hidden");
    setMessage(panelMsg, "Editing interest. Click Update Interest to save.", false);
    interestForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function createAdminItem(collectionName, item, label) {
    const row = document.createElement("div");
    row.className = "admin-item";

    if (item.image) {
      const thumb = document.createElement("img");
      thumb.className = "admin-thumb";
      thumb.src = item.image;
      thumb.alt = label;
      row.appendChild(thumb);
    }

    const text = document.createElement("p");
    text.textContent = label;

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn-outline admin-edit-btn";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      if (collectionName === "skills") startSkillEdit(item);
      if (collectionName === "projects") startProjectEdit(item);
      if (collectionName === "certificates") startCertificateEdit(item);
      if (collectionName === "achievements") startAchievementEdit(item);
      if (collectionName === "interests") startInterestEdit(item);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn-danger";
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", async () => {
      try {
        await store.removeCollectionItem(collectionName, item.id);
        if (collectionName === "skills" && editState.skills === item.id) resetSkillEditMode();
        if (collectionName === "projects" && editState.projects === item.id) resetProjectEditMode();
        if (collectionName === "certificates" && editState.certificates === item.id)
          resetCertificateEditMode();
        if (collectionName === "achievements" && editState.achievements === item.id)
          resetAchievementEditMode();
        if (collectionName === "interests" && editState.interests === item.id) resetInterestEditMode();

        await renderAllAdminLists();
        setMessage(panelMsg, "Item deleted.", false);
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Failed to delete item.", true);
      }
    });

    actions.append(editButton, removeButton);
    row.append(text, actions);
    return row;
  }

  function renderAdminList(container, collectionName, items, getLabel) {
    if (!container) return;
    container.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No entries yet.";
      container.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      container.appendChild(createAdminItem(collectionName, item, getLabel(item)));
    });
  }

  async function renderAllAdminLists() {
    const [skills, projects, certificates, achievements, interests] = await Promise.all([
      store.getCollection("skills"),
      store.getCollection("projects"),
      store.getCollection("certificates"),
      store.getCollection("achievements"),
      store.getCollection("interests")
    ]);

    renderAdminList(skillsAdminList, "skills", skills, (item) => item.category || "Untitled Skill");
    renderAdminList(projectsAdminList, "projects", projects, (item) => item.title || "Untitled Project");
    renderAdminList(
      certificatesAdminList,
      "certificates",
      certificates,
      (item) => item.title || "Untitled Certificate"
    );
    renderAdminList(
      achievementsAdminList,
      "achievements",
      achievements,
      (item) => item.title || "Untitled Achievement"
    );
    renderAdminList(interestsAdminList, "interests", interests, (item) => item.title || "Untitled Interest");
  }

  async function initializeView() {
    await store.ensureDatabase();
    if (configHint) {
      configHint.innerHTML =
        "Static local mode active. Data is saved in this browser only (localStorage).";
    }
    await updateView();
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailInput = document.getElementById("adminEmail");
      const passwordInput = document.getElementById("adminPassword");
      const email = String((emailInput && emailInput.value) || "")
        .trim()
        .toLowerCase();
      const password = String((passwordInput && passwordInput.value) || "").trim();

      if (!email || !password) {
        setMessage(loginMsg, "Enter email and password.", true);
        return;
      }

      try {
        const expectedEmail = String(config.email || "")
          .trim()
          .toLowerCase();
        const expectedPassword = String(config.password || "").trim();
        if (email === expectedEmail && password === expectedPassword) {
          setLoggedInLocal(true);
          clearMessage(loginMsg);
          resetAllEditModes();
          await updateView();
          return;
        }

        setMessage(loginMsg, "Invalid admin email or password.", true);
      } catch (error) {
        setMessage(loginMsg, (error && error.message) || "Login failed.", true);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      setLoggedInLocal(false);
      resetAllEditModes();
      clearMessage(panelMsg);
      await updateView();
    });
  }

  if (skillCancelBtn) {
    skillCancelBtn.addEventListener("click", () => {
      resetSkillEditMode();
      setMessage(panelMsg, "Skill edit canceled.", false);
    });
  }
  if (projectCancelBtn) {
    projectCancelBtn.addEventListener("click", () => {
      resetProjectEditMode();
      setMessage(panelMsg, "Project edit canceled.", false);
    });
  }
  if (certificateCancelBtn) {
    certificateCancelBtn.addEventListener("click", () => {
      resetCertificateEditMode();
      setMessage(panelMsg, "Certificate edit canceled.", false);
    });
  }
  if (achievementCancelBtn) {
    achievementCancelBtn.addEventListener("click", () => {
      resetAchievementEditMode();
      setMessage(panelMsg, "Achievement edit canceled.", false);
    });
  }
  if (interestCancelBtn) {
    interestCancelBtn.addEventListener("click", () => {
      resetInterestEditMode();
      setMessage(panelMsg, "Interest edit canceled.", false);
    });
  }

  if (skillForm) {
    skillForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(skillForm);
      const payload = {
        category: String(form.get("category") || "").trim(),
        tags: String(form.get("tags") || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      };

      if (!payload.category || !payload.tags.length) {
        setMessage(panelMsg, "Fill category and tags.", true);
        return;
      }

      try {
        if (editState.skills) {
          await store.updateCollectionItem("skills", editState.skills, payload);
          resetSkillEditMode();
          setMessage(panelMsg, "Skill updated.", false);
        } else {
          await store.addCollectionItem("skills", payload);
          skillForm.reset();
          setMessage(panelMsg, "Skill added.", false);
        }
        await renderAllAdminLists();
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Failed to save skill.", true);
      }
    });
  }

  if (projectForm) {
    projectForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(projectForm);
      const imageInput = projectForm.querySelector('input[name="imageFile"]');
      const editIdInput = projectForm.querySelector('input[name="editId"]');
      const file = imageInput && imageInput.files ? imageInput.files[0] : null;
      const editProjectId =
        String((editIdInput && editIdInput.value) || projectForm.dataset.editingId || editState.projects || "").trim();

      const title = String(form.get("title") || "").trim();
      const description = String(form.get("description") || "").trim();
      const stack = String(form.get("stack") || "").trim();
      const link = String(form.get("link") || "").trim();

      if (!title || !description) {
        setMessage(panelMsg, "Project title and description are required.", true);
        return;
      }

      try {
        if (editProjectId) {
          const current = await getCollectionItem("projects", editProjectId);
          let image = (current && current.image) || "";
          if (file) image = await fileToDataUrl(file);
          await store.updateCollectionItem("projects", editProjectId, {
            title,
            description,
            stack,
            link,
            image
          });
          resetProjectEditMode();
          setMessage(panelMsg, "Project updated.", false);
        } else {
          const image = file ? await fileToDataUrl(file) : "";
          await store.addCollectionItem("projects", {
            title,
            description,
            stack,
            link,
            image
          });
          projectForm.reset();
          setMessage(panelMsg, "Project added.", false);
        }
        await renderAllAdminLists();
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Failed to save project.", true);
      }
    });
  }

  if (certificateForm) {
    certificateForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(certificateForm);
      const imageInput = certificateForm.querySelector('input[name="imageFile"]');
      const file = imageInput && imageInput.files ? imageInput.files[0] : null;

      const title = String(form.get("title") || "").trim();
      const issuer = String(form.get("issuer") || "").trim();
      const year = String(form.get("year") || "").trim();
      const link = String(form.get("link") || "").trim();

      if (!title || !issuer) {
        setMessage(panelMsg, "Certificate title and issuer are required.", true);
        return;
      }

      try {
        if (editState.certificates) {
          const current = await getCollectionItem("certificates", editState.certificates);
          let image = (current && current.image) || "";
          if (file) image = await fileToDataUrl(file);
          await store.updateCollectionItem("certificates", editState.certificates, {
            title,
            issuer,
            year,
            link,
            image
          });
          resetCertificateEditMode();
          setMessage(panelMsg, "Certificate updated.", false);
        } else {
          const image = file ? await fileToDataUrl(file) : "";
          await store.addCollectionItem("certificates", {
            title,
            issuer,
            year,
            link,
            image
          });
          certificateForm.reset();
          setMessage(panelMsg, "Certificate added.", false);
        }
        await renderAllAdminLists();
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Failed to save certificate.", true);
      }
    });
  }

  if (achievementForm) {
    achievementForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(achievementForm);
      const payload = {
        title: String(form.get("title") || "").trim(),
        description: String(form.get("description") || "").trim()
      };

      if (!payload.title || !payload.description) {
        setMessage(panelMsg, "Achievement title and description are required.", true);
        return;
      }

      try {
        if (editState.achievements) {
          await store.updateCollectionItem("achievements", editState.achievements, payload);
          resetAchievementEditMode();
          setMessage(panelMsg, "Achievement updated.", false);
        } else {
          await store.addCollectionItem("achievements", payload);
          achievementForm.reset();
          setMessage(panelMsg, "Achievement added.", false);
        }
        await renderAllAdminLists();
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Failed to save achievement.", true);
      }
    });
  }

  if (interestForm) {
    interestForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(interestForm);
      const payload = {
        title: String(form.get("title") || "").trim()
      };

      if (!payload.title) {
        setMessage(panelMsg, "Interest cannot be empty.", true);
        return;
      }

      try {
        if (editState.interests) {
          await store.updateCollectionItem("interests", editState.interests, payload);
          resetInterestEditMode();
          setMessage(panelMsg, "Interest updated.", false);
        } else {
          await store.addCollectionItem("interests", payload);
          interestForm.reset();
          setMessage(panelMsg, "Interest added.", false);
        }
        await renderAllAdminLists();
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Failed to save interest.", true);
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const json = await store.exportDatabase();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "portfolio-db.json";
        anchor.click();
        URL.revokeObjectURL(url);
        setMessage(panelMsg, "JSON database exported.", false);
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Failed to export database.", true);
      }
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener("change", async () => {
      const file = importFileInput.files && importFileInput.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        await store.importDatabase(text);
        resetAllEditModes();
        await renderAllAdminLists();
        setMessage(panelMsg, "JSON database imported.", false);
      } catch (error) {
        setMessage(panelMsg, (error && error.message) || "Invalid JSON file.", true);
      } finally {
        importFileInput.value = "";
      }
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !String(file.type || "").startsWith("image/")) {
        reject(new Error("Please upload a valid image file."));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1280;
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Unable to process image."));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.82;
          let dataUrl = canvas.toDataURL("image/webp", quality);

          // Keep payload lightweight for localStorage.
          while (dataUrl.length > 360000 && quality > 0.5) {
            quality -= 0.08;
            dataUrl = canvas.toDataURL("image/webp", quality);
          }

          if (dataUrl.length > 650000) {
            reject(new Error("Image is too large after compression. Use a smaller image."));
            return;
          }

          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to decode image file."));
        img.src = String(reader.result || "");
      };
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });
  }

  initializeView();
})();
