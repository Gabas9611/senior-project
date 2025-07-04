const { createApp } = Vue;

createApp({
    data() {
        return {
            selectedAction: '',
            actionMessage: ''
        }
    },
    methods: {
        handleNavClick(action) {
            console.log('Button clicked with action:', action);
            this.selectedAction = action;
            if (action === 'home') {
                console.log('Redirecting to loading畫面.html with target index.html');
                window.location.href = 'loading畫面.html?target=index.html';
                this.actionMessage = '返回首頁已點擊';
            } else if (action === 'previous') {
                console.log('Redirecting to loading畫面.html with target 主題頁面.html');
                window.location.href = 'loading畫面.html?target=主題頁面.html';
                this.actionMessage = '返回前頁已點擊';
            }
        }
    }
}).mount('#app');