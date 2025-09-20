/*********************
 * References
 *********************/
const gallery = document.getElementById('gallery');
const carouselWrap = document.getElementById('singleCarousel');
let carouselImage = document.getElementById('carouselImage'); 
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');

const overlay = document.getElementById('overlay');
const overlayImg = document.getElementById('overlayImg');
const closeBtn = document.getElementById('closeBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const toggleBtn = document.getElementById('modeToggle');

/*********************
 * Build gallery (pakai gambar dari folder "images" atau root)
 *********************/
const TOTAL = 26; // ubah sesuai jumlah foto Anda
const sizeClasses = ['small','medium','large'];

function rand(min, max) { return Math.random() * (max - min) + min; }

for (let i = 1; i <= TOTAL; i++) {
  const div = document.createElement('div');
  div.className = 'polaroid';
  const sizeClass = sizeClasses[Math.floor(rand(0, sizeClasses.length))];
  div.classList.add(sizeClass);

  div.style.setProperty('--rot', (rand(-6, 6)).toFixed(2) + 'deg');
  div.style.setProperty('--x', Math.round(rand(-8, 8)) + 'px');
  div.style.setProperty('--y', Math.round(rand(-6, 6)) + 'px');
  const scaleVal = (rand(0.92, 1.08)).toFixed(3);
  div.style.setProperty('--scale', scaleVal);

  // Flexible: coba jpg, jpeg, png di folder images/, lalu fallback ke root
  const img = document.createElement('img');
  const extensions = ['jpg', 'jpeg', 'png'];
  let tryIndex = 0;

  function tryNextExtension() {
    if (tryIndex < extensions.length) {
      img.src = `foto${i}.${extensions[tryIndex]}`;
      tryIndex++;
    } else {
      // fallback ke root (default .jpg)
      img.src = `foto${i}.jpg`;
    }
  }

  img.onerror = tryNextExtension;
  tryNextExtension();

  img.alt = `Foto ${i}`;
  div.appendChild(img);
  gallery.appendChild(div);
}

// frames collection
const frames = document.querySelectorAll('.polaroid img');

/*********************
 * Overlay
 *********************/
let currentIndex = 0;
function showImage(index) {
  const node = frames[index];
  if (!node) return;
  overlayImg.src = node.src;
  overlay.style.display = 'flex';
}

frames.forEach((img, index) => {
  img.addEventListener('click', () => {
    currentIndex = index;
    showImage(currentIndex);
    setCarouselIndex(index, 0);
  });
});

closeBtn.addEventListener('click', () => overlay.style.display = 'none');
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });

prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + frames.length) % frames.length;
  showImage(currentIndex);
});
nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % frames.length;
  showImage(currentIndex);
});

document.addEventListener('keydown', (e) => {
  if (overlay.style.display === 'flex') {
    if (e.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + frames.length) % frames.length; showImage(currentIndex); }
    if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % frames.length; showImage(currentIndex); }
    if (e.key === 'Escape') overlay.style.display = 'none';
  }
});

/*********************
 * Toggle B/W mode
 *********************/
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('bw');
  toggleBtn.textContent = document.body.classList.contains('bw') ? '⚪' : '🌈';
  toggleBtn.setAttribute('aria-pressed', document.body.classList.contains('bw') ? 'true' : 'false');
});

/*********************
 * Single-image carousel logic
 *********************/
let carouselIndex = 0;
let isAnimating = false;
const SWIPE_THRESHOLD = 30;

// initialize carousel
if (frames && frames.length) {
  carouselImage.src = frames[0].src;
  carouselIndex = 0;
}

function makeCloneForCarousel(imgNode) {
  const clone = imgNode.cloneNode(true);
  clone.className = "single-carousel-img";
  clone.style.position = "absolute";
  clone.style.top = "0";
  clone.style.height = "100%";
  clone.style.zIndex = 1;
  clone.style.borderRadius = getComputedStyle(carouselImage).borderRadius || "12px";
  return clone;
}

