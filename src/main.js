import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Boid } from './boidClass.js';


let helperToggle = true

const MAX_BOIDS = 200;
const WIDTH = 100;
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
const dist = (WIDTH * 1.2) / Math.tan(THREE.MathUtils.degToRad(fov) / 2);
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

const boxHelper = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH * 2, WIDTH * 2, WIDTH * 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.3 })
);
scene.add(boxHelper);
scene.add(new THREE.DirectionalLight(0xffffff, 10));

let flock = [];
for (let i = 0; i < MAX_BOIDS; i++) {
    flock.push(new Boid({
        position: { x: (Math.random() - 0.5) * WIDTH, y: (Math.random() - 0.5) * WIDTH, z: (Math.random() - 0.5) * WIDTH },
        velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
        acceleration: { x: 0, y: 0, z: 0 }
    }, scene, WIDTH));
}

function animate() {
    stats.begin();

    flock.forEach(b => {
        b.flock(flock);
        b.edges();
        b.update();
    });

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