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

// 宣告互動物件相關的全域變數
const targetObjectNames = ["我是標示點1", "我是標示點2", "我是標示點3"]; // 宣告為全域常數
const highlightableNames = ["我是標示點1", "我是標示點2", "我是標示點3", "畫框01", "畫框02", "畫框03", "畫框04", "畫框05", "大門", "桌子"]; // 宣告為全域常數
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
            isInitialized: false // 新增：追蹤應用程式是否已初始化
        }
    },
    methods: {
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
            if (this.isMenuOpen) {
                this.selectedAction = 'menu';
                this.actionMessage = '選單已開啟';
            }
        },
        handleNavClick(action) {
            this.selectedAction = action;
            if (action === 'import') {
                window.location.href = 'loading畫面.html';
                this.actionMessage = '進入專案已點擊';
            } else if (action === 'navigation') {
                this.actionMessage = '進入導覽已點擊';
            } else if (action === 'introduction') {
                this.actionMessage = '簡介已點擊';
            } else if (action === 'traffic') {
                this.actionMessage = '交通資訊已點擊';
            }
            if (this.isMenuOpen) {
                this.isMenuOpen = false;
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
        showFrameInfo(itemName) {
            // 禁用 OrbitControls
            if (controls) { // 檢查 controls 是否已定義
                controls.enabled = false;
                console.log('OrbitControls 已禁用。');
            }

            this.infoModalTitle = `${itemName} 介紹`;
            // 根據物件名稱設定不同的內容
            switch (itemName) {
                case '畫框01':
                    this.infoModalContent = '這是畫框01的詳細介紹內容。它展示了歷史的痕跡。';
                    break;
                case '畫框02':
                    this.infoModalContent = '畫框02描繪了當地的風土人情，充滿了生命力。';
                    break;
                case '畫框03':
                    this.infoModalContent = '畫框03是一幅抽象藝術作品，引人深思。';
                    break;
                case '畫框04':
                    this.infoModalContent = '畫框04記錄了某個重要事件，具有紀念意義。';
                    break;
                case '畫框05':
                    this.infoModalContent = '畫框05記錄了某個重要事件，具有紀念意義。';
                    break;
                case '大門':
                    this.infoModalContent = '這是大門的介紹。它是通往建築的入口。';
                    break;
                case '桌子':
                    this.infoModalContent = '這是一張桌子。它可以用來放置物品或進行工作。';
                    break;
                default:
                    this.infoModalContent = '沒有找到該物件的介紹資訊。';
            }
            this.showInfoModal = true;
        },
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
                const clickedObject = intersects[0].object;

                // clickableFramesAndDoor 和 frameNames 現在是全域變數
                const clickableObjects = ["畫框01", "畫框02", "畫框03", "畫框04", "畫框05", "大門", "桌子"];
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
                    this.showFrameInfo(clickedItemName);
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

        // 導覽攝影機的設定
        const cameraNav1 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav1.name = "NavCamera1";
        cameraNav1.position.set(3.16, 0.1, -0.05);

        const cameraNav2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav2.name = "NavCamera2";
        cameraNav2.position.set(0.00, 0.1, 0.34);

        const cameraNav3 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraNav3.name = "NavCamera3";
        cameraNav3.position.set(-3.56, 0.1, 0.34);

        // 導覽點與攝影機的對應關係
        navCameras = {
            "我是標示點1": { camera: cameraNav1, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 },
            "我是標示點2": { camera: cameraNav2, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 },
            "我是標示點3": { camera: cameraNav3, isFirstPerson: true, initialLookAt: null, initialRotationX: 0, initialRotationY: 0 }
        };

        // 1. 初始化場景、攝影機和渲染器 (賦值給全域變數)
        scene = new THREE.Scene(); // 這裡使用 = 賦值，因為 scene 已經在外部宣告
        scene.background = new THREE.Color(0xcccccc);

        defaultCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000); // 這裡使用 = 賦值
        defaultCamera.position.set(0, 0, 5); // 恢復一個合理的預設攝影機位置
        currentCamera = defaultCamera; // 初始攝影機為預設攝影機 (這裡使用 = 賦值)

        renderer = new THREE.WebGLRenderer({ antialias: true }); // 這裡使用 = 賦值
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // 2. 添加環境光和方向光
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7.5).normalize();
        scene.add(directionalLight);

        // 3. 初始化 OrbitControls (賦值給全域變數)
        controls = new OrbitControls(currentCamera, renderer.domElement); // 這裡使用 = 賦值
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 50;
        controls.enableZoom = false; // 禁用縮放功能

        // 4. 初始化變數 (賦值給全域變數)
        const loader = new GLTFLoader();
        raycaster = new THREE.Raycaster(); // 這裡使用 = 賦值
        mouse = new THREE.Vector2(); // 這裡使用 = 賦值
        // loadedModel 已經在文件頂部聲明並初始化為 null

        const modelCenter = new THREE.Vector3();
        const modelSize = new THREE.Vector3();

        // --- 互動物件相關變數 ---
        // targetObjectNames, highlightableNames, frameNames 已經是全域常數，不需要在這裡重新宣告

        // 5. 載入模型
        loader.load(
            './model/06月團體專案-20250702-02-01版.glb',
            function (gltf) {
                loadedModel = gltf.scene; // 賦值給全域變數 loadedModel
                scene.add(loadedModel);
                console.log('--- 模型已成功載入並添加到場景中 ---');

                // 將模型置中
                const box = new THREE.Box3().setFromObject(loadedModel);
                box.getCenter(modelCenter);
                box.getSize(modelSize);
                loadedModel.position.sub(modelCenter);
                console.log('模型已移到世界中心。');

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
                const cameraMarker = loadedModel.getObjectByName("我是標示點1");
                if (cameraMarker) {
                    console.log('抓到物件：我是標示點1');
                    const markerPosition = new THREE.Vector3();
                    cameraMarker.getWorldPosition(markerPosition);

                    // --- 設定 NavCamera1 的初始旋轉 ---
                    // NavCamera1 的位置已在 mounted() 函式開頭設定
                    // cameraNav1.lookAt(new THREE.Vector3(0, 0, 0)); // Removed lookAt for first-person camera

                    // 將計算好的初始旋轉值存儲起來，供後續點擊使用
                    navCameras["我是標示點1"].initialRotationX = cameraNav1.rotation.x;
                    navCameras["我是標示點1"].initialRotationY = cameraNav1.rotation.y;
                    console.log('已設定 NavCamera1 的座標為:', cameraNav1.position);

                    // 將 NavCamera1 設為當前攝影機並進入第一人稱模式
                    currentCamera = cameraNav1;
                    isFirstPersonMode = true;
                    controls.enabled = false; // 禁用 OrbitControls
                    console.log('--- 找到攝影機標點，已設定初始視角為 "NavCamera1" (第一人稱) ---');
                    console.log('NavCamera1 座標為: ', cameraNav1.position);

                } else {
                    // 如果找不到標點，則使用預設的第三人稱視角
                    console.warn('在模型中找不到名為 "我是攝影機標點" 的物件。將使用預設的第三人稱視角。');
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
                        tooltipText = parent.name; // Set tooltip text to object's name
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

        // Attach Event Listeners
        renderer.domElement.addEventListener('mousemove', handleMouseMove);
        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        renderer.domElement.addEventListener('mouseup', handleMouseUp);
        renderer.domElement.addEventListener('click', this.onMouseClick); // Add click listener
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