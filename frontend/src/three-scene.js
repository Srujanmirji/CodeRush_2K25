import * as THREE from 'three';

let scene, camera, renderer;
let particlesMesh, gridHelper;
let mouseX = 0, mouseY = 0;

export function initScene() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.002);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x00f7ff,
        transparent: true,
        opacity: 0.8,
    });

    particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Grid (Cyber floor)
    gridHelper = new THREE.GridHelper(100, 50, 0x7000ff, 0x0b0b15);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Floating Cubes
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x7000ff, wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20
        );
        scene.add(cube);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f7ff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.0005;

    // Rotate Particles
    particlesMesh.rotation.y = time * 0.1;
    particlesMesh.rotation.x = mouseY * 0.0001;

    // Movement based on mouse
    camera.position.x += (mouseX * 0.005 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.005 - camera.position.y) * 0.05;

    // Grid movement simulation
    gridHelper.position.z = (time * 5) % 2;

    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}
