const API_KEY = "0e538b02c5ce3325114150f1f0399cae";

// 🟢 تهيئة Firebase (سيرفر الاشتراكات وقاعدة البيانات الحقيقية)
// يرجى استبدال هذه البيانات ببيانات مشروعك في Firebase لتخزين بيانات المشتركين بجدية
const firebaseConfig = {
  apiKey: "AIzaSyD9diiErCQnhPYQgT1COrv6gR3VKLPeZmw",
  authDomain: "zeus-empire-aaf53.firebaseapp.com",
  projectId: "zeus-empire-aaf53",
  storageBucket: "zeus-empire-aaf53.firebasestorage.app",
  messagingSenderId: "358132819586",
  appId: "1:358132819586:web:c9f5a9cb2927426cb9369b",
  measurementId: "G-XHK9P781WB"
};

// تشغيل الـ Firebase فقط إذا كانت المكتبة محملة
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
}

let favorites = JSON.parse(localStorage.getItem("zeus_favorites")) || [];
let continueWatching = JSON.parse(localStorage.getItem("zeus_continue")) || [];
let myRatings = JSON.parse(localStorage.getItem("zeus_ratings")) || {};
let currentUser = JSON.parse(localStorage.getItem("zeus_user")) || null; 
let searchTimeout;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered!'))
            .catch(err => console.log('SW reg error', err));
    });
}

window.onscroll = () => {
    const btn = document.getElementById('backToTop');
    if (window.scrollY > 500) btn.style.display = "flex";
    else btn.style.display = "none";
};

function updateSEOMeta(title, description, image) {
    document.title = `${title} - شاهد الآن على ZEUS`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description.slice(0, 160));
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute("content", image);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.innerText = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme();
    loadHero();
    loadContinueWatching();
    loadLiveChannels();
    updateHeartIconStatus();
    loadQuickFilters();
    updateAuthUI(); 

    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 800);
        }
    }, 2000);

    const categories = [
        { type: 'movie', genre: '', title: "🎬 روائع السينما العربية", extra: "&with_original_language=ar" },
        { type: 'tv', genre: '', title: "📺 مسلسلات عربية مميزة", extra: "&with_original_language=ar" },
        { type: 'tv', genre: 16, title: "🎌 عالم الأنمي الأسطوري", extra: "&with_original_language=ja" },
        { type: 'tv', genre: 18, title: "🇰🇷 أقوى الدراما الكورية", extra: "&with_original_language=ko" },
        { type: 'movie', genre: 28, title: "💥 أفلام الحركة والإثارة" },
        { type: 'movie', genre: 27, title: "😱 أفلام الرعب والغموض" },
        { type: 'movie', genre: 35, title: "😂 أفلام كوميدية ترفيهية" },
        { type: 'movie', genre: 8741, title: "🛸 الخيال العلمي" },
        { type: 'movie', genre: 14, title: "🔮 أفلام الفانتازيا" },
        { type: 'movie', genre: 9648, title: "🔍 الغموض والجريمة" },
        { type: 'movie', genre: 10749, title: "❤️ أفلام رومانسية" },
        { type: 'movie', genre: 12, title: "🧗 مغامرات وتشويق" },
        { type: 'movie', genre: 80, title: "🕵️ قصص الجريمة" },
        { type: 'movie', genre: 99, title: "🎞️ أفلام وثائقية" },
        { type: 'movie', genre: 10751, title: "👨‍👩‍👧‍👦 أفلام عائلية" },
        { type: 'movie', genre: 36, title: "📜 تاريخ وسير ذاتية" },
        { type: 'movie', genre: 10752, title: "🪖 أفلام الحروب" },
        { type: 'movie', genre: 37, title: "🤠 سينما الغرب الأمريكي" },
        { type: 'tv', genre: 10759, title: "🏹 مسلسلات أكشن ومغامرة" },
        { type: 'tv', genre: 10765, title: "🧬 مسلسلات خيال وفانتازيا" },
        { type: 'tv', genre: 80, title: "⚖️ مسلسلات جريمة وتحقيق" },
        { type: 'tv', genre: 10762, title: "🧒 مسلسلات أطفال" },
        { type: 'movie', genre: 10402, title: "🎵 أفلام موسيقية" },
        { type: 'movie', genre: '', title: "🔥 الأكثر شعبية عالمياً", extra: "&sort_by=popularity.desc" },
        { type: 'movie', genre: '', title: "⭐ الأعلى تقييماً", extra: "&sort_by=vote_average.desc" }
    ];

    categories.forEach(cat => {
        loadGenreRow(cat.type, cat.genre, cat.title, cat.extra || '');
    });
});

