document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initTamagotchi();
    initTasks();
});

// přepínání day a night režimu
function initTheme() {
    const btn = document.getElementById("theme-btn");
    if (!btn) return;

    if (localStorage.getItem("tama-theme") === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        btn.textContent = "Den";
    }

    btn.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("tama-theme", "light");
            btn.textContent = "Večer";
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("tama-theme", "dark");
            btn.textContent = "Den";
        }
    });
}

// ovládání Tamagotchi tlačítek A, B, C a stavů mazlíčka
function initTamagotchi() {
    const timeText = document.getElementById("time-text");
    const modeLabel = document.getElementById("mode-label");
    const statusText = document.getElementById("status-text");
    const heartsEl = document.getElementById("hearts-display");
    const petSvg = document.getElementById("pet-svg");

    const btnMode = document.getElementById("btn-mode");
    const btnStart = document.getElementById("btn-start");
    const btnReset = document.getElementById("btn-reset");
    const soundBtn = document.getElementById("sound-btn");

    if (!timeText || !btnMode || !btnStart || !btnReset) return;

    const modes = [
        { id: "work", label: "PRÁCE • 20M", minutes: 20, readyText: "Stiskni B pro start" },
        { id: "short", label: "ČAJ • 5M", minutes: 5, readyText: "Čas na krátký odpočinek" },
        { id: "long", label: "PAUZA • 15M", minutes: 15, readyText: "Delší pauza po studiu" }
    ];

    let modeIndex = 0;
    let totalSeconds = modes[0].minutes * 60;
    let remainingSeconds = totalSeconds;
    let timerId = null;
    let hearts = Number(localStorage.getItem("tama-hearts")) || 0;
    let soundEnabled = false;

    if (heartsEl) heartsEl.textContent = `♥ ${hearts}`;

    // retro pipnutí a fanfárům po dokončení
    function playBeep(freq, duration = 0.08, delay = 0) {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.value = freq;
            const start = ctx.currentTime + delay;
            gain.gain.setValueAtTime(0.12, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
        } catch {

        }
    }

    if (soundBtn) {
        soundBtn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            soundBtn.textContent = soundEnabled ? "Zvuk: Zap" : "Zvuk: Vyp";
            soundBtn.classList.toggle("active", soundEnabled);
            soundBtn.setAttribute("aria-pressed", String(soundEnabled));
            if (soundEnabled) playBeep(660, 0.09);
        });
    }

    function updateDisplay() {
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        timeText.textContent = formatted;
        document.title = `${formatted} - TamaFocus`;
    }

    function updatePetAnimation(isRunning) {
        if (!petSvg) return;
        petSvg.classList.remove("is-working", "is-sleeping");
        const currentId = modes[modeIndex].id;

        if (currentId !== "work") {
            petSvg.classList.add("is-sleeping");
        } else if (isRunning) {
            petSvg.classList.add("is-working");
        }
    }

    function stopTimer() {
        clearInterval(timerId);
        timerId = null;
        updatePetAnimation(false);
    }

    // tlačítko přepínání režimu (písmeno A)
    btnMode.addEventListener("click", () => {
        stopTimer();
        playBeep(520, 0.07);
        modeIndex = (modeIndex + 1) % modes.length;
        const current = modes[modeIndex];

        totalSeconds = current.minutes * 60;
        remainingSeconds = totalSeconds;
        modeLabel.textContent = current.label;
        statusText.textContent = current.readyText;
        updatePetAnimation(false);
        updateDisplay();
    });

    // start/pauza tlačítko (písmeno B)
    btnStart.addEventListener("click", () => {
        if (timerId) {
            stopTimer();
            playBeep(440, 0.07);
            statusText.textContent = "Pozastaveno (B = pokračovat)";
            return;
        }

        playBeep(660, 0.08);
        const current = modes[modeIndex];
        updatePetAnimation(true);
        statusText.textContent = current.id === "work" ? "Soustředíme se..." : "Odpočíváme...";

        timerId = setInterval(() => {
            remainingSeconds--;
            updateDisplay();

            if (remainingSeconds <= 0) {
                stopTimer();
                playBeep(523.25, 0.15, 0);
                playBeep(659.25, 0.15, 0.16);
                playBeep(783.99, 0.3, 0.32);

                if (current.id === "work") {
                    hearts++;
                    localStorage.setItem("tama-hearts", String(hearts));
                    if (heartsEl) heartsEl.textContent = `♥ ${hearts}`;
                    statusText.textContent = "Hotovo! +1 srdíčko";
                } else {
                    statusText.textContent = "Pauza skončila!";
                }
            }
        }, 1000);
    });

    // reset tlačítko (písmeno C)
    btnReset.addEventListener("click", () => {
        stopTimer();
        playBeep(390, 0.09);
        const current = modes[modeIndex];
        remainingSeconds = totalSeconds;
        statusText.textContent = current.readyText;
        updateDisplay();
    });

    updateDisplay();
}

// to-do list v localStorage
function initTasks() {
    const form = document.getElementById("task-form");
    const input = document.getElementById("task-input");
    const list = document.getElementById("task-list");
    if (!form || !input || !list) return;

    let tasks = JSON.parse(localStorage.getItem("tama-tasks") || "[]");

    function renderTasks() {
        localStorage.setItem("tama-tasks", JSON.stringify(tasks));
        list.innerHTML = "";

        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            li.className = task.done ? "task-item done" : "task-item";

            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.done;
            checkbox.addEventListener("change", () => {
                tasks[index].done = checkbox.checked;
                renderTasks();
            });

            const span = document.createElement("span");
            span.textContent = task.text;

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "delete-task";
            delBtn.textContent = "×";
            delBtn.setAttribute("aria-label", "Smazat úkol");
            delBtn.addEventListener("click", () => {
                tasks.splice(index, 1);
                renderTasks();
            });

            label.append(checkbox, span);
            li.append(label, delBtn);
            list.append(li);
        });
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        tasks.push({ text, done: false });
        input.value = "";
        renderTasks();
    });

    renderTasks();
}