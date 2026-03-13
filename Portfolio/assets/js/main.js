// 1. Custom Cursor Logic
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate3d(${e.clientX - 10}px, ${e.clientY - 10}px, 0)`;
    follower.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
});

// 2. Elements & State
const galleryContainer = document.querySelector('.gallery');
let photos = [];

// Admin UI Elements
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const adminPasswordInput = document.getElementById('adminPassword');
const submitAdmin = document.getElementById('submitAdmin');
const adminToolbar = document.getElementById('adminToolbar');
const exitAdmin = document.getElementById('exitAdmin');
const uploadBtn = document.getElementById('uploadBtn');
const editAboutBtn = document.getElementById('editAboutBtn');
const gitConfigBtn = document.getElementById('gitConfigBtn');
const fileInput = document.getElementById('fileInput');

// Git Auth UI Elements
const gitAuthModal = document.getElementById('gitAuthModal');
const githubUsernameInput = document.getElementById('githubUsername');
const githubRepoInput = document.getElementById('githubRepo');
const githubTokenInput = document.getElementById('githubToken');
const githubPathInput = document.getElementById('githubPath');
const checkGitToken = document.getElementById('checkGitToken');
const tokenStatus = document.getElementById('tokenStatus');
const saveGitConfig = document.getElementById('saveGitConfig');
const cancelGitConfig = document.getElementById('cancelGitConfig');

// About Edit UI Elements
const aboutModal = document.getElementById('aboutModal');
const editAboutTitle = document.getElementById('editAboutTitle');
const editAboutBody = document.getElementById('editAboutBody');
const saveAbout = document.getElementById('saveAbout');
const cancelAbout = document.getElementById('cancelAbout');
const aboutSectionTitle = document.querySelector('.about .section-title');
const aboutSectionBody = document.querySelector('.about-text p');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const captionDisplay = document.getElementById('lightbox-caption');
let currentIdx = 0;
let zoomLevel = 1;

// Stat Display Mapping
const displays = {
    height: document.getElementById('displayHeight'),
    bust: document.getElementById('displayBust'),
    waist: document.getElementById('displayWaist'),
    hips: document.getElementById('displayHips'),
    eyes: document.getElementById('displayEyes'),
    hair: document.getElementById('displayHair'),
    shoes: document.getElementById('displayShoes'),
    dress: document.getElementById('displayDress')
};

// Stat Input Mapping
const inputs = {
    height: document.getElementById('statHeight'),
    bust: document.getElementById('statBust'),
    waist: document.getElementById('statWaist'),
    hips: document.getElementById('statHips'),
    eyes: document.getElementById('statEyes'),
    hair: document.getElementById('statHair'),
    shoes: document.getElementById('statShoes'),
    dress: document.getElementById('statDress')
};

// 3. Image Discovery
async function discoverImages() {
    const discovered = [];
    const extensions = ['jpeg', 'png', 'jpg'];
    let i = 1;
    let misses = 0;

    while (misses < 3 && i < 100) {
        let found = false;
        for (const ext of extensions) {
            const url = `assets/images/Img${i}.${ext}`;
            const exists = await new Promise(res => {
                const img = new Image();
                img.onload = () => res(true);
                img.onerror = () => res(false);
                img.src = url;
            });

            if (exists) {
                discovered.push({ src: url, caption: `Img${i}`, ext: ext });
                found = true;
                break;
            }
        }
        
        const urlA = `assets/images/Img${i}a.png`; 
        const existsA = await new Promise(res => {
            const img = new Image();
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = urlA;
        });
        if (existsA) {
            discovered.push({ src: urlA, caption: `Img${i}a`, ext: 'png' });
            found = true;
        }

        if (found) misses = 0; else misses++;
        i++;
    }
    return discovered;
}

function renderGallery() {
    if (!galleryContainer) return;
    galleryContainer.innerHTML = '';
    photos.forEach((photo, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Detect tall images
        const img = new Image();
        img.src = photo.src;
        img.onload = () => {
            if (img.height > img.width) {
                item.classList.add('tall');
            }
        };

        const isBottom = idx % 2 === 0;
        item.innerHTML = `
            <div class="image-wrapper">
                <img src="${photo.src}" alt="${photo.caption}">
                <div class="curved-overlay ${isBottom ? 'bottom' : ''}">
                    <svg viewBox="0 0 250 80">
                        <path id="curve-${idx}" d="M 10,60 Q 125,10 240,60" fill="transparent" />
                        <text>
                            <textPath href="#curve-${idx}" startOffset="50%" text-anchor="middle">
                                MOOD // ${photo.caption}
                            </textPath>
                        </text>
                    </svg>
                </div>
                <button class="delete-photo-btn" onclick="deletePhoto(event, '${photo.caption}')">&times;</button>
            </div>
        `;
        item.onclick = (e) => {
            e.preventDefault();
            openLightbox(idx);
        };
        galleryContainer.appendChild(item);

        // Scroll Reveal Animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        observer.observe(item);
    });
}

function deletePhoto(event, name) {
    event.stopPropagation();
    const confirmed = confirm(`Remove "${name}" from preview? \n(Note: This will not delete the file from your computer or GitHub)`);
    if (confirmed) {
        photos = photos.filter(p => p.caption !== name);
        renderGallery();
        alert(`Photo removed from view. To delete permanently, remove the file from 'assets/images' and push to GitHub.`);
    }
}

// 4. Lightbox & Zoom
function openLightbox(idx) {
    currentIdx = idx;
    lightboxImg.src = photos[idx].src;
    lightboxImg.classList.remove('zoomed');
    lightboxImg.style.transform = 'scale(1)';
    if (captionDisplay) captionDisplay.textContent = photos[idx].caption;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

if (lightboxImg) {
    const updateZoom = (e) => {
        const rect = lightboxImg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        lightboxImg.style.transformOrigin = `${x}% ${y}%`;
    };

    lightboxImg.onclick = (e) => {
        e.stopPropagation();
        if (zoomLevel === 1) {
            zoomLevel = 2.5; // Premium zoom level
            updateZoom(e);
            lightboxImg.style.transform = `scale(${zoomLevel})`;
            lightboxImg.classList.add('zoomed');
        } else {
            zoomLevel = 1;
            lightboxImg.style.transform = 'scale(1)';
            lightboxImg.classList.remove('zoomed');
        }
    };

    lightboxImg.onmousemove = (e) => {
        if (zoomLevel > 1) {
            updateZoom(e);
        }
    };
}

const closeLightboxBtn = document.querySelector('.close-lightbox');
if (closeLightboxBtn) {
    closeLightboxBtn.onclick = () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
        zoomLevel = 1;
    };
}

// 5. Admin Navigation
if (adminBtn) adminBtn.onclick = () => adminModal.style.display = 'flex';
// 5. Admin Navigation
if (adminBtn) adminBtn.onclick = () => adminModal.style.display = 'flex';
if (submitAdmin) {
    submitAdmin.onclick = () => {
        // Obfuscated password check (cHVzdTEyMzQ= is base64 for pusu1234)
        if (btoa(adminPasswordInput.value) === 'cHVzdTEyMzQ=') {
            adminModal.style.display = 'none';
            adminToolbar.style.display = 'block';
            document.body.classList.add('admin-mode');
        } else alert('Incorrect Password');
    };
}
const cancelAdmin = document.getElementById('cancelAdmin');
if (cancelAdmin) cancelAdmin.onclick = () => adminModal.style.display = 'none';
if (exitAdmin) {
    exitAdmin.onclick = () => {
        adminToolbar.style.display = 'none';
        document.body.classList.remove('admin-mode');
    };
}

// Git Config Logic
if (gitConfigBtn) {
    gitConfigBtn.onclick = () => {
        const config = JSON.parse(localStorage.getItem('git_config')) || {};
        githubUsernameInput.value = config.username || '';
        githubRepoInput.value = config.repo || '';
        githubTokenInput.value = config.token || '';
        githubPathInput.value = config.path || 'Portfolio/assets/images';
        saveGitConfig.disabled = true;
        tokenStatus.textContent = '';
        gitAuthModal.style.display = 'flex';
    };
}

if (checkGitToken) {
    checkGitToken.onclick = async () => {
        const token = githubTokenInput.value;
        const username = githubUsernameInput.value;
        const repo = githubRepoInput.value;

        if (!token || !username || !repo) {
            tokenStatus.textContent = 'Please fill Username, Repo, and Token first.';
            tokenStatus.style.color = '#ff4d4d';
            return;
        }

        tokenStatus.textContent = 'Verifying protocol permissions...';
        tokenStatus.style.color = 'var(--accent-color)';

        try {
            const response = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
                headers: { 'Authorization': `token ${token}` }
            });

            if (response.ok) {
                const scopes = response.headers.get('X-OAuth-Scopes') || '';
                if (scopes.includes('repo')) {
                    tokenStatus.textContent = '✅ Git Handshake Successful. "repo" permission verified.';
                    tokenStatus.style.color = '#28a745';
                    saveGitConfig.disabled = false;
                } else {
                    tokenStatus.textContent = '❌ Error: Token missing "repo" scope.';
                    tokenStatus.style.color = '#ff4d4d';
                }
            } else {
                const err = await response.json();
                tokenStatus.textContent = `❌ Error: ${err.message || 'Invalid Credentials'}`;
                tokenStatus.style.color = '#ff4d4d';
            }
        } catch (err) {
            tokenStatus.textContent = '❌ Protocol Error: Connection failed.';
            tokenStatus.style.color = '#ff4d4d';
        }
    };
}

if (saveGitConfig) {
    saveGitConfig.onclick = () => {
        const config = {
            username: githubUsernameInput.value,
            repo: githubRepoInput.value,
            token: githubTokenInput.value,
            path: githubPathInput.value || 'Portfolio/assets/images'
        };
        localStorage.setItem('git_config', JSON.stringify(config));
        gitAuthModal.style.display = 'none';
        alert('Git Configuration Saved Locally.');
    };
}

if (cancelGitConfig) cancelGitConfig.onclick = () => gitAuthModal.style.display = 'none';


if (uploadBtn) {
    uploadBtn.onclick = () => fileInput.click();
}

if (fileInput) {
    fileInput.onchange = async (e) => {
        const config = JSON.parse(localStorage.getItem('git_config'));
        if (!config || !config.token) {
            alert('Please configure Git Settings first (Username, Repo, and Token).');
            gitAuthModal.style.display = 'flex';
            e.target.value = '';
            return;
        }

        const files = Array.from(e.target.files);
        if (!files.length) return;

        const uploadModal = document.getElementById('uploadModal');
        const progressBar = document.getElementById('uploadProgressBar');
        const statusText = document.getElementById('uploadStatus');
        const syncTimer = document.getElementById('syncTimer');

        uploadModal.style.display = 'flex';
        let totalSizeMB = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
        let countdown = Math.max(5, Math.round(totalSizeMB * 2 + 5));
        syncTimer.textContent = countdown;
        progressBar.style.width = '0%';
        statusText.textContent = `Authenticating Git Protocol...`;

        const timerInterval = setInterval(async () => {
            countdown--;
            syncTimer.textContent = countdown;
            progressBar.style.width = `${100 - (countdown / (totalSizeMB * 2 + 5)) * 100}%`;

            if (countdown <= 0) {
                clearInterval(timerInterval);
                statusText.textContent = "Initiating Secure Transfer...";
                
                const findMaxNum = () => {
                    let max = 0;
                    photos.forEach(p => {
                        const match = p.caption.match(/Img(\d+)/i);
                        if (match) {
                            const num = parseInt(match[1]);
                            if (num > max) max = num;
                        }
                    });
                    return max;
                };

                let startNum = findMaxNum() + 1;
                let successCount = 0;

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const ext = file.name.split('.').pop();
                    const nextName = `Img${startNum + i}`;
                    const fullFileName = `${nextName}.${ext}`;
                    
                    try {
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(file);
                        });

                        const response = await fetch(`https://api.github.com/repos/${config.username}/${config.repo}/contents/${config.path}/${fullFileName}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `token ${config.token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: `Standard Protocol: Upload ${fullFileName}`,
                                content: base64
                            })
                        });

                        if (response.ok) {
                            successCount++;
                            photos.push({ src: `assets/images/${fullFileName}`, caption: nextName, ext: ext });
                        } else {
                            const err = await response.json();
                            throw new Error(err.message || 'GitHub API Error');
                        }
                    } catch (err) {
                        alert(`Git Protocol Failed for ${file.name}: ${err.message}`);
                    }
                }

                uploadModal.style.display = 'none';
                if (successCount > 0) {
                    renderGallery();
                    alert(`Standard Protocol Complete: ${successCount} files synced to GitHub!`);
                }
            }
        }, 1000);

        e.target.value = '';
    };
}

