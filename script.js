// ==================================================================
// ==== المحرك النهائي للبوابة - الإصدار المبسط (بدون فيديو) ====
// ==================================================================

// --- 1. الإعدادات العامة ونقطة الاتصال ---
const ADMIN_ID = "user-1759622807227";
const MANUS_API_ENDPOINT = "https://manus-api-gateway-1-a22a1057.deta.app/scan";
let db;

// --- 2. دوال التهيئة وقواعد البيانات المحلية ---
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("DigitalLecturesDB", 1);
        request.onupgradeneeded = event => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains('files')) {
                dbInstance.createObjectStore('files', { keyPath: 'id' });
            }
        };
        request.onsuccess = event => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = event => {
            console.error("❌ [DB] Local DB error:", event.target.error);
            reject(event.target.error);
        };
    });
}

function getSections() {
    const defaultSections = [
        { id: 'cpp', name: 'أساسيات لغة C++' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'computer', name: 'مهارات الحاسوب' },
        { id: 'islamic', name: 'الثقافة الإسلامية' },
        { id: 'tools', name: 'أدوات المطور' }
    ];
    const userSections = JSON.parse(localStorage.getItem('userSections')) || [];
    return [...defaultSections, ...userSections];
}

function getIconForSection(sectionName) {
    const name = sectionName.toLowerCase();
    const iconMap = { 'c++': 'fa-code', 'رياضيات': 'fa-calculator', 'حاسوب': 'fa-laptop', 'اسلامية': 'fa-book-quran', 'انجليزي': 'fa-language', 'شبكات': 'fa-network-wired', 'تصميم': 'fa-palette', 'أمن': 'fa-shield-halved', 'فيزياء': 'fa-atom', 'كيمياء': 'fa-flask-vial', 'إدارة': 'fa-briefcase', 'اقتصاد': 'fa-chart-line', 'أدوات': 'fa-screwdriver-wrench' };
    for (const key in iconMap) { if (name.includes(key)) return iconMap[key]; }
    return 'fa-folder-open';
}

// --- 3. نظام التشغيل الأولي والتسلسل المنطقي ---
document.addEventListener('DOMContentLoaded', async () => {
    // تهيئة الأنظمة الأساسية أولاً
    applySavedTheme();
    try { await initDB(); } catch (error) { console.error("Failed to init DB:", error); }
    initializeSupportSystem();

    // هذا الكود خاص بالصفحة الرئيسية فقط (index.html)
    if (document.getElementById('main-subjects-grid')) {
        const loader = document.getElementById('loader');
        const authSection = document.getElementById('auth-section');
        const contentSection = document.getElementById('content-section');
        const session = JSON.parse(sessionStorage.getItem('userSession'));

        // إخفاء شاشة التحميل بعد فترة قصيرة
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1500);
        }

        // التحقق من وجود جلسة نشطة
        if (session && session.isAuthenticated && new Date().getTime() < session.expiry) {
            authSection.style.display = 'none';
            contentSection.style.display = 'block';
            initializePageFunctions();
        } else {
            authSection.style.display = 'block';
            contentSection.style.display = 'none';
            setupAuthListeners();
        }
    } else { // هذا الكود للصفحات الفرعية
        setupPageContent();
        setupCommonListeners();
    }
});


// --- 4. نظام المصادقة والجولات التعليمية ---
function setupAuthListeners() {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    if (!loginView || !registerView) return;

    document.getElementById('show-register-view').addEventListener('click', (e) => { e.preventDefault(); loginView.style.display = 'none'; registerView.style.display = 'block'; });
    document.getElementById('show-login-view').addEventListener('click', (e) => { e.preventDefault(); registerView.style.display = 'none'; loginView.style.display = 'block'; });
    document.getElementById('register-button').addEventListener('click', handleRegister);
    document.getElementById('copy-id-button').addEventListener('click', handleCopyId);
    document.getElementById('proceed-to-content-button').addEventListener('click', handleProceed);
    document.getElementById('login-button').addEventListener('click', handleLogin);
    document.getElementById('login-password-input').addEventListener('keyup', (e) => e.key === 'Enter' && handleLogin());
    document.getElementById('login-id-input').addEventListener('keyup', (e) => e.key === 'Enter' && handleLogin());
}

