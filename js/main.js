let params = {
    //lookAtTarget: "car",
    numberOfCubes: 0,
    numberOfClouds: 0,
    numberOfBees: 0,
    speed: 0.08,     
    friction: 1,  
    deform: true
};

const WORLD_SIZE = 2000;
const HALF_WORLD_SIZE = 1000;
const PLANE_SIZE = 20; // 20x20
const CUBE_SIZE = 100; 
const STEVE_SIZE = CUBE_SIZE * 0.8;

let flowerFieldModel;
let car;
let swingSpeed = 0.02; // bees swing
let swingAmplitude = 10; // bees distance
let swaySpeed = 0.005; // flowers sway
let swayAmplitude = 0.05; // flowers distance

let cubes = [];
let clouds = [];
let bees = [];
let flowers = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let moveVelocity = 5;
let jumpVelocity = 1;
let jumpAccel = 50;
let fallAccel = 5;

document.addEventListener('click', () => {
    console.log('Mouse Clicked');
    document.body.focus();
    controls.lock();
    console.log('Pointer Lock Status:', controls.isLocked);
});

// camera manipulation
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

function setupThree() {
    // controls
    //controls = new MapControls( camera, renderer.domElement );
    controls = new PointerLockControls (camera, renderer.domElement);
    //scene.add(controls.object);
    scene.add(controls.getObject()); // this worked?
    console.log('PointerLockControls Object:', controls.object); // debug log

    // load GLTF models
    loadGLTF("assets/Minecraft Bee 3D Model/source/model.gltf");
    loadFlowerField("assets/Sunflower fields model/source/model.gltf");
    loadCar("assets/Mclaren F1 Modified Voxel/scene.gltf");
    
    // renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // lights and shadow
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffb028, 1);  // yellow
    directionalLight.position.set(400, 900, 100); 
    directionalLight.castShadow = true;

    // camera bounds
    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;

    // map size for shadow
    directionalLight.shadow.mapSize.width = 512;  
    directionalLight.shadow.mapSize.height = 512; 
    directionalLight.shadow.camera.near = 0.5;   
    directionalLight.shadow.camera.far = 1000;  

    scene.add(directionalLight);

    // helpers
    // const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
    // const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(lightHelper);
    // scene.add(shadowCameraHelper);

    // add fog
    scene.background = new THREE.Color(0xffb028); // yellow
    scene.fog = new THREE.Fog(0xfc6917, 100, 4000); // orangesl

    // GUI
    gui.add(params, "numberOfCubes").listen();
    gui.add(params, "numberOfClouds").listen();
    gui.add(params, "numberOfBees").listen();
    gui.add(params, "speed", 0.01, 0.04).step(0.001).name("speed");
    gui.add(params, "friction", 0.9, 1).step(0.01).name("friction");
    gui.add(params, "deform").name("toggle to start animation");

     
        // camera
    const cameraFolder = gui.addFolder("camera");
    cameraFolder.add(camera.position, "x", -1000, 1000).name("camera X");
    cameraFolder.add(camera.position, "z", -1000, 1000).name("camera Z");
    cameraFolder.add(camera, "fov", 30, 90).name("FOV").onChange(() => camera.updateProjectionMatrix());
    cameraFolder.open();

        // rotation
    const cameraRotationFolder = cameraFolder.addFolder("rotation");
    cameraRotationFolder.add(camera.rotation, "x", -Math.PI, Math.PI, 0.01).name("rotation X").onChange(() => camera.updateMatrixWorld());
    cameraRotationFolder.add(camera.rotation, "y", -Math.PI, Math.PI, 0.01).name("rotation Y").onChange(() => camera.updateMatrixWorld());
    cameraRotationFolder.add(camera.rotation, "z", -Math.PI, Math.PI, 0.01).name("rotation Z").onChange(() => camera.updateMatrixWorld());
    cameraRotationFolder.open();

        // lookAt
    // const cameraFolder2 = gui.addFolder("Camera Controls");
    // cameraFolder.add(params, "lookAtTarget", ["car", "Steve", "sky"]).name("LookAt Target");
    // cameraFolder.open();

    const lookAtOptions = { target: "default" }; // start with default upon refreshin
    const targets = ["default", "car", "steve", "sky"];

    cameraFolder.add(lookAtOptions, "target", targets).name("Look At").onChange((value) => {
        if (value === "Default") {
            camera.lookAt(0, 0, 0);
        } else if (value === "Car") {
            const car = scene.getObjectByName("Car");
            if (car) camera.lookAt(car.position);
        } else if (value === "Steve") {
            const steve = scene.getObjectByName("Steve");
            if (steve) camera.lookAt(steve.position);
        } else if (value === "Sky") {
            camera.lookAt(new THREE.Vector3(0, 1000, 0));
        }
    });

    // add ground plane
    for (let i = 0; i < PLANE_SIZE * PLANE_SIZE; i++) { // 20x20 grid=400 cubes
        let tCube = new Cube();
        cubes.push(tCube);
    }
    params.numberOfCubes = cubes.length;

    // add clouds
    for (let i = 0; i < 30; i++) {
        let cloud = new Cloud();
        clouds.push(cloud);
    }
    params.numberOfClouds = clouds.length;

    addSteve();
}

