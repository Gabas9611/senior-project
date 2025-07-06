import { createApp } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 宣告全域變數以供所有相關函式存取
let scene, renderer, defaultCamera, currentCamera, controls, raycaster, mouse;
let loadedModel = null; // 確保 loadedModel 有初始值
let isFirstPersonMode = false;
let firstPersonRotationX = 0;
let firstPersonRotationY = 0;
let previousMouseX = 0;
let previousMouseY = 0;
let isDragging = false;
let navCameras = {}; // 宣告為全域變數，並在 mounted 中填充

// 導覽攝影機的設定 (Moved to global scope)
let cameraNav1, cameraNav2, cameraNav3, cameraNav4, cameraNav5, cameraNav6, cameraNav7, cameraNav8, cameraNav9, cameraNav10, cameraNav11;

// 宣告互動物件相關的全域變數
const targetObjectNames = ["我是導覽點01", "我是導覽點02", "我是導覽點03", "我是導覽點04", "我是導覽點05", "我是導覽點06"]; // 宣告為全域常數
const highlightableNames = ["我是導覽點01", "我是導覽點02", "我是導覽點03", "我是導覽點04", "我是導覽點05", "我是導覽點06", "介紹欄1", "介紹欄2", "介紹欄3", "介紹", "出口"]; // 宣告為全域常數
const frameNames = ["畫框01", "畫框02", "畫框03", "畫框04"]; // 宣告為全域常數
const highlightableObjects = []; // 宣告為全域變數
let currentHoveredObject = null; // 宣告為全域變數
let originalEmissive = new Map(); // 宣告為全域變數