function handleRegister() {
    const password = document.getElementById('register-password-input').value;
    if (password.length < 4) { alert('كلمة المرور يجب أن تتكون من 4 أحرف على الأقل.'); return; }
    const newId = `user-${Date.now()}`;
    localStorage.setItem(newId, btoa(password));
    localStorage.setItem(`tourCompleted_${newId}`, 'false');
    document.getElementById('generated-id').textContent = newId;
    document.getElementById('register-view').style.display = 'none';
    document.getElementById('id-display-view').style.display = 'block';
}

function handleCopyId() {
    navigator.clipboard.writeText(document.getElementById('generated-id').textContent).then(() => {
        const msg = document.getElementById('copy-success-message');
        msg.style.display = 'block';
        document.getElementById('proceed-to-content-button').disabled = false;
        setTimeout(() => { msg.style.display = 'none'; }, 2000);
    });
}

function handleProceed() {
    const userId = document.getElementById('generated-id').textContent;
    const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    sessionStorage.setItem('userSession', JSON.stringify({ userId, isAuthenticated: true, expiry: expiryTime }));
    window.location.reload();
}

function handleLogin() {
    const id = document.getElementById('login-id-input').value;
    const password = document.getElementById('login-password-input').value;
    const errorMsg = document.getElementById('login-error-message');
    if (!id || !password) { errorMsg.textContent = "الرجاء إدخال البيانات كاملة."; errorMsg.style.display = 'block'; return; }
    const storedPass = localStorage.getItem(id);
    if (storedPass && btoa(password) === storedPass) {
        const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        sessionStorage.setItem('userSession', JSON.stringify({ userId: id, isAuthenticated: true, expiry: expiryTime }));
        window.location.reload();
    } else {
        errorMsg.textContent = "البيانات غير صحيحة."; errorMsg.style.display = 'block';
    }
}

function startOnboardingTour(userId, onFinishCallback) {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) {
        if (onFinishCallback) onFinishCallback();
        return;
    }
    const steps = modal.querySelectorAll('.tour-step');
    let currentStep = 0;
    const showStep = (index) => steps.forEach((step, i) => step.classList.toggle('active', i === index));
    
    const finishTour = () => {
        modal.classList.remove('active');
        localStorage.setItem(`tourCompleted_${userId}`, 'true');
        if (onFinishCallback) onFinishCallback();
    };

    modal.querySelectorAll('.tour-next').forEach(btn => btn.addEventListener('click', () => {
        currentStep++;
        if (currentStep < steps.length) {
            showStep(currentStep);
        } else {
            finishTour();
        }
    }));
    modal.querySelectorAll('.tour-prev').forEach(btn => btn.addEventListener('click', () => {
        currentStep--;
        if (currentStep >= 0) showStep(currentStep);
    }));
    modal.querySelectorAll('.tour-finish').forEach(btn => btn.addEventListener('click', finishTour));
    
    modal.classList.add('active');
    showStep(currentStep);
}
// ==================================================================
// =================== بداية الجزء الثاني ===========================
// ==================================================================

// --- 5. الوظائف العامة بعد تسجيل الدخول ---
function initializePageFunctions() {
    setupPageContent();
    if (document.getElementById('upload-section')) {
        setupUploadListeners();
        showProgrammingTip();
    }
    runSmartCounters();
    setupCommonListeners();

    // *** المنطق الجديد: التحقق من الجولة التعليمية بعد تسجيل الدخول ***
    const session = JSON.parse(sessionStorage.getItem('userSession'));
    if (session) {
        const hasCompletedTour = localStorage.getItem(`tourCompleted_${session.userId}`);
        if (hasCompletedTour !== 'true') {
            // ابدأ الجولة التعليمية، وعند الانتهاء، اعرض نافذة الدعم
            startOnboardingTour(session.userId, () => {
                const supportModal = document.getElementById('onecash-support-modal');
                if (supportModal && window.updateSupportState) {
                    window.updateSupportState(0);
                    supportModal.classList.add('active');
                }
            });
        }
    }
}

function setupCommonListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const filter = searchInput.value.toLowerCase();
            document.querySelectorAll('.file-list li, .subject-card-wrapper, .subject-section').forEach(item => {
                const isVisible = item.textContent.toLowerCase().includes(filter);
                item.style.display = isVisible ? (item.tagName === 'LI' ? 'flex' : 'block') : 'none';
            });
        });
    }
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.style.display = window.scrollY > 100 ? 'block' : 'none';
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    const helpBtn = document.getElementById('help-tour-btn');
    if(helpBtn) {
        helpBtn.addEventListener('click', () => {
            const session = JSON.parse(sessionStorage.getItem('userSession'));
            if (session) {
                // عند الضغط على زر المساعدة، ابدأ الجولة فقط
                startOnboardingTour(session.userId, () => console.log("Help tour finished."));
            }
        });
    }

    const themeModal = document.getElementById('theme-picker-modal');
    const themeBtn = document.getElementById('theme-settings-btn');
    if(themeModal && themeBtn) {
        themeBtn.addEventListener('click', () => themeModal.classList.add('active'));
        themeModal.querySelector('.close-modal-btn').addEventListener('click', () => themeModal.classList.remove('active'));
        themeModal.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                applyTheme(theme);
                localStorage.setItem('selectedTheme', theme);
                themeModal.classList.remove('active');
            });
        });
    }
}

function applyTheme(theme) {
    document.body.className = theme;
    const themeOptions = document.querySelectorAll('.theme-option');
    if (themeOptions.length > 0) {
        themeOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });
    }
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'theme-aurora';
    applyTheme(savedTheme);
}

// --- 6. منطق الرفع والفحص (النسخة المتصلة بـ "مانوس") ---
function setupUploadListeners() {
    let selectedFile = null;
    let lastAddedFileId = null;
    let undoTimeout;

    const steps = { 1: document.getElementById('step-1-file'), 2: document.getElementById('step-2-details'), 3: document.getElementById('step-3-destination') };
    const goToStep = (stepNum) => Object.values(steps).forEach((s, i) => s && s.classList.toggle('active', i + 1 === stepNum));

    const fileInput = document.getElementById('file-input');
    const fileDropArea = document.querySelector('.file-drop-area');
    if(!fileInput || !fileDropArea) return;

    fileDropArea.addEventListener('click', () => fileInput.click());
    fileDropArea.addEventListener('dragover', (e) => { e.preventDefault(); fileDropArea.classList.add('dragover'); });
    fileDropArea.addEventListener('dragleave', () => fileDropArea.classList.remove('dragover'));
    fileDropArea.addEventListener('drop', (e) => { e.preventDefault(); fileDropArea.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) { selectedFile = e.dataTransfer.files[0]; document.querySelector('#selected-file-info span').textContent = selectedFile.name; goToStep(2); } });
    fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) { selectedFile = fileInput.files[0]; document.querySelector('#selected-file-info span').textContent = selectedFile.name; goToStep(2); } });

    document.getElementById('back-to-step-1').addEventListener('click', () => goToStep(1));
    document.getElementById('next-to-step-3').addEventListener('click', () => { if (!document.getElementById('file-display-name-input').value.trim() || !document.getElementById('user-name-input').value.trim()) { alert('الرجاء إدخال اسم وصفي للملف واسمك.'); return; } goToStep(3); });
    document.getElementById('back-to-step-2').addEventListener('click', () => goToStep(2));

    const modal = document.getElementById('add-section-modal');
    document.getElementById('add-new-section-btn').addEventListener('click', () => modal.classList.add('active'));
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => e.target === modal && modal.classList.remove('active'));
    document.getElementById('create-section-btn').addEventListener('click', () => { const newName = document.getElementById('new-section-name-input').value.trim(); if (newName.length < 3) { alert('اسم القسم يجب أن يكون 3 أحرف على الأقل.'); return; } const newId = `sec-${Date.now()}`; const userSections = JSON.parse(localStorage.getItem('userSections')) || []; userSections.push({ id: newId, name: newName }); localStorage.setItem('userSections', JSON.stringify(userSections)); populateSections(); document.getElementById('section-selector').value = newId; modal.classList.remove('active'); document.getElementById('new-section-name-input').value = ''; displayUserAddedSections(); });

    document.getElementById('upload-button').addEventListener('click', async () => {
        const sectionSelector = document.getElementById('section-selector');
        if (!sectionSelector.value) { alert('الرجاء تحديد القسم.'); return; }
        
        const uploadStatus = document.getElementById('upload-status');
        const statusItems = { scanning: document.getElementById('status-scanning'), success: document.getElementById('status-success'), error: document.getElementById('status-error') };
        
        goToStep(0);
        uploadStatus.style.display = 'block';
        Object.values(statusItems).forEach(s => s.classList.remove('active'));
        statusItems.scanning.classList.add('active');
        document.getElementById('scan-progress').textContent = '...جاري الاتصال بـ "مانوس"';

        try {
            await scanFileWithManus(selectedFile);
            
            document.getElementById('scan-progress').textContent = 'آمن! جاري الحفظ...';
            const fileId = await addFileToStorage(selectedFile, sectionSelector.value, document.getElementById('user-name-input').value.trim(), document.getElementById('file-display-name-input').value.trim());
            lastAddedFileId = fileId;

            Object.values(statusItems).forEach(s => s.classList.remove('active'));
            statusItems.success.classList.add('active');
            
            let timeLeft = 5;
            const undoTimerSpan = document.getElementById('undo-timer');
            const undoButton = document.getElementById('undo-button');
            undoTimerSpan.textContent = timeLeft;
            undoButton.disabled = false;
            undoTimeout = setInterval(() => {
                timeLeft--;
                undoTimerSpan.textContent = timeLeft;
                if (timeLeft <= 0) { clearInterval(undoTimeout); undoButton.disabled = true; lastAddedFileId = null; uploadStatus.style.display = 'none'; goToStep(1); }
            }, 1000);

        } catch (error) {
            Object.values(statusItems).forEach(s => s.classList.remove('active'));
            statusItems.error.classList.add('active');
            document.getElementById('error-reason').textContent = error.message || "حدث خطأ غير متوقع.";
        }
    });

    document.getElementById('undo-button').addEventListener('click', () => {
        if (lastAddedFileId) {
            deleteFileFromStorage(lastAddedFileId);
            alert('تم التراجع عن الإضافة.');
            lastAddedFileId = null;
            clearInterval(undoTimeout);
            document.getElementById('upload-status').style.display = 'none';
            goToStep(1);
        }
    });
}

