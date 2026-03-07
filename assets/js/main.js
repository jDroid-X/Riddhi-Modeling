// Custom Cursor
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate3d(${e.clientX - 10}px, ${e.clientY - 10}px, 0)`;
    follower.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
});

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const galleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
let currentIdx = 0;

function openLightbox(idx) {
    currentIdx = idx;
    const img = galleryImages[currentIdx];
    lightboxImg.src = img.src;
    lightboxCaption.textContent = img.getAttribute('data-caption');
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

galleryImages.forEach((img, idx) => {
    img.parentElement.parentElement.addEventListener('click', () => {
        openLightbox(idx);
    });
});

document.querySelector('.close-lightbox').onclick = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
};

document.querySelector('.next').onclick = (e) => {
    e.stopPropagation();
    currentIdx = (currentIdx + 1) % galleryImages.length;
    openLightbox(currentIdx);
};

document.querySelector('.prev').onclick = (e) => {
    e.stopPropagation();
    currentIdx = (currentIdx - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(currentIdx);
};

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'block') {
        if (e.key === 'ArrowRight') document.querySelector('.next').click();
        if (e.key === 'ArrowLeft') document.querySelector('.prev').click();
        if (e.key === 'Escape') document.querySelector('.close-lightbox').click();
    }
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Reveal Animations on Scroll
const observerOptions = { threshold: 0.15 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.gallery-item, .section-title, .about-text').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 1s cubic-bezier(0.19, 1, 0.22, 1)';
    observer.observe(el);
});

// Activation of Observer transition
document.addEventListener('scroll', () => {
    document.querySelectorAll('.gallery-item, .section-title, .about-text').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }
    });
});
