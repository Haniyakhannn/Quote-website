(function () {
  // ── Date label ──────────────────────────────
  const dateLabel = document.getElementById("dateLabel");
  const today = new Date();
  dateLabel.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ── Render today's quote ────────────────────
  const note = (window.TODAYS_NOTE) || { quote: "Add a quote in quote-data.js", author: "" };
  document.getElementById("quoteText").textContent = note.quote;
  document.getElementById("authorText").textContent = note.author || "";

  // ── Envelope open interaction ───────────────
  const envelope = document.getElementById("envelope");
  const hint = document.getElementById("hint");

  function openEnvelope() {
    if (envelope.classList.contains("open")) return;
    envelope.classList.add("open");
    hint.style.opacity = "0";
    recordTodayOpened();
  }

  envelope.addEventListener("click", openEnvelope);
  envelope.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEnvelope();
    }
  });

  // ── Streak tracking (purely local, just for delight) ──
  const streakEl = document.getElementById("streak");

  function recordTodayOpened() {
    const todayKey = new Date().toDateString();
    const lastOpened = localStorage.getItem("fy_lastOpened");
    let streak = parseInt(localStorage.getItem("fy_streak") || "0", 10);

    if (lastOpened === todayKey) {
      // already counted today
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastOpened === yesterday.toDateString()) {
        streak += 1;
      } else {
        streak = 1;
      }
      localStorage.setItem("fy_streak", String(streak));
      localStorage.setItem("fy_lastOpened", todayKey);
    }
    renderStreak(streak);
  }

  function renderStreak(streak) {
    if (!streak || streak < 1) {
      streakEl.textContent = "";
      return;
    }
    streakEl.textContent =
      streak === 1
        ? "first note opened ✦"
        : `${streak} days in a row ✦`;
  }

  // show existing streak on load without incrementing
  (function initStreakDisplay() {
    const streak = parseInt(localStorage.getItem("fy_streak") || "0", 10);
    renderStreak(streak);
  })();

  // ── OneSignal push notifications ────────────
  // OneSignal registers its own service worker below (see serviceWorkerPath/serviceWorkerParam),
  // using the App ID you got from onesignal.com → Settings → Keys & IDs.
  const ONESIGNAL_APP_ID = "6c1172f4-97f3-4f17-80d4-5f6b83272aac";

  const notifyBtn = document.getElementById("notifyBtn");
  const notifyBtnText = document.getElementById("notifyBtnText");

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function (OneSignal) {
    if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID.startsWith("REPLACE")) {
      notifyBtnText.textContent = "reminders need setup — see SETUP_GUIDE.md";
      notifyBtn.disabled = true;
      return;
    }

    // Your site lives in a subfolder (e.g. haniyakhannn.github.io/Quote-website/)
    // rather than at the domain root, so OneSignal needs to be told exactly
    // where to find the service worker and what URL scope it should control.
    const basePath = window.location.pathname.replace(/[^/]*$/, ""); // e.g. "/Quote-website/"

    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: "OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: basePath },
    });

    function reflectPermission() {
      if (OneSignal.Notifications.permission) {
        notifyBtnText.textContent = "reminders are on 💌";
        notifyBtn.disabled = true;
      } else {
        notifyBtnText.textContent = "turn on gentle reminders";
        notifyBtn.disabled = false;
      }
    }
    reflectPermission();

    notifyBtn.addEventListener("click", async () => {
      await OneSignal.Notifications.requestPermission();
      reflectPermission();
    });
  });
})();
