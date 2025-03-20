import * as THREE from 'three';

const cellVertexShader = `
    varying vec3 vNormal;
    void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const cellFragmentShader = `
    uniform float time;
    varying vec3 vNormal;
    void main() {
        vec3 color = vec3(0.2, 0.4, 0.6);
        float alpha = 0.3 + 0.1 * sin(time);
        gl_FragColor = vec4(color, alpha);
    }
`;

export function createCell(x, y, z) {
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const material = new THREE.ShaderMaterial({
        vertexShader: cellVertexShader,
        fragmentShader: cellFragmentShader,
        uniforms: { time: { value: 0 } },
        transparent: true,
        depthWrite: true
    });
    const cell = new THREE.Mesh(geometry, material);
    cell.position.set(x - 1, y - 1, z - 1);
    cell.renderOrder = 0; // Render cells before particles
    return cell;
}