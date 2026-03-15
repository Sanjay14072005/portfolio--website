(function () {
  const DB_KEY = "portfolio_json_db_v1";
  const COLLECTIONS = ["skills", "projects", "certificates", "achievements", "interests"];

  const defaultDb = {
    skills: [
      {
        id: "skill-1",
        category: "Programming Core",
        tags: ["Java", "Python", "DSA", "Problem Solving"]
      },
      {
        id: "skill-2",
        category: "Machine Learning",
        tags: ["ML Fundamentals", "Linear Regression", "Logistic Regression", "Model Evaluation", "NumPy"]
      },
      {
        id: "skill-3",
        category: "AI / Deep Learning",
        tags: ["Deep Learning Basics", "Neural Networks", "Medical AI Systems"]
      },
      {
        id: "skill-4",
        category: "Web & Tools",
        tags: ["HTML", "CSS", "JavaScript", "Git", "GitHub", "SQL", "JDBC", "GoF Patterns"]
      }
    ],
    projects: [
      {
        id: "project-1",
        title: "RAG-Based Chatbot (Llama 3 8B)",
        description:
          "Built a Retrieval-Augmented Generation chatbot powered by the Llama 3 8B model to retrieve context and generate focused answers.",
        stack: "Python, Llama 3, RAG",
        link: "",
        image: ""
      },
      {
        id: "project-2",
        title: "Streak Tracker App",
        description:
          "Developed a habit and daily task tracker where users maintain streaks for specific tasks and track an overall streak score.",
        stack: "Web App, JavaScript, UI/UX",
        link: "",
        image: ""
      },
      {
        id: "project-3",
        title: "Machine Learning Algorithm Implementations",
        description:
          "Implemented core ML algorithms like Linear Regression and Logistic Regression from scratch to understand mathematical foundations.",
        stack: "Python, NumPy, ML",
        link: "",
        image: ""
      }
    ],
    certificates: [
      {
        id: "cert-1",
        title: "AWS Cloud Practitioner",
        issuer: "Amazon Web Services",
        year: "2025",
        link: "",
        image: ""
      },
      {
        id: "cert-2",
        title: "Oracle Cloud Infrastructure Foundations",
        issuer: "Oracle",
        year: "2025",
        link: "",
        image: ""
      }
    ],
    achievements: [
      {
        id: "ach-1",
        title: "Machine Learning Contest Winner - Chennai Institute of Technology",
        description:
          "Recognized for developing effective machine learning solutions and demonstrating strong analytical and implementation skills in a competitive environment."
      },
      {
        id: "ach-2",
        title: "Coding Contest Winner - Chennai Institute of Technology",
        description:
          "Ranked first among participants by solving complex algorithmic problems with optimized logic and efficient coding practices."
      },
      {
        id: "ach-3",
        title: "Department Coding Champion - Panimalar Engineering College",
        description:
          "Secured top position in a departmental coding competition through consistent performance in data structures and problem-solving tasks."
      }
    ],
    interests: [
      { id: "int-1", title: "Artificial Intelligence" },
      { id: "int-2", title: "Machine Learning Systems" },
      { id: "int-3", title: "Medical AI Applications" },
      { id: "int-4", title: "Problem Solving" },
      { id: "int-5", title: "Software Engineering" },
      { id: "int-6", title: "FAANG-Level Preparation" }
    ]
  };

  function cloneDefault() {
    return JSON.parse(JSON.stringify(defaultDb));
  }

  function parseTags(raw) {
    if (Array.isArray(raw)) {
      return raw.map((value) => String(value || "").trim()).filter(Boolean);
    }
    return String(raw || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  function sanitizeSkill(item) {
    return {
      id: String(item?.id || ""),
      category: String(item?.category || "").trim(),
      tags: parseTags(item?.tags)
    };
  }

  function sanitizeProject(item) {
    return {
      id: String(item?.id || ""),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      stack: String(item?.stack || "").trim(),
      link: String(item?.link || "").trim(),
      image: String(item?.image || "").trim()
    };
  }

  function sanitizeCertificate(item) {
    return {
      id: String(item?.id || ""),
      title: String(item?.title || "").trim(),
      issuer: String(item?.issuer || "").trim(),
      year: String(item?.year || "").trim(),
      link: String(item?.link || "").trim(),
      image: String(item?.image || "").trim()
    };
  }

  function sanitizeAchievement(item) {
    return {
      id: String(item?.id || ""),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim()
    };
  }

  function sanitizeInterest(item) {
    return {
      id: String(item?.id || ""),
      title: String(item?.title || "").trim()
    };
  }

  function sanitizeCollection(collectionName, items) {
    const list = Array.isArray(items) ? items : [];

    if (collectionName === "skills") {
      return list.map(sanitizeSkill).filter((item) => item.id && item.category && item.tags.length);
    }
    if (collectionName === "projects") {
      return list.map(sanitizeProject).filter((item) => item.id && item.title && item.description);
    }
    if (collectionName === "certificates") {
      return list.map(sanitizeCertificate).filter((item) => item.id && item.title && item.issuer);
    }
    if (collectionName === "achievements") {
      return list.map(sanitizeAchievement).filter((item) => item.id && item.title && item.description);
    }
    if (collectionName === "interests") {
      return list.map(sanitizeInterest).filter((item) => item.id && item.title);
    }

    return [];
  }

  function normalizeDatabaseShape(parsed, defaultsForMissing) {
    const defaults = cloneDefault();
    const result = {};

    COLLECTIONS.forEach((collectionName) => {
      const source = Array.isArray(parsed?.[collectionName])
        ? parsed[collectionName]
        : defaultsForMissing
          ? defaults[collectionName]
          : [];
      result[collectionName] = sanitizeCollection(collectionName, source);
    });

    return result;
  }

  function ensureLocalDatabase() {
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
      localStorage.setItem(DB_KEY, JSON.stringify(cloneDefault()));
      return;
    }

    try {
      const parsed = JSON.parse(existing);
      const normalized = normalizeDatabaseShape(parsed, true);
      localStorage.setItem(DB_KEY, JSON.stringify(normalized));
    } catch {
      localStorage.setItem(DB_KEY, JSON.stringify(cloneDefault()));
    }
  }

  function readLocalDatabase() {
    ensureLocalDatabase();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEY) || "{}");
      return normalizeDatabaseShape(parsed, false);
    } catch {
      const resetData = cloneDefault();
      localStorage.setItem(DB_KEY, JSON.stringify(resetData));
      return resetData;
    }
  }

  function writeLocalDatabase(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  function nextId(collectionName) {
    const prefixMap = {
      projects: "project",
      skills: "skill",
      certificates: "cert",
      achievements: "ach",
      interests: "int"
    };
    const prefix = prefixMap[collectionName] || "item";
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async function ensureDatabase() {
    ensureLocalDatabase();
  }

  async function readDatabase() {
    return readLocalDatabase();
  }

  async function getCollection(collectionName) {
    if (!COLLECTIONS.includes(collectionName)) return [];
    const db = readLocalDatabase();
    return db[collectionName] || [];
  }

  async function addCollectionItem(collectionName, payload) {
    if (!COLLECTIONS.includes(collectionName)) {
      throw new Error("Invalid collection.");
    }

    const db = readLocalDatabase();
    const next = {
      id: nextId(collectionName),
      ...(payload || {})
    };
    db[collectionName] = [next, ...(db[collectionName] || [])];
    db[collectionName] = sanitizeCollection(collectionName, db[collectionName]);
    writeLocalDatabase(db);
    return next;
  }

  async function removeCollectionItem(collectionName, id) {
    if (!COLLECTIONS.includes(collectionName)) {
      throw new Error("Invalid collection.");
    }

    const db = readLocalDatabase();
    db[collectionName] = (db[collectionName] || []).filter((item) => item.id !== id);
    writeLocalDatabase(db);
  }

  async function updateCollectionItem(collectionName, id, payload) {
    if (!COLLECTIONS.includes(collectionName)) {
      throw new Error("Invalid collection.");
    }

    const db = readLocalDatabase();
    const list = Array.isArray(db[collectionName]) ? db[collectionName] : [];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Item not found.");

    list[index] = {
      ...list[index],
      ...(payload || {}),
      id
    };
    db[collectionName] = sanitizeCollection(collectionName, list);
    writeLocalDatabase(db);

    return db[collectionName].find((item) => item.id === id) || null;
  }

  async function exportDatabase() {
    const db = await readDatabase();
    return JSON.stringify(db, null, 2);
  }

  async function importDatabase(jsonText) {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid JSON database.");
    }
    const normalized = normalizeDatabaseShape(parsed, true);
    writeLocalDatabase(normalized);
  }

  async function resetDatabase() {
    const next = cloneDefault();
    writeLocalDatabase(next);
    return next;
  }

  function getMode() {
    return "local";
  }

  function getModeInfo() {
    return {
      mode: "local",
      configuredMode: "local",
      modeReason: "static_local_only",
      runningOnFileProtocol: window.location.protocol === "file:"
    };
  }

  window.PortfolioStore = {
    ensureDatabase,
    readDatabase,
    getCollection,
    addCollectionItem,
    removeCollectionItem,
    updateCollectionItem,
    exportDatabase,
    importDatabase,
    resetDatabase,
    getMode,
    getModeInfo
  };
})();