function setCarouselIndex(idx, direction = 0) {
  const newIndex = ((idx % frames.length) + frames.length) % frames.length;
  if (!frames.length) return;

  if (direction === 0 || isAnimating === true) {
    if (direction === 0 && !isAnimating) {
      carouselImage.src = frames[newIndex].src;
      carouselIndex = newIndex;
    }
    return;
  }

  if (isAnimating) return;
  isAnimating = true;

  const oldImg = carouselImage;
  const newImg = makeCloneForCarousel(frames[newIndex]);

  newImg.style.left = (direction > 0) ? "100%" : "-100%";
  newImg.style.transition = "left 360ms ease";
  oldImg.style.transition = "transform 360ms ease";

  carouselWrap.appendChild(newImg);

  requestAnimationFrame(() => {
    oldImg.style.transform = (direction > 0) ? "translateX(-100%)" : "translateX(100%)";
    newImg.style.left = "0";
  });

  setTimeout(() => {
    if (oldImg && oldImg.parentNode === carouselWrap) {
      carouselWrap.removeChild(oldImg);
    }
    newImg.style.position = "relative";
    newImg.style.left = "0";
    newImg.style.transform = "none";
    newImg.style.transition = "transform 220ms ease";
    carouselImage = newImg;
    carouselIndex = newIndex;
    isAnimating = false;
  }, 380);
}

// Buttons
carouselPrev.addEventListener('click', () => {
  if (isAnimating) return;
  setCarouselIndex(carouselIndex - 1, -1);
});
carouselNext.addEventListener('click', () => {
  if (isAnimating) return;
  setCarouselIndex(carouselIndex + 1, 1);
});

// Click to open overlay
carouselWrap.addEventListener('click', (e) => {
  const imgEl = e.target.closest('.single-carousel-img');
  if (imgEl) {
    currentIndex = carouselIndex;
    showImage(currentIndex);
  }
});

// Swipe
let isPointerDown = false, pointerId = null, startX = 0, lastTranslate = 0;

carouselWrap.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.single-carousel-btn')) return;
  isPointerDown = true;
  pointerId = e.pointerId;
  try { carouselWrap.setPointerCapture(pointerId); } catch (_) {}
  startX = e.clientX;
  lastTranslate = 0;
  if (carouselImage) carouselImage.style.transition = 'none';
});

carouselWrap.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  const dx = e.clientX - startX;
  lastTranslate = dx;
  if (carouselImage) carouselImage.style.transform = `translateX(${dx}px)`;
});

function handlePointerEnd() {
  if (!isPointerDown) return;
  isPointerDown = false;
  try { if (pointerId !== null) carouselWrap.releasePointerCapture(pointerId); } catch(_) {}
  pointerId = null;

  if (lastTranslate <= -SWIPE_THRESHOLD) {
    setCarouselIndex(carouselIndex + 1, 1);
  } else if (lastTranslate >= SWIPE_THRESHOLD) {
    setCarouselIndex(carouselIndex - 1, -1);
  } else {
    if (carouselImage) {
      carouselImage.style.transition = 'transform 220ms ease';
      carouselImage.style.transform = 'translateX(0)';
    }
  }
  lastTranslate = 0;
}

carouselWrap.addEventListener('pointerup', handlePointerEnd);
carouselWrap.addEventListener('pointercancel', handlePointerEnd);
carouselWrap.addEventListener('pointerleave', (e) => { if (isPointerDown) handlePointerEnd(); });

// Keyboard nav
document.addEventListener('keydown', (e) => {
  if (overlay.style.display === 'flex') return;
  if (isAnimating) return;
  if (e.key === 'ArrowLeft') setCarouselIndex(carouselIndex - 1, -1);
  if (e.key === 'ArrowRight') setCarouselIndex(carouselIndex + 1, 1);
});

// Initial state
setCarouselIndex(0, 0);
