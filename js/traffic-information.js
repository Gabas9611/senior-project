const { createApp, ref } = Vue;

createApp({
    setup() {
        const selectedAction = ref('');
        const actionMessage = ref('');
        const centerIndex = ref(2);
        const isMapVisible = ref(false); // 新增：控制地圖顯示狀態

        const boxes = ref([
            {
                title: '單車',
                title_name:'單車(29min)',
                text:
                    '從大智北一街左轉至大智北路，右轉進新民街，右轉進入復興路四段，左轉進入復興東路，右轉進入樂業路，左轉進入祥順路一段，向右轉進入新平路一段，向左轉進入環太東路，向左轉進入大源路，向右轉進入中山路二段477巷186弄，向右轉進入明秀西路，向左轉進入明秀南路，右轉即可到達目的地。',
                img: './img/traffic/bike.jpg',
            },
            {
                title: '241公車',
                title_name:'241公車(39min)',
                text: '從台中火車站步行4min至台中車站C月台轉乘，經過31min至三中心站下車，再步行4min到達目的地。',
                img: './img/traffic/241bus.jpg',
            },
            {
                title: '汽車',
                title_name:'汽車(22min)',
                text: '從復興路四段到復興東路，向右轉進樂業路，左轉進入祥順路一段，右轉進入中山路二段，之後右轉進入明秀北路，左轉進入明秀東路，再左轉即可到達目的地。',
                img: './img/traffic/car.jpg'
            },
            {
                title: '51公車',
                title_name:'51公車(32min)',
                text: '從台中火車站步行3min到新時代購物中心站搭公車經過24min到三中心站下車，再步行5min到達目的地。',
                img: './img/traffic/51bus.jpg',
            },
            {
                title: '41公車',
                title_name:'41公車(40min)', 
                text: '從台中火車站步行6min到第一廣場轉乘，經過29min後在三中心站下車，再步行5min後抵達。',
                img: './img/traffic/41bus.jpg',
            }
        ]);

        const handleNavClick = (action) => {
            console.log('Button clicked with action:', action);
            selectedAction.value = action;
            if (action === 'home') {
                window.location.href = 'loading.html?target=index.html';
                actionMessage.value = '返回首頁已點擊';
            } else if (action === 'previous') {
                window.location.href = 'loading.html?target=topic.html';
                actionMessage.value = '返回前頁已點擊';
            }
        };

        // 切換地圖和螢幕顯示狀態的函數
        const toggleMap = () => {
            isMapVisible.value = !isMapVisible.value;
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
            const totalBoxes = boxes.value.length;
            const maxOffset = Math.floor(totalBoxes / 2);
            
            // 計算基本偏移量
            let offset = (i - centerIndex.value) * 200;
            
            // 限制偏移量範圍，防止超出容器寬度
            // 假設容器寬度為 95%，考慮到最大卡片寬度400px
            const maxAllowedOffset = 450; // 調整此值以適應您的設計
            
            if (Math.abs(offset) > maxAllowedOffset) {
                offset = offset > 0 ? maxAllowedOffset : -maxAllowedOffset;
            }
            
            // 針對邊界情況進行特殊處理
            if (centerIndex.value === 0) {
                // 當中心在第一個元素時，限制左側偏移
                if (i > centerIndex.value) {
                    offset = Math.min(offset, maxAllowedOffset);
                }
            } else if (centerIndex.value === totalBoxes - 1) {
                // 當中心在最後一個元素時，限制右側偏移
                if (i < centerIndex.value) {
                    offset = Math.max(offset, -maxAllowedOffset);
                }
            }
            
            
            return {
                transform: `translate(-50%, -50%) translateX(${offset}px)`
            };
        };

        return {
            selectedAction,
            actionMessage,
            centerIndex,
            boxes,
            isMapVisible,
            handleNavClick,
            toggleMap,
            updateLayout,
            getSizeClass,
            getStyle
        };
    }
}).mount('#app');