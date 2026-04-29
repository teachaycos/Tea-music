// ====================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ (все let/const сюда, в самый верх!)
let isPlaying = false;
let currentTrackPath = '';
let currentActiveItem = null;
let musicQueue = []; 
let fullPlaylist = [];
let currentTrackIndex = -1;
let musicPlaylist = [];

// Остальные глобальные переменные
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playerCoverElement = document.getElementById('playerCover');
const progressBarElement = document.getElementById('progressBar');
const progressElement = document.getElementById('progress');
const currentTimeElement = document.getElementById('currentTime');
const durationTimeElement = document.getElementById('durationTime');
const volumeControl = document.getElementById('playerVolumeControl');
const volumeRange = volumeControl ? volumeControl.querySelector('input[type="range"]') : null;

// ====================================================================
// ИНИЦИАЛИЗАЦИЯ
// ====================================================================
window.onload = function() {
    // ... (логика прелоадера) ...
    const preloader = document.querySelector('.preloader');
    const body = document.body;

    setTimeout(() => {
        preloader.style.opacity = '0';
        body.classList.add('loaded');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 500);
    // ...
    
    if(volumeRange) {
        // Установка начальной громкости
        audioPlayer.volume = volumeRange.value / 100;
    }

    // Добавление обработчиков событий плеера
    audioPlayer.addEventListener('loadedmetadata', updateProgressBar);
    audioPlayer.addEventListener('timeupdate', updateProgressBar);
    audioPlayer.addEventListener('ended', nextTrack);
    
    // Добавление глобального обработчика для закрытия активного ползунка громкости
    document.addEventListener('click', closeVolumeBarIfOpen);
};

// ====================================================================
// ЛОГИКА НОВОГО БАРА ГРОМКОСТИ (YOUTUBE STYLE)
// ====================================================================

function toggleVolumeBar(event) {
    // Остановить распространение, чтобы клик не закрыл его немедленно
    event.stopPropagation();
    
    // Если клик был по ползунку, не трогаем класс активности
    if (event.target.tagName === 'INPUT' && event.target.type === 'range') {
        return;
    }

    // Переключение класса активности
    volumeControl.classList.toggle('is-active');

    // Если мы открываем ползунок, добавляем ему фокус
    if (volumeControl.classList.contains('is-active')) {
        volumeRange.focus();
    }
}

function closeVolumeBarIfOpen(event) {
    // Если клик не внутри контейнера громкости, закрываем, если открыт
    const isClickInsideVolume = event.target.closest('#playerVolumeControl');
    
    if (!isClickInsideVolume && volumeControl.classList.contains('is-active')) {
        volumeControl.classList.remove('is-active');
    }
}


function setVolume(value) {
    audioPlayer.volume = value / 100;
    
    // Обновление иконки в зависимости от громкости
    const icon = volumeControl.querySelector('.volume-icon');
    if (value == 0) {
        icon.innerHTML = '🔇';
    } else if (value < 50) {
        icon.innerHTML = '🔉';
    } else {
        icon.innerHTML = '🔊';
    }
}


// ====================================================================
// ЛОГИКА ВОСПРОИЗВЕДЕНИЯ И ПРОГРЕСС-БАРА
// ====================================================================

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function updateProgressBar() {
    currentTimeElement.textContent = formatTime(audioPlayer.currentTime);
    if (audioPlayer.duration) {
        durationTimeElement.textContent = formatTime(audioPlayer.duration);
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressElement.style.width = progressPercent + '%';
    } else {
        durationTimeElement.textContent = '0:00';
        progressElement.style.width = '0%';
    }
}

function seekTo(event) {
    if (isNaN(audioPlayer.duration)) return;
    
    event.stopPropagation();

    const rect = progressBarElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    audioPlayer.currentTime = audioPlayer.duration * percentage;
}

// ====================================================================
// ДОБАВЛЕННАЯ ФУНКЦИЯ ДЛЯ ЗАПУСКА ТРЕКА ПО КЛИКУ (чтобы работало на главной)
// ====================================================================

function playTrack(trackElement) {
    if (!trackElement) return;

    const path = trackElement.getAttribute('data-path') || 
                 trackElement.querySelector('audio')?.src || 
                 trackElement.closest('[data-path]')?.getAttribute('data-path');

    const title = trackElement.getAttribute('data-title') || 
                  trackElement.querySelector('h4, .title')?.innerText || 'Без названия';

    const artist = trackElement.getAttribute('data-artist') || 
                   trackElement.querySelector('.artist, p')?.innerText || '';

    if (!path) {
        console.error("Нет data-path у элемента", trackElement);
        return;
    }

    console.log("Пытаемся играть:", title, "—", path); // Для отладки в консоли

    audioPlayer.src = path;
    audioPlayer.play().catch(err => {
        console.error("Ошибка воспроизведения:", err);
        alert("Браузер блокирует автозапуск — кликни ещё раз или разреши звук");
    });

    // Плеер
    document.getElementById('playerTitle').innerText = title;
    document.getElementById('playerArtist').innerText = artist;

    // Визуально выделяем активный трек (если нужно)
    document.querySelectorAll('.music-item, .album-card').forEach(el => el.classList.remove('playing'));
    trackElement.classList.add('playing');

    // Кнопка play/pause
    playPauseBtn.innerText = '⏸️';
    isPlaying = true;
}

function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play().catch(e => console.log("Автозапуск заблокирован", e));
        playPauseBtn.innerText = '⏸️';
        isPlaying = true;
    } else {
        audioPlayer.pause();
        playPauseBtn.innerText = '▶️';
        isPlaying = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.music-item, .album-card, [data-path]').forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Если это ссылка — не переходим
            playTrack(item);
        });
    });
});


