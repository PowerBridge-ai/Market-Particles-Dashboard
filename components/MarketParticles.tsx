import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  target: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

interface MarketParticlesProps {
  marketData: {
    price?: number;
    volume?: number;
    change?: number;
  };
}

const MarketParticles = ({ marketData }: MarketParticlesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create particle system
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        marketInfluence: { value: 1.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          gl_FragColor = vec4(vColor, 1.0 - (r * 2.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });

    // Initialize particles
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const baseColor = new THREE.Color(0x00ff88);
    const accentColor = new THREE.Color(0x0088ff);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      
      positions[i3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i3 + 2] = radius * Math.cos(theta);
      
      const color = baseColor.clone().lerp(accentColor, Math.random());
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = Math.random() * 2 + 1;
      
      particlesRef.current.push({
        position: new THREE.Vector3(
          positions[i3],
          positions[i3 + 1],
          positions[i3 + 2]
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        target: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ),
        color: color,
        size: sizes[i]
      });
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      'customColor',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    particleGeometry.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(sizes, 1)
    );

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    camera.position.z = 15;

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.001;

      // Update market influence based on price changes
      const marketInfluence = ((marketData?.price || 50000) / 50000) * 
                            (1 + Math.sin(time) * 0.2);
      particleMaterial.uniforms.marketInfluence.value = marketInfluence;
      particleMaterial.uniforms.time.value = time;

      // Update particle positions
      particlesRef.current.forEach((particle, index) => {
        const i3 = index * 3;
        
        // Add swirling motion
        const swirl = new THREE.Vector3(
          Math.sin(time + particle.position.y) * 0.1,
          Math.cos(time + particle.position.x) * 0.1,
          Math.sin(time * 0.5) * 0.05
        );
        
        // Update velocity with market influence
        particle.velocity.multiplyScalar(0.99); // Add damping
        particle.velocity.add(swirl);
        particle.velocity.add(
          particle.target.clone()
            .sub(particle.position)
            .normalize()
            .multiplyScalar(0.001 * marketInfluence)
        );

        // Update position
        particle.position.add(particle.velocity);

        // Update geometry
        positions[i3] = particle.position.x;
        positions[i3 + 1] = particle.position.y;
        positions[i3 + 2] = particle.position.z;

        // Reset target if particle is too far
        if (particle.position.distanceTo(particle.target) < 0.1) {
          const radius = Math.random() * 10;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 2;
          
          particle.target.set(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(theta)
          );
        }
      });

      particleGeometry.attributes.position.needsUpdate = true;

      // Rotate the entire particle system
      particles.rotation.y += 0.0005 * marketInfluence;
      particles.rotation.x += 0.0002 * marketInfluence;

      // Camera movement
      camera.position.x = Math.sin(time * 0.1) * 2;
      camera.position.y = Math.cos(time * 0.1) * 2;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0" />;
}; // Fix: Remove extra semicolon after closing brace

import React from 'react'; // Add React import
export default MarketParticles;