function loadQuickFilters() {
    const container = document.getElementById('quickFiltersContainer');
    const filters = [
        { name: "عربي 🎬", type: 'movie', id: '', extra: '&with_original_language=ar' },
        { name: "أكشن 💥", type: 'movie', id: 28 },
        { name: "رعب 😱", type: 'movie', id: 27 },
        { name: "أنمي 🎌", type: 'tv', id: 16 },
        { name: "كوميديا 😂", type: 'movie', id: 35 },
        { name: "دراما 🎭", type: 'movie', id: 18 },
        { name: "خيال علمي 🛸", type: 'movie', id: 8741 },
        { name: "مغامرة 🧗", type: 'movie', id: 12 },
        { name: "جريمة 🕵️", type: 'movie', id: 80 },
        { name: "وثائقي 🎞️", type: 'movie', id: 99 },
        { name: "رومانسية ❤️", type: 'movie', id: 10749 },
        { name: "عائلي 👨‍👩‍👧", type: 'movie', id: 10751 },
        { name: "فانتازيا 🔮", type: 'movie', id: 14 },
        { name: "غموض 🔍", type: 'movie', id: 9648 },
        { name: "تاريخي 📜", type: 'movie', id: 36 },
        { name: "حربي 🪖", type: 'movie', id: 10752 },
        { name: "موسيقي 🎵", type: 'movie', id: 10402 },
        { name: "غربي 🤠", type: 'movie', id: 37 },
        { name: "إثارة ⚡", type: 'movie', id: 53 },
        { name: "كوري 🇰🇷", type: 'tv', id: 18, extra: '&with_original_language=ko' },
        { name: "تركي 🇹🇷", type: 'tv', id: 18, extra: '&with_original_language=tr' },
        { name: "أطفال 🧒", type: 'tv', id: 10762 },
        { name: "واقعي 🎥", type: 'tv', id: 10764 },
        { name: "سياسة ⚖️", type: 'tv', id: 10768 },
        { name: "مباشر ⚽", type: 'live', id: 'live' }
    ];

    filters.forEach(f => {
        const btn = document.createElement('button');
        btn.innerHTML = f.name;
        btn.onclick = (e) => {
            document.querySelectorAll('.quick-filters button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if(f.type === 'live') scrollToLive();
            else applyQuickFilter(f.type, f.id, f.name, f.extra || '');
        };
        container.appendChild(btn);
    });
}

function loadLiveChannels() {
    const container = document.getElementById('sectionsContainer');
    const titleDiv = document.createElement('div');
    titleDiv.className = 'section-title';
    titleDiv.innerText = "⚽ قنوات البث المباشر المحدثة";
    titleDiv.id = "liveChannelsSection";
    const rowDiv = document.createElement('div');
    rowDiv.className = 'scroll-row';
    
    // 🟢 تم التعديل: استبدال الرابط بـ بث مباشر حقيقي لقناة الجزيرة العربية لأن الروابط السابقة كانت VOD (أفلام) وليست بثوث
    const liveChannels = [
        { name: "الجزيرة الإخبارية", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/250px-Aljazeera_eng.svg.png", url: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8" },
        { name: "الرياضية 1", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/BeIN_Sports_1_logo.svg/200px-BeIN_Sports_1_logo.svg.png", url: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8" },
        { name: "الرياضية 2", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/BeIN_Sports_2_logo.svg/200px-BeIN_Sports_2_logo.svg.png", url: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8" },
        { name: "قناة الأفلام", logo: "https://upload.wikimedia.org/wikipedia/ar/thumb/0/00/MBC1_logo.svg/200px-MBC1_logo.svg.png", url: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8" }
    ];
    liveChannels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'movie-card live-card';
        card.onclick = () => playLiveStream(ch.name, ch.url);
        card.innerHTML = `<img src="${ch.logo}" style="object-fit: contain;"><h3>${ch.name}</h3><span class="live-badge">مباشر</span>`;
        rowDiv.appendChild(card);
    });
    container.appendChild(titleDiv);
    container.appendChild(rowDiv);
}

function playLiveStream(name, url) {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    modalBody.innerHTML = `
        <div class="detail-section" style="margin-top:40px;">
            <h1 style="color:var(--primary);">🔴 بث مباشر: ${name}</h1>
            <video id="liveVideoPlayer" controls autoplay style="width:100%; border-radius:8px; margin-top:15px; background:#000;"></video>
        </div>
    `;
    const video = document.getElementById('liveVideoPlayer');
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => video.play());
    }
}

