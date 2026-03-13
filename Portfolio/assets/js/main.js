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

// Simple Discovery: Load images Img1, Img2... until failure
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
                discovered.push({ src: url, caption: `Img${i}` });
                found = true;
                break;
            }
        }
        
        // Also check for "a" variants (Img1a, etc)
        const urlA = `assets/images/Img${i}a.png`; // Check common extra files
        const existsA = await new Promise(res => {
            const img = new Image();
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = urlA;
        });
        if (existsA) {
            discovered.push({ src: urlA, caption: `Img${i}a` });
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
            </div>
        `;
        item.onclick = (e) => {
            e.preventDefault();
            openLightbox(idx);
        };
        galleryContainer.appendChild(item);
    });
}

// Lightbox Advanced
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const caption = document.getElementById('lightbox-caption');
let currentIdx = 0;

function openLightbox(idx) {
    currentIdx = idx;
    lightboxImg.src = photos[idx].src;
    lightboxImg.classList.remove('zoomed');
    lightboxImg.style.transform = 'scale(1)';
    if (caption) caption.textContent = photos[idx].caption;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Intense Zoom Logic (200% - 300%)
let zoomLevel = 1;
lightboxImg.onclick = (e) => {
    e.stopPropagation();
    if (zoomLevel === 1) {
        zoomLevel = 2.5; // High zoom
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
        document.querySelector('.hero-bg-image').src = photos[Math.floor(Math.random() * photos.length)].src;
    }
}

// Admin / Upload logic
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const adminPasswordInput = document.getElementById('adminPassword');
const submitAdmin = document.getElementById('submitAdmin');
const adminToolbar = document.getElementById('adminToolbar');

adminBtn.onclick = () => adminModal.style.display = 'flex';
submitAdmin.onclick = () => {
    if (adminPasswordInput.value === 'pusu1234') {
        adminModal.style.display = 'none';
        adminToolbar.style.display = 'block';
    } else alert('Incorrect Password');
};

document.getElementById('uploadBtn').onclick = () => {
    alert("To add photos, please run the 'Sync_Photos.bat' file in your Portfolio folder.\n\nIt will guide you to pick photos and sync them to your laptop and GitHub automatically.");
};

init();