async function scanFileWithManus(file) {
    if (!file) throw new Error("لم يتم تحديد أي ملف.");
    const formData = new FormData();
    formData.append("file", file);
    try {
        const response = await fetch(MANUS_API_ENDPOINT, { method: 'POST', body: formData });
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `فشل الاتصال بالخادم. الحالة: ${response.status}`);
        }
        const result = await response.json();
        if (result.decision !== 'accepted') {
            throw new Error(result.reason || 'تم رفض الملف من قبل "مانوس".');
        }
        return true;
    } catch (error) {
        console.error('[Manus Connection Error]', error);
        throw new Error(error.message.includes('Failed to fetch') ? 'فشل الاتصال بـ "مانوس". يرجى التحقق من اتصالك بالإنترنت.' : error.message);
    }
}
// ==================================================================
// =================== بداية الجزء الثالث ===========================
// ==================================================================

// --- 7. دوال التخزين والعرض ---
function addFileToStorage(file, sectionId, userName, fileDisplayName) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("قاعدة البيانات غير جاهزة.");
        const session = JSON.parse(sessionStorage.getItem('userSession'));
        const fileId = `file-${Date.now()}`;
        const metadata = { id: fileId, section: sectionId, fileName: fileDisplayName, originalFileName: file.name, userName, userId: session.userId, date: new Date().toISOString().split('T')[0] };
        const fileRecord = { id: fileId, blob: file };
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.add(fileRecord);
        request.oncomplete = () => {
            const allMetadata = JSON.parse(localStorage.getItem('userUploadedFiles')) || [];
            allMetadata.push(metadata);
            localStorage.setItem('userUploadedFiles', JSON.stringify(allMetadata));
            runSmartCounters();
            resolve(fileId);
        };
        request.onerror = (event) => reject("فشل في حفظ الملف.");
    });
}

function deleteFileFromStorage(fileId) {
    if (!db) { alert("قاعدة البيانات غير جاهزة."); return; }
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    store.delete(fileId);
    transaction.oncomplete = () => {
        let allMetadata = JSON.parse(localStorage.getItem('userUploadedFiles')) || [];
        allMetadata = allMetadata.filter(item => item.id !== fileId);
        localStorage.setItem('userUploadedFiles', JSON.stringify(allMetadata));
        const fileElement = document.querySelector(`li[data-item-id="${fileId}"]`);
        if (fileElement) {
            fileElement.classList.add('removing');
            setTimeout(() => fileElement.remove(), 500);
        }
        runSmartCounters();
    };
}