function playRandomMovie() {
    const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`;
    fetch(url).then(res => res.json()).then(data => {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        openMovie(data.results[randomIndex].id, data.results[randomIndex].media_type);
    });
}

function applyQuickFilter(type, genreId, title, extraParams = '') {
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = ''; 
    loadGenreRow(type, genreId, `📌 نتائج: ${title}`, extraParams);
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

function toggleThemeMenu() { document.getElementById('themeMenu').classList.toggle('hidden'); }
function changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem("zeus_theme", themeName);
    document.getElementById('themeMenu').classList.add('hidden');
}
function applySavedTheme() {
    document.documentElement.setAttribute('data-theme', localStorage.getItem("zeus_theme") || "default");
}

function toggleSearch() {
    const wrapper = document.getElementById('searchWrapper');
    wrapper.classList.toggle('hidden');
    if (!wrapper.classList.contains('hidden')) document.getElementById('searchInput').focus();
}

function liveSearch(query) {
    clearTimeout(searchTimeout);
    const resultsDiv = document.getElementById('searchResults');
    const errorState = document.getElementById('errorState');
    if (!query.trim()) { resultsDiv.innerHTML = ''; errorState.style.display = 'none'; return; }
    searchTimeout = setTimeout(() => {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ar`;
        fetch(url).then(res => res.json()).then(data => {
            resultsDiv.innerHTML = '';
            if(data.results.length === 0) errorState.style.display = 'flex';
            else {
                errorState.style.display = 'none';
                data.results.slice(0, 10).forEach(item => {
                    if (item.poster_path) {
                        const card = document.createElement('div');
                        card.className = 'movie-card';
                        card.onclick = () => { openMovie(item.id, item.media_type); toggleSearch(); };
                        card.innerHTML = `<img src="https://image.tmdb.org/t/p/w200${item.poster_path}"><h3>${item.title || item.name}</h3>`;
                        resultsDiv.appendChild(card);
                    }
                });
            }
        });
    }, 500); 
}

function toggleFavoritesView() {
    document.getElementById('favoritesSection').classList.toggle('hidden');
    loadFavoritesUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleFavoriteItem(id, type, title, poster) {
    const index = favorites.findIndex(f => f.id === id);
    if (index === -1) {
        favorites.push({ id, type, title, poster });
        showToast("تمت الإضافة إلى المفضلة ❤️");
    } else {
        favorites.splice(index, 1);
        showToast("تمت الإزالة من المفضلة 🗑️");
    }
    localStorage.setItem("zeus_favorites", JSON.stringify(favorites));
    updateHeartIconStatus();
    loadFavoritesUI();
}

function updateHeartIconStatus() {
    const heartIcon = document.getElementById('bottomHeartIcon');
    if (favorites.length > 0) heartIcon.classList.add('active');
    else heartIcon.classList.remove('active');
}

function loadFavoritesUI() {
    const row = document.getElementById('favoritesRow');
    row.innerHTML = '';
    if (favorites.length === 0) return row.innerHTML = '<p style="color:#666; font-size:12px;">المفضلة فارغة.</p>';
    favorites.forEach(item => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => openMovie(item.id, item.type);
        card.innerHTML = `<img src="${item.poster}"><h3>${item.title}</h3>`;
        row.appendChild(card);
    });
}

function loadHero() {
    const url = `https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}&language=ar`;
    fetch(url).then(res => res.json()).then(data => {
        const item = data.results[0];
        const hero = document.getElementById('heroSection');
        hero.style.backgroundImage = `url('https://image.tmdb.org/t/p/original${item.backdrop_path}')`;
        hero.innerHTML = `
            <div class="hero-info">
                <div class="hero-title">${item.title || item.name}</div>
                <div class="hero-desc">${item.overview ? item.overview.slice(0, 120) + '...' : ''}</div>
                <button class="play-hero" onclick="openMovie(${item.id}, '${item.media_type}')">
                    <i class="fas fa-play"></i> شاهد الآن
                </button>
            </div>`;
    });
}

