const searchInput = document.getElementById("search-input");
const platformFilter = document.getElementById("platform-filter");
const genreFilter = document.getElementById("genre-filter");
const sortFilter = document.getElementById("sort-filter");
const clearBtn = document.getElementById("clear-btn");
const countText = document.getElementById("count-text");
const alertBox = document.getElementById("alert-box");
const gamesList = document.getElementById("games-list");
const detailsModal = document.getElementById("details-modal");
const closeModal = document.getElementById("close-modal");
const modalDetails = document.getElementById("modal-details");

let allGames = [];

async function fetchGames() {
  hideAlert();
  countText.textContent = "Loading games...";
  gamesList.innerHTML = "";

  if (typeof CONFIG === "undefined" || !CONFIG.API_KEY) {
    countText.textContent = "0 games found";
    showAlert("config.js is missing or API_KEY is not set.");
    return;
  }

  const params = new URLSearchParams();
  if (platformFilter.value !== "all") {
    params.append("platform", platformFilter.value);
  }
  if (genreFilter.value) {
    params.append("category", genreFilter.value);
  }
  if (sortFilter.value !== "relevance") {
    params.append("sort-by", sortFilter.value);
  }

  const query = params.toString();
  const url = query ? `${CONFIG.BASE_URL}?${query}` : CONFIG.BASE_URL;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": CONFIG.API_KEY,
        "x-rapidapi-host": CONFIG.API_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    allGames = Array.isArray(data) ? data : [];
    applySearchFilter();
  } catch (err) {
    allGames = [];
    countText.textContent = "0 games found";
    showAlert(`Could not load games (${err.message}). Check your RapidAPI subscription and config.js.`);
  }
}

function applySearchFilter() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = allGames.filter((game) =>
    game.title.toLowerCase().includes(term)
  );

  renderGames(filtered);
}

function renderGames(games) {
  gamesList.innerHTML = "";
  countText.textContent = `Showing ${games.length} game${games.length === 1 ? "" : "s"}`;

  if (games.length === 0) {
    gamesList.innerHTML = "<p>No games matched your current filters.</p>";
    return;
  }

  games.forEach((game) => {
    const card = document.createElement("article");
    card.className = "game-card";

    card.innerHTML = `
      <img src="${game.thumbnail}" alt="${game.title}">
      <div class="card-body">
        <h3>${game.title}</h3>
        <p>${game.short_description}</p>
        <div class="tags">
          <span class="tag">${game.genre}</span>
          <span class="tag">${game.platform}</span>
        </div>
        <button type="button" class="details-btn">View Details</button>
      </div>
    `;

    card.querySelector(".details-btn").addEventListener("click", () => {
      openDetails(game);
    });

    gamesList.appendChild(card);
  });
}

function openDetails(game) {
  modalDetails.innerHTML = `
    <img src="${game.thumbnail}" alt="${game.title}">
    <h2>${game.title}</h2>
    <p>${game.short_description}</p>
    <div class="modal-meta">
      <div><strong>Genre:</strong> ${game.genre}</div>
      <div><strong>Platform:</strong> ${game.platform}</div>
      <div><strong>Publisher:</strong> ${game.publisher}</div>
      <div><strong>Developer:</strong> ${game.developer}</div>
      <div><strong>Release Date:</strong> ${game.release_date}</div>
    </div>
    <a href="${game.game_url}" target="_blank" rel="noopener noreferrer" class="play-link">Play Free</a>
  `;
  detailsModal.classList.remove("hidden");
}

function showAlert(msg) {
  alertBox.textContent = msg;
  alertBox.classList.remove("hidden");
}

function hideAlert() {
  alertBox.textContent = "";
  alertBox.classList.add("hidden");
}

searchInput.addEventListener("input", applySearchFilter);
platformFilter.addEventListener("change", fetchGames);
genreFilter.addEventListener("change", fetchGames);
sortFilter.addEventListener("change", fetchGames);

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  platformFilter.value = "all";
  genreFilter.value = "";
  sortFilter.value = "relevance";
  fetchGames();
});

closeModal.addEventListener("click", () => {
  detailsModal.classList.add("hidden");
});

detailsModal.addEventListener("click", (e) => {
  if (e.target === detailsModal) {
    detailsModal.classList.add("hidden");
  }
});

fetchGames();
async function detectServingBackend() {
  const serverNameEl = document.getElementById('server-name');
  const statusDotEl = document.getElementById('status-dot');
  if (!serverNameEl || !statusDotEl) return;

  try {
    const res = await fetch(`${window.location.pathname}?t=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store'
    });
    const servedBy = res.headers.get('X-Served-By') || '7112-web-01';
    serverNameEl.textContent = `Served by: ${servedBy}`;

    statusDotEl.classList.remove('web-01', 'web-02');
    if (servedBy.includes('web-02')) {
      statusDotEl.classList.add('web-02');
    } else {
      statusDotEl.classList.add('web-01');
    }
  } catch (err) {
    serverNameEl.textContent = 'Served by: 7112-lb-01 cluster';
  }
}

detectServingBackend();