function setupPageContent() {
    if (document.getElementById('main-subjects-grid')) { 
        displayUserAddedSections(); 
        populateSections(); 
    }
    const pageFileName = window.location.pathname.split('/').pop();
    const defaultSection = getSections().find(sec => pageFileName.includes(sec.id));
    if (defaultSection) {
        displayFilesForSection(defaultSection.id);
    } else if (pageFileName.includes('section.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const sectionIdFromUrl = urlParams.get('id');
        if (sectionIdFromUrl) {
            const allSections = getSections();
            const currentSection = allSections.find(sec => sec.id === sectionIdFromUrl);
            if (currentSection) {
                document.title = currentSection.name;
                const header = document.querySelector('#content-section h1');
                const p = document.querySelector('#content-section p');
                if(header) header.innerHTML = `<i class="fa-solid ${getIconForSection(currentSection.name)} subject-icon-large"></i> ${currentSection.name}`;
                if(p) p.textContent = `جميع الملفات والمساهمات الخاصة بقسم ${currentSection.name}.`;
                displayFilesForSection(currentSection.id);
            }
        }
    }
}

function populateSections() { 
    const selector = document.getElementById('section-selector'); 
    if (!selector) return; 
    selector.innerHTML = '<option value="" disabled selected>:: اختر القسم المطلوب ::</option>'; 
    getSections().forEach(sec => { 
        if (sec.id === 'tools') return; 
        const option = document.createElement('option'); 
        option.value = sec.id; 
        option.textContent = sec.name; 
        selector.appendChild(option); 
    }); 
}

function displayUserAddedSections() {
    const grid = document.getElementById('main-subjects-grid');
    if (!grid) return;
    grid.querySelectorAll('.user-added-section').forEach(el => el.remove());
    const userSections = JSON.parse(localStorage.getItem('userSections')) || [];
    const session = JSON.parse(sessionStorage.getItem('userSession'));
    const isAdmin = session && session.userId === ADMIN_ID;
    userSections.forEach(sec => {
        const wrapper = document.createElement('div');
        wrapper.className = 'subject-card-wrapper user-added-section';
        wrapper.dataset.secId = sec.id;
        let adminBtns = '';
        if (isAdmin) { adminBtns = `<div class="card-admin-buttons"><button class="card-admin-btn edit" title="تعديل"><i class="fa-solid fa-pen"></i></button><button class="card-admin-btn delete" title="حذف"><i class="fa-solid fa-trash"></i></button></div>`; }
        wrapper.innerHTML = `<a href="section.html?id=${sec.id}" class="subject-card">${adminBtns}<i class="fa-solid ${getIconForSection(sec.name)} subject-icon-large"></i><h3>${sec.name}</h3><p>قسم أضافه المستخدمون.</p></a>`;
        grid.appendChild(wrapper);
        if (isAdmin) {
            wrapper.querySelector('.edit').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleEditSection(sec.id); });
            wrapper.querySelector('.delete').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleDeleteSection(sec.id); });
        }
    });
}

function handleEditSection(sectionId) { 
    let sections = JSON.parse(localStorage.getItem('userSections')) || []; 
    const section = sections.find(s => s.id === sectionId); 
    if (!section) return; 
    const newName = prompt(`أدخل الاسم الجديد للقسم "${section.name}":`, section.name); 
    if (newName && newName.trim()) { 
        section.name = newName.trim(); 
        localStorage.setItem('userSections', JSON.stringify(sections)); 
        displayUserAddedSections(); 
    } 
}

function handleDeleteSection(sectionId) {
    let sections = JSON.parse(localStorage.getItem('userSections')) || [];
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    if (confirm(`تحذير: سيتم حذف القسم "${section.name}" وكل الملفات المتعلقة به نهائياً. هل أنت متأكد؟`)) {
        sections = sections.filter(s => s.id !== sectionId);
        localStorage.setItem('userSections', JSON.stringify(sections));
        let allMetadata = JSON.parse(localStorage.getItem('userUploadedFiles')) || [];
        const filesToDelete = allMetadata.filter(f => f.section === sectionId);
        const remainingFiles = allMetadata.filter(f => f.section !== sectionId);
        localStorage.setItem('userUploadedFiles', JSON.stringify(remainingFiles));
        if (db) {
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            filesToDelete.forEach(fileMeta => store.delete(fileMeta.id));
        }
        document.querySelector(`.subject-card-wrapper[data-sec-id="${sectionId}"]`)?.remove();
        alert('تم حذف القسم والملفات المتعلقة به.');
        runSmartCounters();
    }
}

