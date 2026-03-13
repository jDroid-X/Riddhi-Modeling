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

// 3. Optimized Image Discovery (Parallel Protocol)
async function discoverImages() {
    const discovered = [];
    const extensions = ['jpeg', 'png', 'jpg'];
    const maxConcurrent = 10; // Check 10 indices at once
    let i = 1;
    let stopDiscovery = false;

    const checkImage = (url, caption, ext) => {
        return new Promise(res => {
            const img = new Image();
            img.onload = () => res({ src: url, caption, ext });
            img.onerror = () => res(null);
            img.src = url;
        });
    };

    while (i < 100) {
        const batch = [];
        for (let j = 0; j < maxConcurrent; j++) {
            const idx = i + j;
            if (idx >= 100) break;
            // Check main extensions in parallel
            extensions.forEach(ext => {
                batch.push(checkImage(`assets/images/Img${idx}.${ext}`, `Img${idx}`, ext));
            });
            // Check alt versions (Img1a.png)
            batch.push(checkImage(`assets/images/Img${idx}a.png`, `Img${idx}a`, 'png'));
        }

        const results = await Promise.all(batch);
        const foundInBatch = results.filter(r => r !== null);
        
        if (foundInBatch.length > 0) {
            discovered.push(...foundInBatch);
        }
        
        i += maxConcurrent;
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
                <img src="${photo.src}" alt="${photo.caption}" loading="lazy">
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

async function deletePhoto(event, name) {
    event.stopPropagation();
    
    const config = JSON.parse(localStorage.getItem('git_config'));
    if (!config || !config.token) {
        alert("Standard Protocol Identity Verification Failed: Please configure 'Git Settings' to enable remote deletion.");
        return;
    }

    const photoToDelete = photos.find(p => p.caption === name);
    if (!photoToDelete) return;

    const confirmed = confirm(`🛑 PERMANENT ACTION: Do you want to delete "${name}" from the GitHub Repository folder? \n\nThis will remove it from the online website permanently.`);
    if (!confirmed) return;

    const uploadModal = document.getElementById('uploadModal');
    const statusText = document.getElementById('uploadStatus');
    const progressBar = document.getElementById('uploadProgressBar');
    const syncTimer = document.getElementById('syncTimer');

    uploadModal.style.display = 'flex';
    statusText.textContent = `Handshaking for Deletion: ${name}...`;
    progressBar.style.width = '30%';
    syncTimer.textContent = '⌛';

    try {
        // Find the file name from the source
        const fileName = photoToDelete.src.split('/').pop();
        const apiPath = `${config.path}/${fileName}`;
        const url = `https://api.github.com/repos/${config.username}/${config.repo}/contents/${apiPath}`;
        
        // Step 1: Request SHA Handshake
        const getResponse = await fetch(url, {
            headers: { 'Authorization': `token ${config.token}` }
        });

        if (!getResponse.ok) throw new Error("File ID (SHA) handshake failed.");
        const fileData = await getResponse.json();
        
        progressBar.style.width = '60%';
        statusText.textContent = `Executing Remote Purge...`;

        // Step 2: Execute DELETE Protocol
        const deleteResponse = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Standard Protocol: Purge ${fileName}`,
                sha: fileData.sha
            })
        });

        if (deleteResponse.ok) {
            photos = photos.filter(p => p.caption !== name);
            renderGallery();
            progressBar.style.width = '100%';
            alert(`Git Protocol Success: "${name}" purged from GitHub.`);
        } else {
            const err = await deleteResponse.json();
            throw new Error(err.message || 'Deletion Handshake Denied');
        }
    } catch (err) {
        alert(`⚠️ Git Protocol Error: ${err.message}`);
    } finally {
        setTimeout(() => {
            uploadModal.style.display = 'none';
        }, 500);
    }
}

// 4. Lightbox & Zoom
function openLightbox(idx) {
    currentIdx = idx;
    lightboxImg.src = photos[idx].src;
    lightboxImg.classList.remove('zoomed');
    lightboxImg.style.transform = 'scale(1)';
    lightboxImg.style.transition = 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
    lightboxImg.style.transformOrigin = 'center center';
    if (captionDisplay) captionDisplay.textContent = photos[idx].caption;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

if (lightboxImg) {
    const updateZoom = (e) => {
        // Calculate percentage of mouse position in the viewport
        const xPercent = (e.clientX / window.innerWidth) * 100;
        const yPercent = (e.clientY / window.innerHeight) * 100;
        
        // Remove transition temporarily for real-time "sticky" panning
        lightboxImg.style.transition = 'none';
        lightboxImg.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    };

    lightboxImg.onclick = (e) => {
        e.stopPropagation();
        if (zoomLevel === 1) {
            zoomLevel = 2.5; 
            // Re-enable transition for the initial zoom "pop"
            lightboxImg.style.transition = 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
            updateZoom(e);
            lightboxImg.style.transform = `scale(${zoomLevel})`;
            lightboxImg.classList.add('zoomed');
        } else {
            zoomLevel = 1;
            lightboxImg.style.transition = 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
            lightboxImg.style.transform = 'scale(1)';
            lightboxImg.classList.remove('zoomed');
        }
    };

    // Track on lightbox for wider range, but logic is tied to zoomed state
    lightbox.onmousemove = (e) => {
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

// Git Config Logic (Standard Protocol: Identity Auto-Fill)
// NOTE: For security, GitHub will block any push that contains a real token string.
// Please use the "Git Settings" panel once per device to save your token.
const DEFAULT_GIT_TOKEN = ""; 

if (gitConfigBtn) {
    gitConfigBtn.onclick = () => {
        const config = JSON.parse(localStorage.getItem('git_config')) || {};
        
        // Auto-fill testing defaults if storage is empty
        githubUsernameInput.value = config.username || 'jDroid-X';
        githubRepoInput.value = config.repo || 'Riddhi-Modeling';
        githubTokenInput.value = config.token || DEFAULT_GIT_TOKEN;
        githubPathInput.value = config.path || 'Portfolio/assets/images';
        
        // If it's a new device and we are pre-filling the default token, 
        // keep the button disabled until they "Check" it for security.
        saveGitConfig.disabled = true;
        tokenStatus.textContent = config.token ? 'Identity Verified (Local)' : 'Ready for Handshake';
        tokenStatus.style.color = config.token ? '#c5a059' : '#666';
        
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
        // Standard Protocol: Trim and Normalize Identity
        const config = {
            username: githubUsernameInput.value.trim(),
            repo: githubRepoInput.value.trim(),
            token: githubTokenInput.value.trim(),
            path: githubPathInput.value.trim().replace(/\\/g, '/') || 'Portfolio/assets/images'
        };
        
        // Remove trailing/leading slashes for a clean API endpoint
        config.path = config.path.replace(/^\/+|\/+$/g, '');
        
        localStorage.setItem('git_config', JSON.stringify(config));
        gitAuthModal.style.display = 'none';
        alert('Standard Protocol: Git Configuration Saved & Normalized.');
    };
}

if (cancelGitConfig) cancelGitConfig.onclick = () => gitAuthModal.style.display = 'none';


if (uploadBtn) {
    uploadBtn.onclick = () => fileInput.click();
}

if (fileInput) {
    fileInput.onchange = async (e) => {
        const config = JSON.parse(localStorage.getItem('git_config'));
        
        // Protocol Validation Check
        if (!config || !config.token || !config.username || !config.repo) {
            alert('⚠️ SYSTEM ALERT: Git Settings Incomplete\n\nYou must first verify and SAVE your Git Credentials in the settings panel before uploading.');
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
                    const ext = file.name.split('.').pop().toLowerCase();
                    const nextName = `Img${startNum + i}`;
                    const fullFileName = `${nextName}.${ext}`;
                    
                    statusText.textContent = `Syncing [${i+1}/${files.length}]: ${fullFileName}...`;
                    progressBar.style.width = `${50 + ((i + 1) / files.length) * 50}%`;

                    try {
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(file);
                        });

                        const uploadUrl = `https://api.github.com/repos/${config.username}/${config.repo}/contents/${config.path}/${fullFileName}`;
                        const response = await fetch(uploadUrl, {
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
                            // Dynamically determine local src: if 'Portfolio/' is in path, strip it for local preview
                            // We use a regex to handle both slashes and case sensitivity
                            const normalizedPath = config.path.replace(/\\/g, '/');
                            const localPath = normalizedPath.includes('Portfolio/') 
                                ? normalizedPath.split('Portfolio/')[1] 
                                : normalizedPath;
                            
                            photos.push({ src: `${localPath}/${fullFileName}`, caption: nextName, ext: ext });
                        } else {
                            const err = await response.json();
                            // Handle case where file already exists
                            if (response.status === 409) {
                                throw new Error(`Slot ${nextName} is already occupied on GitHub. Please check your gallery syncing.`);
                            }
                            throw new Error(`GitHub said: ${err.message}`);
                        }
                    } catch (err) {
                        alert(`🛑 Git Protocol Failed for ${file.name}:\n${err.message}`);
                    }
                }

                uploadModal.style.display = 'none';
                if (successCount > 0) {
                    renderGallery();
                    alert(`✅ Protocol Success: ${successCount} files synced and added to preview!`);
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

// 7. Initialize Everything (Standard Protocol)
window.addEventListener('DOMContentLoaded', async () => {
    // A. Load saved content
    loadAboutContent();

    // B. Discover and Render Gallery
    photos = await discoverImages();
    renderGallery(); 
    
    // C. Random Hero Background Logic
    if (photos.length > 0) {
        const heroImg = document.getElementById('heroImage');
        if (heroImg) {
            const randomIdx = Math.floor(Math.random() * photos.length);
            heroImg.src = photos[randomIdx].src;
            heroImg.onload = () => heroImg.style.opacity = '1';
            if (heroImg.complete) heroImg.style.opacity = '1';
        }
    }
});
