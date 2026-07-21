"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export const CinematicBackground = () => {
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);

  // 1. WebGL Dark Ambient Shader
  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;

    const syncSize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    syncSize();
    window.addEventListener("resize", syncSize);

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 mouse = u_mouse / u_resolution;
        
        // Base dark matte color (#090909)
        vec3 color = vec3(0.035, 0.035, 0.035);
        
        // Mouse-following radial spotlight with orange glow
        float dist = distance(uv, mouse);
        float spotlight = smoothstep(0.65, 0.0, dist) * 0.12;
        color += vec3(1.0, 0.41, 0.24) * spotlight;
        
        // Center ambient spotlight behind hero text
        float ambientSpot = smoothstep(0.85, 0.0, distance(uv, vec2(0.5, 0.6))) * 0.06;
        color += vec3(1.0, 0.41, 0.24) * ambientSpot;

        // Fine paper film grain noise
        float n = noise(uv * 900.0 + u_time * 0.15);
        color += (n - 0.5) * 0.025;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compileShader(type: number, src: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      return shader;
    }

    const vertShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = (t: number) => {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", syncSize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Three.js Glowing Orange Square Pixel Particle Clusters
  useEffect(() => {
    const container = particleContainerRef.current;
    if (!container) return;

    let animationFrameId: number;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Create crisp square particle texture
    const createSquareTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FF6A3D";
        ctx.fillRect(0, 0, 32, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const squareTexture = createSquareTexture();

    const particlesCount = 350;
    const positions = new Float32Array(particlesCount * 3);
    const originalY = new Float32Array(particlesCount);
    const speed = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount; i++) {
      const x = (Math.random() - 0.5) * 26;
      const y = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 12;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      originalY[i] = y;
      speed[i] = 0.2 + Math.random() * 0.8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff6a3d,
      size: 0.35,
      map: squareTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
    };

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating sine motion for individual particles
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particlesCount; i++) {
        posArray[i * 3 + 1] = originalY[i] + Math.sin(elapsedTime * speed[i] + i) * 0.4;
      }
      posAttr.needsUpdate = true;

      // Slow cluster rotation
      particleSystem.rotation.y = elapsedTime * 0.02;
      particleSystem.rotation.x = elapsedTime * 0.01;

      // Parallax interaction with mouse
      particleSystem.position.x += (mouseX * 1.0 - particleSystem.position.x) * 0.05;
      particleSystem.position.y += (-mouseY * 1.0 - particleSystem.position.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      squareTexture.dispose();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* WebGL Shader Layer */}
      <div className="absolute inset-0 w-full h-full opacity-80 z-[1]">
        <canvas ref={shaderCanvasRef} className="block w-full h-full" />
      </div>

      {/* Three.js Square Particle System */}
      <div className="absolute inset-0 w-full h-full z-[2]">
        <div ref={particleContainerRef} className="w-full h-full" />
      </div>

      {/* Film Grain Noise Overlay */}
      <div className="grain-overlay absolute inset-0 z-[3]" />
    </div>
  );
};
