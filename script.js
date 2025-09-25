// --- كود خلفية الماتريكس وتبديل الوضع (لا تغيير) ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const letters = '01'; const fontSize = 16; const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);
function drawMatrix() { ctx.fillStyle = 'rgba(10, 25, 47, 0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#00aaff'; ctx.font = `${fontSize}px arial`; for (let i = 0; i < drops.length; i++) { const text = letters[Math.floor(Math.random() * letters.length)]; ctx.fillText(text, i * fontSize, drops[i] * fontSize); if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) { drops[i] = 0; } drops[i]++; } }
setInterval(drawMatrix, 40);

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const body = document.body;
themeToggleBtn.addEventListener('click', () => { body.classList.toggle('light-mode'); const icon = themeToggleBtn.querySelector('i'); if (body.classList.contains('light-mode')) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); } else { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); } });

// --- كود تسجيل الدخول المطور ---
const loginSection = document.getElementById('login-section');
const contentSection = document.getElementById('content-section');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');

// ***** هذا هو السطر الذي تم تغييره *****
// كلمة المرور الجديدة المشفرة هي: UG9ydGFsQWNjZXNzMjAyNUAh
const correctPasswordHash = "UG9ydGFsQWNjZXNzMjAyNUAh";

function showContent() {
    if (loginSection) loginSection.style.display = 'none';
    if (contentSection) contentSection.style.display = 'block';
    
    // نستدعي الدوال الإضافية فقط إذا كانت موجودة في الصفحة الحالية
    if (typeof addNewBadges === 'function') {
        addNewBadges();
    }
    // هذا السطر خاص بالصفحة الرئيسية فقط
    if (typeof runSmartCounters === 'function') {
        runSmartCounters();
    }
}

function checkPassword() {
    if (btoa(passwordInput.value) === correctPasswordHash) {
        sessionStorage.setItem('isAuthenticated', 'true');
        showContent();
    } else {
        errorMessage.style.display = 'block';
    }
}

// تحقق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isAuthenticated') === 'true') {
        showContent();
    }
});

// ربط الأحداث فقط إذا كانت العناصر موجودة (مهم للصفحة الرئيسية)
if (loginButton) {
    loginButton.addEventListener('click', checkPassword);
}
if (passwordInput) {
    passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkPassword();
    });
}


// --- كود شارة "جديد" والبحث وزر العودة للأعلى (يعمل في كل الصفحات) ---
function addNewBadges() {
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const lectures = document.querySelectorAll('.file-list li');
    lectures.forEach(lecture => {
        const lectureDateStr = lecture.getAttribute('data-date');
        if (lectureDateStr) {
            const lectureDate = new Date(lectureDateStr);
            if ((now - lectureDate < twoDaysInMs) && (now >= lectureDate)) {
                // تعديل بسيط ليضيف الشارة داخل .file-meta إذا كانت موجودة
                const metaSpan = lecture.querySelector('.file-meta');
                if (metaSpan && !metaSpan.querySelector('.new-badge')) {
                    const newBadge = document.createElement('span');
                    newBadge.className = 'new-badge';
                    newBadge.innerText = 'جديد';
                    metaSpan.prepend(newBadge);
                }
            }
        }
    });
}

const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('keyup', () => {
        const filter = searchInput.value.toLowerCase();
        // تعديل ليشمل أقسام المواد في صفحة الأدوات
        const items = document.querySelectorAll('.file-list li, .subject-section');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(filter)) {
                item.style.display = 'flex'; // أو 'block' للأقسام
            } else {
                item.style.display = 'none';
            }
        });
    });
}

const backToTopBtn = document.getElementById('back-to-top-btn');
if (backToTopBtn) {
    const scrollableElement = document.getElementById('content-section') || window;
    scrollableElement.addEventListener('scroll', () => {
        const scrollTop = scrollableElement.scrollTop || document.documentElement.scrollTop;
        if (scrollTop > 100) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    backToTopBtn.addEventListener('click', () => {
        if (scrollableElement.scrollTo) {
            scrollableElement.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}
