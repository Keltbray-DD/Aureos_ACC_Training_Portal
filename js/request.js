let currentLevel = null;
let viewYear;
let viewMonth;
let selectedSession = null;
let sessionsLoaded = false;
const normalisedSessions = { '1': [], '2A': [], '2B': [] };

const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ---- loading screen helpers ----
function setLoadingStep(stepId, stateName) {
    const li = document.querySelector(`#loadingSteps [data-step="${stepId}"]`);
    if (!li) return;
    li.classList.remove('pending', 'active', 'done');
    li.classList.add(stateName);
    const icon = li.querySelector('.step-icon');
    if (icon) icon.textContent = stateName === 'done' ? '✓' : '';
}
function showLoading() {
    const s = document.getElementById('loadingScreen');
    if (s) s.classList.add('show');
}
function hideLoading() {
    const s = document.getElementById('loadingScreen');
    if (s) s.classList.remove('show');
}

// ---- session loading with automatic retry + manual refresh ----
const SESSION_LOAD_ATTEMPTS = 3;      // total tries before showing the error notice
const SESSION_RETRY_DELAY_MS = 1500;  // base delay, grows with each attempt
let sessionsLoading = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function totalSessionCount() {
    return Object.values(normalisedSessions)
        .reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
}

function hideSessionError() {
    const el = document.getElementById('sessionError');
    if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
}

// failed === true  -> the fetch itself errored (network / HTTP)
// failed === false -> the fetch worked but returned no upcoming sessions
function showSessionError(failed) {
    const el = document.getElementById('sessionError');
    if (!el) return;
    el.classList.remove('hidden');
    el.innerHTML = failed
        ? '<i class="fas fa-triangle-exclamation"></i> We couldn\'t load the training sessions. '
          + 'Please check your connection and use <strong>Refresh sessions</strong> to try again.'
        : '<i class="fas fa-circle-info"></i> No upcoming sessions are showing right now. '
          + 'Use <strong>Refresh sessions</strong> to check again.';
}

// Loads the session list, retrying automatically while it comes back empty
// (covers a failed fetch or a transient empty response from Power Automate).
// Also invoked by the manual "Refresh sessions" button.
async function loadSessions() {
    if (sessionsLoading) return false;
    sessionsLoading = true;

    const refreshBtn = document.getElementById('refreshSessions');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.dataset.idleLabel = refreshBtn.dataset.idleLabel || refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-rotate-right fa-spin"></i> Loading&hellip;';
    }

    hideSessionError();
    setLoadingStep('sessions', 'active');

    let fetchFailed = false;
    try {
        for (let attempt = 1; attempt <= SESSION_LOAD_ATTEMPTS; attempt++) {
            fetchFailed = false;
            try {
                trainingList = await getEventDetails();
            } catch (err) {
                fetchFailed = true;
                trainingList = null;
                console.error(`Session load attempt ${attempt} failed:`, err);
            }
            buildSessions();

            if (totalSessionCount() > 0) {
                setLoadingStep('sessions', 'done');
                if (currentLevel !== null) selectLevel(currentLevel);
                return true;
            }

            if (attempt < SESSION_LOAD_ATTEMPTS) {
                await sleep(SESSION_RETRY_DELAY_MS * attempt);
            }
        }

        // Exhausted all attempts with no sessions to show.
        setLoadingStep('sessions', 'done');
        if (currentLevel !== null) selectLevel(currentLevel);
        showSessionError(fetchFailed);
        return false;
    } finally {
        sessionsLoading = false;
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = refreshBtn.dataset.idleLabel || 'Refresh sessions';
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    roleDropdown = document.getElementById('dropdownMenu')
    searchInput = document.getElementById('searchInput')

    // Wire up the controls straight away so they respond even while the
    // session/role data is still loading. Levels are keyed as strings
    // ('1', '2A', '2B') so Level 2 can be split into its two variants.
    document.querySelectorAll('.lvlBtn').forEach(btn => {
        btn.addEventListener('click', () => selectLevel(btn.dataset.level))
    })
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1))
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1))

    // Manual "Refresh sessions" fallback if dates don't load.
    const refreshBtn = document.getElementById('refreshSessions')
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadSessions())

    // "What's covered at each level" modal
    const coveredModal = document.getElementById('coveredModal')
    document.getElementById('coveredBtn').addEventListener('click', () => coveredModal.classList.add('open'))
    document.getElementById('coveredClose').addEventListener('click', () => coveredModal.classList.remove('open'))
    coveredModal.addEventListener('click', (e) => {
        if (e.target === coveredModal) coveredModal.classList.remove('open')
    })
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') coveredModal.classList.remove('open')
    })

    // Load everything behind the loading screen, then refresh the calendar
    // if a level was already chosen while it was loading.
    showLoading()
    try {
        await loadSessions()

        setLoadingStep('roles', 'active')
        roleData = await getRoleData()
        await roleSeachBarLoad(roleData)
        setLoadingStep('roles', 'done')
    } finally {
        hideLoading()
    }
})

