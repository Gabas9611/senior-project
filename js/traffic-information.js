const { createApp, onMounted, nextTick } = Vue;

        createApp({
            setup() {
                // 處理導航點擊事件
                const handleNavClick = (action) => {
                    switch (action) {
                        case 'previous':
                            // 方法1: 導航到首頁
                            window.location.href = 'topic.html';
                            break;
                        default:
                            console.log('未知的導航動作:', action);
                    }
                };

                return {
                    handleNavClick,
                };
            }
        }).mount("#app");