function getIconForFile(fileName) {
    if (!fileName) return { icon: 'fa-file', color: '#9ca3af' };
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = { 'pdf': { icon: 'fa-file-pdf', color: '#ef4444' }, 'doc': { icon: 'fa-file-word', color: '#3b82f6' }, 'docx': { icon: 'fa-file-word', color: '#3b82f6' }, 'ppt': { icon: 'fa-file-powerpoint', color: '#f97316' }, 'pptx': { icon: 'fa-file-powerpoint', color: '#f97316' }, 'xls': { icon: 'fa-file-excel', color: '#22c55e' }, 'xlsx': { icon: 'fa-file-excel', color: '#22c55e' }, 'zip': { icon: 'fa-file-zipper', color: '#f59e0b' }, 'rar': { icon: 'fa-file-zipper', color: '#f59e0b' }, 'mp3': { icon: 'fa-file-audio', color: '#8b5cf6' }, 'wav': { icon: 'fa-file-audio', color: '#8b5cf6' }, 'mp4': { icon: 'fa-file-video', color: '#ec4899' }, 'mov': { icon: 'fa-file-video', color: '#ec4899' }, 'jpg': { icon: 'fa-file-image', color: '#06b6d4' }, 'jpeg': { icon: 'fa-file-image', color: '#06b6d4' }, 'png': { icon: 'fa-file-image', color: '#06b6d4' }, 'txt': { icon: 'fa-file-lines', color: '#6b7280' } };
    return iconMap[extension] || { icon: 'fa-file', color: '#9ca3af' };
}

