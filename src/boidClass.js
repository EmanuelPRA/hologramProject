import * as THREE from 'three';

export class Boid {
  constructor(parameters, scene, WIDTH) {
    this.WIDTH = WIDTH;
    this.position = new THREE.Vector3(parameters.position.x, parameters.position.y, parameters.position.z);
    this.velocity = new THREE.Vector3(parameters.velocity.x, parameters.velocity.y, parameters.velocity.z);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.maxSpeed = parameters.maxSpeed || 1;
    this.maxForce = parameters.maxForce || 0.05;

    this.mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
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
    let perceptionRadius = 10;
    let steer = new THREE.Vector3(0, 0, 0);
    for (let j = 0; j < boids.length; j++) {
      let distance = this.position.distanceTo(boids[j].position);
      if (this !== boids[j] && distance < perceptionRadius) {
        let diff = new THREE.Vector3().subVectors(this.position, boids[j].position);
        diff.divideScalar(distance * distance);
        steer.add(diff);
        numberOfBoids++;
      }
    }
    if (numberOfBoids > 0) steer.divideScalar(numberOfBoids);
    if (steer.length() > 0) {
      steer.setLength(this.maxSpeed);
      steer.sub(this.velocity);
      steer.clampLength(0, this.maxForce);
    }
    return steer;
  }

  flock(boids) {
    let a = this.align(boids).multiplyScalar(1.0);
    let c = this.cohesion(boids).multiplyScalar(0.8);
    let s = this.separation(boids).multiplyScalar(1.5);
    this.acceleration.add(a).add(c).add(s);
  }

  edges() {
    if (this.position.length() > this.WIDTH) {
      let steer = new THREE.Vector3(0, 0, 0).sub(this.position).normalize().multiplyScalar(this.maxSpeed);
      steer.sub(this.velocity).clampLength(0, this.maxForce * 2);
      this.acceleration.add(steer);
    }
  }

  update() {
    this.velocity.add(this.acceleration).clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.multiplyScalar(0);
    this.mesh.position.copy(this.position);
    this.mesh.lookAt(this.position.clone().add(this.velocity));
  }
}