function updateThree() {
    //controls.update(); // inertia handling

    //manipulate camera
    // camera.position.x = cos(time * 0.001) * 500;
    // camera.position.y = sin(time * 0.001) * 50;
    // camera.lookAt(scene.position);
    //camera.lookAt(0, 0, 0);

      //manipulate camera
    //camera.position.x = cos(time * 0.001) * 500;
    //camera.position.y = sin(time * 0.001) * 50;
    //camera.lookAt(scene.position);
    //camera.lookAt(0, 0, 0);

    // let lookAtVector = new THREE.Vector3(0, 0, -1);
    // lookAtVector.applyQuaternion(camera.quaternion);

    // lookAtVector.multiplyScalar(300); // threejs vector math

    // let targetPos = new THREE.Vector3().addVectors(camera.position, lookAtVector);
    // cube.position.copy(targetPos);
    // cube.setRotationFromQuaternion(camera.quaternion);
    controls.object.position.y = 200;

    // pointer lock
    if (moveForward) {
        controls.moveForward(moveVelocity);
    } else if (moveBackward) {
        controls.moveForward(-moveVelocity);
    }
    if (moveLeft) {
        controls.moveRight(-moveVelocity);
    } else if (moveRight) {
        controls.moveRight(moveVelocity);
    }

    // jump
    controls.object.position.y += jumpVelocity;
    if (controls.object.position.y > 200) {
        jumpVelocity -= fallAccel;
    } else {
        controls.object.position.y = 200;
        jumpVelocity = 0;
        canJump = true; // no double jumps
    }
    
    let targetPosition = null;
    if (params.lookAtTarget === "car" && car) {
        targetPosition = car.position;
    } else if (params.lookAtTarget === "Steve") {
        const steve = scene.getObjectByName("Steve");
        if (steve) {
            targetPosition = steve.position;
        }
    } else if (params.lookAtTarget === "sky") {
        targetPosition = new THREE.Vector3(0, 1000, 0); // Looking directly up
    }

    // update camera.lookAt if target is valdiated
    if (targetPosition) {
        camera.lookAt(targetPosition);
    }

    // render ? needed another one here
    renderer.render(scene, camera);
}

