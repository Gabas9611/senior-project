const { createApp, onMounted, nextTick } = Vue;
createApp({
    setup() {
        const handleNavClick = (action) => {
            switch (action) {
                case 'previous':
                    window.location.href = 'topic.html';
                    break;
                default:
                    console.log('未知的導航動作:', action);
            }
        };

        onMounted(async () => {
            await nextTick();
            new Swiper(".mySwiper", {
                slidesPerView: 3,
                spaceBetween: 30,
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true,
                },
                breakpoints: {
                    0: {
                        slidesPerView: 1,
                        spaceBetween: 10,
                    },
                    480: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 3,
                        spaceBetween: 30,
                    },
                },
            });
        });

        return {
            handleNavClick,
        };
    }
}).mount("#app");
