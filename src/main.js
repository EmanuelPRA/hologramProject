import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// You can position it away from your hologram center
stats.dom.style.position = 'absolute';
stats.dom.style.top = '30px';
stats.dom.style.left = '30px';

const MAX_BOIDS = 1000;

const WIDTH = 100


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const vFOV = THREE.MathUtils.degToRad(camera.fov);


const distance = (WIDTH * 1.2) / Math.tan(vFOV / 2);

camera.position.set(0, 0, distance);
camera.lookAt(0, 0, 0);

const size = Math.min(window.innerWidth, window.innerHeight);


renderer.setSize(size, size);

camera.aspect = 1; 
camera.updateProjectionMatrix(); // Critical: tells Three.js to recalculate math


// Create a box geometry matching your WIDTH
// If WIDTH is 50, the box should be WIDTH * 2 to cover -50 to +50
const helperGeometry = new THREE.BoxGeometry(WIDTH * 2, WIDTH * 2, WIDTH * 2);

const helperMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00, // Or your Faculty Secondary Color
    wireframe: true,
    transparent: true,
    opacity: 0.3
});

const boxHelper = new THREE.Mesh(helperGeometry, helperMaterial);
scene.add(boxHelper);



class boid {
  constructor(parameters) {
    this.position = new THREE.Vector3(parameters.position.x, parameters.position.y, parameters.position.z);
    this.velocity = new THREE.Vector3(parameters.velocity.x, parameters.velocity.y, parameters.velocity.z);
    this.acceleration = new THREE.Vector3(parameters.acceleration.x, parameters.acceleration.y, parameters.acceleration.z) || new THREE.Vector3(0, 0, 0);
    this.maxSpeed = parameters.maxSpeed || 1;
    this.maxForce = parameters.maxForce || 0.05;

    this.mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.5, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    scene.add(this.mesh);
    this.mesh.position.copy(this.position);

  }
  align(boids) {
    let numberOfBoids = 0;
    let perceptionRadius = 30;
    let desired = new THREE.Vector3(0, 0, 0);
    for (let j = 0; j < boids.length; j++) {
        if (this !== boids[j] && this.position.distanceTo(boids[j].position) < perceptionRadius) {
            numberOfBoids++;
            desired.add(boids[j].velocity);
        }
    }
    if (numberOfBoids > 0) {
        desired.divideScalar(numberOfBoids);
        let steering = new THREE.Vector3().subVectors(desired, this.velocity);
        steering.clampLength(0, this.maxForce);
        return steering;
    }
    return new THREE.Vector3(0, 0, 0); 
  }

  cohesion(boids) {
      let numberOfBoids = 0;
      let perceptionRadius = 30; 
      let centerOfMass = new THREE.Vector3(0, 0, 0);

      for (let j = 0; j < boids.length; j++) {
          if (this !== boids[j] && this.position.distanceTo(boids[j].position) < perceptionRadius) {
              numberOfBoids++;
              centerOfMass.add(boids[j].position);
          }
      }

      if (numberOfBoids > 0) {
          centerOfMass.divideScalar(numberOfBoids);
          
          let desired = new THREE.Vector3().subVectors(centerOfMass, this.position);
          
          desired.setLength(this.maxSpeed);
          
          let steering = new THREE.Vector3().subVectors(desired, this.velocity);
          steering.clampLength(0, this.maxForce);
          
          return steering;
      }
      return new THREE.Vector3(0, 0, 0);
  }

  separation(boids) {
    let numberOfBoids = 0;
    let perceptionRadius = 10; // How close is "too close"?
    let steer = new THREE.Vector3(0, 0, 0);

    for (let j = 0; j < boids.length; j++) {
        let distance = this.position.distanceTo(boids[j].position);

        // If it's a neighbor and not myself
        if (this !== boids[j] && distance < perceptionRadius) {
            // 1. Calculate vector pointing AWAY from neighbor
            let diff = new THREE.Vector3().subVectors(this.position, boids[j].position);
            
            // 2. Weight by distance (The closer they are, the harder we flee)
            diff.divideScalar(distance * distance); 
            
            steer.add(diff);
            numberOfBoids++;
        }
    }

    if (numberOfBoids > 0) {
        steer.divideScalar(numberOfBoids);
    }

    if (steer.length() > 0) {
        // 3. Implement Steering Math (Desired - Velocity)
        steer.setLength(this.maxSpeed);
        steer.sub(this.velocity);
        steer.clampLength(0, this.maxForce);
    }

    return steer;
}

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    alignment.multiplyScalar(1.0);
    cohesion.multiplyScalar(0.8);
    separation.multiplyScalar(1.5); 

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
}
  update(boids){
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.acceleration.multiplyScalar(0);
    this.mesh.position.copy(this.position);
    this.mesh.lookAt(this.position.clone().add(this.velocity));
  }

  edges() {

  const boundary = WIDTH; 

  const distance = this.position.length();

  if (distance > boundary) {
    let steer = new THREE.Vector3(0, 0, 0).sub(this.position);
    

    steer.normalize();
    

    steer.multiplyScalar(this.maxSpeed);
    

    steer.sub(this.velocity);
    
    steer.clampLength(0, this.maxForce * 2); // Slightly stronger than alignment
    
    this.acceleration.add(steer);
  }
}
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

let flock = [];

for (let i = 0; i < MAX_BOIDS; i++) {
  const boidInstance = new boid({
    position: { 
      // Distribute from -WIDTH/2 to +WIDTH/2 to center the box at (0,0,0)
      x: (Math.random() - 0.5) * WIDTH, 
      y: (Math.random() - 0.5) * WIDTH, 
      z: (Math.random() - 0.5) * WIDTH 
    },
    velocity: { 
      x: (Math.random() - 0.5) * 2, 
      y: (Math.random() - 0.5) * 2, 
      z: (Math.random() - 0.5) * 2 
    },
    acceleration: { x: 0, y: 0, z: 0 },
    maxSpeed: 1.5, 
    maxForce: 0.05
  });
  flock.push(boidInstance);
}


function animate() {
    stats.begin(); // Start tracking this frame

    for (let boidInstance of flock) {
        boidInstance.flock(flock); 
        boidInstance.edges(); 
        boidInstance.update(); 
    }
    
    controls.update();
    renderer.render(scene, camera);

    stats.end(); // End tracking
    requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    
    camera.aspect = 1; // Force 1:1
    camera.updateProjectionMatrix();
    
    renderer.setSize(minDim, minDim);
});