function getBox() {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

    // load assets
    const loader = new THREE.TextureLoader();
    const grassTopTexture = loader.load('imgs/grass-top.webp');
    const dirtBottomTexture = loader.load('imgs/dirt.jpeg');
    const grassSideTexture = loader.load('imgs/grass-side.png');

    const materials = [
        new THREE.MeshPhongMaterial({ map: grassSideTexture,}), new THREE.MeshPhongMaterial({ map: grassSideTexture, }), // Xs
        new THREE.MeshPhongMaterial({ map: grassTopTexture, }), new THREE.MeshPhongMaterial({ map: dirtBottomTexture, }), // Ys
        new THREE.MeshPhongMaterial({ map: grassSideTexture,}), new THREE.MeshPhongMaterial({ map: grassSideTexture,  })  // Zs
    ];

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

class Cube {
    constructor() {
        this.mesh = getBox();
        
        // randomize starting pos
        this.initialPosition = new THREE.Vector3(
            Math.random() * WORLD_SIZE - WORLD_SIZE/2,
            Math.random() * WORLD_SIZE - WORLD_SIZE/2,
            Math.random() * WORLD_SIZE - WORLD_SIZE/2
        );
        this.mesh.position.copy(this.initialPosition);

        // calc pos relative to grid
        const gridX = Math.floor(cubes.length % PLANE_SIZE); // X index
        const gridZ = Math.floor(cubes.length / PLANE_SIZE); // Z 
        
        this.targetPosition = new THREE.Vector3(
            (gridX - PLANE_SIZE / 2) * CUBE_SIZE,  // x center
            0,  // flatness
            (gridZ - PLANE_SIZE / 2) * CUBE_SIZE   // z center
        );
        
        scene.add(this.mesh);
    }

    move(speed, friction, deform) {
        let destination = deform ? this.initialPosition : this.targetPosition;
        this.mesh.position.lerp(destination, speed);
        
        this.mesh.position.multiplyScalar(friction);
    }
}

function getCloud() {
    // randomize the widths of meshes
    const w = Math.random() * 150 + 150; // 150 - 300

    const geometry = new THREE.BoxGeometry(w, 30, w);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.castShadow = true;
    return mesh;
}

class Cloud {
    constructor() {
        this.mesh = getCloud();

        this.initialPosition = new THREE.Vector3(
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2
        );
        this.mesh.position.copy(this.initialPosition);

        const xPos = (Math.random() * PLANE_SIZE - PLANE_SIZE / 2) * CUBE_SIZE;
        const zPos = (Math.random() * PLANE_SIZE - PLANE_SIZE / 2) * CUBE_SIZE;
        const yPos = CUBE_SIZE * 6 + Math.random() * 600; // hovering above ground

        this.targetPosition = new THREE.Vector3(xPos, yPos, zPos);

        scene.add(this.mesh);
    }

    move(speed, friction, deform) {
        // move towards target or initial based on deform
        let destination = deform ? this.initialPosition : this.targetPosition;
        this.mesh.position.lerp(destination, speed);
        this.mesh.position.multiplyScalar(friction);
    }
}

// FLOWER FIELD MODEL
function loadFlowerField(filepath) {
    const loader = new GLTFLoader();

    loader.load(
        filepath,
        function (gltfData) {
            flowerFieldModel = gltfData.scene;
            flowerFieldModel.scale.set(120, 120, -120); 
            console.log("Flower field model loaded:", flowerFieldModel);

            for (let i = 0; i < 14; i++) {
                const flower = new FlowerField(flowerFieldModel.clone());
                flowers.push(flower);
            }
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('Error loading flower field model:', error);
        }
    );
}

class FlowerField {
    constructor(model) {
        this.mesh = model;

        this.initialPosition = new THREE.Vector3(
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2
        );
        this.mesh.position.copy(this.initialPosition);

        const xPos = (Math.random() * PLANE_SIZE - PLANE_SIZE / 2) * (CUBE_SIZE - 15);
        const zPos = WORLD_SIZE / 8 + Math.random() * (WORLD_SIZE / 10); // front area
        this.targetPosition = new THREE.Vector3(xPos, random(0, 45), zPos);

        this.mesh.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        scene.add(this.mesh);
    }

    move(speed, friction, deform) {
        const destination = deform ? this.initialPosition : this.targetPosition;
        this.mesh.position.lerp(destination, speed);
        this.mesh.position.multiplyScalar(friction);
    }
}

// BEE MODEL 
function loadGLTF(filepath) {
    const loader = new GLTFLoader();
    
    loader.load(
        filepath,
        function (gltfData) {
            beeModel = gltfData.scene;
            beeModel.scale.set(-200, 200, -200);
            beeModel.rotation.y = -Math.PI / 2; // face left
            console.log("Bee model loaded: ", beeModel);
            
            for (let i = 0; i < 15; i++) {
                const bee = new Bee(beeModel);
                bees.push(bee);
            }
            params.numberOfBees = bees.length;
            
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (err) {
            console.error('An error occurred loading the bee model:', err);
        }
    );
}

class Bee {
    constructor(model) {
        // clone bee model
        this.mesh = model.clone();
        //shadow both receiving and shading -- chatGPT response
        this.mesh.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        // random initalPos
        this.initialPosition = new THREE.Vector3(
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2
        );
        this.mesh.position.copy(this.initialPosition);

        // targetPosition 

        this.targetPosition = new THREE.Vector3(
            (Math.random() * PLANE_SIZE - PLANE_SIZE / 2) * CUBE_SIZE,
            200 + Math.random() * 400, // min 200 above ground
            (Math.random() * PLANE_SIZE - PLANE_SIZE / 2) * CUBE_SIZE
        );

        this.targetY = this.targetPosition.y; // save to swing

        scene.add(this.mesh);
    }

    move(speed, friction, deform) {
        let destination = deform ? this.initialPosition : this.targetPosition;
        this.mesh.position.lerp(destination, speed);
        this.mesh.position.multiplyScalar(friction);
    }
}

// CAR MODEL
function loadCar(filepath) {
    const loader = new GLTFLoader();

    loader.load(
        filepath,
        function (gltfData) {
            const carModel = gltfData.scene;
            carModel.scale.set(5, 5, 5); 
            carModel.rotation.y = Math.PI / 1.5; 
            carModel.position.set(-500, 50, -300);

            carModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            console.log("Car model loaded:", carModel);
            carModel.name = "Car"; // assign the name
            car = carModel; // store reference for dynamic lookAt
            scene.add(carModel);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error("Error loading car model:", error);
        }
    );
}


function addSteve() {
    const loader = new THREE.TextureLoader();
    
    // load assets
    const headTexture = loader.load('imgs/steve-head-front.png');
    const bodyTexture = loader.load('imgs/Minecraft Steve body.png');
    const armTexture = loader.load('imgs/Steve Arm.png');
    const legTexture = loader.load('imgs/Minecraft Steve Leg.png');

    // create Steve
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(STEVE_SIZE, STEVE_SIZE, STEVE_SIZE ), 
        new THREE.MeshPhongMaterial({ 
            map: headTexture 
        })
    );
    head.castShadow = true;
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(STEVE_SIZE, STEVE_SIZE * 1.2, STEVE_SIZE * 0.6),
        //new THREE.BoxGeometry(STEVE_SIZE * 0.4, STEVE_SIZE * 1.2, STEVE_SIZE * 0.4), 
 
        new THREE.MeshPhongMaterial({ 
            map: bodyTexture 
        })
    );
    body.castShadow = true;
    const leftArm = new THREE.Mesh(
        new THREE.BoxGeometry(STEVE_SIZE * 0.4, STEVE_SIZE * 1.2, STEVE_SIZE * 0.4), 
        new THREE.MeshPhongMaterial({ 
            map: armTexture 
        })
    );
    leftArm.castShadow = true;
    const rightArm = new THREE.Mesh(
        new THREE.BoxGeometry(STEVE_SIZE * 0.4, STEVE_SIZE * 1.2, STEVE_SIZE * 0.4), 
        new THREE.MeshPhongMaterial({ 
            map: armTexture 
        })
    );
    rightArm.castShadow = true;
    const leftLeg = new THREE.Mesh(
        new THREE.BoxGeometry(STEVE_SIZE * 0.4, STEVE_SIZE * 2 , STEVE_SIZE * 0.4), 
        new THREE.MeshPhongMaterial({ 
            map: legTexture 
        })
    );
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(
        new THREE.BoxGeometry(STEVE_SIZE * 0.4, STEVE_SIZE * 2, STEVE_SIZE * 0.4), 
        new THREE.MeshPhongMaterial({ 
            map: legTexture 
        })
    );
    rightLeg.castShadow = true;

    // position set
    head.position.set(0, STEVE_SIZE + 50, 0);
    body.position.set(0, STEVE_SIZE * 0.6, 0);
    leftArm.position.set(-STEVE_SIZE * 0.7, STEVE_SIZE * 0.6, 0);
    rightArm.position.set(STEVE_SIZE * 0.7, STEVE_SIZE * 0.6, 0);
    leftLeg.position.set(-STEVE_SIZE * 0.2, 0, 0);
    rightLeg.position.set(STEVE_SIZE * 0.2, 0, 0);

    // grouped
    const steve = new THREE.Group();
    steve.add(head);
    steve.add(body);
    steve.add(leftArm);
    steve.add(rightArm);
    steve.add(leftLeg);
    steve.add(rightLeg);

    steve.castShadow = true;

    // pos steve in the middle + top of the ucbes
    steve.position.set(0, CUBE_SIZE + STEVE_SIZE * 0.2, 0);
    // steve.receiveShadow = false;
    steve.name = "Steve";
    scene.add(steve);
}

