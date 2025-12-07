import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
    // Hero Text Reveal
    gsap.from('.hero-title', {
        duration: 1.5,
        y: 100,
        opacity: 0,
        ease: 'power4.out',
        stagger: 0.2
    });

    gsap.from('.hero-subtitle', {
        duration: 1.5,
        y: 50,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.5
    });

    gsap.from('.cta-buttons', {
        duration: 1.5,
        y: 30,
        opacity: 0,
        ease: 'back.out(1.7)',
        delay: 1
    });

    // Event Details Cards (Flip Effect)
    gsap.utils.toArray('.detail-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            duration: 1,
            rotationY: 90,
            opacity: 0,
            ease: 'power2.out',
            delay: i * 0.2
        });
    });

    // About Section
    gsap.from('#about .content', {
        scrollTrigger: {
            trigger: '#about',
            start: 'top 80%',
        },
        duration: 1.2,
        x: -100,
        opacity: 0,
        ease: 'power2.out'
    });

    // Timeline Glow
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
            },
            duration: 0.8,
            x: i % 2 === 0 ? -50 : 50,
            opacity: 0,
            ease: 'power2.out'
        });
    });
}