function loadGenreRow(type, genreId, title, extraParams = '') {
    const container = document.getElementById('sectionsContainer');
    const titleDiv = document.createElement('div');
    titleDiv.className = 'section-title';
    titleDiv.innerText = title;
    const rowDiv = document.createElement('div');
    rowDiv.className = 'scroll-row';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'movie-card skeleton-card';
        skeleton.innerHTML = `<div class="skeleton-img"></div><div class="skeleton-text"></div>`;
        rowDiv.appendChild(skeleton);
    }
    container.appendChild(titleDiv);
    container.appendChild(rowDiv);
    const genreQuery = genreId ? `&with_genres=${genreId}` : '';
    const url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}${genreQuery}&language=ar${extraParams}`;
    fetch(url).then(res => res.json()).then(data => {
        rowDiv.innerHTML = ''; 
        if(data.results) {
            data.results.forEach(m => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.onclick = () => openMovie(m.id, type);
                const poster = m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
                card.innerHTML = `<img src="${poster}" loading="lazy"><h3>${m.title || m.name}</h3><span>⭐ ${m.vote_average.toFixed(1)}</span>`;
                rowDiv.appendChild(card);
            });
        }
    });
}

function setRating(id, rateValue) {
    myRatings[id] = rateValue;
    localStorage.setItem("zeus_ratings", JSON.stringify(myRatings));
    renderStars(rateValue);
    showToast("شكراً لتقييمك! ⭐");
}

function renderStars(currentRate) {
    document.querySelectorAll('.user-stars i').forEach((star, index) => {
        star.className = index < currentRate ? 'fas fa-star' : 'far fa-star';
    });
}

function showModalSkeleton() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-hero" style="background: #111;"></div>
        <div class="detail-section">
            <div class="sk-line sk-title"></div>
            <div class="sk-line" style="width:30%"></div>
            <div class="sk-line sk-desc"></div>
            <div class="sk-line" style="width:50%"></div>
        </div>
    `;
}

function openMovie(id, type) {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    showModalSkeleton();
    addToContinueWatching(id, type, 1, 1); 
    const savedProgress = continueWatching.find(item => item.id === id);
    const startSeason = savedProgress && savedProgress.season ? savedProgress.season : 1;
    const startEpisode = savedProgress && savedProgress.episode ? savedProgress.episode : 1;
    const detailsUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=ar&append_to_response=videos`;
    const creditsUrl = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}&language=ar`;
    
    Promise.all([
        fetch(detailsUrl).then(res => res.json()),
        fetch(creditsUrl).then(res => res.json()).catch(() => ({ cast: [] }))
    ]).then(([details, credits]) => {
            const backdrop = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
            const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
            const title = details.title || details.name;
            const isFav = favorites.some(f => f.id === id);
            const userRate = myRatings[id] || 0;
            const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');
            
            updateSEOMeta(title, details.overview || '', poster);

            let trailerKey = null;
            if (details.videos && details.videos.results.length > 0) {
                const trailer = details.videos.results.find(v => v.type === 'Trailer') || details.videos.results[0];
                trailerKey = trailer.key;
            }

            let html = `
                <div class="modal-hero" style="background-image: url('${backdrop}')"></div>
                <div class="detail-section">
                    <h1>${title}</h1>
                    <div class="meta-info">
                        <span class="meta-tag">⭐ ${details.vote_average.toFixed(1)}</span>
                        <span class="meta-tag">${(details.release_date || details.first_air_date || '').split('-')[0]}</span>
                    </div>
                    <button class="watch-now-btn" onclick="startWatching(${id}, '${type}', ${startSeason}, ${startEpisode})">
                        <span>شاهد الآن ${type==='tv' && savedProgress ? '(م '+startSeason+' ح '+startEpisode+')' : ''}</span><div class="play-icon-box"><i class="fas fa-play"></i></div>
                    </button>
                    <div class="action-buttons">
                        <button id="modalHeartBtn" class="action-btn ${isFav ? 'active' : ''}" onclick="toggleFavoriteItem(${id}, '${type}', '${safeTitle}', '${poster}')">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="action-btn" title="مشاركة" onclick="shareMovie('${safeTitle}', window.location.href)"><i class="fas fa-share-alt"></i></button>
                        ${trailerKey ? `<button class="action-btn" onclick="playTrailer('${trailerKey}')"><i class="fab fa-youtube" style="color:red;"></i></button>` : ''}
                    </div>
                    <div class="rating-box">
                        <span>تقييمك:</span>
                        <div class="user-stars">${[1,2,3,4,5].map(n => `<i class="far fa-star" onclick="setRating(${id}, ${n})"></i>`).join('')}</div>
                    </div>
                    <p>${details.overview || 'لا يوجد وصف.'}</p>
                    <div id="inlinePlayer" style="display:none;"></div>
                    <div class="cast-section">
                        <div class="cast-title">النجوم</div>
                        <div class="cast-scroll">
            `;
            if (credits.cast) {
                credits.cast.slice(0, 10).forEach(actor => {
                    const actorImg = actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/100x100';
                    html += `<div class="cast-item" onclick="loadActorMovies(${actor.id}, '${actor.name.replace(/'/g, "")}')" style="cursor:pointer;">
                                <img src="${actorImg}">
                                <p>${actor.name}</p>
                             </div>`;
                });
            }
            html += `</div></div>
                <div class="similar-section">
                    <div class="cast-title">مقترحات مشابهة</div>
                    <div class="scroll-row" id="similarRow"><p style="font-size:11px; color:#666;">جاري التحميل...</p></div>
                </div>`;
            if (type === 'tv' && details.seasons) {
                html += `<h3>المواسم</h3><select class="seasons-select" onchange="loadEpisodes(${id}, this.value)">`;
                details.seasons.forEach(s => { 
                    const selected = s.season_number == startSeason ? "selected" : "";
                    if(s.season_number > 0) html += `<option value="${s.season_number}" ${selected}>${s.name}</option>`; 
                });
                html += `</select><div class="episodes-grid" id="episodesGrid"></div>`;
                setTimeout(() => loadEpisodes(id, startSeason), 50);
            }
            html += `</div>`;
            modalBody.innerHTML = html;
            renderStars(userRate);
            loadSimilarItems(id, type);
        });
}

