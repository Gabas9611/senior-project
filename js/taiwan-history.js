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
                console.log('Redirecting to loading.html with target index.html');
                window.location.href = 'loading.html?target=index.html';
                this.actionMessage = '返回首頁已點擊';
            } else if (action === 'previous') {
                console.log('Redirecting to loading.html with target topic.html');
                window.location.href = 'loading.html?target=topic.html';
                this.actionMessage = '返回前頁已點擊';
            }
        }
    }
}).mount('#app');