function displayFilesForSection(sectionId) {
    const fileList = document.querySelector('.file-list');
    if (!fileList) return;
    const originalLectures = { 'cpp': [ { name: 'اساسيات في لغة C++ (المعاملات).pdf', link: 'https://drive.google.com/file/d/1EXjRbu89Zagu6-xSJm6iPXErxSSiKEYF/view?usp=drivesdk' }, { name: 'المحاضرة الاولى اساسيات لغةC++.pdf', link: 'https://drive.google.com/file/d/1R4FCjCnv86f6xMU41vxS44NqdtN0By2b/view?usp=drivesdk' }, { name: 'المحاضرة الثانية برمجه اساسيات لغة C++.pdf', link: 'https://drive.google.com/file/d/1Qv-fpUiCKcBEt19yn3M3_oFmsWQNVMaT/view?usp=drivesdk' }, { name: 'المحاضرة الثالثه اساسيات لغةC++.pdf', link: 'https://drive.google.com/file/d/1RmreFCLe6AFGB-A6c-XkCqr8tuLsNOFK/view?usp=drivesdk' }, { name: 'المحاضرة الرابعه الإدخال والإخراج والثوابت لغةC++.pdf', link: 'https://drive.google.com/file/d/1RsGBUyBGG3Px1a65to7XNQRhuQgyvrS7/view?usp=drivesdk' }, { name: 'الخوارزميات والمخططات الإنسيابيه.pdf', link: 'https://drive.google.com/file/d/1RwjtfUWF4jNXiOYfBnfeovCheh_05e4T/view?usp=drivesdk' } ], 'math': [ { name: '(1) مستند من تكليف الرياضيات.pdf', link: 'https://drive.google.com/file/d/1R4lrRqOcFUn0ZusdeMCkhrkA1amBNSoS/view?usp=drivesdk' }, { name: 'رياضيات متقطعه (المنطق الرياضي).pdf', link: 'https://drive.google.com/file/d/1R24mOLOwyZmIg_XAd0HRhk5rZa9umJf2/view?usp=drivesdk' }, { name: 'الرياضيات المجموعات (الفئات).pdf', link: 'https://drive.google.com/file/d/1R5YHazCz7AVGxpbGFbQGk0MXDIqQVgnJ/view?usp=drivesdk' }, { name: 'مقرر الرياضيات 1 (المتباينات).pdf', link: 'https://drive.google.com/file/d/1TLvTAzVwVGqV_WzauSu9kJpRC1DCmJyW/view?usp=drivesdk' }, { name: '(1) تكليف في مادة الرياضيات المتقطعه.pdf', link: 'https://drive.google.com/file/d/1Qt3CkJIwDZlGAr9uXdKqA5IGstq1XFiJ/view?usp=drivesdk' } ], 'computer': [ { name: 'مقرر النظري مهارة الحاسوب.pdf', link: 'https://drive.google.com/file/d/1QprlyoF4ZwBND9zyTSzZXd8HsD349bQ_/view?usp=drivesdk' } ], 'islamic': [ { name: 'صوتيات د.أحمد عامر.mp3', link: 'https://drive.google.com/file/d/1SaeAS7THdvptzNLBtgBYJx8qnL91cVq_/view?usp=drivesdk' } ] };
    fileList.innerHTML = ''; 
    if (originalLectures[sectionId]) {
        originalLectures[sectionId].forEach(lecture => {
            const { icon, color } = getIconForFile(lecture.name);
            const li = document.createElement('li');
            li.innerHTML = `<div class="file-info"><div class="file-icon-wrapper" style="background-color: ${color}33; color: ${color};"><i class="fa-solid ${icon}"></i></div><div class="file-details"><span class="file-name">${lecture.name}</span><span class="file-meta">محاضرة أساسية</span></div></div><div class="file-buttons"><a href="${lecture.link}" target="_blank" class="primary-btn download-btn"><i class="fa-solid fa-download"></i> تحميل</a></div>`;
            fileList.appendChild(li);
        });
    }
    const allMetadata = JSON.parse(localStorage.getItem('userUploadedFiles')) || [];
    const sectionFiles = allMetadata.filter(file => file.section === sectionId);
    const session = JSON.parse(sessionStorage.getItem('userSession'));
    const currentUserId = session ? session.userId : null;
    const isAdmin = currentUserId === ADMIN_ID;
    sectionFiles.forEach(fileMeta => {
        const { icon, color } = getIconForFile(fileMeta.originalFileName);
        const li = document.createElement('li');
        li.className = 'user-added';
        li.dataset.itemId = fileMeta.id;
        let adminButtonsHTML = (isAdmin || (currentUserId && fileMeta.userId === currentUserId)) ? `<button class="secondary-btn delete-btn" title="حذف"><i class="fa-solid fa-trash"></i></button>` : '';
        li.innerHTML = `<div class="file-info"><div class="file-icon-wrapper" style="background-color: ${color}33; color: ${color};"><i class="fa-solid ${icon}"></i></div><div class="file-details"><span class="file-name">${fileMeta.fileName}</span><span class="file-meta">أُضيف بواسطة: ${fileMeta.userName} بتاريخ: ${fileMeta.date.replace(/-/g, '/')}</span></div></div><div class="file-buttons">${adminButtonsHTML}<button class="primary-btn download-btn"><i class="fa-solid fa-download"></i> تحميل</button></div>`;
        li.querySelector('.download-btn').onclick = () => downloadFile(fileMeta.id, fileMeta.originalFileName);
        if (li.querySelector('.delete-btn')) { li.querySelector('.delete-btn').onclick = () => { if (confirm(`هل أنت متأكد من حذف ملف "${fileMeta.fileName}"؟`)) { deleteFileFromStorage(fileMeta.id); } }; }
        fileList.appendChild(li);
    });
}

function downloadFile(fileId, originalFileName) {
    if (!db) { alert("قاعدة البيانات غير جاهزة، يرجى المحاولة مرة أخرى."); return; }
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    const request = store.get(fileId);
    request.onsuccess = (event) => {
        const record = event.target.result;
        if (record && record.blob) {
            const url = URL.createObjectURL(record.blob);
            const a = document.createElement('a');
            a.style.display = 'none'; a.href = url; a.download = originalFileName;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); a.remove();
        } else { alert(`عذراً، لم يتم العثور على محتوى الملف.`); }
    };
    request.onerror = (event) => alert('حدث خطأ أثناء محاولة تحميل الملف.');
}

// --- 8. ميزات إضافية (عدادات، نصائح) ---
function runSmartCounters() {
    const lecturesCounter = document.getElementById('lectures-counter');
    if (!lecturesCounter) return;
    const userFiles = (JSON.parse(localStorage.getItem('userUploadedFiles')) || []).length;
    const baseLectures = 13;
    lecturesCounter.textContent = baseLectures + userFiles;
    const userSections = (JSON.parse(localStorage.getItem('userSections')) || []).length;
    const baseSections = 4;
    document.getElementById('subjects-counter').textContent = baseSections + userSections;
    document.getElementById('tools-counter').textContent = 9;
}

