import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
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
const PADDLE_SPEED = 8;
const BALL_SPEED = 5;
const MAX_BALL_SPEED = 10;
const WINNING_SCORE = 11;

interface LocalGameState {
  player1Y: number;
  player2Y: number;
  ballX: number;
  ballY: number;
  ballZ: number;
  ballVelocityX: number;
  ballVelocityY: number;
  ballVelocityZ: number;
  player1Score: number;
  player2Score: number;
  gameStarted: boolean;
  gameEnded: boolean;
  isPaused: boolean;
  countdown: number;
}

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
  
  // Local game state for immediate response
  const localGameRef = useRef<LocalGameState>({
    player1Y: GAME_HEIGHT / 2,
    player2Y: GAME_HEIGHT / 2,
    ballX: GAME_WIDTH / 2,
    ballY: GAME_HEIGHT / 2,
    ballZ: 0,
    ballVelocityX: 0,
    ballVelocityY: 0,
    ballVelocityZ: 0,
    player1Score: 0,
    player2Score: 0,
    gameStarted: false,
    gameEnded: false,
    isPaused: false,
    countdown: 3,
  });

  // Key states
  const keysPressed = useRef<Set<string>>(new Set());

  // Animation frame ID
  const animationFrameId = useRef<number | null>(null);

  // Score display elements
  const scoreTextRef = useRef<GUI.TextBlock | null>(null);

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

    // Start local game after a short delay
    setTimeout(() => {
      startLocalGame();
    }, 1000);

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
      keysPressed.current.add(e.key.toLowerCase());
      
      // Handle pause
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        localGameRef.current.isPaused = !localGameRef.current.isPaused;
      }
      
      // Handle restart
      if (e.key === 'r' || e.key === 'R') {
        if (localGameRef.current.gameEnded) {
          resetLocalGame();
          startLocalGame();
        }
      }
      
      // Remote game controls
      if (gameStore.socket && gameStore.status === 'playing') {
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
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game update loop
    const gameLoop = () => {
      updateLocalGame();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    animationFrameId.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Update game objects based on remote game state
  useEffect(() => {
    if (!sceneRef.current || !gameStore.socket) return;

    // Update paddle positions from remote
    if (paddle1Ref.current && gameStore.player1) {
      const y = (gameStore.player1.position - GAME_HEIGHT / 2) * SCALE_FACTOR;
      paddle1Ref.current.position.y = y;
      localGameRef.current.player1Y = gameStore.player1.position;
    }

    if (paddle2Ref.current && gameStore.player2) {
      const y = (gameStore.player2.position - GAME_HEIGHT / 2) * SCALE_FACTOR;
      paddle2Ref.current.position.y = y;
      localGameRef.current.player2Y = gameStore.player2.position;
    }

    // Update ball position from remote
    if (ballRef.current && gameStore.ball) {
      const x = (gameStore.ball.x - GAME_WIDTH / 2) * SCALE_FACTOR;
      const y = (gameStore.ball.y - GAME_HEIGHT / 2) * SCALE_FACTOR;
      ballRef.current.position.x = x;
      ballRef.current.position.y = y;
      localGameRef.current.ballX = gameStore.ball.x;
      localGameRef.current.ballY = gameStore.ball.y;
    }
  }, [gameStore.player1?.position, gameStore.player2?.position, gameStore.ball]);

  const startLocalGame = () => {
    const localGame = localGameRef.current;
    localGame.gameStarted = false;
    localGame.countdown = 3;
    
    // Countdown
    const countdownInterval = setInterval(() => {
      localGame.countdown--;
      if (localGame.countdown <= 0) {
        clearInterval(countdownInterval);
        localGame.gameStarted = true;
        resetBall();
      }
    }, 1000);
  };

  const resetLocalGame = () => {
    const localGame = localGameRef.current;
    localGame.player1Y = GAME_HEIGHT / 2;
    localGame.player2Y = GAME_HEIGHT / 2;
    localGame.ballX = GAME_WIDTH / 2;
    localGame.ballY = GAME_HEIGHT / 2;
    localGame.ballZ = 0;
    localGame.ballVelocityX = 0;
    localGame.ballVelocityY = 0;
    localGame.ballVelocityZ = 0;
    localGame.player1Score = 0;
    localGame.player2Score = 0;
    localGame.gameEnded = false;
    localGame.isPaused = false;
    localGame.countdown = 3;
    updateScoreDisplay();
  };

  const resetBall = () => {
    const localGame = localGameRef.current;
    localGame.ballX = GAME_WIDTH / 2;
    localGame.ballY = GAME_HEIGHT / 2;
    localGame.ballZ = 0;
    localGame.ballVelocityX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
    localGame.ballVelocityY = (Math.random() - 0.5) * BALL_SPEED * 0.5;
    localGame.ballVelocityZ = (Math.random() - 0.5) * 2; // 3D effect
  };

  const updateLocalGame = () => {
    const localGame = localGameRef.current;
    
    // Don't update if game hasn't started, is paused, or has ended
    if (!localGame.gameStarted || localGame.isPaused || localGame.gameEnded) {
      return;
    }

    // Only update for local game (no socket connection)
    if (gameStore.socket && gameStore.status === 'playing') {
      return; // Let remote game handle updates
    }

    // Update paddle positions based on keyboard input
    if (keysPressed.current.has('w')) {
      localGame.player1Y = Math.max(PADDLE_HEIGHT / 2, localGame.player1Y - PADDLE_SPEED);
    }
    if (keysPressed.current.has('s')) {
      localGame.player1Y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT / 2, localGame.player1Y + PADDLE_SPEED);
    }
    if (keysPressed.current.has('arrowup')) {
      localGame.player2Y = Math.max(PADDLE_HEIGHT / 2, localGame.player2Y - PADDLE_SPEED);
    }
    if (keysPressed.current.has('arrowdown')) {
      localGame.player2Y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT / 2, localGame.player2Y + PADDLE_SPEED);
    }

    // Simple AI for player 2 (if single player)
    if (!keysPressed.current.has('arrowup') && !keysPressed.current.has('arrowdown')) {
      const aiSpeed = PADDLE_SPEED * 0.7; // AI is slightly slower
      const paddleCenter = localGame.player2Y;
      const ballY = localGame.ballY;
      
      if (ballY < paddleCenter - 10) {
        localGame.player2Y = Math.max(PADDLE_HEIGHT / 2, localGame.player2Y - aiSpeed);
      } else if (ballY > paddleCenter + 10) {
        localGame.player2Y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT / 2, localGame.player2Y + aiSpeed);
      }
    }

    // Update ball position
    localGame.ballX += localGame.ballVelocityX;
    localGame.ballY += localGame.ballVelocityY;
    localGame.ballZ += localGame.ballVelocityZ;

    // Ball Z-axis boundaries (3D depth effect)
    if (localGame.ballZ > GAME_DEPTH / 2 || localGame.ballZ < -GAME_DEPTH / 2) {
      localGame.ballVelocityZ = -localGame.ballVelocityZ;
    }

    // Ball collision with top/bottom walls
    if (localGame.ballY - BALL_SIZE / 2 <= 0 || 
        localGame.ballY + BALL_SIZE / 2 >= GAME_HEIGHT) {
      localGame.ballVelocityY = -localGame.ballVelocityY;
      localGame.ballY = Math.max(BALL_SIZE / 2, Math.min(GAME_HEIGHT - BALL_SIZE / 2, localGame.ballY));
    }

    // Ball collision with left paddle (player 1)
    if (localGame.ballX - BALL_SIZE / 2 <= PADDLE_WIDTH && 
        localGame.ballVelocityX < 0) {
      if (Math.abs(localGame.ballY - localGame.player1Y) <= PADDLE_HEIGHT / 2 + BALL_SIZE / 2) {
        // Hit paddle
        localGame.ballVelocityX = Math.abs(localGame.ballVelocityX) * 1.05; // Speed up slightly
        localGame.ballVelocityX = Math.min(localGame.ballVelocityX, MAX_BALL_SPEED);
        
        // Add spin based on where ball hits paddle
        const hitPos = (localGame.ballY - localGame.player1Y) / (PADDLE_HEIGHT / 2);
        localGame.ballVelocityY += hitPos * 2;
        localGame.ballVelocityZ = (Math.random() - 0.5) * 3; // Random 3D spin
        
        localGame.ballX = PADDLE_WIDTH + BALL_SIZE / 2; // Prevent sticking
      } else {
        // Player 2 scores
        localGame.player2Score++;
        updateScoreDisplay();
        
        if (localGame.player2Score >= WINNING_SCORE) {
          endLocalGame(2);
        } else {
          resetBall();
        }
      }
    }

    // Ball collision with right paddle (player 2)
    if (localGame.ballX + BALL_SIZE / 2 >= GAME_WIDTH - PADDLE_WIDTH && 
        localGame.ballVelocityX > 0) {
      if (Math.abs(localGame.ballY - localGame.player2Y) <= PADDLE_HEIGHT / 2 + BALL_SIZE / 2) {
        // Hit paddle
        localGame.ballVelocityX = -Math.abs(localGame.ballVelocityX) * 1.05; // Speed up slightly
        localGame.ballVelocityX = Math.max(localGame.ballVelocityX, -MAX_BALL_SPEED);
        
        // Add spin based on where ball hits paddle
        const hitPos = (localGame.ballY - localGame.player2Y) / (PADDLE_HEIGHT / 2);
        localGame.ballVelocityY += hitPos * 2;
        localGame.ballVelocityZ = (Math.random() - 0.5) * 3; // Random 3D spin
        
        localGame.ballX = GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE / 2; // Prevent sticking
      } else {
        // Player 1 scores
        localGame.player1Score++;
        updateScoreDisplay();
        
        if (localGame.player1Score >= WINNING_SCORE) {
          endLocalGame(1);
        } else {
          resetBall();
        }
      }
    }

    // Update 3D positions
    if (paddle1Ref.current) {
      paddle1Ref.current.position.y = (localGame.player1Y - GAME_HEIGHT / 2) * SCALE_FACTOR;
    }
    if (paddle2Ref.current) {
      paddle2Ref.current.position.y = (localGame.player2Y - GAME_HEIGHT / 2) * SCALE_FACTOR;
    }
    if (ballRef.current) {
      ballRef.current.position.x = (localGame.ballX - GAME_WIDTH / 2) * SCALE_FACTOR;
      ballRef.current.position.y = (localGame.ballY - GAME_HEIGHT / 2) * SCALE_FACTOR;
      ballRef.current.position.z = localGame.ballZ * SCALE_FACTOR;
      
      // Rotate ball for visual effect
      ballRef.current.rotation.x += 0.1;
      ballRef.current.rotation.y += 0.1;
    }
  };

  const endLocalGame = (winner: number) => {
    localGameRef.current.gameEnded = true;
    console.log(`Player ${winner} wins!`);
  };

  const updateScoreDisplay = () => {
    if (scoreTextRef.current) {
      const localGame = localGameRef.current;
      scoreTextRef.current.text = `${localGame.player1Score} - ${localGame.player2Score}`;
    }
  };

  const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.05, 1);

    // Camera - more dynamic angle
    const camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(0, 3, -12),
      scene
    );
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    camera.fov = 0.8;

    // Animated camera for more dynamic view
    let cameraTime = 0;
    scene.registerBeforeRender(() => {
      cameraTime += 0.01;
      camera.position.x = Math.sin(cameraTime * 0.3) * 2;
      camera.position.y = 3 + Math.sin(cameraTime * 0.5) * 0.5;
      camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    });

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

    // Add spot lights for dramatic effect
    const spotLight1 = new BABYLON.SpotLight(
      'spotLight1',
      new BABYLON.Vector3(-5, 8, 0),
      new BABYLON.Vector3(1, -1, 0),
      Math.PI / 3,
      2,
      scene
    );
    spotLight1.intensity = 0.5;
    spotLight1.diffuse = new BABYLON.Color3(0, 0.73, 0.74);

    const spotLight2 = new BABYLON.SpotLight(
      'spotLight2',
      new BABYLON.Vector3(5, 8, 0),
      new BABYLON.Vector3(-1, -1, 0),
      Math.PI / 3,
      2,
      scene
    );
    spotLight2.intensity = 0.5;
    spotLight2.diffuse = new BABYLON.Color3(1, 0.42, 0.42);

    // Create game field (table) with glass-like material
    const ground = BABYLON.MeshBuilder.CreateBox('ground', {
      width: GAME_WIDTH * SCALE_FACTOR,
      height: 0.2,
      depth: GAME_DEPTH * SCALE_FACTOR,
    }, scene);
    ground.position.y = -2;
    
    const groundMaterial = new BABYLON.PBRMaterial('groundMat', scene);
    groundMaterial.metallic = 0.8;
    groundMaterial.roughness = 0.2;
    groundMaterial.albedoColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    groundMaterial.emissiveColor = new BABYLON.Color3(0, 0.73, 0.74);
    groundMaterial.emissiveIntensity = 0.05;
    ground.material = groundMaterial;

    // Create walls with glow effect
    const wallHeight = 3;
    const wallThickness = 0.2;
    
    // Top wall
    const topWall = BABYLON.MeshBuilder.CreateBox('topWall', {
      width: GAME_WIDTH * SCALE_FACTOR,
      height: wallHeight,
      depth: wallThickness,
    }, scene);
    topWall.position.z = GAME_DEPTH * SCALE_FACTOR / 2;
    topWall.position.y = -0.5;
    
    // Bottom wall
    const bottomWall = BABYLON.MeshBuilder.CreateBox('bottomWall', {
      width: GAME_WIDTH * SCALE_FACTOR,
      height: wallHeight,
      depth: wallThickness,
    }, scene);
    bottomWall.position.z = -GAME_DEPTH * SCALE_FACTOR / 2;
    bottomWall.position.y = -0.5;

    const wallMaterial = new BABYLON.PBRMaterial('wallMat', scene);
    wallMaterial.metallic = 0.9;
    wallMaterial.roughness = 0.1;
    wallMaterial.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    wallMaterial.emissiveColor = new BABYLON.Color3(0, 0.73, 0.74);
    wallMaterial.emissiveIntensity = 0.3;
    topWall.material = wallMaterial;
    bottomWall.material = wallMaterial;

    // Create animated center line
    const centerLineSegments = 10;
    for (let i = 0; i < centerLineSegments; i++) {
      const segment = BABYLON.MeshBuilder.CreateBox(`centerLine${i}`, {
        width: 0.05,
        height: 0.02,
        depth: (GAME_DEPTH * SCALE_FACTOR) / centerLineSegments * 0.7,
      }, scene);
      segment.position.y = -1.95;
      segment.position.z = (i - centerLineSegments / 2 + 0.5) * (GAME_DEPTH * SCALE_FACTOR) / centerLineSegments;
      
      const centerLineMaterial = new BABYLON.PBRMaterial(`centerLineMat${i}`, scene);
      centerLineMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
      centerLineMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
      centerLineMaterial.emissiveIntensity = 0.5;
      centerLineMaterial.metallic = 0.5;
      centerLineMaterial.roughness = 0.3;
      segment.material = centerLineMaterial;
      
      // Animate center line
      scene.registerBeforeRender(() => {
        centerLineMaterial.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.001 + i * 0.5) * 0.2;
      });
    }

    // Create paddles with neon glow
    const paddleMaterial1 = new BABYLON.PBRMaterial('paddleMat1', scene);
    paddleMaterial1.albedoColor = new BABYLON.Color3(0.9, 0.9, 1);
    paddleMaterial1.emissiveColor = new BABYLON.Color3(0, 0.73, 0.74);
    paddleMaterial1.emissiveIntensity = 0.5;
    paddleMaterial1.metallic = 0.7;
    paddleMaterial1.roughness = 0.2;

    const paddleMaterial2 = new BABYLON.PBRMaterial('paddleMat2', scene);
    paddleMaterial2.albedoColor = new BABYLON.Color3(1, 0.9, 0.9);
    paddleMaterial2.emissiveColor = new BABYLON.Color3(1, 0.42, 0.42);
    paddleMaterial2.emissiveIntensity = 0.5;
    paddleMaterial2.metallic = 0.7;
    paddleMaterial2.roughness = 0.2;

    // Player 1 paddle (left) - cyan glow
    const paddle1 = BABYLON.MeshBuilder.CreateBox('paddle1', {
      width: PADDLE_WIDTH * SCALE_FACTOR,
      height: PADDLE_HEIGHT * SCALE_FACTOR,
      depth: PADDLE_DEPTH * SCALE_FACTOR,
    }, scene);
    paddle1.position.x = -(GAME_WIDTH / 2 - PADDLE_WIDTH) * SCALE_FACTOR;
    paddle1.position.y = 0;
    paddle1.material = paddleMaterial1;
    paddle1Ref.current = paddle1;

    // Player 2 paddle (right) - red glow
    const paddle2 = BABYLON.MeshBuilder.CreateBox('paddle2', {
      width: PADDLE_WIDTH * SCALE_FACTOR,
      height: PADDLE_HEIGHT * SCALE_FACTOR,
      depth: PADDLE_DEPTH * SCALE_FACTOR,
    }, scene);
    paddle2.position.x = (GAME_WIDTH / 2 - PADDLE_WIDTH) * SCALE_FACTOR;
    paddle2.position.y = 0;
    paddle2.material = paddleMaterial2;
    paddle2Ref.current = paddle2;

    // Create ball with energy effect
    const ball = BABYLON.MeshBuilder.CreateSphere('ball', {
      diameter: BALL_SIZE * SCALE_FACTOR * 2,
    }, scene);
    ball.position.x = 0;
    ball.position.y = 0;
    ball.position.z = 0;
    
    const ballMaterial = new BABYLON.PBRMaterial('ballMat', scene);
    ballMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
    ballMaterial.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
    ballMaterial.emissiveIntensity = 0.8;
    ballMaterial.metallic = 0.9;
    ballMaterial.roughness = 0.1;
    ball.material = ballMaterial;
    ballRef.current = ball;

    // Animate ball glow
    scene.registerBeforeRender(() => {
      if (ballMaterial && localGameRef.current.gameStarted) {
        const speed = Math.sqrt(
          localGameRef.current.ballVelocityX ** 2 + 
          localGameRef.current.ballVelocityY ** 2
        );
        const normalizedSpeed = speed / MAX_BALL_SPEED;
        ballMaterial.emissiveIntensity = 0.5 + normalizedSpeed * 0.5;
        
        // Change color based on speed
        const r = 1;
        const g = 1 - normalizedSpeed * 0.5;
        const b = normalizedSpeed * 0.5;
        ballMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
      }
    });

    // Add glow effect
    const gl = new BABYLON.GlowLayer('glow', scene);
    gl.intensity = 0.7;

    // Add particle system for ball trail
    const particleSystem = new BABYLON.ParticleSystem('particles', 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAUGVYSWZNTQAqAAAACAACARIAAwAAAAEAAQAAh2kABAAAAAEAAAAmAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAAIoAMABAAAAAEAAAAIAAAAAO7OFacAAABwaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGLz4KPC94OnhtcG1ldGE+ChD5uU0AAAB2SURBVBgZY2BgYPgPxP8h+D8U/4fhfzD8H4L/o+H/SPgfBP8H4/9w/B+K/0PwfzT8H4r/A9F/JPwfgv9D8X8w/g/F/6H4Pwz/h+L/UPwfhv9D8X8o/g/D/6H4PxT/h+H/UPwfgv8jw/+h+D8E/4fg/yAMBAC6glRVz2jVhwAAAABJRU5ErkJggg==',
      scene
    );
    particleSystem.emitter = ball;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.01, -0.01, -0.01);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.01, 0.01, 0.01);
    particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.42, 0.42, 0.8);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    particleSystem.minSize = 0.02;
    particleSystem.maxSize = 0.08;
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.5;
    particleSystem.emitRate = 200;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
    particleSystem.minEmitPower = 0.01;
    particleSystem.maxEmitPower = 0.2;
    particleSystem.updateSpeed = 0.01;
    particleSystem.start();

    // Create GUI for score display
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    const scoreText = new GUI.TextBlock();
    scoreText.text = '0 - 0';
    scoreText.color = 'white';
    scoreText.fontSize = 48;
    scoreText.fontWeight = 'bold';
    scoreText.top = '-40%';
    scoreText.shadowColor = 'black';
    scoreText.shadowOffsetX = 2;
    scoreText.shadowOffsetY = 2;
    advancedTexture.addControl(scoreText);
    scoreTextRef.current = scoreText;

    // Add countdown text
    const countdownText = new GUI.TextBlock();
    countdownText.text = '';
    countdownText.color = '#00babc';
    countdownText.fontSize = 72;
    countdownText.fontWeight = 'bold';
    countdownText.shadowColor = 'black';
    countdownText.shadowOffsetX = 3;
    countdownText.shadowOffsetY = 3;
    advancedTexture.addControl(countdownText);

    // Update countdown display
    scene.registerBeforeRender(() => {
      const localGame = localGameRef.current;
      if (!localGame.gameStarted && localGame.countdown > 0) {
        countdownText.text = localGame.countdown.toString();
        countdownText.alpha = 1;
      } else {
        countdownText.alpha = 0;
      }
      
      // Show pause text
      if (localGame.isPaused && localGame.gameStarted && !localGame.gameEnded) {
        countdownText.text = 'PAUSED';
        countdownText.fontSize = 48;
        countdownText.alpha = 1;
      }
      
      // Show game over text
      if (localGame.gameEnded) {
        const winner = localGame.player1Score >= WINNING_SCORE ? 1 : 2;
        countdownText.text = `PLAYER ${winner} WINS!\nPress R to restart`;
        countdownText.fontSize = 36;
        countdownText.alpha = 1;
      }
    });

    // Add ambient particles for atmosphere
    const ambientParticles = new BABYLON.ParticleSystem('ambientParticles', 500, scene);
    ambientParticles.particleTexture = new BABYLON.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAUGVYSWZNTQAqAAAACAACARIAAwAAAAEAAQAAh2kABAAAAAEAAAAmAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAAEoAMABAAAAAEAAAAEAAAAAIqgr7IAAAAraVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhLz4KwwuZtAAAADdJREFUCB1jYGBg+A/EDDAMBIAA4n+AAQMYMPz/D8T/gRgIAAX+Q8F/KAYB/IofKAYUAwEBANaFFAUccOKBAAAAAElFTkSuQmCC',
      scene
    );
    ambientParticles.emitter = new BABYLON.Vector3(0, 0, 0);
    ambientParticles.minEmitBox = new BABYLON.Vector3(-10, -5, -5);
    ambientParticles.maxEmitBox = new BABYLON.Vector3(10, 5, 5);
    ambientParticles.color1 = new BABYLON.Color4(0, 0.73, 0.74, 0.5);
    ambientParticles.color2 = new BABYLON.Color4(1, 0.42, 0.42, 0.5);
    ambientParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    ambientParticles.minSize = 0.01;
    ambientParticles.maxSize = 0.03;
    ambientParticles.minLifeTime = 5;
    ambientParticles.maxLifeTime = 10;
    ambientParticles.emitRate = 20;
    ambientParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    ambientParticles.gravity = new BABYLON.Vector3(0, -0.05, 0);
    ambientParticles.direction1 = new BABYLON.Vector3(-0.1, 1, -0.1);
    ambientParticles.direction2 = new BABYLON.Vector3(0.1, 1, 0.1);
    ambientParticles.minEmitPower = 0.01;
    ambientParticles.maxEmitPower = 0.1;
    ambientParticles.updateSpeed = 0.01;
    ambientParticles.start();

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