function actionAddToQueue(event, link, isPlayer) { performAction(event, link, isPlayer, 'queue'); }
function actionAddToPlaylist(event, link, isPlayer) { performAction(event, link, isPlayer, 'playlist'); }
function actionToggleFavorite(event, link, isPlayer) { performAction(event, link, isPlayer, 'favorite'); }
function openAuthModal() {
    const modal = document.getElementById('authModal');
    const overlay = document.querySelector('.overlay');
    
    overlay.classList.add('active');
    modal.classList.add('active');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    const overlay = document.querySelector('.overlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
}

// Закрытие при клике на любое место фона
document.querySelector('.overlay').addEventListener('click', closeAuthModal);
// ====================================================================
// ЛОГИКА АВТОЗАПУСКА ПРИ СКРОЛЛЕ (ДЛЯ ЧАРТОВ)
// ====================================================================

let scrollTimeout;
const scrollObserverOptions = {
    root: null, // следим относительно вьюпорта
    threshold: 0.8 // трек считается "активным", если он виден на 80%
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Очищаем предыдущий таймер, если пользователь продолжает скроллить
            clearTimeout(scrollTimeout);

            // Устанавливаем задержку 800мс перед запуском
            scrollTimeout = setTimeout(() => {
                const trackElement = entry.target;
                const trackPath = trackElement.getAttribute('data-path');
                
                // Проверяем, не играет ли этот трек уже сейчас
                if (currentTrackPath !== trackPath) {
                    console.log("Автозапуск трека:", trackElement.querySelector('h4').innerText);
                    
                    // Вызываем существующую функцию выбора трека
                    // (Предполагается, что в script.js есть selectTrack или логика клика)
                    trackElement.click(); 
                }
            }, 800); 
        }
    });
}, scrollObserverOptions);

// Запускаем наблюдение за всеми треками в чарте
document.querySelectorAll('.music-item').forEach(item => {
    observer.observe(item);
});
let currentIdx = 0;
const slides = document.querySelectorAll('.chart-slide');
const player = document.getElementById('audioPlayer');

function changeSlide(direction) {
    // 1. Плавное затухание текущего трека (Fade Out)
    fadeAudio(0, () => {
        // 2. Переключение слайда
        slides[currentIdx].classList.remove('active');
        currentIdx = (currentIdx + direction + slides.length) % slides.length;
        const nextSlide = slides[currentIdx];
        nextSlide.classList.add('active');

        // 3. Мгновенная смена источника и запуск
        const newPath = nextSlide.getAttribute('data-path');
        player.src = newPath;
        player.volume = 0; // Начинаем с тишины
        player.play().catch(e => console.log("Нужен клик для запуска"));

        // 4. Обновляем инфо в плеере (из твоего script.js)
        if (window.updatePlayerInfo) {
            updatePlayerInfo(
                nextSlide.getAttribute('data-title'),
                nextSlide.getAttribute('data-artist'),
                ''
            );
        }

        // 5. Плавное появление (Fade In)
        fadeAudio(0.7); // 0.7 - целевая громкость
    });
}