function showProgrammingTip() {
    const tipContainer = document.getElementById('tip-container');
    if (!tipContainer) return;
    const tips = ["دائماً اكتب الكود كما لو أن الشخص الذي سيقوم بصيانته هو شخص عنيف ومضطرب نفسياً يعرف أين تسكن.", "أفضل رسالة خطأ هي تلك التي لا تظهر أبداً.", "قياس تقدم البرمجة بعدد أسطر الكود يشبه قياس تقدم بناء الطائرات بوزنها.", "أولاً، قم بحل المشكلة. ثم، اكتب الكود.", "أي أحمق يمكنه كتابة كود يفهمه الحاسوب. المبرمجون الجيدون يكتبون كوداً يفهمه البشر."];
    document.getElementById('programming-tip').textContent = tips[Math.floor(Math.random() * tips.length)];
}

// --- 9. نظام الدعم (النسخة النهائية المصححة) ---
function initializeSupportSystem() {
    const supportModal = document.getElementById('onecash-support-modal');
    if (!supportModal) return;

    const supportBtn = document.getElementById('support-btn');
    const closeModalBtn = supportModal.querySelector('.close-modal-btn');
    const simNextBtn = document.getElementById('sim-next-btn');
    const simPrevBtn = document.getElementById('sim-prev-btn');
    const copyBtn = document.getElementById('copy-number-btn');
    const copySuccessMsg = document.getElementById('copy-support-success');
    const phoneNumberSpan = document.getElementById('onecash-number');
    const animatedPointer = document.getElementById('animated-pointer');
    const simPhoneNumber = document.getElementById('sim-phone-number');
    const simAmount = document.getElementById('sim-amount');

    const explanationSteps = supportModal.querySelectorAll('.explanation-step');
    const simulationScreens = supportModal.querySelectorAll('.simulation-screen');
    const copyNumberCard = supportModal.querySelector('.support-number-card');
    const agentNote = supportModal.querySelector('.agent-note');

    let currentStep = 0;
    const pointerPositions = { 1: { top: '35%', left: '25%' }, 2: { top: '25%', left: '50%' }, 3: { top: '30%', left: '50%' }, 4: { top: '75%', left: '50%' } };

    function updateState(step) {
        currentStep = step;
        explanationSteps.forEach((el, i) => el.classList.toggle('active', i === step));
        const screenToShow = (step > 0 && step < 5) ? step : (step === 5 ? 4 : 1);
        simulationScreens.forEach((el, i) => el.classList.toggle('active', (i + 1) === screenToShow));
        if (pointerPositions[step]) {
            animatedPointer.style.display = 'block';
            animatedPointer.style.top = pointerPositions[step].top;
            animatedPointer.style.left = pointerPositions[step].left;
        } else {
            animatedPointer.style.display = 'none';
        }
        if (step === 3) {
            simPhoneNumber.textContent = '778944857';
            simAmount.textContent = '500';
        } else {
            simPhoneNumber.textContent = '';
            simAmount.textContent = '';
        }
        copyNumberCard.style.display = (step === 5) ? 'flex' : 'none';
        agentNote.style.display = (step === 5) ? 'block' : 'none';
        simPrevBtn.disabled = (step === 0);
        if (step === 0) {
            simNextBtn.innerHTML = 'ابدأ <i class="fa-solid fa-arrow-left"></i>';
        } else if (step === 5) {
            simNextBtn.innerHTML = 'إنهاء';
        } else {
            simNextBtn.innerHTML = 'التالي <i class="fa-solid fa-arrow-left"></i>';
        }
    }
    
    window.updateSupportState = updateState;

    function openSupportModal() {
        updateState(0);
        supportModal.classList.add('active');
    }
    function closeSupportModal() {
        supportModal.classList.remove('active');
    }

    if (supportBtn) supportBtn.addEventListener('click', openSupportModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSupportModal);
    if (simNextBtn) simNextBtn.addEventListener('click', () => {
        if (currentStep < 5) {
            updateState(currentStep + 1);
        } else {
            closeSupportModal();
        }
    });
    if (simPrevBtn) simPrevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            updateState(currentStep - 1);
        }
    });
    if (copyBtn) copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(phoneNumberSpan.textContent).then(() => {
            copySuccessMsg.style.display = 'block';
            setTimeout(() => {
                copySuccessMsg.style.display = 'none';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('فشل نسخ الرقم');
        });
    });
}
