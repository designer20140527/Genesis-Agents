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
        this.isMobile = window.innerWidth <= 480; // Mobile detection
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        if (!this.isMobile) {
            this.updateSlide(0);
        }
    }
    
    bindEvents() {
        // Skip horizontal scrolling setup on mobile
        if (this.isMobile) {
            return;
        }
        
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
            resizeTimeout = setTimeout(() => {
                this.isMobile = window.innerWidth <= 480;
                if (!this.isMobile) {
                    this.updateSlide(this.currentSlide);
                }
            }, 250);
        });
        
        // Prevent default scroll behavior on horizontal wrapper
        document.querySelector('.horizontal-wrapper').addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    handleWheel(e) {
        // Special handling for slider4 (carousel)
        if (this.currentSlide === 3) { // slider4 is index 3 (0-based)
            const carousel = window.carouselManager;
            if (carousel) {
                // Let carousel try to handle the scroll first
                const carouselHandled = carousel.handleWheel(e);
                
                if (carouselHandled) {
                    // Carousel handled it, don't proceed with main scroll
                    return;
                }
                // If carousel couldn't handle it, continue with main scroll below
            }
        }
        
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

// Slider4 Carousel Functionality
class Slider4CarouselManager {
    constructor() {
        this.currentIndex = 0;
        this.totalItems = 5;
        this.isScrolling = false;
        this.scrollThreshold = 50;
        this.lastScrollTime = 0;
        this.cooldownDuration = 300;
        this.isMobile = window.innerWidth <= 480;
        this.init();
    }
    
    init() {
        if (this.isMobile) {
            // Show all items on mobile without carousel functionality
            this.showAllItemsMobile();
            return;
        }
        this.bindEvents();
        this.bindDotsEvents();
        this.updateCarousel();
    }
    
    bindEvents() {
        const slider4 = document.getElementById('slider4');
        if (!slider4) return;
        
        // Listen for wheel events only when slider4 is active
        slider4.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        
        // Touch support for mobile
        let startY = 0;
        slider4.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        slider4.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const diffY = startY - endY;
            
            if (Math.abs(diffY) > 50) {
                if (diffY > 0 && this.currentIndex < this.totalItems - 1) {
                    this.nextItem();
                } else if (diffY < 0 && this.currentIndex > 0) {
                    this.prevItem();
                }
            }
        }, { passive: true });
    }
    
    bindDotsEvents() {
        const dots = document.querySelectorAll('.slider4-dot');
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (index !== this.currentIndex && !this.isScrolling) {
                    this.currentIndex = index;
                    this.updateCarousel();
                }
            });
        });
    }
    
    // Check if carousel can handle scroll in given direction
    canHandleScroll(direction) {
        if (direction > 0) {
            return this.currentIndex < this.totalItems - 1;
        } else {
            return this.currentIndex > 0;
        }
    }
    
    // Get current carousel state for main scroller
    getCarouselState() {
        return {
            currentIndex: this.currentIndex,
            totalItems: this.totalItems,
            canScrollNext: this.currentIndex < this.totalItems - 1,
            canScrollPrev: this.currentIndex > 0,
            isScrolling: this.isScrolling
        };
    }
    
    handleWheel(e) {
        const currentTime = Date.now();
        if (this.isScrolling || (currentTime - this.lastScrollTime) < this.cooldownDuration) {
            e.preventDefault();
            return true; // Indicate we handled it (busy)
        }
        
        const deltaY = e.deltaY;
        
        if (Math.abs(deltaY) > this.scrollThreshold) {
            if (deltaY > 0 && this.currentIndex < this.totalItems - 1) {
                // Can scroll to next item
                e.preventDefault();
                this.nextItem();
                this.lastScrollTime = currentTime;
                return true; // Successfully handled
            } else if (deltaY < 0 && this.currentIndex > 0) {
                // Can scroll to previous item
                e.preventDefault();
                this.prevItem();
                this.lastScrollTime = currentTime;
                return true; // Successfully handled
            }
        }
        
        return false; // Couldn't handle, let main scroll take over
    }
    
    nextItem() {
        if (this.currentIndex < this.totalItems - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }
    
    prevItem() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }
    
    updateCarousel() {
        this.isScrolling = true;
        
        const carousel = document.querySelector('.slider4-carousel');
        const items = document.querySelectorAll('.roadmap-item');
        const dots = document.querySelectorAll('.slider4-dot');
        
        if (!carousel || !items.length) return;
        
        // Calculate transform position to center the active item
        // Get actual item width from the first item element
        const actualItemWidth = items[0].offsetWidth;
        // Get actual gap size from computed styles
        const carouselStyles = window.getComputedStyle(carousel);
        const gapSize = parseFloat(carouselStyles.gap) || 64; // fallback to 64px
        const itemWidth = actualItemWidth + gapSize;
        const containerWidth = carousel.parentElement.offsetWidth;
        // Get carousel padding from computed styles
        const paddingLeft = parseFloat(carouselStyles.paddingLeft) || 0;
        // Account for padding when calculating the center position
        const firstItemOffset = (containerWidth - actualItemWidth) / 2 - paddingLeft;
        const translateX = firstItemOffset - (this.currentIndex * itemWidth);
        
        carousel.style.transform = `translateX(${translateX}px)`;
        
        // Update active states - hide left items, show current and right items
        items.forEach((item, index) => {
            if (index === this.currentIndex) {
                item.classList.add('active');
                item.style.opacity = '1';
            } else if (index < this.currentIndex) {
                // Hide items to the left (already shown)
                item.classList.remove('active');
                item.style.opacity = '0';
            } else {
                // Show items to the right (future items) with reduced opacity
                item.classList.remove('active');
                item.style.opacity = '0.4';
            }
        });
        
        // Update dots state
        dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Reset scrolling flag
        setTimeout(() => {
            this.isScrolling = false;
        }, 600);
    }
    
    showAllItemsMobile() {
        const carousel = document.querySelector('.slider4-carousel');
        const items = document.querySelectorAll('.roadmap-item');
        
        if (!carousel || !items.length) return;
        
        // Remove transform and show all items
        carousel.style.transform = 'none';
        
        // Show all items with full opacity
        items.forEach((item) => {
            item.classList.add('active');
            item.style.opacity = '1';
        });
    }
}