// Normalise the three event buckets (Level1, Level2a, Level2b) into two
// level groups. The session type is derived from the bucket it came from,
// not from a field on the event itself.
function buildSessions() {
    const list = trainingList || {};
    normalisedSessions['1'] = normaliseBucket(list.Level1, 'Level 1', '1');
    normalisedSessions['2A'] = normaliseBucket(list.Level2a, 'Level 2A', '2A');
    normalisedSessions['2B'] = normaliseBucket(list.Level2b, 'Level 2B', '2B');
    sessionsLoaded = true;
}

function normaliseBucket(bucket, label, type) {
    if (!Array.isArray(bucket)) return [];
    const now = new Date();
    return bucket
        .map(ev => ({
            id: ev.id,
            start: new Date(ev.startWithTimeZone || ev.start),
            label: label,
            type: type,
            subject: ev.subject || '',
            location: ev.location || ''
        }))
        .filter(s => !isNaN(s.start) && s.start >= now)   // drop past / invalid sessions
        .sort((a, b) => a.start - b.start);
}

function selectLevel(level) {
    currentLevel = level;
    selectedSession = null;
    document.querySelectorAll('.lvlBtn').forEach(b => {
        b.classList.toggle('active', b.dataset.level === level);
    });
    document.getElementById('slotList').innerHTML = '';
    resetSignup();

    const sessions = normalisedSessions[level];
    const anchor = sessions.length ? sessions[0].start : new Date();
    viewYear = anchor.getFullYear();
    viewMonth = anchor.getMonth();

    document.getElementById('calendarWrap').classList.remove('hidden');
    renderCalendar();

    if (!sessions.length) {
        document.getElementById('slotList').innerHTML = sessionsLoaded
            ? '<p class="note">There are no upcoming sessions for this level right now. Please check back soon.</p>'
            : '<p class="note">Loading available sessions&hellip;</p>';
    }
}

function changeMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
}

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function renderCalendar() {
    const sessions = normalisedSessions[currentLevel] || [];
    document.getElementById('monthLabel').textContent = CAL_MONTHS[viewMonth] + ' ' + viewYear;

    const weekHead = document.getElementById('weekHead');
    weekHead.innerHTML = '';
    CAL_WEEKDAYS.forEach(w => {
        const d = document.createElement('div');
        d.textContent = w;
        weekHead.appendChild(d);
    });

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lead = (firstOfMonth.getDay() + 6) % 7;            // Monday-first offset
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < lead; i++) {
        grid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(viewYear, viewMonth, day);
        const daySessions = sessions.filter(s => sameDay(s.start, cellDate));
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = day;

        if (cellDate < today) cell.classList.add('past');

        if (daySessions.length) {
            cell.classList.add('has-session');
            const dot = document.createElement('span');
            dot.className = 'cal-dot';
            cell.appendChild(dot);
            cell.addEventListener('click', () => {
                document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                renderSlots(daySessions, cellDate);
            });
        }
        grid.appendChild(cell);
    }
}

function renderSlots(daySessions, cellDate) {
    selectedSession = null;
    resetSignup();

    const slotList = document.getElementById('slotList');
    const dayLabel = cellDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    let html = '<p class="slot-heading">Available sessions &mdash; ' + dayLabel + '</p>';
    daySessions.forEach((s, i) => {
        const time = s.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        html += '<button type="button" class="slot" data-i="' + i + '">'
              +   '<span class="slot-main">' + s.label + ' &middot; ' + time + '</span>'
              +   (isOnline(s.location) ? '<span class="slot-online"><i class="fas fa-video"></i> Online</span>' : '')
              + '</button>';
    });
    slotList.innerHTML = html;

    slotList.querySelectorAll('.slot').forEach(btn => {
        btn.addEventListener('click', () => {
            slotList.querySelectorAll('.slot').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectSlot(daySessions[parseInt(btn.dataset.i, 10)]);
        });
    });
}

function selectSlot(session) {
    selectedSession = session;
    const dateLabel = session.start.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const time = session.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('selectedSummary').innerHTML =
        '<i class="fas fa-circle-check"></i> <strong>' + session.label + '</strong> on <strong>'
        + dateLabel + '</strong> at <strong>' + time + '</strong>'
        + (isOnline(session.location) ? ' &middot; online' : '');

    document.getElementById('signupStep').classList.remove('hidden');

    // Re-run email validation in case a valid address was already entered.
    if (document.getElementById('userEmail').value) {
        validateEmail();
    } else {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled');
    }
}

function resetSignup() {
    selectedSession = null;
    const step = document.getElementById('signupStep');
    if (step) step.classList.add('hidden');
    const summary = document.getElementById('selectedSummary');
    if (summary) summary.innerHTML = '';
}

function isOnline(location) {
    return /teams|online|virtual|zoom/i.test(location || '');
}

async function runAddUserToEvent() {
    if (!selectedSession) return;

    const userEmail = document.getElementById('userEmail')
    const submitBtn = document.getElementById('submitBtn')

    submitBtn.disabled = true
    userEmail.disabled = true
    document.querySelectorAll('.lvlBtn').forEach(b => b.disabled = true)

    await postEventUpdate(selectedSession.id, userEmail.value)
    window.location.href = 'requestSuccess.html';
}

