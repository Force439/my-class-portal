// ==================================================================
// ==== المحرك النهائي للبوابة - إصدار "ManusGuard" مع لوحة تحكم ====
// ==================================================================
//            هذا الكود هو تجسيد لذكاء وقرارات "مانوس"
//              يعمل بشكل مستقل، قوي، وفوري.
// ==================================================================

// --- 1. الإعدادات العامة ---
const ADMIN_ID = "user-1759774462780";
let db;
let nsfwModel = null;

// --- 2. دوال التهيئة وقواعد البيانات المحلية ---
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("DigitalLecturesDB", 2);
        request.onupgradeneeded = event => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains('files')) {
                dbInstance.createObjectStore('files', { keyPath: 'id' });
            }
        };
        request.onsuccess = event => {
            db = event.target.result;
            console.log("✅ [DB] Local file database initialized.");
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
    applySavedTheme();
    initializeSupportSystem();

    try {
        await initDB();
    } catch (error) {
        console.error("Failed to init DB:", error);
    }

    if (document.getElementById('main-subjects-grid')) {
        const loader = document.getElementById('loader');
        const authSection = document.getElementById('auth-section');
        const contentSection = document.getElementById('content-section');
        const session = JSON.parse(sessionStorage.getItem('userSession'));

        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1500);
        }

        if (session && session.isAuthenticated && new Date().getTime() < session.expiry) {
            authSection.style.display = 'none';
            contentSection.style.display = 'block';
            await initializePageFunctions();
        } else {
            authSection.style.display = 'block';
            contentSection.style.display = 'none';
            setupAuthListeners();
        }
    } else {
        // للصفحات الفرعية
        await setupPageContent();
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
// --- 5. الوظائف العامة بعد تسجيل الدخول ---
async function initializePageFunctions() {
    // **جديد**: تهيئة نظام الأخبار
    initializeAdminPanel();
    loadAndDisplayAnnouncements();

    setupPageContent();
    if (document.getElementById('upload-section')) {
        await loadNsfwModelAndShowPopup();
        setupUploadListeners();
        showProgrammingTip();
    }
    runSmartCounters();
    setupCommonListeners();

    const session = JSON.parse(sessionStorage.getItem('userSession'));
    if (session) {
        const hasCompletedTour = localStorage.getItem(`tourCompleted_${session.userId}`);
        if (hasCompletedTour !== 'true') {
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

// --- 5.1. **جديد**: دوال نظام إدارة الأخبار ---

// دالة لتهيئة لوحة تحكم المدير
function initializeAdminPanel() {
    const session = JSON.parse(sessionStorage.getItem('userSession'));
    const adminPanel = document.getElementById('admin-panel-card');
    
    // تحقق إذا كان المستخدم هو المدير
    if (session && session.userId === ADMIN_ID && adminPanel) {
        adminPanel.style.display = 'block'; // إظهار لوحة التحكم

        const postBtn = document.getElementById('post-announcement-btn');
        const announcementInput = document.getElementById('announcement-input');

        postBtn.addEventListener('click', () => {
            const text = announcementInput.value.trim();
            if (text) {
                const newAnnouncement = {
                    id: `anno-${Date.now()}`,
                    text: text,
                    date: new Date().toISOString()
                };

                // حفظ الخبر الجديد وإعادة عرضه
                const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
                announcements.unshift(newAnnouncement); // إضافة الخبر الجديد في البداية
                saveAnnouncements(announcements);
                displayAnnouncements(announcements);

                announcementInput.value = ''; // تفريغ حقل الإدخال
                alert('تم نشر الخبر بنجاح!');
            } else {
                alert('الرجاء كتابة نص الخبر قبل النشر.');
            }
        });
    }
}

// دالة لتحميل وعرض الأخبار من LocalStorage
function loadAndDisplayAnnouncements() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    displayAnnouncements(announcements);
}

// دالة لحفظ مصفوفة الأخبار في LocalStorage
function saveAnnouncements(announcements) {
    localStorage.setItem('announcements', JSON.stringify(announcements));
}

// دالة لعرض الأخبار في الصفحة
function displayAnnouncements(announcements) {
    const listContainer = document.getElementById('announcements-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // تفريغ القائمة قبل إعادة العرض

    if (announcements.length === 0) {
        listContainer.innerHTML = '<p>لا توجد أخبار هامة حالياً.</p>';
        return;
    }

    const session = JSON.parse(sessionStorage.getItem('userSession'));
    const isAdmin = session && session.userId === ADMIN_ID;

    announcements.forEach(announcement => {
        const item = document.createElement('div');
        item.className = 'announcement-item';
        item.dataset.id = announcement.id;

        // زر الحذف الذي يظهر للمدير فقط
        const deleteBtnHTML = isAdmin ? `<button class="delete-announcement-btn" title="حذف الخبر"><i class="fa-solid fa-trash"></i></button>` : '';
        
        item.innerHTML = `<p>${announcement.text}</p>${deleteBtnHTML}`;
        
        listContainer.appendChild(item);

        // إضافة وظيفة لزر الحذف إذا كان موجودًا
        if (isAdmin) {
            const deleteBtn = item.querySelector('.delete-announcement-btn');
            if(deleteBtn) {
                deleteBtn.style.display = 'grid'; // إظهار الزر
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // منع أي أحداث أخرى
                    if (confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
                        // حذف الخبر من المصفوفة وإعادة الحفظ والعرض
                        const updatedAnnouncements = announcements.filter(a => a.id !== announcement.id);
                        saveAnnouncements(updatedAnnouncements);
                        displayAnnouncements(updatedAnnouncements);
                    }
                });
            }
        }
    });
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

// --- 6. منطق الرفع واستدعاء "ManusGuard" ---
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
    
    document.getElementById('next-to-step-3').addEventListener('click', () => { 
        const userNameInput = document.getElementById('user-name-input');
        if (userNameInput.value.trim().toLowerCase() === 'hameed al_sameai') {
            userNameInput.value = 'Hameed Alsamei';
        }
        if (!document.getElementById('file-display-name-input').value.trim() || !userNameInput.value.trim()) { 
            alert('الرجاء إدخال اسم وصفي للملف واسمك.'); 
            return; 
        } 
        goToStep(3); 
    });

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
        
        const scanProgress = document.getElementById('scan-progress');
        
        try {
            await ManusGuard.scan(selectedFile, (progress, message) => {
                scanProgress.textContent = `${message} (${Math.round(progress)}%)`;
            });
            
            scanProgress.textContent = 'آمن! جاري الحفظ...';
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


// ==================================================================
// ==================================================================
// ==                                                              ==
// ==            محرك الفحص الأمني "ManusGuard" v3.0               ==
// ==                  (النسخة النهائية الآمنة)                    ==
// ==                                                              ==
// ==================================================================
// ==================================================================

const ManusGuard = {
    
    config: {
        maxFileSize: 50 * 1024 * 1024,
        blacklistedExtensions: ['exe', 'msi', 'bat', 'cmd', 'sh', 'vbs', 'js', 'jar', 'ps1', 'scr', 'com', 'pif', 'gadget', 'hta', 'cpl', 'msc', 'ws', 'wsf', 'reg'],
        suspiciousKeywords: ['hack', 'crack', 'patch', 'keygen', 'activator', 'free', 'exploit', 'porn', 'sex', 'xxx', 'naked', 'adult', 'فضيحة', 'إباحي'],
        fileSignatures: { 'ffd8ffe0': 'jpg', 'ffd8ffe1': 'jpg', 'ffd8ffe2': 'jpg', 'ffd8ffe3': 'jpg', 'ffd8ffe8': 'jpg', '89504e47': 'png', '47494638': 'gif', '25504446': 'pdf', '504b0304': 'zip', 'd0cf11e0': 'doc/xls/ppt', '3c3f786d': 'xml' }
    },

    scan: async function(file, onProgress) {
        if (!file) {
            throw new Error("لم يتم تحديد أي ملف للفحص.");
        }

        const checks = [
            { name: "فحص البيانات الأولية", func: this.checkMetadata },
            { name: "فحص البصمة الرقمية", func: this.checkFileSignature },
            { name: "فحص المحتوى العميق", func: this.checkContent },
            { name: "فحص محتوى الصورة (AI)", func: this.checkImageContent }
        ];

        for (let i = 0; i < checks.length; i++) {
            const check = checks[i];
            const progress = ((i + 1) / checks.length) * 100;
            onProgress(progress, check.name);
            await check.func.call(this, file);
        }

        return true;
    },

    checkMetadata: function(file) {
        return new Promise((resolve, reject) => {
            if (file.size > this.config.maxFileSize) return reject(new Error(`حجم الملف يتجاوز الحد المسموح به (${this.config.maxFileSize / 1024 / 1024}MB).`));
            if (file.size === 0) return reject(new Error("لا يمكن رفع ملف فارغ."));
            const extension = file.name.split('.').pop().toLowerCase();
            if (this.config.blacklistedExtensions.includes(extension)) return reject(new Error(`امتداد الملف (${extension}) غير مسموح به لأسباب أمنية.`));
            const fileNameLower = file.name.toLowerCase();
            for (const keyword of this.config.suspiciousKeywords) {
                if (fileNameLower.includes(keyword)) return reject(new Error("اسم الملف يحتوي على كلمات غير مسموح بها."));
            }
            resolve(true);
        });
    },

    checkFileSignature: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = (e) => {
                if (e.target.readyState === FileReader.DONE) {
                    const arr = (new Uint8Array(e.target.result)).subarray(0, 4);
                    let header = "";
                    for (let i = 0; i < arr.length; i++) header += arr[i].toString(16).padStart(2, '0');
                    let foundType = null;
                    for (const signature in this.config.fileSignatures) {
                        if (header.startsWith(signature)) {
                            foundType = this.config.fileSignatures[signature];
                            break;
                        }
                    }
                    if (foundType) {
                        resolve(true);
                    } else {
                        const extension = file.name.split('.').pop().toLowerCase();
                        if (['txt', 'md', 'csv'].includes(extension)) {
                            resolve(true);
                        } else {
                            reject(new Error("نوع الملف غير معروف أو قد يكون مزيفًا. تم الرفض كإجراء أمني."));
                        }
                    }
                }
            };
            reader.onerror = () => reject(new Error("حدث خطأ أثناء قراءة بصمة الملف."));
            const blob = file.slice(0, 4);
            reader.readAsArrayBuffer(blob);
        });
    },

    checkContent: function(file) {
        return new Promise((resolve, reject) => {
            const extension = file.name.split('.').pop().toLowerCase();
            const readableExtensions = ['txt', 'html', 'css', 'xml', 'svg', 'md', 'csv', 'json'];
            if (!readableExtensions.includes(extension)) {
                resolve(true);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = (e) => {
                if (e.target.readyState === FileReader.DONE) {
                    const content = e.target.result;
                    const dangerousPatterns = [/<script\b[^>]*>/i, /<\/script>/i, /\bon\w+\s*=\s*['"]?[^'"]*['"]?/i, /<iframe\b[^>]*>/i, /javascript:/i, /data:/i, /eval\(/i, /document\.cookie/i, /localStorage/i, /sessionStorage/i];
                    for (const pattern of dangerousPatterns) {
                        if (pattern.test(content)) {
                            return reject(new Error("تم اكتشاف محتوى قد يكون ضارًا داخل الملف."));
                        }
                    }
                    resolve(true);
                }
            };
            reader.onerror = () => reject(new Error("حدث خطأ أثناء قراءة محتوى الملف."));
            reader.readAsText(file);
        });
    },
    
    checkImageContent: function(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                return resolve(true);
            }
            if (!nsfwModel) {
                console.error("[ManusGuard] نموذج فحص الصور غير متوفر. تم رفض الصورة كإجراء احترازي.");
                return reject(new Error("فشل الاتصال بخادم فحص الصور. لا يمكن رفع الصور حاليًا."));
            }
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                img.onload = async () => {
                    try {
                        const predictions = await nsfwModel.classify(img);
                        const unsafeClasses = ['Porn', 'Hentai', 'Sexy'];
                        const confidenceThreshold = 0.70;
                        for (const prediction of predictions) {
                            if (unsafeClasses.includes(prediction.className) && prediction.probability > confidenceThreshold) {
                                return reject(new Error(`تم اكتشاف محتوى غير لائق (تصنيف: ${prediction.className}).`));
                            }
                        }
                        resolve(true);
                    } catch (error) {
                        reject(new Error("حدث خطأ أثناء تحليل الصورة."));
                    }
                };
                img.onerror = () => reject(new Error("لا يمكن قراءة ملف الصورة."));
            };
            reader.onerror = () => reject(new Error("خطأ في قراءة ملف الصورة."));
            reader.readAsDataURL(file);
        });
    }
};
// --- 7. دوال التخزين والعرض ---
function addFileToStorage(file, sectionId, userName, fileDisplayName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("[Storage] قاعدة البيانات غير جاهزة. لا يمكن الحفظ.");
            return reject("فشل الاتصال بقاعدة البيانات. لا يمكن حفظ الملف.");
        }

        const session = JSON.parse(sessionStorage.getItem('userSession'));
        if (!session) {
            return reject("انتهت جلسة المستخدم. يرجى تسجيل الدخول مرة أخرى.");
        }

        const fileId = `file-${Date.now()}`;
        const metadata = { id: fileId, section: sectionId, fileName: fileDisplayName, originalFileName: file.name, userName, userId: session.userId, date: new Date().toISOString().split('T')[0] };
        const fileRecord = { id: fileId, blob: file };

        try {
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            
            const request = store.add(fileRecord);
            request.onsuccess = () => {
                console.log(`[Storage] تم حفظ الملف بنجاح بالمعرف: ${fileId}`);
                const allMetadata = JSON.parse(localStorage.getItem('userUploadedFiles')) || [];
                allMetadata.push(metadata);
                localStorage.setItem('userUploadedFiles', JSON.stringify(allMetadata));
                runSmartCounters();
                resolve(fileId);
            };

            request.onerror = (event) => {
                console.error("[Storage] فشل طلب الحفظ:", event.target.error);
                reject("فشل في حفظ الملف في قاعدة البيانات. قد يكون حجمه كبيرًا جدًا.");
            };

            transaction.oncomplete = () => {
                console.log("[Storage] اكتملت عملية الحفظ بنجاح.");
            };

            transaction.onerror = (event) => {
                console.error("[Storage] فشلت عملية الحفظ:", event.target.error);
                reject("فشلت عملية الحفظ. قد تكون مساحة التخزين ممتلئة.");
            };

        } catch (error) {
            console.error("[Storage] خطأ فادح أثناء بدء عملية الحفظ:", error);
            reject("حدث خطأ غير متوقع أثناء محاولة الوصول إلى قاعدة البيانات.");
        }
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

