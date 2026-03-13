// Custom Cursor
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate3d(${e.clientX - 10}px, ${e.clientY - 10}px, 0)`;
    follower.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
});

// Gallery Logic
const galleryContainer = document.querySelector('.gallery');
let photos = [];

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
        
        // Check "a" variants
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
    galleryContainer.innerHTML = '';
    photos.forEach((photo, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <div class="image-wrapper">
                <img src="${photo.src}" alt="${photo.caption}">
                <div class="curved-overlay"><span>${photo.caption}</span></div>
                <button class="delete-photo-btn" onclick="deletePhoto(event, '${photo.caption}')">&times;</button>
            </div>
        `;
        item.onclick = (e) => {
            e.preventDefault();
            openLightbox(idx);
        };
        galleryContainer.appendChild(item);
    });
}

function deletePhoto(event, name) {
    event.stopPropagation();
    alert(`To remove ${name} permanently:\n\n1. Open your 'assets/images' folder on your laptop.\n2. Delete the file named ${name}.\n3. Tell me to "Sync Delete" and I will remove it from GitHub too!`);
}

// Lightbox Advanced
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const captionDisplay = document.getElementById('lightbox-caption');
let currentIdx = 0;

function openLightbox(idx) {
    currentIdx = idx;
    lightboxImg.src = photos[idx].src;
    lightboxImg.classList.remove('zoomed');
    lightboxImg.style.transform = 'scale(1)';
    if (captionDisplay) captionDisplay.textContent = photos[idx].caption;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Intense Zoom Logic (200% - 300%)
let zoomLevel = 1;
lightboxImg.onclick = (e) => {
    e.stopPropagation();
    if (zoomLevel === 1) {
        zoomLevel = 2.5; 
        const rect = lightboxImg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        lightboxImg.style.transformOrigin = `${x}% ${y}%`;
        lightboxImg.style.transform = `scale(${zoomLevel})`;
        lightboxImg.classList.add('zoomed');
    } else {
        zoomLevel = 1;
        lightboxImg.style.transform = 'scale(1)';
        lightboxImg.classList.remove('zoomed');
    }
};

document.querySelector('.close-lightbox').onclick = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
    zoomLevel = 1;
};

// Navigation
document.querySelector('.next').onclick = (e) => {
    e.stopPropagation();
    currentIdx = (currentIdx + 1) % photos.length;
    openLightbox(currentIdx);
};

document.querySelector('.prev').onclick = (e) => {
    e.stopPropagation();
    currentIdx = (currentIdx - 1 + photos.length) % photos.length;
    openLightbox(currentIdx);
};

document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'block') {
        if (e.key === 'ArrowRight') document.querySelector('.next').click();
        if (e.key === 'ArrowLeft') document.querySelector('.prev').click();
        if (e.key === 'Escape') document.querySelector('.close-lightbox').click();
    }
});

// Initialization
async function init() {
    photos = await discoverImages();
    renderGallery();
    
    // Set random hero
    if (photos.length > 0) {
        const heroImg = document.querySelector('.hero-bg-image');
        if (heroImg) {
            const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
            heroImg.src = randomPhoto.src;
            
            // Trigger fade-in after load
            if (heroImg.complete) {
                heroImg.style.opacity = '1';
            } else {
                heroImg.onload = () => {
                    heroImg.style.opacity = '1';
                };
            }
        }
    }
}

// Admin / Upload Logic
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const adminPasswordInput = document.getElementById('adminPassword');
const submitAdmin = document.getElementById('submitAdmin');
const adminToolbar = document.getElementById('adminToolbar');
const fileInput = document.getElementById('fileInput');
const exitAdmin = document.getElementById('exitAdmin');

adminBtn.onclick = () => adminModal.style.display = 'flex';
submitAdmin.onclick = () => {
    if (adminPasswordInput.value === 'pusu1234') {
        adminModal.style.display = 'none';
        adminToolbar.style.display = 'block';
        document.body.classList.add('admin-mode');
    } else alert('Incorrect Password');
};

exitAdmin.onclick = () => {
    adminToolbar.style.display = 'none';
    document.body.classList.remove('admin-mode');
};

fileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    alert("Photo has been requested to upload");

    for (let file of files) {
        const nextName = `Img${photos.length + 1}`;
        const ext = file.name.split('.').pop();
        
        console.log(`Uploading in process: ${file.name}...`);

        // Use FileReader to trigger Download
        const reader = new FileReader();
        reader.onload = (event) => {
            const blob = new Blob([event.target.result], { type: file.type });
            const url = window.URL.createObjectURL(blob);
            
            // Trigger browser's Download manager
            const a = document.createElement('a');
            a.href = url;
            a.download = `${nextName}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Update UI
            photos.push({ src: event.target.result, caption: nextName, ext: ext });
            renderGallery();
        };
        reader.readAsDataURL(file);
    }

    alert("Photo uploaded! Please save the downloaded file into your 'assets/images' folder.");
    e.target.value = '';
};

// About Editing Logic
const editAboutBtn = document.getElementById('editAboutBtn');
const aboutModal = document.getElementById('aboutModal');
const editAboutTitle = document.getElementById('editAboutTitle');
const editAboutBody = document.getElementById('editAboutBody');
const saveAbout = document.getElementById('saveAbout');
const cancelAbout = document.getElementById('cancelAbout');

const aboutSectionTitle = document.querySelector('.about .section-title');
const aboutSectionBody = document.querySelector('.about-text p');

// Stat Display Elements
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

// Stat Input Elements
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
        Object.keys(inputs).forEach(key => {
            if (displays[key]) inputs[key].value = displays[key].textContent;
        });
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

        const profileData = {
            title: editAboutTitle.value,
            body: editAboutBody.value,
            stats: statsData
        };
        
        aboutSectionTitle.textContent = profileData.title;
        aboutSectionBody.textContent = profileData.body;
        localStorage.setItem('portfolio_about', JSON.stringify(profileData));
        aboutModal.style.display = 'none';

        // Notify for permanent sync
        alert("Profile updated locally on this device!\n\nTo make this change permanent for everyone online, please tell me 'Sync Profile Changes' and I will update your files and GitHub.");
    };
}

// Initialization
async function init() {
    loadAboutContent();
    photos = await discoverImages();
    renderGallery();
    
    // Set random hero
    if (photos.length > 0) {
        const heroImg = document.querySelector('.hero-bg-image');
        if (heroImg) {
            const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
            heroImg.src = randomPhoto.src;
            if (heroImg.complete) {
                heroImg.style.opacity = '1';
            } else {
                heroImg.onload = () => {
                    heroImg.style.opacity = '1';
                };
            }
        }
    }
}

init();
