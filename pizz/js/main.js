document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMobile = document.querySelector('.nav-mobile');

    if (menuToggle && navMobile) {
        menuToggle.addEventListener('click', function() {
            navMobile.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (navMobile && !e.target.closest('.header') && !e.target.closest('.nav-mobile') && navMobile.classList.contains('active')) {
            navMobile.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    window.addEventListener('resize', function() {
        if (navMobile && window.innerWidth > 768) {
            navMobile.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.4)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    }

    lastScroll = currentScroll;
});

document.addEventListener('DOMContentLoaded', function() {
    const orderBtn = document.getElementById('orderBtn');
    const floatingOrderBtn = document.getElementById('floatingOrderBtn');
    const orderModal = document.getElementById('orderModal');
    const modalClose = document.getElementById('modalClose');

    function openModal() {
        orderModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        orderModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (orderModal) {
        if (orderBtn) {
            orderBtn.addEventListener('click', openModal);
        }

        if (floatingOrderBtn) {
            floatingOrderBtn.addEventListener('click', openModal);
        }

        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        orderModal.addEventListener('click', function(e) {
            if (e.target === orderModal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && orderModal.classList.contains('active')) {
                closeModal();
            }
        });
    }
});