async function setupPageContent() {
    // **جديد**: تحميل الأخبار في الصفحات الفرعية أيضًا
    loadAndDisplayAnnouncements();

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
                const header = document.querySelector('#section-header');
                if(header) {
                    header.innerHTML = `<h1><i class="fa-solid ${getIconForSection(currentSection.name)} subject-icon-large"></i> ${currentSection.name}</h1><p>جميع الملفات والمساهمات الخاصة بقسم ${currentSection.name}.</p>`;
                }
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
        let displayName = fileMeta.userName;
        if (displayName.trim().toLowerCase() === 'hameed al_sameai') {
            displayName = 'Hameed Alsamei';
        }
        const { icon, color } = getIconForFile(fileMeta.originalFileName);
        const li = document.createElement('li');
        li.className = 'user-added';
        li.dataset.itemId = fileMeta.id;
        let adminButtonsHTML = (isAdmin || (currentUserId && fileMeta.userId === currentUserId)) ? `<button class="secondary-btn delete-btn" title="حذف"><i class="fa-solid fa-trash"></i></button>` : '';
        li.innerHTML = `<div class="file-info"><div class="file-icon-wrapper" style="background-color: ${color}33; color: ${color};"><i class="fa-solid ${icon}"></i></div><div class="file-details"><span class="file-name">${fileMeta.fileName}</span><span class="file-meta">أُضيف بواسطة: ${displayName} بتاريخ: ${fileMeta.date.replace(/-/g, '/')}</span></div></div><div class="file-buttons">${adminButtonsHTML}<button class="primary-btn download-btn"><i class="fa-solid fa-download"></i> تحميل</button></div>`;
        li.querySelector('.download-btn').onclick = () => downloadFile(fileMeta.id, fileMeta.originalFileName);
        if (li.querySelector('.delete-btn')) { 
            li.querySelector('.delete-btn').onclick = () => { 
                if (confirm(`هل أنت متأكد من حذف ملف "${fileMeta.fileName}"؟`)) { 
                    deleteFileFromStorage(fileMeta.id); 
                } 
            }; 
        }
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

// ==================================================================
// ==== دوال الحماية (نسخة محسنة مع خيارات للمستخدم) ====
// ==================================================================

async function loadNsfwModelAndShowPopup() {
    const popup = document.getElementById('manus-guard-popup');
    if (!popup) return;

    // **جديد**: التحقق من LocalStorage قبل إظهار النافذة
    const hidePopupPermanently = localStorage.getItem('hideManusGuardPopup');
    if (hidePopupPermanently === 'true') {
        console.log('[ManusGuard] تم تخطي إظهار نافذة الحماية بناءً على طلب المستخدم.');
        return; // لا تقم بإظهار النافذة
    }

    // --- إعداد أزرار التحكم ---
    const skipBtn = document.getElementById('skip-popup-btn');
    const dontShowBtn = document.getElementById('dont-show-popup-btn');

    const closePopup = () => {
        popup.classList.remove('active');
    };

    const dontShowAgain = () => {
        // **جديد**: حفظ اختيار المستخدم في LocalStorage
        localStorage.setItem('hideManusGuardPopup', 'true');
        closePopup();
    };

    skipBtn.addEventListener('click', closePopup);
    dontShowBtn.addEventListener('click', dontShowAgain);

    // --- إظهار النافذة وتحديث محتواها ---
    popup.classList.add('active');
    
    const statusDiv = document.getElementById('manus-guard-status');
    if(statusDiv) {
        statusDiv.textContent = 'تم تفعيل نظام الحماية الأساسي.';
        statusDiv.style.color = '#28a745';
    }

    const policyList = popup.querySelector('.manus-popup-body ul');
    if (policyList) {
        policyList.innerHTML = `
            <li><i class="fa-solid fa-shield-alt"></i> <strong>فحص أمني شامل:</strong> يتم فحص جميع الملفات للتأكد من خلوها من التهديدات الأمنية الأساسية.</li>
            <li><i class="fa-solid fa-lock"></i> <strong>الفحص يتم محلياً:</strong> يتم تحليل الملفات مباشرة في متصفحك ولا يتم رفعها لأي خادم أثناء الفحص.</li>
            <li><i class="fa-solid fa-info-circle"></i> <strong>ملاحظة:</strong> تم تعطيل فحص الصور بالذكاء الاصطناعي مؤقتاً بسبب قيود الخادم المحلي.</li>
        `;
    }
}