function animate() {
    requestAnimationFrame(animate);
    updateThree();
    time = performance.now();
    frame++;
    renderer.render(scene, camera);

    //camera.position.y = 400;

    // animation logic (forming)
    cubes.forEach(cube => {
        cube.move(params.speed, params.friction, params.deform);
    });

    clouds.forEach(cloud => {
        cloud.move(params.speed, params.friction, params.deform);
    });

    bees.forEach(bee => {
        bee.move(params.speed, params.friction, params.deform);
    });

    flowers.forEach(flower => {
        flower.move(params.speed, params.friction, params.deform);
    });

    // bees animation
    bees.forEach((bee, index) => {
        let offsetY = Math.sin(Date.now() * swingSpeed + index) * swingAmplitude;
        bee.mesh.position.y = bee.targetY + offsetY;
    });
    
    // flowers wind effect
    flowers.forEach((flower, index) => {
        flower.move(params.speed, params.friction, params.deform);
        // rotation for x
        flower.mesh.rotation.y = Math.sin(Date.now() * swaySpeed + index) * swayAmplitude;
    });
}
animate();

function onKeyDown(event) {
 controls.lock(); // *** this should be triggered by user interaction
 switch (event.code) {
   case 'ArrowUp':
   case 'KeyW':
     moveForward = true;
     break;
   case 'ArrowLeft':
   case 'KeyA':
     moveLeft = true;
     break;
   case 'ArrowDown':
   case 'KeyS':
     moveBackward = true;
     break;
   case 'ArrowRight':
   case 'KeyD':
     moveRight = true;
     break;
   case 'Space':
     if (canJump === true) {
       // while (controls.object.position.y < 200 + jumpve)
       jumpVelocity += jumpAccel;
     }
     canJump = false;
     break;
 }
};


function onKeyUp(event) {
 switch (event.code) {
   case 'ArrowUp':
   case 'KeyW':
     moveForward = false;
     break;
   case 'ArrowLeft':
   case 'KeyA':
     moveLeft = false;
     break;
   case 'ArrowDown':
   case 'KeyS':
     moveBackward = false;
     break;
   case 'ArrowRight':
   case 'KeyD':
     moveRight = false;
     break;
 }
};

// car
//This work is based on "Mclaren F1 Modified | Voxel" (https://sketchfab.com/3d-models/mclaren-f1-modified-voxel-d0eebfa2c98b4814a3773a1cfb7bb963) by Fenrate (https://sketchfab.com/Fenrate) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)

// bees
// 3d model by kuzneciv
// https://sketchfab.com/3d-models/bee-minecraft-b883baf691204b4d9a618e5e5841adf1

// flower fields
// 3d model by Mecha Brian
// https://sketchfab.com/3d-models/sunflower-fields-91e0133fd91a48f4ab8d21196a690f20