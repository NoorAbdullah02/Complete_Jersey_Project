import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

// Helper to generate random points in a sphere
const generateSpherePoints = (count, radius) => {
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = Math.cbrt(Math.random()) * radius;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = z;
    }
    return points;
};

function Stars(props) {
    const ref = useRef();
    const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth <= 768, []);

    // Use manual generation instead of maath
    const sphere = useMemo(() => {
        // Determine device capability and choose point count
        const hw = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
        let count = 2000;
        if (isMobile || hw <= 2) count = 350; // Drastic reduction for mobile/low-end
        else if (hw <= 4) count = 800;
        else count = 1500; // conservative default for most desktops
        return generateSpherePoints(count, 1.5);
    }, [isMobile]);

    useFrame((state, delta) => {
        if (!ref.current) return;
        ref.current.rotation.x -= delta / 15;
        ref.current.rotation.y -= delta / 20;
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#6366f1"
                    size={0.003}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={2} // AdditiveBlending
                />
            </Points>
        </group>
    );
}

export default function ThreeBackground() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const pixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(isMobile ? 1.0 : 1.5, window.devicePixelRatio) : 1;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: '#000' }}>
            <Canvas
                camera={{ position: [0, 0, 1] }}
                pixelRatio={pixelRatio}
                gl={{
                    antialias: false,
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: false
                }}
            >
                <Stars />
            </Canvas>
        </div>
    );
}