createApp({
    data() {
        return {
            isMenuOpen: false,
            selectedAction: '',
            actionMessage: '',
            showInfoModal: false, // 控制資訊彈出視窗的顯示
            infoModalTitle: '',   // 資訊彈出視窗的標題
            infoModalContent: '',  // 資訊彈出視窗的內容
            infoModalButtonText: '進入參觀', // 新增：資訊彈出視窗按鈕文字
            modalAction: '', // 新增：彈出視窗按鈕的動作類型
            showModalButton: true, // 新增：控制是否顯示彈出視窗按鈕
            isInitialized: false // 新增：追蹤應用程式是否已初始化
        }
    },
    methods: {
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
            if (controls) {
                controls.enabled = !this.isMenuOpen; // 選單開啟時禁用 controls，關閉時啟用
                if (this.isMenuOpen) {
                    console.log('選單已開啟，OrbitControls 已禁用。');
                } else {
                    console.log('選單已關閉，OrbitControls 已重新啟用。');
                }
            }
            if (this.isMenuOpen) {
                this.selectedAction = 'menu';
                this.actionMessage = '選單已開啟';
            }
        },
        handleNavClick(action) {
            this.selectedAction = action;
            if (action === 'import') {
                window.location.href = 'loading畫面.html?target=交通資訊.html';
                this.actionMessage = '進入專案已點擊';
            } else if (action === 'navigation') {
                this.actionMessage = '進入導覽已點擊';
            } else if (action === 'introduction') {
                window.location.href = 'loading畫面.html?target=index.html';
                this.actionMessage = '簡介已點擊';
            } else if (action === 'traffic') {
                this.actionMessage = '交通資訊已點擊';
            } else if (action === 'showExhibitionA') {
                this.switchToCamera('NavCamera7');
                this.actionMessage = '展覽館A已點擊';
            } else if (action === 'showExhibitionB') {
                this.switchToCamera('NavCamera8');
                this.actionMessage = '展覽館B已點擊';
            } else if (action === 'showExhibitionC') {
                this.switchToCamera('NavCamera9');
                this.actionMessage = '展覽館C已點擊';
            }
            if (this.isMenuOpen) {
                this.isMenuOpen = false;
            }
        },
        switchToCamera(cameraName) {
            const targetCameraConfig = navCameras[Object.keys(navCameras).find(key => navCameras[key].camera.name === cameraName)];

            if (targetCameraConfig && targetCameraConfig.camera) {
                const targetCamera = targetCameraConfig.camera;
                const targetIsFirstPersonMode = targetCameraConfig.isFirstPerson;

                currentCamera = targetCamera;

                console.log(`切換目標攝影機 ${cameraName} 的宣告位置:`, targetCamera.position);

                controls.enabled = false;
                isFirstPersonMode = targetIsFirstPersonMode;

                gsap.to(currentCamera.position, {
                    duration: 1.5,
                    x: targetCamera.position.x,
                    y: targetCamera.position.y,
                    z: targetCamera.position.z,
                    ease: "power2.inOut",
                    onComplete: function () {
                        console.log(`攝影機已切換到 ${cameraName}，位置:`, currentCamera.position);
                        console.log(`攝影機已切換到 ${cameraName}，旋轉:`, currentCamera.rotation);
                    }
                });

                const targetRotationX = targetIsFirstPersonMode ? targetCameraConfig.initialRotationX : targetCamera.rotation.x;
                const targetRotationY = targetIsFirstPersonMode ? targetCameraConfig.initialRotationY : targetCamera.rotation.y;
                const targetRotationZ = targetIsFirstPersonMode ? 0 : targetCamera.rotation.z;

                gsap.to(currentCamera.rotation, {
                    duration: 1.5,
                    x: targetRotationX,
                    y: targetRotationY,
                    z: targetRotationZ,
                    ease: "power2.inOut",
                    onComplete: function () {
                        if (isFirstPersonMode) {
                            firstPersonRotationX = targetRotationX;
                            firstPersonRotationY = targetRotationY;
                        }
                        console.log(`攝影機已切換到 ${cameraName}，最終旋轉: X=${currentCamera.rotation.x.toFixed(2)}, Y=${currentCamera.rotation.y.toFixed(2)}, Z=${currentCamera.rotation.z.toFixed(2)}`);
                        console.log(`使用的 initialRotationX: ${targetRotationX.toFixed(2)}, initialRotationY: ${targetRotationY.toFixed(2)}`);
                    }
                });
            } else {
                console.warn(`無法找到名為 ${cameraName} 的攝影機配置。`);
            }
        },
        closeInfoModal() {
            this.showInfoModal = false;
            // 重新啟用 OrbitControls
            if (controls) { // 檢查 controls 是否已定義
                controls.enabled = true;
                controls.update();
                console.log('資訊彈出視窗已關閉，OrbitControls 已重新啟用。');
            }
        },
        // *** 修改開始：showFrameInfo 方法新增 clickedObject 參數 ***
        showFrameInfo(itemName, clickedObject = null) {
            // 禁用 OrbitControls
            if (controls) { // 檢查 controls 是否已定義
                controls.enabled = false;
                console.log('OrbitControls 已禁用。');
            }

            let displayTitle = itemName; // 預設使用傳入的 itemName
            let displayContent = '沒有找到該物件的介紹資訊。';

            // 如果傳入了 clickedObject 且它有 customDisplayName，則優先使用 customDisplayName 作為標題
            if (clickedObject && clickedObject.userData && clickedObject.userData.customDisplayName) {
                displayTitle = clickedObject.userData.customDisplayName;
            }

            // 根據原始物件名稱設定不同的內容 (這裡保持您現有的邏輯，用 itemName 來判斷)
            switch (itemName) {
                case '畫框01':
                    displayContent = '這是畫框01的詳細介紹內容。它展示了歷史的痕跡。';
                    this.infoModalButtonText = '查看更多畫作';
                    this.modalAction = 'viewArtwork';
                    this.showModalButton = true;
                    break;
                case '介紹欄1':
                    displayContent = '這是行銷工坊的詳細介紹內容。';
                    this.infoModalButtonText = '進入導覽';
                    this.modalAction = 'enterExhibitionA';
                    this.showModalButton = true;
                    break;
                case '介紹欄2':
                    displayContent = '這是設計部的詳細介紹內容。';
                    this.infoModalButtonText = '參觀室內';
                    this.modalAction = 'enterDesignDept';
                    this.showModalButton = true;
                    break;
                case '介紹欄3':
                    displayContent = '這是人力資源部的詳細介紹內容。';
                    this.infoModalButtonText = '進入導覽';
                    this.modalAction = 'enterHRDept';
                    this.showModalButton = true;
                    break;
                case '介紹':
                    displayContent = '歡迎來到勤益彈藥庫改造後的現場<br>以下將帶您來了解要如何操作。<br>1.按住滑鼠左鍵拖曳滑鼠可以調整視角<br>2.點擊地圖上的星星可以切換攝影機<br>3.點擊介紹牌可以與建築互動';
                    this.infoModalButtonText = '了解更多';
                    this.modalAction = 'learnMore';
                    this.showModalButton = false; // 這裡設定為 false，不顯示按鈕
                    break;
                case '出口':
                    displayContent = '這是離開展廳的相關資訊。';
                    this.infoModalButtonText = '離開';
                    this.modalAction = 'exit';
                    this.showModalButton = true;
                    break;
                default:
                    displayContent = '沒有找到該物件的介紹資訊。';
                    this.infoModalButtonText = '關閉';
                    this.modalAction = 'close';
                    this.showModalButton = true;
            }
            this.infoModalTitle = displayTitle;   // 設定彈出視窗標題
            this.infoModalContent = displayContent;  // 資訊彈出視窗的內容
            this.showInfoModal = true;
        },
        enterExhibition() {
            this.closeInfoModal(); // 先關閉彈出視窗
            switch (this.modalAction) {
                case 'enterExhibitionA':
                    window.location.href = 'loading畫面.html?target=台灣歷史.html';
                    break;
                case 'exit':
                    window.location.href = 'loading畫面.html?target=index.html';
                    break;
                case 'viewArtwork':
                    // 這裡可以添加跳轉到畫作詳細頁面或執行其他操作的邏輯
                    console.log('查看更多畫作');
                    break;
                case 'enterDesignDept':
                    window.location.href = 'loading畫面.html?target=展覽館A.html';
                    break;
                case 'enterHRDept':
                    window.location.href = 'loading畫面.html?target=彈藥庫歷史.html';
                    break;
                case 'learnMore':
                    console.log('了解更多');
                    break;
                case 'close':
                default:
                    // 預設行為，例如只關閉彈出視窗
                    break;
            }
        },
        // *** 修改結束：showFrameInfo 方法 ***

        // 新增：滑鼠點擊事件，用於切換攝影機和偵測物件點擊
        onMouseClick(event) {
            // 確保應用程式已初始化，避免在載入時觸發
            if (!this.isInitialized) {
                console.log('應用程式未初始化，忽略點擊事件。');
                return;
            }

            // 檢查 loadedModel, raycaster, mouse, currentCamera 是否已初始化
            if (!loadedModel || !raycaster || !mouse || !currentCamera) {
                console.warn('Three.js 核心物件尚未完全初始化。');
                return;
            }

            event.preventDefault();

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, currentCamera);

            // *** 關鍵修正：偵測整個模型，而不只是導覽點 ***
            const intersects = raycaster.intersectObjects([loadedModel], true);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object; // 這是實際被點擊的 Three.js 物件

                // clickableFramesAndDoor 和 frameNames 現在是全域變數
                const clickableObjects = ["介紹欄1", "介紹欄2", "介紹欄3", "介紹", "出口"];
                let targetNavPointName = null;
                let clickedItemName = null;

                // --- 遍歷父物件，同時檢查導覽點和可點擊物件 ---
                let parent = clickedObject;
                while (parent) {
                    // 檢查是否為導覽點 (使用全域變數 targetObjectNames)
                    if (!targetNavPointName && targetObjectNames.includes(parent.name)) {
                        targetNavPointName = parent.name;
                    }
                    // 檢查是否為可點擊的物件 (畫框、門或桌子)
                    if (!clickedItemName && clickableObjects.includes(parent.name)) {
                        clickedItemName = parent.name;
                    }
                    // 如果兩種類型都找到了，就可以提前結束循環
                    if (targetNavPointName && clickedItemName) {
                        break;
                    }
                    parent = parent.parent;
                }

                // 如果找到了可點擊的物件，就顯示資訊彈出視窗
                if (clickedItemName) {
                    // *** 修改：傳遞 clickedObject ***
                    this.showFrameInfo(clickedItemName, clickedObject);

                    // 如果點擊的是「介紹欄1」，則切換攝影機並將視角向後看
                    if (clickedItemName === '介紹欄1') {
                        // 直接使用全域的 cameraNav7
                        const targetCamera = cameraNav7;

                        if (targetCamera) {
                            console.log('Clicked "介紹欄1". Target Camera (NavCamera7) position:', targetCamera.position);
                            console.log('Current Camera position BEFORE switch:', currentCamera.position);
                            console.log('Current Camera rotation BEFORE switch:', currentCamera.rotation);

                            // 立即切換 currentCamera
                            currentCamera = targetCamera;

                            // 禁用 OrbitControls
                            controls.enabled = false;
                            isFirstPersonMode = true; // 設定為第一人稱模式

                            // 使用 GSAP 動畫平滑移動攝影機到 NavCamera7 的位置
                            gsap.to(currentCamera.position, {
                                duration: 1.5,
                                x: targetCamera.position.x,
                                y: targetCamera.position.y,
                                z: targetCamera.position.z,
                                ease: "power2.inOut",
                                onComplete: function () {
                                    console.log('GSAP position animation complete. Current Camera position AFTER animation:', currentCamera.position);
                                    console.log('攝影機已切換到 NavCamera7，並進入第一人稱模式。');
                                    // 在第一人稱模式下，OrbitControls 應保持禁用
                                    // 並且不需要設定 controls.object 或 controls.target
                                    // 視角控制將由 handleMouseMove 處理
                                    // *** 修改：傳遞 clickedObject ***
                                    this.showFrameInfo('介紹欄1', clickedObject); // 在動畫完成後顯示資訊彈出視窗
                                }.bind(this) // 綁定 this，確保在 onComplete 中可以訪問 Vue 實例的 this
                            });

                            // 移除旋轉動畫，讓攝影機保持其預設的初始旋轉
                            // 確保第一人稱攝影機的初始旋轉與模型導覽點一致
                            // 並且將當前攝影機的旋轉設定為這個初始旋轉
                            // 這樣滑鼠拖曳可以從這個點開始
                            const navCamera7Config = navCameras["我是導覽點07"];
                            if (navCamera7Config) {
                                currentCamera.rotation.set(navCamera7Config.initialRotationX, navCamera7Config.initialRotationY, 0, 'YXZ');
                                firstPersonRotationX = navCamera7Config.initialRotationX;
                                firstPersonRotationY = navCamera7Config.initialRotationY;
                                console.log('NavCamera7 initial rotation applied: X=', firstPersonRotationX, 'Y=', firstPersonRotationY);
                            } else {
                                console.warn('NavCamera7 config not found in navCameras.');
                            }

                        } else {
                            console.warn('無法找到 cameraNav7。');
                        }
                    } else if (clickedItemName === '介紹欄2') {
                        // 直接使用全域的 cameraNav8
                        const targetCamera = cameraNav8;

                        if (targetCamera) {
                            console.log('Clicked "介紹欄2". Target Camera (NavCamera8) position:', targetCamera.position);
                            console.log('Current Camera position BEFORE switch:', currentCamera.position);
                            console.log('Current Camera rotation BEFORE switch:', currentCamera.rotation);

                            // 立即切換 currentCamera
                            currentCamera = targetCamera;

                            // 禁用 OrbitControls
                            controls.enabled = false;
                            isFirstPersonMode = true; // 設定為第一人稱模式

                            // 使用 GSAP 動畫平滑移動攝影機到 NavCamera8 的位置
                            gsap.to(currentCamera.position, {
                                duration: 1.5,
                                x: targetCamera.position.x,
                                y: targetCamera.position.y,
                                z: targetCamera.position.z,
                                ease: "power2.inOut",
                                onComplete: function () {
                                    console.log('GSAP position animation complete. Current Camera position AFTER animation:', currentCamera.position);
                                    console.log('攝影機已切換到 NavCamera8，並進入第一人稱模式。');
                                    // 在第一人稱模式下，OrbitControls 應保持禁用
                                    // 並且不需要設定 controls.object 或 controls.target
                                    // 視角控制將由 handleMouseMove 處理
                                    // *** 修改：傳遞 clickedObject ***
                                    this.showFrameInfo('介紹欄2', clickedObject); // 在動畫完成後顯示資訊彈出視窗
                                }.bind(this) // 綁定 this，確保在 onComplete 中可以訪問 Vue 實例的 this
                            });

                            // 移除旋轉動畫，讓攝影機保持其預設的初始旋轉
                            // 確保第一人稱攝影機的初始旋轉與模型導覽點一致
                            // 並且將當前攝影機的旋轉設定為這個初始旋轉
                            // 這樣滑鼠拖曳可以從這個點開始
                            const navCamera8Config = navCameras["我是導覽點08"];
                            if (navCamera8Config) {
                                currentCamera.rotation.set(navCamera8Config.initialRotationX, navCamera8Config.initialRotationY, 0, 'YXZ');
                                firstPersonRotationX = navCamera8Config.initialRotationX;
                                firstPersonRotationY = navCamera8Config.initialRotationY;
                                console.log('NavCamera8 initial rotation applied: X=', firstPersonRotationX, 'Y=', firstPersonRotationY);
                            } else {
                                console.warn('NavCamera8 config not found in navCameras.');
                            }

                        } else {
                            console.warn('無法找到 cameraNav8。');
                        }
                    } else if (clickedItemName === '介紹欄3') {
                        // 直接使用全域的 cameraNav9
                        const targetCamera = cameraNav9;

                        if (targetCamera) {
                            console.log('Clicked "介紹欄3". Target Camera (NavCamera9) position:', targetCamera.position);
                            console.log('Current Camera position BEFORE switch:', currentCamera.position);
                            console.log('Current Camera rotation BEFORE switch:', currentCamera.rotation);

                            // 立即切換 currentCamera
                            currentCamera = targetCamera;

                            // 禁用 OrbitControls
                            controls.enabled = false;
                            isFirstPersonMode = true; // 設定為第一人稱模式

                            // 使用 GSAP 動畫平滑移動攝影機到 NavCamera9 的位置
                            gsap.to(currentCamera.position, {
                                duration: 1.5,
                                x: targetCamera.position.x,
                                y: targetCamera.position.y,
                                z: targetCamera.position.z,
                                ease: "power2.inOut",
                                onComplete: function () {
                                    console.log('GSAP position animation complete. Current Camera position AFTER animation:', currentCamera.position);
                                    console.log('攝影機已切換到 NavCamera9，並進入第一人稱模式。');
                                    // 在第一人稱模式下，OrbitControls 應保持禁用
                                    // 並且不需要設定 controls.object 或 controls.target
                                    // 視角控制將由 handleMouseMove 處理
                                    // *** 修改：傳遞 clickedObject ***
                                    this.showFrameInfo('介紹欄3', clickedObject); // 在動畫完成後顯示資訊彈出視窗
                                }.bind(this) // 綁定 this，確保在 onComplete 中可以訪問 Vue 實例的 this
                            });

                            // 移除旋轉動畫，讓攝影機保持其預設的初始旋轉
                            // 確保第一人稱攝影機的初始旋轉與模型導覽點一致
                            // 並且將當前攝影機的旋轉設定為這個初始旋轉
                            // 這樣滑鼠拖曳可以從這個點開始
                            const navCamera9Config = navCameras["我是導覽點09"];
                            if (navCamera9Config) {
                                currentCamera.rotation.set(navCamera9Config.initialRotationX, navCamera9Config.initialRotationY, 0, 'YXZ');
                                firstPersonRotationX = navCamera9Config.initialRotationX;
                                firstPersonRotationY = navCamera9Config.initialRotationY;
                                console.log('NavCamera9 initial rotation applied: X=', firstPersonRotationX, 'Y=', firstPersonRotationY);
                            } else {
                                console.warn('NavCamera9 config not found in navCameras.');
                            }

                        } else {
                            console.warn('無法找到 cameraNav9。');
                        }
                    } else if (clickedItemName === '介紹') {
                        // 直接使用全域的 cameraNav10
                        const targetCamera = cameraNav10;

                        if (targetCamera) {
                            console.log('Clicked "介紹". Target Camera (NavCamera10) position:', targetCamera.position);
                            console.log('Current Camera position BEFORE switch:', currentCamera.position);
                            console.log('Current Camera rotation BEFORE switch:', currentCamera.rotation);

                            // 立即切換 currentCamera
                            currentCamera = targetCamera;

                            // 禁用 OrbitControls
                            controls.enabled = false;
                            isFirstPersonMode = true; // 設定為第一人稱模式

                            // 使用 GSAP 動畫平滑移動攝影機到 NavCamera10 的位置
                            gsap.to(currentCamera.position, {
                                duration: 1.5,
                                x: targetCamera.position.x,
                                y: targetCamera.position.y,
                                z: targetCamera.position.z,
                                ease: "power2.inOut",
                                onComplete: function () {
                                    console.log('GSAP position animation complete. Current Camera position AFTER animation:', currentCamera.position);
                                    console.log('攝影機已切換到 NavCamera10，並進入第一人稱模式。');
                                    // 在第一人稱模式下，OrbitControls 應保持禁用
                                    // 並且不需要設定 controls.object 或 controls.target
                                    // 視角控制將由 handleMouseMove 處理
                                    // *** 修改：傳遞 clickedObject ***
                                    this.showFrameInfo('介紹', clickedObject); // 在動畫完成後顯示資訊彈出視窗
                                }.bind(this) // 綁定 this，確保在 onComplete 中可以訪問 Vue 實例的 this
                            });

                            // 移除旋轉動畫，讓攝影機保持其預設的初始旋轉
                            // 確保第一人稱攝影機的初始旋轉與模型導覽點一致
                            // 並且將當前攝影機的旋轉設定為這個初始旋轉
                            // 這樣滑鼠拖曳可以從這個點開始
                            const navCamera10Config = navCameras["我是導覽點10"];
                            if (navCamera10Config) {
                                currentCamera.rotation.set(navCamera10Config.initialRotationX, navCamera10Config.initialRotationY, 0, 'YXZ');
                                firstPersonRotationX = navCamera10Config.initialRotationX;
                                firstPersonRotationY = navCamera10Config.initialRotationY;
                                console.log('NavCamera10 initial rotation applied: X=', firstPersonRotationX, 'Y=', firstPersonRotationY);
                            } else {
                                console.warn('NavCamera10 config not found in navCameras.');
                            }

                        } else {
                            console.warn('無法找到 cameraNav10。');
                        }
                    } else if (clickedItemName === '出口') {
                        // 直接使用全域的 cameraNav11
                        const targetCamera = cameraNav11;

                        if (targetCamera) {
                            console.log('Clicked "出口". Target Camera (NavCamera11) position:', targetCamera.position);
                            console.log('Current Camera position BEFORE switch:', currentCamera.position);
                            console.log('Current Camera rotation BEFORE switch:', currentCamera.rotation);

                            // 立即切換 currentCamera
                            currentCamera = targetCamera;

                            // 禁用 OrbitControls
                            controls.enabled = false;
                            isFirstPersonMode = true; // 設定為第一人稱模式

                            // 使用 GSAP 動畫平滑移動攝影機到 NavCamera11 的位置
                            gsap.to(currentCamera.position, {
                                duration: 1.5,
                                x: targetCamera.position.x,
                                y: targetCamera.position.y,
                                z: targetCamera.position.z,
                                ease: "power2.inOut",
                                onComplete: function () {
                                    console.log('GSAP position animation complete. Current Camera position AFTER animation:', currentCamera.position);
                                    console.log('攝影機已切換到 NavCamera11，並進入第一人稱模式。');
                                    // 在第一人稱模式下，OrbitControls 應保持禁用
                                    // 並且不需要設定 controls.object 或 controls.target
                                    // 視角控制將由 handleMouseMove 處理
                                    // *** 修改：傳遞 clickedObject ***
                                    this.showFrameInfo('出口', clickedObject); // 在動畫完成後顯示資訊彈出視窗
                                }.bind(this) // 綁定 this，確保在 onComplete 中可以訪問 Vue 實例的 this
                            });

                            // 移除旋轉動畫，讓攝影機保持其預設的初始旋轉
                            // 確保第一人稱攝影機的初始旋轉與模型導覽點一致
                            // 並且將當前攝影機的旋轉設定為這個初始旋轉
                            // 這樣滑鼠拖曳可以從這個點開始
                            const navCamera11Config = navCameras["我是導覽點11"];
                            if (navCamera11Config) {
                                currentCamera.rotation.set(navCamera11Config.initialRotationX, navCamera11Config.initialRotationY, 0, 'YXZ');
                                firstPersonRotationX = navCamera11Config.initialRotationX;
                                firstPersonRotationY = navCamera11Config.initialRotationY;
                                console.log('NavCamera11 initial rotation applied: X=', firstPersonRotationX, 'Y=', firstPersonRotationY);
                            } else {
                                console.warn('NavCamera11 config not found in navCameras.');
                            }

                        } else {
                            console.warn('無法找到 cameraNav11。');
                        }
                    }
                }

                // 如果點擊的是導覽點，執行攝影機切換
                if (targetNavPointName) {
                    console.log(`Clicked on: ${targetNavPointName}`); // Debug log
                    // *** 關鍵修正：將 currentTargetCameraObj 和 targetIsFirstPersonMode 儲存為局部常數 ***
                    const currentTargetCameraObj = navCameras[targetNavPointName]; // navCameras 現在是全域變數
                    if (currentTargetCameraObj && currentTargetCameraObj.camera) {
                        const targetCamera = currentTargetCameraObj.camera;
                        const targetIsFirstPersonMode = currentTargetCameraObj.isFirstPerson; // 儲存目標模式

                        // *** 修正：在動畫開始前就切換 currentCamera ***
                        currentCamera = targetCamera;

                        console.log(`點擊了 "${targetNavPointName}"，準備切換到攝影機 "${currentCamera.name}"`);
                        console.log('Current isFirstPersonMode:', isFirstPersonMode); // Debug log
                        console.log('Controls enabled before disable:', controls.enabled); // Debug log

                        // 禁用 OrbitControls
                        controls.enabled = false;
                        console.log('Controls enabled after disable:', controls.enabled);

                        // 判斷是否為第一人稱模式 (這個是全域變數，會在動畫開始時設定)
                        isFirstPersonMode = targetIsFirstPersonMode; // 現在直接使用儲存的目標模式
                        console.log('New isFirstPersonMode:', isFirstPersonMode);

                        // 1. 先讀取目標攝影機預先宣告好的座標
                        const destinationPosition = targetCamera.position.clone(); // 使用 .clone() 確保我們得到一個獨立的向量，而不是參考

                        // 2. 再使用讀取到的座標進行移動動畫
                        gsap.to(currentCamera.position, {
                            duration: 1.5,
                            x: destinationPosition.x,
                            y: destinationPosition.y,
                            z: destinationPosition.z,
                            ease: "power2.inOut",
                            onUpdate: function () {
                                // 在動畫過程中，如果目標攝影機是第一人稱，保持看向初始方向；否則看向 OrbitControls 的目標
                                // 這裡使用 `targetIsFirstPersonMode` 而不是 `isFirstPersonMode`，確保動畫期間行為正確
                                if (!targetIsFirstPersonMode) {
                                    // 這裡如果 currentTargetCameraObj.initialLookAt 是 null，會導致錯誤
                                    // 所以確保這裡有個 fallback
                                    const lookAtTarget = currentTargetCameraObj.initialLookAt || new THREE.Vector3(0, 0, 0);
                                    currentCamera.lookAt(lookAtTarget);
                                } else {
                                    // 對於第一人稱動畫，讓它保持當前動畫的 rotation 即可，因為 onComplete 會設定
                                }
                            },
                            onComplete: function () {
                                console.log('GSAP position animation complete.'); // Debug log
                                currentCamera = targetCamera; // 正式切換攝影機實例
                                console.log('currentCamera after switch:', currentCamera.name); // Debug log

                                // 這裡的 isFirstPersonMode 是動畫結束時的全域狀態
                                if (isFirstPersonMode) {
                                    console.log("進入第一人稱模式");
                                    // 確保第一人稱攝影機的初始旋轉與模型導覽點一致
                                    // 並且將當前攝影機的旋轉設定為這個初始旋轉
                                    // 這樣滑鼠拖曳可以從這個點開始
                                    // *** 修正：使用 currentTargetCameraObj 確保正確的 initialRotation ***
                                    currentCamera.rotation.set(currentTargetCameraObj.initialRotationX, currentTargetCameraObj.initialRotationY, 0, 'YXZ');
                                    firstPersonRotationX = currentTargetCameraObj.initialRotationX;
                                    firstPersonRotationY = currentTargetCameraObj.initialRotationY;

                                    // 啟用滑鼠拖曳控制的標誌
                                    isDragging = false; // 初始不拖曳

                                } else {
                                    // 恢復 OrbitControls 設置，並啟用
                                    controls.object = currentCamera; // 更新 OrbitControls 所控制的攝影機
                                    // *** 修正：使用 currentTargetCameraObj 確保正確的 initialLookAt ***
                                    controls.target.copy(currentTargetCameraObj.initialLookAt || new THREE.Vector3(0, 0, 0)); // 設定為導覽攝影機的初始目標點，實現軌道旋轉
                                    controls.enableZoom = true;
                                    controls.enablePan = true;
                                    controls.minPolarAngle = 0; // 解除垂直旋轉限制
                                    controls.maxPolarAngle = Math.PI; // 解除垂直旋轉限制
                                    controls.enabled = true; // 啟用 OrbitControls
                                    controls.update(); // 強制更新 controls
                                    console.log('OrbitControls re-enabled for non-first-person mode.'); // Debug log
                                }
                                console.log('Controls enabled at end of position animation:', controls.enabled); // Debug log
                            }
                        });

                        // 使用 GSAP 動畫平滑旋轉攝影機 (對於第一人稱，是旋轉到初始朝向)
                        // *** 修正：確保目標是第一人稱的初始旋轉，而不是 targetCamera 的 rotation ***
                        const targetRotationX = targetIsFirstPersonMode ? currentTargetCameraObj.initialRotationX : targetCamera.rotation.x;
                        const targetRotationY = targetIsFirstPersonMode ? currentTargetCameraObj.initialRotationY : targetCamera.rotation.y;
                        const targetRotationZ = targetIsFirstPersonMode ? 0 : targetCamera.rotation.z; // 第一人稱通常 Z 軸為 0，避免 roll

                        gsap.to(currentCamera.rotation, {
                            duration: 1.5,
                            x: targetRotationX,
                            y: targetRotationY,
                            z: targetRotationZ,
                            ease: "power2.inOut",
                            onComplete: function () {
                                console.log('GSAP rotation animation complete.'); // Debug log
                            }
                        });
                    }
                }
            }
        },
    },
    mounted() {
        // 0. 基本設定
        const container = document.getElementById('three-container');
        if (!container) {
            console.error('無法找到 ID 為 "three-container" 的容器。');
            return;
        }

        // 導覽攝影機的設定 (保持不變)
        cameraNav1 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav1.name = "NavCamera1";
        cameraNav1.position.set(-6.47, -0.9, -0.17);

        cameraNav2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav2.name = "NavCamera2";
        cameraNav2.position.set(-4.51, -0.9, -0.17);

        cameraNav3 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav3.name = "NavCamera3";
        cameraNav3.position.set(-2.14, -0.9, -0.17);

        cameraNav4 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav4.name = "NavCamera4";
        cameraNav4.position.set(0.47, -0.9, -0.17);

        cameraNav5 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav5.name = "NavCamera5";
        cameraNav5.position.set(3.38, -0.9, -0.17);

        cameraNav6 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav6.name = "NavCamera6";
        cameraNav6.position.set(5.36, -0.9, -0.17);


        cameraNav7 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav7.name = "NavCamera7";
        cameraNav7.position.set(3.38, -0.9, -0.17);
        cameraNav7.rotation.y = Math.PI; // 將攝影機繞 Y 軸旋轉 180 度 (π 弧度)

        cameraNav8 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav8.name = "NavCamera8";
        cameraNav8.position.set(-2.14, -0.9, -0.17); // 調整位置


        cameraNav9 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav9.name = "NavCamera9";
        cameraNav9.position.set(-4.51, -0.9, -0.17); // 調整位置
        cameraNav9.rotation.y = Math.PI;

        cameraNav10 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav10.name = "NavCamera10";
        cameraNav10.position.set(-4.62, -0.9, -0.17);
        cameraNav10.rotation.y = -Math.PI / 2;

        cameraNav11 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav11.name = "NavCamera11";
        cameraNav11.position.set(5.37, -0.9, -0.17);



        // 導覽點與攝影機的對應關係 (保持不變)
        navCameras = {
            "我是導覽點01": { camera: cameraNav1, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: Math.PI / 2 },
            "我是導覽點02": { camera: cameraNav2, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 },
            "我是導覽點03": { camera: cameraNav3, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 },
            "我是導覽點04": { camera: cameraNav4, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 },
            "我是導覽點05": { camera: cameraNav5, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 },
            "我是導覽點06": { camera: cameraNav6, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: -Math.PI / 2 },
            "我是導覽點07": { camera: cameraNav7, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: Math.PI }, // 对应介紹欄1
            "我是導覽點08": { camera: cameraNav8, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 }, // 对应介紹欄2
            "我是導覽點09": { camera: cameraNav9, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: Math.PI },  // 对应介紹欄3
            "我是導覽點10": { camera: cameraNav10, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: Math.PI / 2 }, // 对应介紹
            "我是導覽點11": { camera: cameraNav11, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: -Math.PI / 2 } // 对应出口
        };

        // 1. 初始化場景、攝影機和渲染器 (賦值給全域變數)
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);

        defaultCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        defaultCamera.position.set(0, 0, 5);
        currentCamera = defaultCamera;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
