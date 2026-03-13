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
            </div>
        `;
        item.onclick = () => openLightbox(idx);
        galleryContainer.appendChild(item);
    });
}

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
function openLightbox(idx) {
    lightboxImg.src = photos[idx].src;
    lightboxImg.style.transform = 'scale(1)';
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

lightboxImg.onclick = (e) => {
    e.stopPropagation();
    const isZoomed = lightboxImg.style.transform === 'scale(2.5)';
    if (!isZoomed) {
        const rect = lightboxImg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        lightboxImg.style.transformOrigin = `${x}% ${y}%`;
        lightboxImg.style.transform = 'scale(2.5)';
    } else {
        lightboxImg.style.transform = 'scale(1)';
    }
};

document.querySelector('.close-lightbox').onclick = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
};

// Admin / Upload Logic
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const adminPasswordInput = document.getElementById('adminPassword');
const submitAdmin = document.getElementById('submitAdmin');
const adminToolbar = document.getElementById('adminToolbar');
const fileInput = document.getElementById('fileInput');

adminBtn.onclick = () => adminModal.style.display = 'flex';
submitAdmin.onclick = () => {
    if (adminPasswordInput.value === 'pusu1234') {
        adminModal.style.display = 'none';
        adminToolbar.style.display = 'block';
    } else alert('Incorrect Password');
};

document.getElementById('uploadBtn').onclick = () => fileInput.click();

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

init();
