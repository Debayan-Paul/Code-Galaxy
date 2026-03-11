"use client";
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface GalaxyGraphProps {
  data: { nodes: any[]; links: any[] } | null;
  onNodeClick: (node: any) => void;
}

export default function GalaxyGraph({ data, onNodeClick }: GalaxyGraphProps) {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);

  // Create shared geometry and materials once
  const { sharedGeometry, materialTypes } = useMemo(() => {
    if (typeof window === 'undefined') return { sharedGeometry: null, materialTypes: {} as any };
    const loader = new THREE.TextureLoader();
    
    const createMat = (tex: string, extras = {}) => new THREE.MeshStandardMaterial({
        map: loader.load(tex),
        roughness: 0.5,
        metalness: 0.15,
        ...extras
    });

    const matGalaxy = [createMat('/galaxy_spiral.png', { emissive: new THREE.Color(0xaaddff), emissiveIntensity: 0.8 })];
    const matStars = [
      createMat('/planet_sun.png', { emissive: new THREE.Color(0xffddaa), emissiveIntensity: 1.2 }),
      createMat('/planet_sun.png', { emissive: new THREE.Color(0xffaaaa), emissiveIntensity: 1.0 }),  // Red star
      createMat('/planet_sun.png', { emissive: new THREE.Color(0xaaccff), emissiveIntensity: 1.1 }),  // Blue star
      createMat('/planet_sun.png', { emissive: new THREE.Color(0xffffcc), emissiveIntensity: 0.9 }),  // White star
      createMat('/planet_sun.png', { emissive: new THREE.Color(0xffcc88), emissiveIntensity: 1.0 }),  // Orange star
    ];
    const matGasGiants = [createMat('/planet_gas.png'), createMat('/planet_saturn.png'), createMat('/planet_uranus.png'), createMat('/planet_neptune.png')];
    const matPlanets = [createMat('/planet_earth.png'), createMat('/planet_mars.png'), createMat('/planet_venus.png'), createMat('/planet_mercury.png'), createMat('/planet_pluto.png'), createMat('/planet_ice.png')];
    const matMoons = [createMat('/planet_moon.png')];

    const geo = new THREE.SphereGeometry(1, 48, 48); 
    
    return { sharedGeometry: geo, materialTypes: { matGalaxy, matStars, matGasGiants, matPlanets, matMoons } };
  }, []);

  // Resize handler
  useEffect(() => {
    const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Add lights to the Three.js scene
  useEffect(() => {
    if (!fgRef.current) return;
    const scene = fgRef.current.scene();
    if (!scene) return;

    const existingLights = scene.children.filter((c: any) => c.isLight);
    if (existingLights.length > 0) return;

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);

    const point = new THREE.PointLight(0xffffff, 2, 2000);
    point.position.set(0, 0, 0);
    scene.add(point);

    const point2 = new THREE.PointLight(0x88aaff, 1, 3000);
    point2.position.set(200, 200, 200);
    scene.add(point2);
  });

  // Configure physics
  useEffect(() => {
    if (fgRef.current && data) {
      fgRef.current.d3Force('charge').strength(-800); 
      fgRef.current.d3Force('link').distance((link: any) => {
          return link.type === 'hierarchy' ? 180 : 300;
      });

      // Set camera to look from above at an angle so orbits look flat/clean
      const dist = 400;
      fgRef.current.cameraPosition(
        { x: 0, y: dist * 0.6, z: dist * 0.8 },
        { x: 0, y: 0, z: 0 },
        1500
      );
    }
  }, [data]);

  // Create orbit rings and animate planet revolution
  // Uses a retry mechanism to wait for ForceGraph3D's scene to be ready
  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length <= 1) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    const setup = (retries: number) => {
      if (cancelled) return;
      
      const scene = fgRef.current?.scene?.();
      if (!scene) {
        // Scene not ready yet (happens on initial mount) — retry
        if (retries > 0) {
          retryTimer = setTimeout(() => setup(retries - 1), 100);
        }
        return;
      }

      // Remove old orbit rings
      if (orbitGroupRef.current) {
        scene.remove(orbitGroupRef.current);
        orbitGroupRef.current = null;
      }

      const center = data.nodes.find((n: any) => n.__isInvisibleParent);
      const children = data.nodes.filter((n: any) => !n.__isInvisibleParent);
      
      if (!center || children.length === 0) return;
      
      // Draw orbit rings — positions already set by page.tsx
      const group = new THREE.Group();
      const baseRadius = 80;
      const radiusStep = 50;

      children.forEach((_child: any, i: number) => {
        const radius = baseRadius + i * radiusStep;

        // Create thick orbit ring using TubeGeometry
        const curvePath = new THREE.CurvePath<THREE.Vector3>();
        const segments = 128;
        for (let j = 0; j < segments; j++) {
          const a1 = (j / segments) * Math.PI * 2;
          const a2 = ((j + 1) / segments) * Math.PI * 2;
          curvePath.add(new THREE.LineCurve3(
            new THREE.Vector3(Math.cos(a1) * radius, 0, Math.sin(a1) * radius),
            new THREE.Vector3(Math.cos(a2) * radius, 0, Math.sin(a2) * radius)
          ));
        }
        
        const tubeGeo = new THREE.TubeGeometry(curvePath, segments, 0.4, 8, true);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: 0x6688cc,
          transparent: true,
          opacity: 0.25
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        group.add(tube);
      });
      
      orbitGroupRef.current = group;
      scene.add(group);

      // Animate orbital revolution
      let lastTime = performance.now();
      const animate = () => {
        if (cancelled) return;
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        
        children.forEach((child: any, i: number) => {
          const radius = baseRadius + i * radiusStep;
          const speed = 0.06 + (i * 0.012);
          const currentAngle = Math.atan2(child.z || 0, child.x || 0);
          const newAngle = currentAngle + speed * dt;
          
          child.fx = Math.cos(newAngle) * radius;
          child.fz = Math.sin(newAngle) * radius;
          child.fy = 0;
          child.x = child.fx;
          child.z = child.fz;
          child.y = 0;
        });
        
        if (fgRef.current) {
          fgRef.current.d3ReheatSimulation();
        }
        
        animFrameRef.current = requestAnimationFrame(animate);
      };
      
      animFrameRef.current = requestAnimationFrame(animate);
    };

    // Start setup with up to 30 retries (~3 seconds of waiting for scene)
    setup(30);
    
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      cancelAnimationFrame(animFrameRef.current);
      const scene = fgRef.current?.scene?.();
      if (orbitGroupRef.current && scene) {
        scene.remove(orbitGroupRef.current);
        orbitGroupRef.current = null;
      }
    };
  }, [data]);

  const handleClick = useCallback((node: any) => {
    if (node.__isInvisibleParent) return;
    
    const distance = 60;
    const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
    
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
        node, 
        2000
      );
    }
    
    onNodeClick(node);
  }, [onNodeClick]);

  if (!data) return null;

  return (
    <div className="w-full h-full absolute inset-0">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={0}
        nodeLabel={(node: any) => node.__isInvisibleParent ? '' : (node.name || '')}
        linkDirectionalArrowLength={0}
        onNodeClick={handleClick}
        backgroundColor="rgba(0,0,0,0)"
        linkColor={() => 'rgba(0,0,0,0)'}
        linkWidth={() => 0}
        linkOpacity={0}
        linkVisibility={() => false}
        nodeThreeObject={(node: any) => {
            if (node.__isInvisibleParent) {
                return new THREE.Mesh(
                    new THREE.SphereGeometry(0.01, 4, 4), 
                    new THREE.MeshBasicMaterial({ visible: false })
                );
            }
            if (!sharedGeometry || !materialTypes.matStars) return new THREE.Mesh();
            
            const val = node.val || 3;
            const hash = node.id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
            
            let matArray;
            let scale: number;
            const MULTIPLIER = 2.5; // Increased base size multiplier
            
            if (node.group === 'galaxy') {
                matArray = materialTypes.matGalaxy;
                scale = 20 * MULTIPLIER;
            } else if (node.group === 'solar_system') {
                matArray = materialTypes.matStars;
                scale = 10 * MULTIPLIER;
            } else {
                // Planets — made significantly larger
                if (val > 10) { 
                    matArray = materialTypes.matGasGiants;
                    scale = (8 + (val - 10) * 0.8) * MULTIPLIER;
                } else if (val > 5) { 
                    matArray = materialTypes.matPlanets;
                    scale = (5 + (val - 5) * 0.6) * MULTIPLIER;
                } else { 
                    matArray = materialTypes.matMoons;
                    scale = (3.5 + val * 0.4) * MULTIPLIER;
                }
            }
            
            const textureIndex = Math.abs(hash) % matArray.length;
            const material = matArray[textureIndex].clone();
            
            // Tint slightly so same textures look different
            if (node.group === 'planet') {
                const tints = [0xffffff, 0xffeeee, 0xeeffee, 0xeeeeff, 0xffffee];
                material.color.lerp(new THREE.Color(tints[Math.abs(hash) % tints.length]), 0.15);
            }
            
            const mesh = new THREE.Mesh(sharedGeometry, material);
            const jitter = 1 + (Math.abs(hash % 10) / 50); // subtle variation
            mesh.scale.set(scale * jitter, scale * jitter, scale * jitter);
            
            return mesh;
        }}
      />
    </div>
  );
}