// Slider2 Tab Functionality
class Slider2TabManager {
    constructor() {
        this.currentTab = 'deploy';
        this.init();
    }
    
    init() {
        this.bindTabEvents();
        // Set initial image for default tab
        this.updateRightImage(this.currentTab);
    }
    
    bindTabEvents() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }
    
    switchTab(tabId) {
        if (tabId === this.currentTab) return;
        
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-content="${tabId}"]`).classList.add('active');
        
        // Update right side image based on tab
        this.updateRightImage(tabId);
        
        this.currentTab = tabId;
    }
    
    updateRightImage(tabId) {
        const rightImageContainer = document.querySelector('.right-image-container');
        if (!rightImageContainer) return;
        
        // Clear existing tab-specific classes
        rightImageContainer.classList.remove('tab-deploy', 'tab-runtime', 'tab-composability', 'tab-universal');
        
        // Add new tab-specific class
        rightImageContainer.classList.add(`tab-${tabId}`);
    }
}

// Slider5 FAQ Accordion Functionality
class Slider5AccordionManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.bindAccordionEvents();
    }
    
    bindAccordionEvents() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                this.toggleAccordionItem(faqItem);
            });
        });
    }
    
    toggleAccordionItem(clickedItem) {
        const isActive = clickedItem.classList.contains('active');
        
        // Close all other items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== clickedItem) {
                item.classList.remove('active');
            }
        });
        
        // Toggle the clicked item
        if (isActive) {
            clickedItem.classList.remove('active');
        } else {
            clickedItem.classList.add('active');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const scroller = new HorizontalScroller();
    const touchHandler = new TouchHandler(scroller);
    const tabManager = new Slider2TabManager();
    const carouselManager = new Slider4CarouselManager();
    const accordionManager = new Slider5AccordionManager();
    
    // Make carousel manager globally accessible
    window.carouselManager = carouselManager;
    
    // Create background beams effect
    createBackgroundBeams();
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
}); 