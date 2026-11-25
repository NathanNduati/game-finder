# GameFinder — Free-to-Play PC & Browser Games Discovery App

GameFinder is a responsive web application built with vanilla HTML, CSS, and JavaScript that solves the challenge of discovering genuinely free-to-play PC and browser games without paywalls or cluttered storefronts. Powered by the **Free-to-Play Games Database API** (via RapidAPI), it allows users to search, filter by platform and genre, sort titles dynamically, and inspect detailed publisher, developer, and release metadata.

The application is deployed behind an **HAProxy round-robin load balancer (`7112-lb-01`)** distributing traffic across two Ubuntu/Nginx backend web servers (`7112-web-01` and `7112-web-02`).

---

## Live Links & Demo Video

* **Demo Video (≤ 2 mins):** [Watch Video Walkthrough](YOUR_VIDEO_LINK_HERE)
* **Deployed Application (Load Balancer):** [http://3.83.42.137](http://3.83.42.137) (`7112-lb-01`)
* **GitHub Repository:** [https://github.com/NathanNduati/game-finder](https://github.com/NathanNduati/game-finder)

---

## System Architecture

```text
Client Browser
      │
      ▼
HAProxy Load Balancer (7112-lb-01 — 3.83.42.137)
  ├──► Round-Robin ──► Nginx Web Server 1 (7112-web-01 — 44.203.111.212)
  └──► Round-Robin ──► Nginx Web Server 2 (7112-web-02 — 44.204.52.194)
                              │
                              ▼
             RapidAPI: Free-to-Play Games Database
       ([https://free-to-play-games-database.p.rapidapi.com/api/games](https://free-to-play-games-database.p.rapidapi.com/api/games))
```

---

## Core Features

* **Real-Time External API Integration:** Queries the Free-to-Play Games Database API (`GET /api/games`) with dynamic query parameters (`platform`, `category`, `sort-by`).
* **Interactive Search, Filtering & Sorting:**
  * Instant client-side title search (`applySearchFilter`).
  * Filter by **Platform** (`All Platforms`, `PC (Windows)`, `Web Browser`).
  * Filter by **Genre** (`Shooter`, `MMORPG`, `Strategy`, `MOBA`, `Action`, `Racing`, `Sports`, `Fighting`, `Card Games`).
  * Sort by **Relevance**, **Release Date**, **Popularity**, or **Alphabetical**.
* **Game Details Modal:** Displays full description, genre/platform tags, publisher, developer, release date, and a direct **Play Free** external link.
* **Graceful Error Handling:** Catches missing configuration (`config.js`), HTTP error statuses, and network/API downtime, presenting clear user-friendly feedback in the UI alert banner.
* **API Key Security:** Keeps `config.js` excluded via `.gitignore` while providing `config.example.js` as a safe setup template.
* **Live Backend Server Badge:** Displays which backend server (`7112-web-01` or `7112-web-02`) handled the request in the footer to visibly demonstrate HAProxy round-robin distribution.

---

## Project Structure

```text
game-finder/
├── index.html        # Application structure, filter controls, modal, and server footer
├── style.css         # Responsive CSS Grid layout, dark-mode theme, and modal styling
├── app.js            # RapidAPI integration, search/filter/sort logic, and error handling
├── config.example.js # Template for RapidAPI credentials
├── .gitignore        # Prevents config.js and local environment files from being committed
└── README.md         # Documentation, deployment guide, load balancer config, and credits
```

---

## Local Setup & Running Instructions

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/NathanNduati/game-finder.git](https://github.com/NathanNduati/game-finder.git)
   cd game-finder
   ```

2. **Create `config.js` from `config.example.js`:**
   ```bash
   cp config.example.js config.js
   ```
   Open `config.js` and insert your RapidAPI key (obtainable from the [Free-to-Play Games Database API on RapidAPI](https://rapidapi.com/digiwalls/api/free-to-play-games-database)):
   ```javascript
   const CONFIG = {
     BASE_URL: "[https://free-to-play-games-database.p.rapidapi.com/api/games](https://free-to-play-games-database.p.rapidapi.com/api/games)",
     API_KEY: "YOUR_RAPIDAPI_KEY_HERE",
     API_HOST: "free-to-play-games-database.p.rapidapi.com"
   };
   ```

3. **Start a local web server:**
   ```bash
   python3 -m http.server 8080
   ```
   Open `http://localhost:8080` in your browser.

---

## Server Deployment & HAProxy Load Balancer Configuration

### Step 1: Deploy Application Files to Both Web Servers (`7112-web-01` & `7112-web-02`)

1. Installed and enabled Nginx on both Ubuntu servers (`44.203.111.212` and `44.204.52.194`):
   ```bash
   sudo apt update && sudo apt install -y nginx
   sudo systemctl enable --now nginx
   ```
2. Copied `index.html`, `style.css`, `app.js`, and `config.js` to `/var/www/html/` on both servers and set proper web root ownership:
   ```bash
   scp index.html style.css app.js config.js ubuntu@44.203.111.212:/tmp/
   ssh ubuntu@44.203.111.212 "sudo cp /tmp/index.html /tmp/style.css /tmp/app.js /tmp/config.js /var/www/html/ && sudo chown -R www-data:www-data /var/www/html"
   ```
   *(Repeated for `7112-web-02` at `44.204.52.194`.)*
3. Configured Nginx (`/etc/nginx/sites-available/default`) on each server to inject a custom `X-Served-By` response header (`7112-web-01` and `7112-web-02` respectively) and validated with `sudo nginx -t && sudo systemctl reload nginx`.

### Step 2: Configure HAProxy on `7112-lb-01` (`3.83.42.137`)

1. Installed HAProxy on `7112-lb-01`:
   ```bash
   sudo apt update && sudo apt install -y haproxy
   ```
2. Configured `/etc/haproxy/haproxy.cfg` with an HTTP frontend listening on port `80` forwarding traffic to a `roundrobin` backend pool with health checks enabled:
   ```haproxy
   frontend http_front
       bind *:80
       mode http
       default_backend web_servers

   backend web_servers
       mode http
       balance roundrobin
       option httpchk GET /
       server 7112-web-01 44.203.111.212:80 check
       server 7112-web-02 44.204.52.194:80 check
   ```
3. Validated the HAProxy configuration and restarted the service:
   ```bash
   sudo haproxy -c -f /etc/haproxy/haproxy.cfg
   sudo systemctl restart haproxy
   ```

### Step 3: Load Balancing Verification & Testing

Tested sequential HTTP requests against the load balancer IP (`3.83.42.137`) to verify alternating traffic distribution:
```bash
for i in {1..4}; do curl -sI [http://3.83.42.137](http://3.83.42.137) | grep -i X-Served-By; done
```

Output confirmed alternating responses across both backend nodes:
```text
X-Served-By: 7112-web-01
X-Served-By: 7112-web-02
X-Served-By: 7112-web-01
X-Served-By: 7112-web-02
```

In the browser (`http://3.83.42.137`), refreshing the page visibly updates the footer badge between `Served by: 7112-web-01` and `Served by: 7112-web-02`.

---

## Challenges Encountered & How They Were Solved

1. **Securing API Keys Without Breaking Deployment:**
   * **Challenge:** Committing `config.js` directly to GitHub would expose the RapidAPI key publicly, while omitting it completely breaks live API requests on the servers.
   * **Solution:** Added `config.js` to `.gitignore`, created a sanitized `config.example.js` template for repository users, and deployed `config.js` directly to `/var/www/html/` on `7112-web-01` and `7112-web-02` via `scp`.
2. **Browser Caching Masking Round-Robin Switching:**
   * **Challenge:** Although `curl` confirmed HAProxy was alternating between `7112-web-01` and `7112-web-02`, browser refreshes initially served cached HTML from a single backend.
   * **Solution:** Added a distinct server badge (`7112-web-01` / `7112-web-02`) to each server's deployed `index.html` and verified uncached round-robin switching in the browser.
3. **Client-Side Search vs. Server-Side API Filtering:**
   * **Challenge:** Triggering a new RapidAPI request on every keystroke in the search box risked hitting rate limits and caused UI lag.
   * **Solution:** Used server-side query parameters (`platform`, `category`, `sort-by`) when dropdown filters change, while filtering the fetched `allGames` array in memory (`applySearchFilter`) for instant, zero-latency title search.

---

## API Attribution & Credits

* **External API:** [Free-to-Play Games Database API](https://rapidapi.com/digiwalls/api/free-to-play-games-database) hosted on RapidAPI (`free-to-play-games-database.p.rapidapi.com`) — special thanks to the FreeToGame / Digiwalls developers for maintaining the open free-to-play catalog.
* **Developer:** Nathan Nduati