function loadSimilarItems(id, type) {
    fetch(`https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${API_KEY}&language=ar&page=1`)
    .then(res => res.json()).then(data => {
        const row = document.getElementById('similarRow');
        row.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.slice(0, 10).forEach(m => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.onclick = () => { document.getElementById('modalContent').scrollTop = 0; openMovie(m.id, type); };
                card.innerHTML = `<img src="https://image.tmdb.org/t/p/w200${m.poster_path}"><h3>${m.title || m.name}</h3>`;
                row.appendChild(card);
            });
        }
    });
}

function loadActorMovies(actorId, actorName) {
    closeMovie();
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = `<div class="section-title">🎬 أعمال النجم: ${actorName}</div><div id="actorResults" class="scroll-row" style="flex-wrap: wrap; justify-content: center;"></div>`;
    fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_cast=${actorId}&language=ar`)
    .then(res => res.json()).then(data => {
        const row = document.getElementById('actorResults');
        data.results.forEach(m => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.onclick = () => openMovie(m.id, 'movie');
            card.innerHTML = `<img src="https://image.tmdb.org/t/p/w200${m.poster_path}"><h3>${m.title}</h3>`;
            row.appendChild(card);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function loadEpisodes(tvId, seasonNumber) {
    const grid = document.getElementById('episodesGrid');
    fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=ar`)
        .then(res => res.json()).then(data => {
            grid.innerHTML = '';
            if (data.episodes) {
                data.episodes.forEach(ep => {
                    const epImg = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : 'https://via.placeholder.com/300x200';
                    grid.innerHTML += `
                        <div class="episode-card" onclick="startWatching(${tvId}, 'tv', ${seasonNumber}, ${ep.episode_number})">
                            <img src="${epImg}"><div class="play-overlay"><i class="fas fa-play"></i></div>
                            <h4>حلقة ${ep.episode_number}</h4>
                        </div>`;
                });
            }
        });
}

function playTrailer(youtubeKey) {
    const player = document.getElementById('inlinePlayer');
    player.style.display = 'block';
    player.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtubeKey}?autoplay=1" frameborder="0" allowfullscreen style="width:100%; height:300px; border-radius:8px;"></iframe>`;
    player.scrollIntoView({ behavior: 'smooth' });
}

function shareMovie(title, url) {
    if (navigator.share) {
        navigator.share({ title: title, url: url });
    } else {
        navigator.clipboard.writeText(`${title}: ${url}`).then(() => {
            showToast("تم نسخ الرابط بنجاح! 📋");
        });
    }
}