async function postEventUpdate(eventId,userEmail){

    const bodyData = {
        'eventId': eventId,
        'userEmail': userEmail
        };

    const headers = {
        'Content-Type':'application/json'
    };

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bodyData)
    };

    const apiUrl = "https://default917b4d06d2e9475983a3e7369ed74e.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c90aa7165c1d4ee4b782189637e1a16e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=x6nAho9m-IfX27tBqgp7X_tR40YICMunoKgpls1z5Xg";
    //console.log(apiUrl)
    console.log(requestOptions)
    responseData = await fetch(apiUrl,requestOptions)
        .then(response => response.json())
        .then(data => {
            const JSONdata = data
        //console.log(JSONdata)
        //console.log(JSONdata.uploadKey)
        //console.log(JSONdata.urls)
        return JSONdata
        })
        .catch(error => console.error('Error fetching data:', error));

    return responseData
    }

async function getEventDetails(){

    const headers = {
        'Content-Type':'application/json'
    };

    const requestOptions = {
        method: 'GET',
        headers: headers,
        // Always fetch a fresh session list. Without this the browser can serve
        // a cached response, so newly added sessions/dates only appear after a
        // hard refresh (Ctrl+F5).
        cache: 'no-store'
    };

    const apiUrl = "https://default917b4d06d2e9475983a3e7369ed74e.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2153356072ec47c5846c5870941fccba/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lIcs5at2Z0KVOKhDU5ZpEH_4ct0TC1ZGGIaTaUZwChA";

    // Let failures propagate so loadSessions() can retry rather than silently
    // leaving the calendar empty.
    const response = await fetch(apiUrl, requestOptions);
    if (!response.ok) {
        throw new Error('Session request failed with status ' + response.status);
    }
    return await response.json();
    }

    function validateEmail() {
        const email = document.getElementById("userEmail").value;
        const submitButton = document.getElementById(`submitBtn`);
        const message = document.getElementById("message");
      
        // Define blocked personal email providers
        const blockedDomains = ["gmail.com", "yahoo.com", "hotmail.com", "hotmail.co.uk", "outlook.com", "aol.com", "icloud.com", "live.com", "msn.com", "protonmail.com"];
        const emailRegex = new RegExp(`^[^\\s@]+@(?!(${blockedDomains.join("|")}))[^\\s@]+\\.[^\\s@]+$`, "i");
      
        if (emailRegex.test(email)) {
            message.style.color = "green";
            message.textContent = "✅ Valid Business Email!";
            submitButton.disabled = false; // Enable button
            submitButton.classList.remove("disabled"); // Remove greyed-out style
        } else {
            message.style.color = "red";
            message.textContent = "❌ Invalid Email! Please use a business email (e.g., name@company.com).";
            submitButton.disabled = true; // Disable button
            submitButton.classList.add("disabled"); // Add greyed-out style
        }
      }

      async function getRoleData() {
      
        const headers = {
          "Content-Type": "application/json",
        };
      
        const requestOptions = {
          method: "GET",
          headers: headers,
          //body: JSON.stringify(bodyData),
        };
      
        const apiUrl =
          "https://default917b4d06d2e9475983a3e7369ed74e.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b9e23700047948609bfb4cf36a95369c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IkrQgErXeGqyQcL8mVU4ekbHdtGIHHV1e46nNt1xSnE";
        //console.log(apiUrl)
        //console.log(requestOptions)
        responseData = await fetch(apiUrl, requestOptions)
          .then((response) => response.json())
          .then((data) => {
            const JSONdata = data;
            console.log(JSONdata);
            //console.log(JSONdata.uploadKey)
            //console.log(JSONdata.urls)
            return JSONdata;
          })
          .catch((error) => console.error("Error fetching data:", error));
        return responseData;
      }

      async function roleSeachBarLoad(data) {

        selectedRole = "";
      
        searchInput.addEventListener("input", () => {
          const value = searchInput.value.toLowerCase();
          roleDropdown.innerHTML = "";
      
          if (!value) {
            roleDropdown.style.display = "none";
            return;
          }
      
          const filtered = data.filter((p) =>
            p["role"].toLowerCase().includes(value)
          );
          filtered.forEach((project) => {
            const div = document.createElement("div");
            div.textContent = project["role"];
            div.addEventListener("click", () => {
              selectedRole = project;
              console.log(selectedRole)
              searchInput.value = selectedRole["role"]
              document.getElementById('roleTrainingLevel').innerHTML = ''
                document.getElementById('roleTrainingLevel').innerHTML = `<p class="note">Minimum Level of training required ${selectedRole["trainingLevel"]}</p>`
                // const level = selectedRole["trainingLevel"].split(' ')[1]
                // document.getElementById('levelSelect').value = level
                // calculateeDatesDropdown(level)
            });
            roleDropdown.appendChild(div);
          });
      
          roleDropdown.style.display = filtered.length > 0 ? "block" : "none";
          //noResults.style.display = filtered.length > 0 ? "none" : "block";
        });
      
        document.addEventListener("click", (e) => {
          if (!e.target.closest(".search-box")) {
            roleDropdown.style.display = "none";
          }
        });
      }