// Функция для плавного изменения громкости
function fadeAudio(targetVolume, callback) {
    const step = 0.05; // Насколько сильно меняем громкость за шаг
    const interval = 30; // Скорость (мс)

    const timer = setInterval(() => {
        if (player.volume < targetVolume) {
            player.volume = Math.min(player.volume + step, targetVolume);
        } else {
            player.volume = Math.max(player.volume - step, targetVolume);
        }

        // Если достигли цели
        if (Math.abs(player.volume - targetVolume) < 0.01) {
            clearInterval(timer);
            player.volume = targetVolume;
            if (callback) callback();
        }
    }, interval);
}

// ================================================
// ПЕРЕТАСКИВАНИЕ МИНИ-ПЛЕЕРА
// ================================================

const miniPlayer = document.getElementById('miniPlayer');

if (miniPlayer) {
    let isDragging = false;
    let xOffset = 0;
    let yOffset = 0;

    miniPlayer.addEventListener('mousedown', (e) => {
        // Не тащим, если кликнули по кнопкам, ползунку громкости или прогресс-бару
        if (e.target.closest('button, input[type="range"], .progress-bar-container')) {
            return;
        }

        e.preventDefault();

        // Запоминаем смещение от левого верхнего угла плеера до курсора
        const rect = miniPlayer.getBoundingClientRect();
        xOffset = e.clientX - rect.left;
        yOffset = e.clientY - rect.top;

        isDragging = true;
        miniPlayer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Новые координаты
        let newLeft = e.clientX - xOffset;
        let newTop = e.clientY - yOffset;

        // Ограничиваем, чтобы плеер не ушёл за экран
        const rect = miniPlayer.getBoundingClientRect();
        newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - rect.width - 10));
        newTop = Math.max(10, Math.min(newTop, window.innerHeight - rect.height - 10));

        miniPlayer.style.left = newLeft + 'px';
        miniPlayer.style.top = newTop + 'px';
        miniPlayer.style.bottom = 'auto';      
        miniPlayer.style.transform = 'none';   
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            miniPlayer.style.cursor = 'move';
        }
    });
}