// ✅ 顯示觸控事件提示框（適用於 iOS 手機除錯）
renderer.domElement.addEventListener('touchstart', function () {
  const debugBox = document.createElement('div');
  debugBox.style.position = 'fixed';
  debugBox.style.top = '10px';
  debugBox.style.right = '10px';
  debugBox.style.zIndex = 9999;
  debugBox.style.backgroundColor = 'rgba(0,0,0,0.7)';
  debugBox.style.color = 'white';
  debugBox.style.padding = '10px';
  debugBox.style.borderRadius = '10px';
  debugBox.style.fontSize = '16px';
  debugBox.innerText = '📱 已偵測到觸控事件';
  document.body.appendChild(debugBox);
});

        container.appendChild(renderer.domElement);

        // 2. 添加環境光和方向光
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7.5).normalize();
        scene.add(directionalLight);

        // 3. 初始化 OrbitControls (賦值給全域變數)
        controls = new OrbitControls(currentCamera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 50;
        controls.enableZoom = false; // 禁用縮放功能
        controls.enableRotate = true;

        // ✅ 加這段以支援手機手勢操作
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        // 4. 初始化變數 (賦值給全域變數)
        const loader = new GLTFLoader();
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        const modelCenter = new THREE.Vector3();
        const modelSize = new THREE.Vector3();

        // 5. 載入模型
        loader.load(
            './model/06月團體專題-老建築改建-20250703-02版 .glb',
            function (gltf) {
                loadedModel = gltf.scene;
                scene.add(loadedModel);
                console.log('--- 模型已成功載入並添加到場景中 ---');

                // 將模型置中
                const box = new THREE.Box3().setFromObject(loadedModel);
                box.getCenter(modelCenter);
                box.getSize(modelSize);
                loadedModel.position.sub(modelCenter);
                console.log('模型已移到世界中心。');

                // *** 新增開始：為特定物件添加自訂顯示名稱到 userData ***
                loadedModel.traverse((child) => {
                    if (child.isMesh) {
                        switch (child.name) {
                            case '介紹欄1':
                                child.userData.customDisplayName = '台灣歷史館';
                                break;
                            case '介紹欄2':
                                child.userData.customDisplayName = '老建築再生館';
                                break;
                            case '介紹欄3':
                                child.userData.customDisplayName = '彈藥庫歷史館';
                                break;
                            case '介紹':
                                child.userData.customDisplayName = '操作說明';
                                break;
                            case '出口':
                                child.userData.customDisplayName = '離開展廳';
                                break;
                            // 如果有其他物件需要自訂名稱，可以在這裡添加
                        }
                    }
                });
                // *** 新增結束：為特定物件添加自訂顯示名稱到 userData ***

                // --- 尋找所有可高亮的物件並存儲 (填充到全域變數 highlightableObjects) ---
                highlightableObjects.length = 0; // 清空舊數據，確保每次載入都正確
                highlightableNames.forEach(name => {
                    const object = loadedModel.getObjectByName(name);
                    if (object) {
                        highlightableObjects.push(object);
                        console.log(`找到可互動物件：${name}`);
                    } else {
                        console.warn(`互動物件警告：在模型中找不到名為 "${name}" 的物件。`);
                    }
                });

                // 尋找攝影機標點以設定初始第一人稱視角
                const urlParams = new URLSearchParams(window.location.search);
                const initialCameraName = urlParams.get('camera');

                let initialCameraConfig = navCameras["我是導覽點01"]; // Default to NavCamera1
                if (initialCameraName) {
                    // Find the corresponding navCamera based on the name passed from the URL
                    const foundConfig = Object.values(navCameras).find(config => config.camera.name === initialCameraName);
                    if (foundConfig) {
                        initialCameraConfig = foundConfig;
                        console.log(`從 URL 參數讀取到初始攝影機：${initialCameraName}`);
                    } else {
                        console.warn(`URL 參數指定的攝影機 "${initialCameraName}" 未找到，使用預設攝影機。`);
                    }
                }

                if (initialCameraConfig) {
                    const targetCamera = initialCameraConfig.camera;
                    currentCamera = targetCamera;
                    isFirstPersonMode = initialCameraConfig.isFirstPerson;
                    controls.enabled = !isFirstPersonMode; // Disable controls if in first-person mode

                    if (isFirstPersonMode) {
                        currentCamera.rotation.set(initialCameraConfig.initialRotationX, initialCameraConfig.initialRotationY, 0, 'YXZ');
                        firstPersonRotationX = initialCameraConfig.initialRotationX;
                        firstPersonRotationY = initialCameraConfig.initialRotationY;
                        console.log(`已設定初始視角為 "${targetCamera.name}" (第一人稱)。`);
                    } else {
                        controls.object = currentCamera;
                        controls.target.copy(initialCameraConfig.initialLookAt || new THREE.Vector3(0, 0, 0));
                        controls.enableZoom = true;
                        controls.enablePan = true;
                        controls.minPolarAngle = 0;
                        controls.maxPolarAngle = Math.PI;
                        controls.update();
                        console.log(`已設定初始視角為 "${targetCamera.name}" (第三人稱)。`);
                    }
                    console.log(`${targetCamera.name} 座標為: `, targetCamera.position);
                } else {
                    console.warn('未找到初始攝影機配置。將使用預設的第三人稱視角。');
                    updateCameraForModel();
                }

                // 確保控制器更新其內部狀態
                controls.update();

                // 輸出標示點的座標
                targetObjectNames.forEach(name => {
                    const marker = loadedModel.getObjectByName(name);
                    if (marker) {
                        const worldPosition = new THREE.Vector3();
                        marker.getWorldPosition(worldPosition);
                        console.log(`物件 "${name}" 的世界座標: X=${worldPosition.x.toFixed(2)}, Y=${worldPosition.y.toFixed(2)}, Z=${worldPosition.z.toFixed(2)}`);
                    } else {
                        console.warn(`警告：在模型中找不到名為 "${name}" 的標示點。`);
                    }
                });

            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('載入模型時發生錯誤！', error);
            }
        );

        // 此函式僅在模型不包含攝影機時，用於設定預設攝影機的視角
        function updateCameraForModel() {
            if (!loadedModel) return;

            const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
            const fov = defaultCamera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

            cameraZ *= 1.5; // 攝影機距離模型的乘數

            defaultCamera.position.set(modelCenter.x, modelCenter.y, modelCenter.z + cameraZ);
            controls.target.copy(modelCenter);
        }

        function onWindowResize() {
            const aspect = container.clientWidth / container.clientHeight;
            renderer.setSize(container.clientWidth, container.clientHeight);

            // 更新所有已知的攝影機，並確保當前攝影機也被更新
            const camerasToUpdate = [defaultCamera, cameraNav1, cameraNav2, cameraNav3];
            if (currentCamera && !camerasToUpdate.includes(currentCamera)) {
                camerasToUpdate.push(currentCamera);
            }

            camerasToUpdate.forEach(cam => {
                if (cam) {
                    cam.aspect = aspect;
                    cam.updateProjectionMatrix();
                }
            });
        }
        window.addEventListener('resize', onWindowResize);

        // Event Handlers
        // Attach Event Listeners
        const tooltip = document.getElementById('tooltip'); // Get tooltip element
        renderer.domElement.addEventListener('mousemove', handleMouseMove);
        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        renderer.domElement.addEventListener('mouseup', handleMouseUp);
        renderer.domElement.addEventListener('click', this.onMouseClick); // Add click listener
        window.addEventListener('keydown', handleKeyDown, false);

        function handleMouseMove(event) {
            // 確保 loadedModel 已載入
            if (!loadedModel || !raycaster || !mouse || !currentCamera) return;

            // Reset all previous highlights (使用全域變數 originalEmissive)
            originalEmissive.forEach((originalColor, object) => {
                if (object.material) {
                    object.material.emissive.setHex(originalColor);
                }
            });
            originalEmissive.clear();

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, currentCamera);
            const intersects = raycaster.intersectObjects([loadedModel], true); // Intersect with the entire model

            let objectToHighlight = null;
            let tooltipText = '';

            if (intersects.length > 0) {
                const intersectedMesh = intersects[0].object; // The actual mesh hit by the raycaster

                // Traverse up the hierarchy to find the named highlightable object (使用全域變數 highlightableNames)
                let parent = intersectedMesh;
                while (parent) {
                    if (highlightableNames.includes(parent.name)) {
                        objectToHighlight = parent;
                        tooltipText = parent.userData.customDisplayName || parent.name; // 優先使用 customDisplayName，否則使用物件名稱
                        break;
                    }
                    parent = parent.parent;
                }
            }

            if (objectToHighlight) {
                // Highlight single object (whether it's a frame or not)
                objectToHighlight.traverse(child => {
                    if (child.isMesh && child.material) {
                        if (!originalEmissive.has(child)) { // Only clone and store original if not already processed
                            originalEmissive.set(child, child.material.emissive.getHex());
                            child.material = child.material.clone(); // Always clone to ensure unique material for highlighting
                        }
                        child.material.emissive.setHex(0x00ff00); // Green highlight
                    }
                });

                // Show tooltip
                tooltip.innerHTML = tooltipText;
                tooltip.style.left = `${event.clientX - tooltip.offsetWidth - 10}px`; // Position to the left of the mouse
                tooltip.style.top = `${event.clientY + 10}px`;
                tooltip.classList.add('show');
            } else {
                // Hide tooltip if no object is hovered
                tooltip.classList.remove('show');
            }

            // First-person camera rotation logic (if isDragging and isFirstPersonMode)
            if (isFirstPersonMode && isDragging) {
                const deltaX = event.clientX - previousMouseX;
                const deltaY = event.clientY - previousMouseY;

                firstPersonRotationY -= deltaX * 0.002; // Adjust sensitivity
                firstPersonRotationX -= deltaY * 0.002; // Adjust sensitivity

                // Clamp X rotation to prevent flipping
                firstPersonRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, firstPersonRotationX));

                currentCamera.rotation.set(firstPersonRotationX, firstPersonRotationY, 0, 'YXZ');

                previousMouseX = event.clientX;
                previousMouseY = event.clientY;
            }
        }

        function handleMouseDown(event) {
            if (isFirstPersonMode) {
                isDragging = true;
                previousMouseX = event.clientX;
                previousMouseY = event.clientY;
            }
        }

        function handleMouseUp() {
            if (isFirstPersonMode) {
                isDragging = false;
            }
        }

        function handleKeyDown(event) {
            console.log('onKeyDown triggered.'); // Debug log
            if (event.key === 'Escape') {
                console.log('按下 ESC 鍵，切換回預設攝影機');
                console.log('Current isFirstPersonMode before ESC:', isFirstPersonMode); // Debug log
                console.log('Controls enabled before ESC:', controls.enabled); // Debug log

                // 停止第一人稱模式
                isFirstPersonMode = false;
                isDragging = false; // 確保拖曳狀態重置
                console.log('isFirstPersonMode after ESC reset:', isFirstPersonMode); // Debug log

                // 啟用 OrbitControls (會自動接管 currentCamera)
                if (controls) { // 檢查 controls 是否已定義
                    controls.enabled = true;
                    console.log('Controls enabled after ESC re-enable:', controls.enabled); // Debug log
                }


                // 使用 GSAP 動畫平滑移動攝影機
                gsap.to(currentCamera.position, {
                    duration: 1.5,
                    x: defaultCamera.position.x,
                    y: defaultCamera.position.y,
                    z: defaultCamera.position.z,
                    ease: "power2.inOut",
                    onUpdate: function () {
                        if (controls && controls.target) { // 確保 controls 和 controls.target 已定義
                            currentCamera.lookAt(controls.target); // 確保在動畫過程中攝影機看向目標
                        }
                    },
                    onComplete: function () {
                        console.log('GSAP ESC position animation complete.'); // Debug log
                        currentCamera = defaultCamera; // 正式切換攝影機實例
                        if (controls) { // 檢查 controls 是否已定義
                            controls.object = currentCamera; // 更新 OrbitControls 所控制的攝影機
                            controls.target.set(0, 0, 0); // 預設攝影機的目標通常是原點
                            controls.enableZoom = true; // 啟用縮放
                            controls.enablePan = true; // 啟用平移
                            controls.minPolarAngle = 0; // 解除垂直旋轉限制
                            controls.maxPolarAngle = Math.PI; // 解除垂直旋轉限制
                            controls.update(); // 強制更新 controls
                            console.log('Controls enabled at end of ESC animation:', controls.enabled); // Debug log
                        }
                    }
                });

                // 使用 GSAP 動畫平滑旋轉攝影機
                // 這裡的目標是 defaultCamera 的初始旋轉 (通常是 0,0,0)
                gsap.to(currentCamera.rotation, {
                    duration: 1.5,
                    x: defaultCamera.rotation.x,
                    y: defaultCamera.rotation.y,
                    z: defaultCamera.rotation.z,
                    ease: "power2.inOut",
                    onComplete: function () {
                        console.log('GSAP rotation animation complete.'); // Debug log
                    }
                });
            }
        }

        // Attach Event Listeners (這段重複了，但為了整合完整性保留，實際部署時可刪除重複的)
        renderer.domElement.addEventListener('mousemove', handleMouseMove);
        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        renderer.domElement.addEventListener('mouseup', handleMouseUp);
        renderer.domElement.addEventListener('click', this.onMouseClick);
        window.addEventListener('keydown', handleKeyDown, false);

        function animate() {
            requestAnimationFrame(animate);

            // 只有當不在第一人稱模式時，才更新 OrbitControls
            if (!isFirstPersonMode && controls) { // 檢查 controls 是否已定義
                controls.update();
            }

            if (renderer && scene && currentCamera) { // 檢查核心 Three.js 物件是否已定義
                renderer.render(scene, currentCamera); // 使用 currentCamera 渲染
            }
        }
        animate();

        // 應用程式初始化完成
        this.isInitialized = true;
    }
}).mount('#app');
