import * as THREE from 'https://unpkg.com/three@latest/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.112/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, cone, obj_xArrow, obj_yArrow, obj_zArrow;

export function initVisualizer() {
    const container = document.getElementById('visualization');

    // Initialize scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Initialize camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.up.set(0, 0, 1); // Set Z-axis as up
    camera.position.set(5, 5, 5);

    // Initialize renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Initialize controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Add grid and axes helpers
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper( 5 );
    axesHelper.setColors("rgb(255, 0, 0)","rgb(0, 255, 0)","rgb(0, 0, 255)")
    scene.add( axesHelper );

    // // Add labeled arrows for X, Y, Z axes
    // const arrowSize = 2;
    // const xArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowSize, 0xff0000);
    // const yArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowSize, 0x00ff00);
    // const zArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowSize, 0x0000ff);
    
    // scene.add(xArrow);
    // scene.add(yArrow);
    // scene.add(zArrow);

    // Add light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    visualizeRotation(new THREE.Quaternion().identity());

    animate();
}


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

export function computeAndVisualize() {
    const eulerInput = document.getElementById('euler').value;
    const quaternionInput = document.getElementById('quaternion').value;
    const axisAngleInput = document.getElementById('axisAngle').value;

    let euler, quaternion, axisAngle;

    try {
        if (eulerInput) {
            const eulerValues = eulerInput.split(',').map(Number);

            if (eulerValues.length !== 3 || eulerValues.some(isNaN)) {
                throw new Error('Invalid Euler angles format. Provide 3 numbers separated by commas.');
            }

            euler = new THREE.Euler(
                THREE.MathUtils.degToRad(eulerValues[0]),
                THREE.MathUtils.degToRad(eulerValues[1]),
                THREE.MathUtils.degToRad(eulerValues[2])
            );
            quaternion = new THREE.Quaternion().setFromEuler(euler);
            axisAngle = quaternionToAxisAngle(quaternion);
        } else if (quaternionInput) {
            const quaternionValues = quaternionInput.split(',').map(Number);

            if (quaternionValues.length !== 4 || quaternionValues.some(isNaN)) {
                throw new Error('Invalid quaternion format. Provide 4 numbers separated by commas.');
            }

            quaternion = new THREE.Quaternion(
                quaternionValues[0],
                quaternionValues[1],
                quaternionValues[2],
                quaternionValues[3]
            );
            euler = new THREE.Euler().setFromQuaternion(quaternion);
            axisAngle = quaternionToAxisAngle(quaternion);
        } else if (axisAngleInput) {
            const axisAngleValues = axisAngleInput.split(',').map(Number);

            if (axisAngleValues.length !== 4 || axisAngleValues.some(isNaN)) {
                throw new Error('Invalid axis-angle format. Provide 4 numbers separated by commas.');
            }

            const axis = new THREE.Vector3(
                axisAngleValues[0],
                axisAngleValues[1],
                axisAngleValues[2]
            ).normalize();
            const angle = THREE.MathUtils.degToRad(axisAngleValues[3]);
            quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
            euler = new THREE.Euler().setFromQuaternion(quaternion);
            axisAngle = { axis, angle: axisAngleValues[3] };
        } else {
            alert('Please enter at least one rotation representation.');
            return;
        }

        visualizeRotation(quaternion);
        displayResults(euler, quaternion, axisAngle);
    } catch (error) {
        alert(error.message);
    }
}

function quaternionToAxisAngle(quaternion) {
    const axis = new THREE.Vector3();
    const angle = 2 * Math.acos(quaternion.w);
    const sinHalfAngle = Math.sqrt(1 - quaternion.w * quaternion.w);

    if (sinHalfAngle > 0.001) {
        axis.set(quaternion.x, quaternion.y, quaternion.z).divideScalar(sinHalfAngle);
    } else {
        axis.set(1, 0, 0); // Default axis if angle is 0
    }

    return { axis, angle: THREE.MathUtils.radToDeg(angle) };
}

function displayResults(euler, quaternion, axisAngle) {
    document.getElementById('results').style.display = 'block';

    document.querySelector('#eulerResult span').textContent = `${THREE.MathUtils.radToDeg(euler.x).toFixed(2)}, ${THREE.MathUtils.radToDeg(euler.y).toFixed(2)}, ${THREE.MathUtils.radToDeg(euler.z).toFixed(2)}`;

    document.querySelector('#quaternionResult span').textContent = `${quaternion.x.toFixed(4)}, ${quaternion.y.toFixed(4)}, ${quaternion.z.toFixed(4)}, ${quaternion.w.toFixed(4)}`;

    document.querySelector('#axisAngleResult span').textContent = `${axisAngle.axis.x.toFixed(4)}, ${axisAngle.axis.y.toFixed(4)}, ${axisAngle.axis.z.toFixed(4)}, ${axisAngle.angle.toFixed(2)}`;
}

export function copyToClipboard(id) {
    const text = document.querySelector(`#${id} span`).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy!');
    });
}


function visualizeRotation(quaternion) {
    if (cone) {
        scene.remove(cone);
    }
    if (obj_xArrow) {
        scene.remove(obj_xArrow);
        scene.remove(obj_yArrow);
        scene.remove(obj_zArrow);
    }
    // Create a cone aligned with the positive X-axis
    const coneGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 ); 
    const coneMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    cone = new THREE.Mesh(coneGeometry, coneMaterial);

    // Create a quaternion to align the cone with the positive X-axis
    const alignQuaternion = new THREE.Quaternion();
    alignQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);

    // Combine the alignment quaternion with the input quaternion
    const finalQuaternion = new THREE.Quaternion();
    finalQuaternion.multiplyQuaternions(quaternion, alignQuaternion);

    // Apply the final quaternion to the cone
    cone.quaternion.copy(finalQuaternion);

    // Add object arrows:
    const arrowSize = 1;
    obj_xArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowSize, 0xff0000);
    obj_yArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowSize, 0x00ff00);
    obj_zArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowSize, 0x0000ff);

    obj_xArrow.applyQuaternion(quaternion);
    obj_yArrow.applyQuaternion(quaternion);
    obj_zArrow.applyQuaternion(quaternion);
    
    scene.add(obj_xArrow);
    scene.add(obj_yArrow);
    scene.add(obj_zArrow);

    // Add the cone to the scene
    scene.add(cone);
}


initVisualizer()

window.computeAndVisualize = computeAndVisualize;
window.copyToClipboard = copyToClipboard;