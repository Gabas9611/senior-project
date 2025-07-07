const { createApp, ref } = Vue;

        createApp({
            setup() {
                const selectedAction = ref('');
                const actionMessage = ref('');
                const centerIndex = ref(2);
                
                const boxes = ref([
                    { title:'高鐵',text: '123' },
                    {  title:'台鐵',text: '745' },
                    { title:'客運',text: '789' },
                    {  title:'公車',text: '217' },
                    {  title:'自行開車',text: '684' }
                ]);

                const handleNavClick = (action) => {
                    console.log('Button clicked with action:', action);
                    selectedAction.value = action;
                    if (action === 'home') {
                        //console.log('Redirecting to loading畫面.html with target index.html');
                        window.location.href = 'loading畫面.html?target=index.html';
                        actionMessage.value = '返回首頁已點擊';
                    } else if (action === 'previous') {
                        //console.log('Redirecting to loading畫面.html with target 主題頁面.html');
                        window.location.href = 'loading畫面.html?target=主題頁面.html';
                        actionMessage.value = '返回前頁已點擊';
                    }
                };

                const updateLayout = (index) => {
                    centerIndex.value = index;
                };

                const getSizeClass = (i) => {
                    const diff = Math.abs(i - centerIndex.value);
                    if (diff === 0) return 'large';
                    else if (diff === 1) return 'medium';
                    return 'small';
                };

                const getStyle = (i) => {
                    const offset = (i - centerIndex.value) * 150;
                    return {
                        transform: `translate(-50%, -50%) translateX(${offset}px)`
                    };
                };

                return {
                    selectedAction,
                    actionMessage,
                    centerIndex,
                    boxes,
                    handleNavClick,
                    updateLayout,
                    getSizeClass,
                    getStyle
                };
            }
        }).mount('#app');