// 🟢 تم التعديل: إزالة الـ Sandbox، وتحسين الطول ليتسع للأزرار والفيديو، وإضافة "سيرفر 2Embed" كونه خيار ممتاز للأفلام العربية
function startWatching(id, type, season = 1, episode = 1, server = 'vidsrc') {
    addToContinueWatching(id, type, season, episode);
    const player = document.getElementById('inlinePlayer');
    player.style.display = 'block';
    let embedUrl = "";
    
    if (server === 'vidsrc') {
        embedUrl = type === 'movie' ? `https://vidsrc.to/embed/movie/${id}` : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
    } else if (server === 'autoembed') {
        embedUrl = type === 'movie' ? `https://autoembed.to/movie/tmdb/${id}` : `https://autoembed.to/tv/tmdb/${id}/${season}/${episode}`;
    } else if (server === 'superembed') {
        embedUrl = type === 'movie' ? `https://multiembed.mov/?video_id=${id}&tmdb=1` : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
    } else if (server === 'embedsu') {
        // تم استبدال السيرفر بسيرفر أقوى لدعم المحتوى العربي
        embedUrl = type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embed/tv/${id}/${season}/${episode}`;
    }
    
    player.innerHTML = `
        <div class="server-bar">
            <span>سيرفر:</span>
            <button onclick="startWatching(${id}, '${type}', ${season}, ${episode}, 'vidsrc')" class="${server==='vidsrc'?'active':''}">سيرفر 1 (سريع)</button>
            <button onclick="startWatching(${id}, '${type}', ${season}, ${episode}, 'autoembed')" class="${server==='autoembed'?'active':''}">سيرفر 2 (أوتو)</button>
            <button onclick="startWatching(${id}, '${type}', ${season}, ${episode}, 'superembed')" class="${server==='superembed'?'active':''}">سيرفر 3 (عالمي)</button>
            <button onclick="startWatching(${id}, '${type}', ${season}, ${episode}, 'embedsu')" class="${server==='embedsu'?'active':''}">سيرفر 4 (عربي)</button>
        </div>
        <div style="position:relative;">
            <iframe src="${embedUrl}" frameborder="0" allowfullscreen style="width:100%; height:320px;"></iframe>
        </div>
    `;
    player.scrollIntoView({ behavior: 'smooth' });
}

function closeMovie() {
    document.getElementById('movieModal').style.display = 'none';
    const player = document.getElementById('inlinePlayer');
    if(player) player.innerHTML = ''; 
    
    const liveVideo = document.getElementById('liveVideoPlayer');
    if(liveVideo) {
        liveVideo.pause();
        liveVideo.src = "";
        liveVideo.load();
    }
    
    document.body.style.overflow = 'auto';
    document.title = "ZEUS - عالم الأفلام والمسلسلات";
}

function addToContinueWatching(id, type, season = 1, episode = 1) {
    continueWatching = continueWatching.filter(item => item.id !== id);
    continueWatching.unshift({ id, type, season, episode });
    if (continueWatching.length > 8) continueWatching.pop();
    localStorage.setItem("zeus_continue", JSON.stringify(continueWatching));
    loadContinueWatching();
}

function loadContinueWatching() {
    const row = document.getElementById('continueRow');
    if (continueWatching.length === 0) return;
    document.getElementById('continueSection').classList.remove('hidden');
    row.innerHTML = '';
    continueWatching.forEach(item => {
        fetch(`https://api.themoviedb.org/3/${item.type}/${item.id}?api_key=${API_KEY}&language=ar`).then(res => res.json()).then(data => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.onclick = () => openMovie(data.id, item.type);
            let progressText = '';
            if(item.type === 'tv' && item.season && item.episode) {
                progressText = `<span style="display:block; font-weight:normal; font-size:10px; color:#aaa;">م${item.season} ح${item.episode}</span>`;
            }
            card.innerHTML = `<img src="https://image.tmdb.org/t/p/w200${data.poster_path}"><h3>${data.title || data.name} ${progressText}</h3>`;
            row.appendChild(card);
        });
    });
}

function goToHome() { window.location.reload(); }
function scrollToLive() {
    const liveSec = document.getElementById('liveChannelsSection');
    if(liveSec) liveSec.scrollIntoView({behavior: 'smooth'});
}

document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('searchWrapper');
    if (wrapper && !wrapper.contains(e.target) && !e.target.closest('.fa-search')) {
        wrapper.classList.add('hidden');
    }
});