function openTrackMenu(event, btn) {
    event.stopPropagation();
    event.preventDefault();

    // Удаляем все предыдущие меню
    document.querySelectorAll('.track-menu').forEach(menu => menu.remove());

    const card = btn.closest('.music-card');
    if (!card) return;

    const path   = card.getAttribute('data-path');
    const title  = card.getAttribute('data-title') || card.querySelector('h3')?.innerText || 'Трек';
    const artist = card.getAttribute('data-artist') || card.querySelector('p')?.innerText || '';

    // Создаём меню
    const menu = document.createElement('div');
    menu.className = 'track-menu show';
    menu.innerHTML = `
        <button onclick="addToQueue('${path.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}', '${artist.replace(/'/g, "\\'")}')">
            <i>➕</i> Добавить в очередь
        </button>
        <button onclick="addToFavorites('${path.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}', '${artist.replace(/'/g, "\\'")}')">
            <i>❤️</i> В избранное
        </button>
        <button onclick="addToPlaylist('${path.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}', '${artist.replace(/'/g, "\\'")}')">
            <i>📜</i> В плейлист
        </button>
        <button onclick="shareTrack('${title.replace(/'/g, "\\'")}')">
            <i>🔗</i> Поделиться
        </button>
    `;

    // Позиция меню — строго под кнопкой, с учётом скролла
const btnRect = btn.getBoundingClientRect();
const menuWidth = 200; // примерно ширина меню

menu.style.position = 'fixed'; // фиксируем относительно окна, а не body
menu.style.left = `${btnRect.left + window.scrollX + (btnRect.width / 2) - (menuWidth / 2)}px`; // по центру под кнопкой
menu.style.top = `${btnRect.bottom + window.scrollY + 10}px`; // 10px ниже кнопки
menu.style.minWidth = '220px';
menu.style.maxWidth = '280px';

    setTimeout(() => {
        const closeHandler = function(e) {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 10);
}

function addToFavorites(path, title, artist) {
    alert(`"${title}" добавлен в избранное!`);
}

function addToPlaylist(path, title, artist) {
    alert(`"${title}" добавлен в плейлист! (выбери плейлист)`);
}

function shareTrack(title) {
    alert(`Поделиться "${title}" — скопируй ссылку!`);
}

// ================================================
// АВТОРИЗАЦИЯ ЧЕРЕЗ СЕРВЕР + MySQL
// ================================================

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Обновление сайдбара после входа
function updateSidebarAfterLogin() {
    const authContainer = document.querySelector('.sidebar__header .auth-btn') || 
                         document.querySelector('.user-profile');
    
    if (authContainer) {
        authContainer.outerHTML = `
            <div class="user-profile">
                <img src="${currentUser.avatar || 'https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=ff00ff&color=fff'}" 
                     alt="Аватар" 
                     style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--primary-color);">
                <span>${currentUser.username}</span>
                <button onclick="logout()" style="background:none; border:none; color:var(--text-color-faded); cursor:pointer; margin-left:8px; font-size:0.85rem;">Выйти</button>
            </div>
        `;
    }
}

// Выход
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
}

// Открытие модалки
function openAuthModal() {
    document.getElementById('authBox').classList.add('active');
    document.getElementById('authOverlay').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authBox').classList.remove('active');
    document.getElementById('authOverlay').classList.remove('active');

    // Сброс формы и режима
    document.getElementById('authForm').reset();
    document.getElementById('authError').style.display = 'none';
    isReg = false;
    document.getElementById('modalTitle').innerText = 'Вход';
    document.getElementById('switchText').innerText = 'Нет аккаунта?';
    document.getElementById('switchBtn').innerText = 'Зарегистрируйтесь';
    resetAvatarPreview();
}

// Переключение между Вход / Регистрация
let isReg = false;
function toggleReg() {
    isReg = !isReg;
    document.getElementById('modalTitle').innerText = isReg ? 'Регистрация' : 'Вход';
    document.getElementById('avatarBlock').style.display = isReg ? 'block' : 'none';
    
    document.getElementById('switchText').innerText = isReg ? 'Уже есть аккаунт?' : 'Нет аккаунта?';
    document.getElementById('switchBtn').innerText = isReg ? 'Войти' : 'Зарегистрируйтесь';

    document.getElementById('authError').style.display = 'none';
}

// Основная функция отправки формы
async function handleAuthSubmit(event) {
    event.preventDefault();

    const username = document.getElementById('authLogin').value.trim();
    const password = document.getElementById('authPass').value;
    const errorEl = document.getElementById('authError');

    if (!username || !password) {
        errorEl.textContent = 'Введите логин и пароль';
        errorEl.style.display = 'block';
        return;
    }

    let avatar = null;

    // Если выбрана дефолтная аватарка
    if (window.selectedDefaultAvatar) {
        avatar = window.selectedDefaultAvatar;
    }
    // Если загружена своя картинка
    else if (document.getElementById('avatarDataUrl') && document.getElementById('avatarDataUrl').value) {
        avatar = document.getElementById('avatarDataUrl').value;
    }

    const url = isReg ? 'http://localhost:3000/register' : 'http://localhost:3000/login';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, avatar })
        });

        const data = await response.json();

        if (response.ok) {
            if (isReg) {
                alert('✅ Регистрация прошла успешно!\nТеперь можете войти в аккаунт.');

                isReg = false;
                window.selectedDefaultAvatar = null;   
                document.getElementById('modalTitle').innerText = 'Вход';
                document.getElementById('avatarBlock').style.display = 'none';
                document.getElementById('switchText').innerText = 'Нет аккаунта?';
                document.getElementById('switchBtn').innerText = 'Зарегистрируйтесь';

                document.getElementById('authForm').reset();
                document.getElementById('authError').style.display = 'none';
                resetAvatarPreview();

                closeAuthModal();

            } else {
                // Успешный вход
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                updateSidebarAfterLogin();
                closeAuthModal();
            }
        } else {
            errorEl.textContent = data.error || 'Ошибка';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        errorEl.textContent = 'Не удалось подключиться к серверу.';
        errorEl.style.display = 'block';
    }
}

// Превью аватара (для регистрации)
function previewAvatar(input) {
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('imageDisplay').src = e.target.result;
            document.getElementById('imageDisplay').style.display = 'block';
            document.getElementById('plusIcon').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function resetAvatarPreview() {
    document.getElementById('imageDisplay').style.display = 'none';
    document.getElementById('plusIcon').style.display = 'block';
}
function selectDefaultAvatar(src) {
    // Сохраняем выбранную аватарку в скрытое поле
    window.selectedDefaultAvatar = src;

    document.getElementById('imageDisplay').src = src;
    document.getElementById('imageDisplay').style.display = 'block';
    document.getElementById('plusIcon').style.display = 'none';

    // Выделяем выбранную аватарку
    document.querySelectorAll('.default-avatar').forEach(img => {
        img.classList.remove('selected');
        if (img.src === src) img.classList.add('selected');
    });
}