// 6. About Edit Logic
function loadAboutContent() {
    const storedAbout = JSON.parse(localStorage.getItem('portfolio_about'));
    if (storedAbout) {
        if (aboutSectionTitle) aboutSectionTitle.textContent = storedAbout.title || aboutSectionTitle.textContent;
        if (aboutSectionBody) aboutSectionBody.textContent = storedAbout.body || aboutSectionBody.textContent;
        if (storedAbout.stats) {
            Object.keys(storedAbout.stats).forEach(key => {
                if (displays[key]) displays[key].textContent = storedAbout.stats[key];
            });
        }
    }
}

if (editAboutBtn) {
    editAboutBtn.onclick = () => {
        editAboutTitle.value = aboutSectionTitle.textContent;
        editAboutBody.value = aboutSectionBody.textContent;
        Object.keys(inputs).forEach(key => { if (displays[key]) inputs[key].value = displays[key].textContent; });
        aboutModal.style.display = 'flex';
    };
}

if (cancelAbout) cancelAbout.onclick = () => aboutModal.style.display = 'none';

if (saveAbout) {
    saveAbout.onclick = () => {
        const statsData = {};
        Object.keys(inputs).forEach(key => {
            statsData[key] = inputs[key].value;
            if (displays[key]) displays[key].textContent = inputs[key].value;
        });
        const profileData = { title: editAboutTitle.value, body: editAboutBody.value, stats: statsData };
        aboutSectionTitle.textContent = profileData.title;
        aboutSectionBody.textContent = profileData.body;
        localStorage.setItem('portfolio_about', JSON.stringify(profileData));
        aboutModal.style.display = 'none';
        alert("Profile updated! Run Sync to update online.");
    };
}

// 4. Initial Render & Gallery Logic
async function initGallery() {
    photos = await discoverImages();
    
    // Random Hero Background Logic
    if (photos.length > 0) {
        const heroImg = document.getElementById('heroImage');
        if (heroImg) {
            const randomIdx = Math.floor(Math.random() * photos.length);
            heroImg.src = photos[randomIdx].src;
            heroImg.onload = () => heroImg.style.opacity = '1';
            if (heroImg.complete) heroImg.style.opacity = '1';
        }
    }

    renderGallery();
}

// 7. Initialize Everything
async function init() {
    loadAboutContent();
    await initGallery();
}

init();
