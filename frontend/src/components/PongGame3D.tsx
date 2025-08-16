import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

// Game constants matching backend
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GAME_DEPTH = 50;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const PADDLE_DEPTH = 30;
const BALL_SIZE = 10;
const SCALE_FACTOR = 0.01; // Scale down for 3D world

function PongGame3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const gameStore = useGameStore();
  const { user } = useAuthStore();
  
  // Refs for game objects
  const paddle1Ref = useRef<BABYLON.Mesh | null>(null);
  const paddle2Ref = useRef<BABYLON.Mesh | null>(null);
  const ballRef = useRef<BABYLON.Mesh | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Babylon.js
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    // Create scene
    const scene = createScene(engine, canvasRef.current);
    sceneRef.current = scene;

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStore.socket || gameStore.status !== 'playing') return;
      
      let direction: 'up' | 'down' | null = null;
      
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        direction = 'up';
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        direction = 'down';
      }
      
      if (direction && gameStore.gameId) {
        gameStore.socket.emit('move-paddle', {
          gameId: gameStore.gameId,
          direction,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Update game objects based on game state
  useEffect(() => {
    if (!sceneRef.current) return;

    // Update paddle positions
    if (paddle1Ref.current && gameStore.player1) {
      const y = (gameStore.player1.position - GAME_HEIGHT / 2) * SCALE_FACTOR;
      paddle1Ref.current.position.y = y;
    }

    if (paddle2Ref.current && gameStore.player2) {
      const y = (gameStore.player2.position - GAME_HEIGHT / 2) * SCALE_FACTOR;
      paddle2Ref.current.position.y = y;
    }

    // Update ball position
    if (ballRef.current && gameStore.ball) {
      const x = (gameStore.ball.x - GAME_WIDTH / 2) * SCALE_FACTOR;
      const y = (gameStore.ball.y - GAME_HEIGHT / 2) * SCALE_FACTOR;
      ballRef.current.position.x = x;
      ballRef.current.position.y = y;
    }
  }, [gameStore.player1?.position, gameStore.player2?.position, gameStore.ball]);

  const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1);

    // Camera
    const camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(0, 2, -10),
      scene
    );
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.fov = 0.8;

    // Lights
    const light1 = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light1.intensity = 0.7;

    const light2 = new BABYLON.PointLight(
      'light2',
      new BABYLON.Vector3(0, 5, 0),
      scene
    );
    light2.intensity = 0.5;

    // Create game field (table)
    const ground = BABYLON.MeshBuilder.CreateBox('ground', {
      width: GAME_WIDTH * SCALE_FACTOR,
      height: 0.1,
      depth: GAME_DEPTH * SCALE_FACTOR,
    }, scene);
    ground.position.y = -2;
    
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    groundMaterial.emissiveColor = new BABYLON.Color3(0, 0.73, 0.74); // 42-primary color
    groundMaterial.emissiveIntensity = 0.1;
    ground.material = groundMaterial;

    // Create walls
    const wallHeight = 2;
    const wallThickness = 0.2;
    
    // Top wall
    const topWall = BABYLON.MeshBuilder.CreateBox('topWall', {
      width: GAME_WIDTH * SCALE_FACTOR,
      height: wallHeight,
      depth: wallThickness,
    }, scene);
    topWall.position.z = GAME_DEPTH * SCALE_FACTOR / 2;
    topWall.position.y = -1;
    
    // Bottom wall
    const bottomWall = BABYLON.MeshBuilder.CreateBox('bottomWall', {
      width: GAME_WIDTH * SCALE_FACTOR,
      height: wallHeight,
      depth: wallThickness,
    }, scene);
    bottomWall.position.z = -GAME_DEPTH * SCALE_FACTOR / 2;
    bottomWall.position.y = -1;

    const wallMaterial = new BABYLON.StandardMaterial('wallMat', scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.17, 0.17, 0.17);
    wallMaterial.emissiveColor = new BABYLON.Color3(0, 0.73, 0.74);
    wallMaterial.emissiveIntensity = 0.2;
    topWall.material = wallMaterial;
    bottomWall.material = wallMaterial;

    // Create center line
    const centerLine = BABYLON.MeshBuilder.CreateBox('centerLine', {
      width: 0.05,
      height: 0.02,
      depth: GAME_DEPTH * SCALE_FACTOR,
    }, scene);
    centerLine.position.y = -1.95;
    
    const centerLineMaterial = new BABYLON.StandardMaterial('centerLineMat', scene);
    centerLineMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    centerLineMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    centerLineMaterial.emissiveIntensity = 0.5;
    centerLine.material = centerLineMaterial;

    // Create paddles
    const paddleMaterial = new BABYLON.StandardMaterial('paddleMat', scene);
    paddleMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    paddleMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    paddleMaterial.emissiveIntensity = 0.3;

    // Player 1 paddle (left)
    const paddle1 = BABYLON.MeshBuilder.CreateBox('paddle1', {
      width: PADDLE_WIDTH * SCALE_FACTOR,
      height: PADDLE_HEIGHT * SCALE_FACTOR,
      depth: PADDLE_DEPTH * SCALE_FACTOR,
    }, scene);
    paddle1.position.x = -(GAME_WIDTH / 2 - PADDLE_WIDTH) * SCALE_FACTOR;
    paddle1.position.y = 0;
    paddle1.material = paddleMaterial;
    paddle1Ref.current = paddle1;

    // Player 2 paddle (right)
    const paddle2 = BABYLON.MeshBuilder.CreateBox('paddle2', {
      width: PADDLE_WIDTH * SCALE_FACTOR,
      height: PADDLE_HEIGHT * SCALE_FACTOR,
      depth: PADDLE_DEPTH * SCALE_FACTOR,
    }, scene);
    paddle2.position.x = (GAME_WIDTH / 2 - PADDLE_WIDTH) * SCALE_FACTOR;
    paddle2.position.y = 0;
    paddle2.material = paddleMaterial;
    paddle2Ref.current = paddle2;

    // Create ball
    const ball = BABYLON.MeshBuilder.CreateSphere('ball', {
      diameter: BALL_SIZE * SCALE_FACTOR * 2,
    }, scene);
    ball.position.x = 0;
    ball.position.y = 0;
    ball.position.z = 0;
    
    const ballMaterial = new BABYLON.StandardMaterial('ballMat', scene);
    ballMaterial.diffuseColor = new BABYLON.Color3(1, 0.42, 0.42); // 42-secondary color
    ballMaterial.emissiveColor = new BABYLON.Color3(1, 0.42, 0.42);
    ballMaterial.emissiveIntensity = 0.5;
    ballMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    ballMaterial.specularPower = 32;
    ball.material = ballMaterial;
    ballRef.current = ball;

    // Add glow effect
    const gl = new BABYLON.GlowLayer('glow', scene);
    gl.intensity = 0.5;

    // Add particle system for ball trail
    const particleSystem = new BABYLON.ParticleSystem('particles', 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      scene
    );
    particleSystem.emitter = ball;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.01, -0.01, -0.01);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.01, 0.01, 0.01);
    particleSystem.color1 = new BABYLON.Color4(1, 0.42, 0.42, 1);
    particleSystem.color2 = new BABYLON.Color4(0, 0.73, 0.74, 1);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    particleSystem.minSize = 0.01;
    particleSystem.maxSize = 0.05;
    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.3;
    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-1, 0, 0);
    particleSystem.direction2 = new BABYLON.Vector3(1, 0, 0);
    particleSystem.minEmitPower = 0.01;
    particleSystem.maxEmitPower = 0.1;
    particleSystem.updateSpeed = 0.01;
    particleSystem.start();

    // Add animations
    scene.registerBeforeRender(() => {
      // Rotate ball
      if (ballRef.current) {
        ballRef.current.rotation.x += 0.1;
        ballRef.current.rotation.y += 0.1;
      }
    });

    return scene;
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-lg"
      style={{ outline: 'none' }}
    />
  );
}

export default PongGame3D;
