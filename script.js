// Horizontal scrolling functionality
class HorizontalScroller {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 6;
        this.isScrolling = false;
        this.scrollThreshold = 50; // Reduced threshold for better responsiveness
        this.lastScrollPosition = 0;
        this.scrollAccumulator = 0; // Track cumulative scroll
        this.lastWheelTime = 0;
        this.wheelCooldown = 100; // Cooldown between wheel events in ms
        this.animationDuration = 500; // Extended animation duration
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateSlide(0);
    }
    
    bindEvents() {
        // Handle wheel scrolling with passive option for better performance
        window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        
        // Throttled scroll handler for mobile
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => this.handleScroll(), 16); // ~60fps
        }, { passive: true });
        
        // Handle navigation dots
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Handle keyboard navigation
        window.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Handle resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.updateSlide(this.currentSlide), 250);
        });
        
        // Prevent default scroll behavior on horizontal wrapper
        document.querySelector('.horizontal-wrapper').addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        // Check if we're already scrolling or in cooldown
        const currentTime = Date.now();
        if (this.isScrolling || (currentTime - this.lastWheelTime) < this.wheelCooldown) {
            return;
        }
        
        const deltaY = e.deltaY;
        this.scrollAccumulator += deltaY;
        
        // Reset accumulator if direction changes
        if ((this.scrollAccumulator > 0 && deltaY < 0) || (this.scrollAccumulator < 0 && deltaY > 0)) {
            this.scrollAccumulator = deltaY;
        }
        
        // Check if accumulated scroll exceeds threshold
        if (Math.abs(this.scrollAccumulator) > this.scrollThreshold) {
            if (this.scrollAccumulator > 0 && this.currentSlide < this.totalSlides - 1) {
                // Scroll down - go to next slide
                this.nextSlide();
                this.scrollAccumulator = 0;
                this.lastWheelTime = currentTime;
            } else if (this.scrollAccumulator < 0 && this.currentSlide > 0) {
                // Scroll up - go to previous slide
                this.prevSlide();
                this.scrollAccumulator = 0;
                this.lastWheelTime = currentTime;
            }
        }
    }
    
    handleScroll() {
        // Throttle scroll events to prevent excessive triggering
        if (this.isScrolling) return;
        
        const scrollPosition = window.scrollY;
        const slideHeight = window.innerHeight;
        const newSlide = Math.round(scrollPosition / slideHeight);
        
        if (newSlide !== this.currentSlide && newSlide >= 0 && newSlide < this.totalSlides) {
            this.updateSlide(newSlide);
        }
    }
    
    handleKeydown(e) {
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides - 1);
                break;
        }
    }
    
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }
    
    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }
    
    goToSlide(slideIndex) {
        if (slideIndex >= 0 && slideIndex < this.totalSlides && slideIndex !== this.currentSlide) {
            this.updateSlide(slideIndex);
            
            // Update scroll position for mobile
            const targetScrollPosition = slideIndex * window.innerHeight;
            window.scrollTo({
                top: targetScrollPosition,
                behavior: 'smooth'
            });
        }
    }
    
    updateSlide(slideIndex) {
        if (this.isScrolling || slideIndex === this.currentSlide) return;
        
        this.isScrolling = true;
        this.currentSlide = slideIndex;
        
        const wrapper = document.querySelector('.horizontal-wrapper');
        const translateX = -(slideIndex * 100);
        
        // Add smooth transition
        wrapper.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        wrapper.style.transform = `translateX(${translateX}vw)`;
        
        // Update navigation dots
        this.updateDots();
        
        // Reset scrolling flag after animation completes
        setTimeout(() => {
            this.isScrolling = false;
            this.scrollAccumulator = 0; // Reset accumulator
        }, this.animationDuration);
    }
    
    updateDots() {
        document.querySelectorAll('.dot').forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// Touch support for mobile devices
class TouchHandler {
    constructor(scroller) {
        this.scroller = scroller;
        this.startY = 0;
        this.startX = 0;
        this.minSwipeDistance = 50;
        
        this.bindTouchEvents();
    }
    
    bindTouchEvents() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }
    
    handleTouchStart(e) {
        this.startY = e.touches[0].clientY;
        this.startX = e.touches[0].clientX;
    }
    
    handleTouchEnd(e) {
        if (!this.startY || !this.startX) return;
        
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        
        const diffY = this.startY - endY;
        const diffX = this.startX - endX;
        
        // Determine if it's a vertical swipe
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > this.minSwipeDistance) {
            if (diffY > 0) {
                // Swipe up - next slide
                this.scroller.nextSlide();
            } else {
                // Swipe down - previous slide
                this.scroller.prevSlide();
            }
        }
        
        // Reset
        this.startY = 0;
        this.startX = 0;
    }
}

// Background Beams Effect
function createBackgroundBeams() {
    const beamsContainer = document.querySelector('.background-beams');
    if (!beamsContainer) return;
    
    const beamCount = 15;
    
    for (let i = 0; i < beamCount; i++) {
        const beam = document.createElement('div');
        beam.classList.add('beam');
        
        // Random color variant (1, 2, or 3)
        const colorVariant = Math.floor(Math.random() * 3) + 1;
        beam.classList.add(`color-${colorVariant}`);
        
        // Random horizontal position
        const leftPosition = (i * (100 / beamCount)) + (Math.random() * 8 - 4);
        beam.style.left = `${Math.max(0, Math.min(100, leftPosition))}%`;
        
        // Random animation duration and delay
        const duration = 6 + Math.random() * 8; // 6-14 seconds
        const delay = -Math.random() * duration; // Start at random point in animation
        
        beam.style.setProperty('--beam-duration', `${duration}s`);
        beam.style.setProperty('--beam-delay', `${delay}s`);
        
        beamsContainer.appendChild(beam);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const scroller = new HorizontalScroller();
    const touchHandler = new TouchHandler(scroller);
    
    // Create background beams effect
    createBackgroundBeams();
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
}); 