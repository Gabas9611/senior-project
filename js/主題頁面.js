const { createApp } = Vue;

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
        }
    },
    mounted() {
        // 0. 基本設定
        const container = document.getElementById('three-container');
        if (!container) {
            console.error('無法找到 ID 為 "three-container" 的容器。');
            return;
        }

        // 1. 初始化場景、攝影機和渲染器
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xcccccc);

        const defaultCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        defaultCamera.position.set(0, 0, 5);
        let currentCamera = defaultCamera; // 初始攝影機為預設攝影機

        // 新增：宣告額外的導覽攝影機
        const cameraNav1 = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        cameraNav1.name = "導覽點01攝影機";
        const cameraNav2 = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        cameraNav2.name = "導覽點02攝影機";
        const cameraNav3 = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        cameraNav3.name = "導覽點03攝影機";
        
        const navCameras = {
            "我是導覽點01": { camera: cameraNav1, initialLookAt: null, isFirstPerson: true, initialRotationX: 0, initialRotationY: 0 }, // 新增 isFirstPerson 標記
            "我是導覽點02": { camera: cameraNav2, initialLookAt: null, isFirstPerson: true, initialRotationX: 0, initialRotationY: 0 }, // 其他導覽點可選擇是否為第一人稱
            "我是導覽點03": { camera: cameraNav3, initialLookAt: null, isFirstPerson: true, initialRotationX: 0, initialRotationY: 0 },
        };

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // 2. 添加環境光和方向光
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7.5).normalize();
        scene.add(directionalLight);

        // 3. 初始化 OrbitControls
        const controls = new OrbitControls(currentCamera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 50;

        // 4. 初始化變數
        const loader = new GLTFLoader();
        const raycaster = new THREE.Raycaster(); // 用於滑鼠互動
        const mouse = new THREE.Vector2(); // 用於滑鼠互動
        let loadedModel = null;
        const modelCenter = new THREE.Vector3();
        const modelSize = new THREE.Vector3();

        // 新增：目標物件相關變數
        const targetObjectNames = ["我是導覽點01", "我是導覽點02", "我是導覽點03"];
        const targetObjects = new Map();
        let currentHoveredObject = null;
        let originalEmissive = new Map();

        // 新增：第一人稱攝影機控制變數
        let isFirstPersonMode = false; // 追蹤是否處於第一人稱模式
        let firstPersonRotationX = 0; // 第一人稱視角 X 軸旋轉
        let firstPersonRotationY = 0; // 第一人稱視角 Y 軸旋轉
        let previousMouseX = 0;
        let previousMouseY = 0;
        let isDragging = false; // 用於滑鼠拖曳判斷

        // 5. 載入模型
        loader.load(
            './model/06月團體專題-老建築改建-20250703-02版 .glb',
            function (gltf) {
                loadedModel = gltf.scene;
                scene.add(loadedModel);
                console.log('模型載入成功！', loadedModel);

                const box = new THREE.Box3().setFromObject(loadedModel);
                box.getCenter(modelCenter);
                box.getSize(modelSize);

                loadedModel.position.sub(modelCenter);
                console.log('模型已移到世界中心。');

                // 尋找並處理目標物件
                targetObjectNames.forEach(name => {
                    const obj = loadedModel.getObjectByName(name);
                    if (obj) {
                        targetObjects.set(name, obj);
                        console.log(`成功找到物件: "${name}"`);
                        const worldPosition = new THREE.Vector3();
                        obj.getWorldPosition(worldPosition);
                        console.log(`物件 "${name}" 的世界座標為:`, worldPosition);

                        // 更新對應的導覽攝影機座標
                        const navCameraObj = navCameras[name];
                        if (navCameraObj) {
                            const navCamera = navCameraObj.camera;
                            navCamera.position.copy(worldPosition); // 攝影機位置與導覽點重合

                            // 取得導覽點物件的世界前方方向
                            const worldDirection = new THREE.Vector3();
                            obj.getWorldDirection(worldDirection); 

                            // 設定攝影機的看向目標為導覽點前方的一個點
                            // 對於第一人稱，這將是攝影機的初始朝向
                            const initialLookAtTarget = worldPosition.clone().add(worldDirection.multiplyScalar(1)); 
                            navCamera.lookAt(initialLookAtTarget);
                            navCameraObj.initialLookAt = initialLookAtTarget; // 儲存初始看向目標

                            // 如果是第一人稱攝影機，計算並儲存其初始的 firstPersonRotationX/Y
                            if (navCameraObj.isFirstPerson) {
                                // 創建一個臨時的 Object3D 來獲取正確的 Euler 角度
                                const tempObject = new THREE.Object3D();
                                tempObject.position.copy(navCamera.position);
                                tempObject.lookAt(initialLookAtTarget);
                                navCameraObj.initialRotationX = tempObject.rotation.x;
                                navCameraObj.initialRotationY = tempObject.rotation.y;
                            }
                            
                        }
                    } else {
                        console.warn(`在模型中找不到名為 "${name}" 的物件。`);
                    }
                });

                updateCameraForModel();
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('載入模型時發生錯誤！', error);
            }
        );
        
        function updateCameraForModel() {
            if (!loadedModel) return;

            const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
            const fov = defaultCamera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            
            cameraZ *= 1.5; 

            defaultCamera.position.set(0, 0, cameraZ);
            
            controls.target.set(0, 0, 0);
            controls.update();
        }

        function onWindowResize() {
            // 所有攝影機都需要更新寬高比
            const aspect = container.clientWidth / container.clientHeight;
            defaultCamera.aspect = aspect;
            defaultCamera.updateProjectionMatrix();
            cameraNav1.aspect = aspect;
            cameraNav1.updateProjectionMatrix();
            cameraNav2.aspect = aspect;
            cameraNav2.updateProjectionMatrix();
            cameraNav3.aspect = aspect;
            cameraNav3.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
        window.addEventListener('resize', onWindowResize);

        // 新增：滑鼠移動事件，用於處理懸停高亮
        function onMouseMove(event) {
            // 如果在第一人稱模式下，用滑鼠移動來旋轉攝影機，不處理 Hover
            if (isFirstPersonMode && isDragging) {
                const deltaX = event.clientX - previousMouseX;
                const deltaY = event.clientY - previousMouseY;

                firstPersonRotationY -= deltaX * 0.005; // 左右旋轉
                firstPersonRotationX -= deltaY * 0.005; // 上下旋轉

                // 限制上下旋轉角度，避免翻轉
                firstPersonRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, firstPersonRotationX));

                // 直接應用到 currentCamera 的旋轉
                currentCamera.rotation.set(firstPersonRotationX, firstPersonRotationY, 0, 'YXZ');
                
                previousMouseX = event.clientX;
                previousMouseY = event.clientY;
                return; // 阻止繼續執行 Hover 邏輯
            }

            if (targetObjects.size === 0) return;

            event.preventDefault();

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, currentCamera);

            const intersections = [];
            for (const [name, obj] of targetObjects.entries()) {
                const boundingBox = new THREE.Box3().setFromObject(obj);
                const intersectionPoint = new THREE.Vector3();

                if (raycaster.ray.intersectBox(boundingBox, intersectionPoint)) {
                    intersections.push({
                        distance: raycaster.ray.origin.distanceTo(intersectionPoint),
                        object: obj
                    });
                }
            }

            if (currentHoveredObject) {
                currentHoveredObject.traverse(child => {
                    if (child.isMesh && originalEmissive.has(child.uuid)) {
                        // 確保只有當前懸停的物件恢復材質，如果它沒有再次被懸停
                        const originalMaterial = originalEmissive.get(child.uuid);
                        if (child.material !== originalMaterial) { // 避免重複賦值
                             child.material = originalMaterial;
                        }
                        originalEmissive.delete(child.uuid);
                    }
                });
                currentHoveredObject = null;
            }

            if (intersections.length > 0) {
                intersections.sort((a, b) => a.distance - b.distance);
                const closestIntersection = intersections[0];
                const hoveredObject = closestIntersection.object;

                currentHoveredObject = hoveredObject;
                currentHoveredObject.traverse(child => {
                    if (child.isMesh) {
                        if (!originalEmissive.has(child.uuid)) { // 只保存一次原始材質
                            originalEmissive.set(child.uuid, child.material);
                        }
                        // 創建一個新的材質實例並應用發光效果
                        const newMaterial = child.material.clone();
                        newMaterial.emissive.set(0xffff00);
                        child.material = newMaterial;
                    }
                });
            }
        }
        window.addEventListener('mousemove', onMouseMove, false);

        // 新增：滑鼠點擊事件，用於切換攝影機
        function onMouseClick(event) {
            console.log('onMouseClick triggered.'); // Debug log
            event.preventDefault();

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, currentCamera);

            const intersects = raycaster.intersectObjects(Array.from(targetObjects.values()), true);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                let targetNavPointName = null;

                let parent = clickedObject;
                while (parent) {
                    if (targetObjectNames.includes(parent.name)) {
                        targetNavPointName = parent.name;
                        break;
                    }
                    parent = parent.parent;
                }

                if (targetNavPointName) {
                    console.log(`Clicked on: ${targetNavPointName}`); // Debug log
                    // *** 關鍵修正：將 currentTargetCameraObj 和 targetIsFirstPersonMode 儲存為局部常數 ***
                    const currentTargetCameraObj = navCameras[targetNavPointName];
                    if (currentTargetCameraObj && currentTargetCameraObj.camera) {
                        const targetCamera = currentTargetCameraObj.camera;
                        const targetIsFirstPersonMode = currentTargetCameraObj.isFirstPerson; // 儲存目標模式

                        console.log(`點擊了 "${targetNavPointName}"，準備切換到攝影機 "${targetCamera.name}"`);
                        console.log('Current isFirstPersonMode:', isFirstPersonMode); // Debug log
                        console.log('Controls enabled before disable:', controls.enabled); // Debug log
                        
                        // 禁用 OrbitControls
                        controls.enabled = false;
                        console.log('Controls enabled after disable:', controls.enabled);

                        // 判斷是否為第一人稱模式 (這個是全域變數，會在動畫開始時設定)
                        isFirstPersonMode = targetIsFirstPersonMode; // 現在直接使用儲存的目標模式
                        console.log('New isFirstPersonMode:', isFirstPersonMode);

                        // 使用 GSAP 動畫平滑移動攝影機位置
                        gsap.to(currentCamera.position, {
                            duration: 1.5,
                            x: targetCamera.position.x,
                            y: targetCamera.position.y,
                            z: targetCamera.position.z,
                            ease: "power2.inOut",
                            onUpdate: function() {
                                // 在動畫過程中，如果目標攝影機是第一人稱，保持看向初始方向；否則看向 OrbitControls 的目標
                                // 這裡使用 `targetIsFirstPersonMode` 而不是 `isFirstPersonMode`，確保動畫期間行為正確
                                if (!targetIsFirstPersonMode) {
                                     // 這裡如果 currentTargetCameraObj.initialLookAt 是 null，會導致錯誤
                                     // 所以確保這裡有個 fallback
                                     const lookAtTarget = currentTargetCameraObj.initialLookAt || new THREE.Vector3(0,0,0);
                                     currentCamera.lookAt(lookAtTarget);
                                } else {
                                     // 對於第一人稱動畫，讓它保持當前動畫的 rotation 即可，因為 onComplete 會設定
                                }
                            },
                            onComplete: function() {
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
                                    controls.target.copy(currentTargetCameraObj.initialLookAt || new THREE.Vector3(0,0,0)); // 設定為導覽攝影機的初始目標點，實現軌道旋轉
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
                            onUpdate: function() {
                                // 在旋轉動畫過程中，確保 position 已經到位，否則 lookAt 會受到影響
                                // 如果是第一人稱模式，這裡的旋轉動畫會直接設定攝影機的朝向
                            },
                            onComplete: function() {
                                console.log('GSAP rotation animation complete.'); // Debug log
                            }
                        });
                    }
                }
            }
        }
        window.addEventListener('click', onMouseClick, false);


        // 新增：處理滑鼠按下和放開事件，用於第一人稱模式下的拖曳
        renderer.domElement.addEventListener('mousedown', (event) => {
            if (isFirstPersonMode) {
                isDragging = true;
                previousMouseX = event.clientX;
                previousMouseY = event.clientY;
            }
        });

        renderer.domElement.addEventListener('mouseup', () => {
            if (isFirstPersonMode) {
                isDragging = false;
            }
        });


        // 新增：ESC 鍵事件，用於切換回預設攝影機
        function onKeyDown(event) {
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
                controls.enabled = true;
                console.log('Controls enabled after ESC re-enable:', controls.enabled); // Debug log

                // 使用 GSAP 動畫平滑移動攝影機
                gsap.to(currentCamera.position, {
                    duration: 1.5,
                    x: defaultCamera.position.x,
                    y: defaultCamera.position.y,
                    z: defaultCamera.position.z,
                    ease: "power2.inOut",
                    onUpdate: function() {
                        currentCamera.lookAt(controls.target); // 確保在動畫過程中攝影機看向目標
                    },
                    onComplete: function() {
                        console.log('GSAP ESC position animation complete.'); // Debug log
                        currentCamera = defaultCamera; // 正式切換攝影機實例
                        controls.object = currentCamera; // 更新 OrbitControls 所控制的攝影機
                        controls.target.set(0, 0, 0); // 預設攝影機的目標通常是原點
                        controls.enableZoom = true; // 啟用縮放
                        controls.enablePan = true; // 啟用平移
                        controls.minPolarAngle = 0; // 解除垂直旋轉限制
                        controls.maxPolarAngle = Math.PI; // 解除垂直旋轉限制
                        controls.update(); // 強制更新 controls
                        console.log('Controls enabled at end of ESC animation:', controls.enabled); // Debug log
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
                    onComplete: function() {
                        console.log('GSAP ESC rotation animation complete.'); // Debug log
                    }
                });
            }
        }
        window.addEventListener('keydown', onKeyDown, false);

        function animate() {
            requestAnimationFrame(animate);

            if (!isFirstPersonMode) {
                // 只有當不在第一人稱模式時，才更新 OrbitControls
                controls.update();
            }
            
            renderer.render(scene, currentCamera); // 使用 currentCamera 渲染
        }
        animate();
    }
}).mount('#app');