function openLoginModal() {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    modalBody.innerHTML = `
        <div class="login-container glass-effect" style="border-radius:10px;">
            <div class="login-tabs">
                <button class="login-tab active" onclick="switchLoginTab('login')">تسجيل الدخول</button>
                <button class="login-tab" onclick="switchLoginTab('register')">إنشاء حساب</button>
            </div>
            <div id="loginFormArea">
                <h2 style="color:var(--primary); text-align:center; margin-bottom:5px;">مرحباً بك مجدداً</h2>
                <p style="text-align:center; color:#aaa; font-size:12px; margin-bottom:20px;">انضم لـ ZEUS لمشاهدة أفضل</p>
                <input type="email" id="loginEmail" placeholder="البريد الإلكتروني">
                <input type="password" id="loginPassword" placeholder="كلمة المرور">
                <button class="login-btn" onclick="handleLogin()">دخول</button>
            </div>
            <p style="text-align:center; font-size:11px; color:#666; margin-top:15px;">بوابة دفع الاشتراكات ستفعل هنا مستقبلاً.</p>
        </div>
    `;
}

function switchLoginTab(type) {
    const formArea = document.getElementById('loginFormArea');
    const tabs = document.querySelectorAll('.login-tab');
    if (type === 'login') {
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        formArea.innerHTML = `
            <h2 style="color:var(--primary); text-align:center; margin-bottom:5px;">مرحباً بك مجدداً</h2>
            <p style="text-align:center; color:#aaa; font-size:12px; margin-bottom:20px;">انضم لـ ZEUS لمشاهدة أفضل</p>
            <input type="email" id="loginEmail" placeholder="البريد الإلكتروني">
            <input type="password" id="loginPassword" placeholder="كلمة المرور">
            <button class="login-btn" onclick="handleLogin()">دخول</button>
        `;
    } else {
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
        formArea.innerHTML = `
            <h2 style="color:var(--primary); text-align:center; margin-bottom:5px;">إنشاء حساب جديد</h2>
            <p style="text-align:center; color:#aaa; font-size:12px; margin-bottom:20px;">قم بإنشاء حساب لحفظ مفضلتك</p>
            <input type="text" id="regName" placeholder="الاسم الكامل">
            <input type="email" id="regEmail" placeholder="البريد الإلكتروني">
            <input type="password" id="regPassword" placeholder="كلمة المرور">
            <button class="login-btn" onclick="handleRegister()">إنشاء حساب</button>
        `;
    }
}

function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    
    if (name && email && pass) {
        let users = JSON.parse(localStorage.getItem("zeus_users")) || [];
        if (users.some(u => u.email === email)) {
            showToast("هذا البريد الإلكتروني مسجل بالفعل! ⚠️");
            return;
        }
        users.push({ name, email, pass });
        localStorage.setItem("zeus_users", JSON.stringify(users));
        showToast("تم إنشاء الحساب بنجاح! تفضل بالدخول. 🎉");
        switchLoginTab('login');
    } else {
        showToast("يرجى ملء كافة الحقول! ⚠️");
    }
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    let users = JSON.parse(localStorage.getItem("zeus_users")) || [];
    
    const user = users.find(u => u.email === email && u.pass === pass);
    
    if(user) {
        currentUser = { email: user.email, name: user.name, isSubscribed: false, tier: 'free' };
        localStorage.setItem("zeus_user", JSON.stringify(currentUser));
        closeMovie();
        updateAuthUI();
        showToast(`مرحباً بك يا ${user.name}! 🎉`);
    } else if (email === "admin@zeus.com" && pass === "admin") { 
        currentUser = { email: email, name: "المدير", isSubscribed: true, tier: 'emerald' };
        localStorage.setItem("zeus_user", JSON.stringify(currentUser));
        closeMovie();
        updateAuthUI();
        showToast("تم الدخول كمدير! 🎉");
    } else {
        showToast("البريد الإلكتروني أو كلمة المرور غير صحيحة! ❌");
    }
}

function updateAuthUI() {
    const userBtn = document.getElementById('userNavBtn');
    if(userBtn) {
        userBtn.innerHTML = currentUser ? `<i class="fas fa-user-check"></i><span>${currentUser.name}</span>` : `<i class="fas fa-user"></i><span>دخول</span>`;
    }
}

