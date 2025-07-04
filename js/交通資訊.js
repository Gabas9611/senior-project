 const { createApp } = Vue;

        createApp({
            data() {
                return {
                    isMenuOpen: false,
                    selectedAction: '',
                    actionMessage: ''
                }
            },
            methods: {
                toggleMenu() {
                    this.isMenuOpen = !this.isMenuOpen;
                    if (this.isMenuOpen) {
                        this.selectedAction = 'menu';
                        this.actionMessage = '選單已開啟';
                    } else {
                        this.selectedAction = '';
                        this.actionMessage = '';
                    }
                },
                handleNavClick(action) {
                    this.selectedAction = action;
                    if (action === 'import') {
                        this.actionMessage = '進入專案功能被點擊';
                    }
                    // 關閉選單如果是開啟的
                    if (this.isMenuOpen) {
                        this.isMenuOpen = false;
                    }
                }
            }
        }).mount('#app');