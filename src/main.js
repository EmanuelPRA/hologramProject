import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Boid } from './boidClass.js';
import { FBXLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';   


let helperToggle = true

const MAX_BOIDS = 100;
const WIDTH = 200;
const stats = new Stats();
document.body.appendChild(stats.dom);

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const totalSize = Math.min(window.innerWidth, window.innerHeight);
renderer.setSize(totalSize, totalSize);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);


renderer.domElement.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);`;


const fov = 75;
const dist = (WIDTH * 1.2) / Math.tan(THREE.MathUtils.degToRad(fov) / 2) +100;
const cameras = {
    front: new THREE.PerspectiveCamera(fov, 1, 0.1, 10000),
    back:  new THREE.PerspectiveCamera(fov, 1, 0.1, 10000),
    left:  new THREE.PerspectiveCamera(fov, 1, 0.1, 10000),
    right: new THREE.PerspectiveCamera(fov, 1, 0.1, 10000)
};

cameras.front.position.set(0, 0, dist);
cameras.back.position.set(0, 0, -dist);
cameras.left.position.set(-dist, 0, 0);
cameras.right.position.set(dist, 0, 0);

Object.values(cameras).forEach(cam => cam.lookAt(0, 0, 0));
cameras.back.rotation.z = Math.PI;
cameras.left.rotation.z = -Math.PI / 2;
cameras.right.rotation.z = Math.PI / 2;

//DEBUG
let isDebugMode = false;

const debugCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
debugCamera.position.set(0, WIDTH, WIDTH); // Positioned at an angle

const controls = new OrbitControls(debugCamera, renderer.domElement);
controls.enabled = false; // Start disabled
//DEBUG


const boxHelper = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH * 2, WIDTH * 2, WIDTH * 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.3 })
);
scene.add(boxHelper);

//add logo.fbx to scene
const loader = new FBXLoader();

loader.load('/logo.fbx', (object) => {
    object.material = new THREE.MeshPhongMaterial({
        emissive: 0x001133,
        emissiveIntensity: 5,
        specular: 0xffffff,
        shininess: 100
    });
    object.scale.set(0.5, 0.5, 0.5);
    scene.add(object);
});

const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1); 
    scene.add(ambientLight);


const coreLight = new THREE.PointLight(0x0055ff,15, 10000, 0); // Faculty Blue
coreLight.position.set(20, 20, 50);
scene.add(coreLight);


const geometry = new THREE.TetrahedronGeometry(3, 0);
geometry.rotateX(Math.PI / 2); // Align the cone to point forward

const material = new THREE.MeshPhongMaterial({ color: 0x00aaaa, flatShading: true });

// Create the InstancedMesh
const mesh = new THREE.InstancedMesh(geometry, material, MAX_BOIDS);
scene.add(mesh);

// A dummy object used to generate the transformation matrix for each boid
const dummy = new THREE.Object3D();

let flock = []

// Initialize flock
for (let i = 0; i < MAX_BOIDS; i++) {
  flock.push(new Boid({
    position: { x: (Math.random() - 0.5) * WIDTH, y: (Math.random() - 0.5) * WIDTH, z: (Math.random() - 0.5) * WIDTH },
    velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
    WIDTH: WIDTH
  }, i)); // Pass the index i as the ID
}


function animate() {
    stats.begin();

    for (let i = 0; i < flock.length; i++) {
        const b = flock[i];
        
        // 1. Run the physics
        b.flock(flock);
        b.edges();
        b.update();

        // 2. Set the dummy object's properties
        dummy.position.copy(b.position);
        
        // Point the mesh in the direction of velocity
        // (position + velocity = target point)
        dummy.lookAt(b.position.clone().add(b.velocity));
        
        // 3. Update the dummy's internal matrix and apply to InstancedMesh
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (isDebugMode) {
        controls.update();
        renderer.render(scene, debugCamera);
    } else {
        
        const S = Math.min(window.innerWidth, window.innerHeight);
        const vSize = S / 3;

        renderer.setScissorTest(true);
        renderer.clear();

        const renderView = (cam, x, y) => {
            renderer.setViewport(x, y, vSize, vSize);
            renderer.setScissor(x, y, vSize, vSize);
            renderer.render(scene, cam);
        };

        renderView(cameras.front, vSize, vSize * 2);
        renderView(cameras.back, vSize, 0);
        renderView(cameras.left, 0, vSize);
        renderView(cameras.right, vSize * 2, vSize);

        renderer.setScissorTest(false);
    }

    stats.end();
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    renderer.setSize(minDim, minDim);
});

window.addEventListener('keydown', (e) => {
  if (e.key == 'h') {
    helperToggle = !helperToggle;

    if (helperToggle) {
      scene.add(boxHelper)
    }else{
      scene.remove(boxHelper)
    }
  }

});

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'd') {
        isDebugMode = !isDebugMode;
        controls.enabled = isDebugMode;
        
        // Reset the renderer state when switching
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
    }
});