// 🟢 تمت إضافة الـ JS الخاص بنافذة الإعدادات وربط Firebase
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const modalBody = document.getElementById('settingsModalBody');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    modalBody.innerHTML = `
        <div class="settings-container" style="color: #fff;">
            <h2 style="color:var(--primary); text-align:center;"><i class="fas fa-cog"></i> إعدادات المنصة</h2>
            <hr style="border-color: #333; margin: 15px 0;">
            
            <div class="setting-item" style="margin-bottom:20px;">
                <h4><i class="fas fa-globe"></i> لغة المنصة</h4>
                <select class="seasons-select" onchange="showToast('سيتم تفعيل اللغات الأخرى قريباً!')">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                </select>
            </div>

            <div class="setting-item" style="margin-bottom:20px;">
                <h4><i class="fas fa-tags"></i> خطط الاشتراكات المدفوعة (دعم مادي)</h4>
                <div class="subs-grid">
                    <div class="sub-card">
                        <h5>بـلـس ⭐️</h5>
                        <p>0.99$</p>
                        <span>إزالة الإعلانات كلياً</span>
                        <button onclick="handleSubscribeFirebase('Plus', '0.99')">اشترك</button>
                    </div>
                    <div class="sub-card">
                        <h5>بلاتيني 💎</h5>
                        <p>1.99$</p>
                        <span>سيرفرات 4K فائقة السرعة</span>
                        <button onclick="handleSubscribeFirebase('Platinum', '1.99')">اشترك</button>
                    </div>
                    <div class="sub-card">
                        <h5>الـمـاسي 🏆</h5>
                        <p>2.99$</p>
                        <span>بث مباشر بدون تقطيع</span>
                        <button onclick="handleSubscribeFirebase('Diamond', '2.99')">اشترك</button>
                    </div>
                    <div class="sub-card">
                        <h5>زمـردي 🔥</h5>
                        <p>3.99$</p>
                        <span>كل المزايا السابقة + دعم الأولوية</span>
                        <button onclick="handleSubscribeFirebase('Emerald', '3.99')">اشترك</button>
                    </div>
                </div>
            </div>

            <div class="setting-item" style="margin-bottom:20px;">
                <h4><i class="fas fa-credit-card"></i> طرق الدفع المتاحة</h4>
                <div class="payment-icons" style="display:flex; gap:10px; justify-content:center; font-size:24px; margin: 10px 0;">
                    <i class="fab fa-cc-paypal" style="color:#003087;"></i>
                    <i class="fab fa-cc-visa" style="color:#1a1f71;"></i>
                    <i class="fab fa-cc-mastercard" style="color:#eb001b;"></i>
                    <i class="fab fa-apple-pay" style="color:#fff;"></i>
                </div>
                <button class="login-btn" style="width:100%;" onclick="payWithPaypal('5.00')"><i class="fas fa-heart"></i> دعم المنصة مباشرة عبر PayPal</button>
            </div>

            <div class="setting-item" style="text-align:center;">
                <h4>📱 منصاتنا الرسمية</h4>
                <div style="display:flex; gap:15px; justify-content:center; margin-top:10px;">
                    <a href="https://www.instagram.com.zeus.official.app._empire?igsh=MTc1bnF5cnVwcWR2aA==" target="_blank" style="color:#E1306C; font-size:25px;"><i class="fab fa-instagram"></i></a>
                    <a href="https://t.me/X1D_A" target="_blank" style="color:#0088cc; font-size:25px;"><i class="fab fa-telegram"></i></a>
                </div>
            </div>
        </div>
    `;
}

// 🟢 دالة تخزين الاشتراك الحقيقي في سيرفر الـ Firebase
function handleSubscribeFirebase(tier, price) {
    if (!currentUser) {
        showToast("يرجى تسجيل الدخول أولاً لتتمكن من الاشتراك ⚠️");
        openLoginModal();
        return;
    }

    if (typeof db !== 'undefined') {
        db.collection("subscriptions").add({
            userEmail: currentUser.email,
            userName: currentUser.name,
            tier: tier,
            price: price,
            status: "pending",
            date: new Date()
        }).then(() => {
            showToast(`🎉 تم تسجيل طلبك في خطة ${tier} بنجاح! سيتم تفعيله قريباً.`);
            payWithPaypal(price);
        }).catch((error) => {
            console.error("Firebase Error: ", error);
            showToast("حدث خطأ ما أثناء إرسال طلب الاشتراك ❌");
        });
    } else {
        showToast("خطأ: لم يتم تهيئة الـ Firebase بشكل سليم. قم بوضع الـ Config الصحيح. ⚠️");
    }
}

function payWithPaypal(amount) {
    const paypalUsername = "zeus102"; 
    const paypalUrl = `https://www.paypal.com/paypalme/${paypalUsername}/${amount}`;
    window.open(paypalUrl, '_blank');
}


db.collection("test").add({
    message: "Hello Firebase from Zeus-Empire!",
    time: new Date()
})
.then(() => {
    console.log("البيانات وصلت بنجاح!");
})
.catch((error) => {
    console.error("في خطأ بالربط: ", error);
});

