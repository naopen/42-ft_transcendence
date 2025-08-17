import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

// Game constants matching backend
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GAME_DEPTH = 600;  // Increased for better 3D effect
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 15;
const PADDLE_DEPTH = 15;
const BALL_SIZE = 15;
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
    ballZ: GAME_DEPTH / 2,
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

    // Update paddle positions from remote (invert Z-axis to match intuitive controls)
    if (paddle1Ref.current && gameStore.player1) {
      const y = -(gameStore.player1.position - GAME_HEIGHT / 2) * SCALE_FACTOR;
      paddle1Ref.current.position.z = y;
      localGameRef.current.player1Y = gameStore.player1.position;
    }

    if (paddle2Ref.current && gameStore.player2) {
      const y = -(gameStore.player2.position - GAME_HEIGHT / 2) * SCALE_FACTOR;
      paddle2Ref.current.position.z = y;
      localGameRef.current.player2Y = gameStore.player2.position;
    }

    // Update ball position from remote (invert Z-axis to match intuitive controls)
    if (ballRef.current && gameStore.ball) {
      const x = (gameStore.ball.x - GAME_WIDTH / 2) * SCALE_FACTOR;
      const z = -(gameStore.ball.y - GAME_HEIGHT / 2) * SCALE_FACTOR;
      ballRef.current.position.x = x;
      ballRef.current.position.z = z;
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
    localGame.ballZ = GAME_DEPTH / 2;
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
    localGame.ballZ = GAME_DEPTH / 2;
    localGame.ballVelocityX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
    localGame.ballVelocityY = (Math.random() - 0.5) * BALL_SPEED * 0.5;
    localGame.ballVelocityZ = 0; // Start with no vertical movement
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

    // Check if it's two-player mode (arrow keys being used for player 2)
    const isTwoPlayerMode = keysPressed.current.has('arrowup') || keysPressed.current.has('arrowdown');
    
    // Update paddle positions based on keyboard input
    // Player 1 controls (left side) - W/S keys
    if (keysPressed.current.has('w')) {
      localGame.player1Y = Math.max(PADDLE_HEIGHT / 2, localGame.player1Y - PADDLE_SPEED);
    }
    if (keysPressed.current.has('s')) {
      localGame.player1Y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT / 2, localGame.player1Y + PADDLE_SPEED);
    }
    
    // In single player mode, allow arrow keys for player 1 as well
    if (!isTwoPlayerMode) {
      if (keysPressed.current.has('arrowup')) {
        localGame.player1Y = Math.max(PADDLE_HEIGHT / 2, localGame.player1Y - PADDLE_SPEED);
      }
      if (keysPressed.current.has('arrowdown')) {
        localGame.player1Y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT / 2, localGame.player1Y + PADDLE_SPEED);
      }
    } else {
      // Player 2 controls (right side) - for two-player local mode
      if (keysPressed.current.has('arrowup')) {
        localGame.player2Y = Math.max(PADDLE_HEIGHT / 2, localGame.player2Y - PADDLE_SPEED);
      }
      if (keysPressed.current.has('arrowdown')) {
        localGame.player2Y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT / 2, localGame.player2Y + PADDLE_SPEED);
      }
    }

    // Simple AI for player 2 (if single player)
    if (!isTwoPlayerMode) {
      const aiSpeed = PADDLE_SPEED * 0.85; // AI is slightly slower
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
        
        // Add 3D bounce effect
        localGame.ballVelocityZ = (Math.random() - 0.5) * 50; // Bounce up/down
        
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
        
        // Add 3D bounce effect
        localGame.ballVelocityZ = (Math.random() - 0.5) * 50; // Bounce up/down
        
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

    // Ball gravity - gradually return to table level
    if (localGame.ballZ > GAME_DEPTH / 2) {
      localGame.ballVelocityZ -= 2; // Gravity
    } else if (localGame.ballZ < GAME_DEPTH / 2) {
      localGame.ballVelocityZ += 0.5; // Slight upward force when below table
    }
    
    // Ball bounce on table
    if (localGame.ballZ <= GAME_DEPTH / 2 && localGame.ballVelocityZ < 0) {
      localGame.ballVelocityZ = Math.abs(localGame.ballVelocityZ) * 0.8; // Dampen bounce
      localGame.ballZ = GAME_DEPTH / 2;
    }
    
    // Maximum height limit
    if (localGame.ballZ > GAME_DEPTH) {
      localGame.ballZ = GAME_DEPTH;
      localGame.ballVelocityZ = 0;
    }

    // Update 3D positions (invert Z-axis to match intuitive controls)
    if (paddle1Ref.current) {
      paddle1Ref.current.position.z = -(localGame.player1Y - GAME_HEIGHT / 2) * SCALE_FACTOR;
    }
    if (paddle2Ref.current) {
      paddle2Ref.current.position.z = -(localGame.player2Y - GAME_HEIGHT / 2) * SCALE_FACTOR;
    }
    if (ballRef.current) {
      ballRef.current.position.x = (localGame.ballX - GAME_WIDTH / 2) * SCALE_FACTOR;
      ballRef.current.position.z = -(localGame.ballY - GAME_HEIGHT / 2) * SCALE_FACTOR;
      ballRef.current.position.y = (localGame.ballZ - GAME_DEPTH / 2) * SCALE_FACTOR * 0.3 + 0.2;
      
      // Rotate ball for visual effect
      ballRef.current.rotation.x += 0.2;
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
    scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);

    // Camera - Top-down view with slight angle (75 degrees)
    const camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(0, 8, -3), // Position: high above and slightly back
      scene
    );
    camera.setTarget(new BABYLON.Vector3(0, 0, 0)); // Look at center
    camera.fov = 0.9;

    // Lights
    const light1 = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light1.intensity = 0.6;
    light1.diffuse = new BABYLON.Color3(1, 1, 1);
    light1.specular = new BABYLON.Color3(0.5, 0.5, 0.5);
    light1.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

    // Main directional light from above
    const light2 = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(0, -1, 0.2),
      scene
    );
    light2.position = new BABYLON.Vector3(0, 10, -2);
    light2.intensity = 0.8;

    // Create game table (playing field)
    const table = BABYLON.MeshBuilder.CreateBox('table', {
      width: GAME_WIDTH * SCALE_FACTOR,
      height: 0.1,
      depth: GAME_HEIGHT * SCALE_FACTOR,
    }, scene);
    table.position.y = 0;
    
    const tableMaterial = new BABYLON.PBRMaterial('tableMat', scene);
    tableMaterial.albedoColor = new BABYLON.Color3(0.05, 0.05, 0.08);
    tableMaterial.metallic = 0.3;
    tableMaterial.roughness = 0.7;
    tableMaterial.emissiveColor = new BABYLON.Color3(0, 0.4, 0.4);
    tableMaterial.emissiveIntensity = 0.02;
    table.material = tableMaterial;

    // Create table border/frame
    const borderThickness = 0.3;
    const borderHeight = 0.3;
    
    // Top border
    const topBorder = BABYLON.MeshBuilder.CreateBox('topBorder', {
      width: GAME_WIDTH * SCALE_FACTOR + borderThickness * 2,
      height: borderHeight,
      depth: borderThickness,
    }, scene);
    topBorder.position.z = GAME_HEIGHT * SCALE_FACTOR / 2 + borderThickness / 2;
    topBorder.position.y = borderHeight / 2;
    
    // Bottom border
    const bottomBorder = BABYLON.MeshBuilder.CreateBox('bottomBorder', {
      width: GAME_WIDTH * SCALE_FACTOR + borderThickness * 2,
      height: borderHeight,
      depth: borderThickness,
    }, scene);
    bottomBorder.position.z = -GAME_HEIGHT * SCALE_FACTOR / 2 - borderThickness / 2;
    bottomBorder.position.y = borderHeight / 2;

    // Side borders (goals)
    const leftBorder = BABYLON.MeshBuilder.CreateBox('leftBorder', {
      width: borderThickness,
      height: borderHeight,
      depth: GAME_HEIGHT * SCALE_FACTOR,
    }, scene);
    leftBorder.position.x = -GAME_WIDTH * SCALE_FACTOR / 2 - borderThickness / 2;
    leftBorder.position.y = borderHeight / 2;
    
    const rightBorder = BABYLON.MeshBuilder.CreateBox('rightBorder', {
      width: borderThickness,
      height: borderHeight,
      depth: GAME_HEIGHT * SCALE_FACTOR,
    }, scene);
    rightBorder.position.x = GAME_WIDTH * SCALE_FACTOR / 2 + borderThickness / 2;
    rightBorder.position.y = borderHeight / 2;

    const borderMaterial = new BABYLON.PBRMaterial('borderMat', scene);
    borderMaterial.albedoColor = new BABYLON.Color3(0.15, 0.15, 0.2);
    borderMaterial.metallic = 0.8;
    borderMaterial.roughness = 0.3;
    borderMaterial.emissiveColor = new BABYLON.Color3(0, 0.73, 0.74);
    borderMaterial.emissiveIntensity = 0.1;
    
    topBorder.material = borderMaterial;
    bottomBorder.material = borderMaterial;
    
    // Goal areas glow differently
    const goalMaterial = new BABYLON.PBRMaterial('goalMat', scene);
    goalMaterial.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    goalMaterial.metallic = 0.9;
    goalMaterial.roughness = 0.1;
    goalMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0.3);
    goalMaterial.emissiveIntensity = 0.2;
    
    leftBorder.material = goalMaterial;
    rightBorder.material = goalMaterial;

    // Create center line (dashed)
    const dashCount = 15;
    for (let i = 0; i < dashCount; i++) {
      if (i % 2 === 0) {
        const dash = BABYLON.MeshBuilder.CreateBox(`dash${i}`, {
          width: 0.05,
          height: 0.01,
          depth: (GAME_HEIGHT * SCALE_FACTOR) / dashCount,
        }, scene);
        dash.position.x = 0;
        dash.position.y = 0.06;
        dash.position.z = (i - dashCount / 2) * (GAME_HEIGHT * SCALE_FACTOR) / dashCount;
        
        const dashMaterial = new BABYLON.PBRMaterial(`dashMat${i}`, scene);
        dashMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        dashMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        dashMaterial.emissiveIntensity = 0.3;
        dash.material = dashMaterial;
      }
    }

    // Create paddles with better visibility
    const paddleMaterial1 = new BABYLON.PBRMaterial('paddleMat1', scene);
    paddleMaterial1.albedoColor = new BABYLON.Color3(0, 0.8, 0.9);
    paddleMaterial1.emissiveColor = new BABYLON.Color3(0, 0.73, 0.74);
    paddleMaterial1.emissiveIntensity = 0.4;
    paddleMaterial1.metallic = 0.6;
    paddleMaterial1.roughness = 0.3;

    const paddleMaterial2 = new BABYLON.PBRMaterial('paddleMat2', scene);
    paddleMaterial2.albedoColor = new BABYLON.Color3(0.9, 0.4, 0.4);
    paddleMaterial2.emissiveColor = new BABYLON.Color3(1, 0.42, 0.42);
    paddleMaterial2.emissiveIntensity = 0.4;
    paddleMaterial2.metallic = 0.6;
    paddleMaterial2.roughness = 0.3;

    // Player 1 paddle (left) - cyan
    const paddle1 = BABYLON.MeshBuilder.CreateBox('paddle1', {
      width: PADDLE_WIDTH * SCALE_FACTOR,
      height: PADDLE_DEPTH * SCALE_FACTOR,
      depth: PADDLE_HEIGHT * SCALE_FACTOR,
    }, scene);
    paddle1.position.x = -(GAME_WIDTH / 2 - PADDLE_WIDTH * 2) * SCALE_FACTOR;
    paddle1.position.y = PADDLE_DEPTH * SCALE_FACTOR / 2;
    paddle1.position.z = 0;
    paddle1.material = paddleMaterial1;
    paddle1Ref.current = paddle1;

    // Player 2 paddle (right) - red
    const paddle2 = BABYLON.MeshBuilder.CreateBox('paddle2', {
      width: PADDLE_WIDTH * SCALE_FACTOR,
      height: PADDLE_DEPTH * SCALE_FACTOR,
      depth: PADDLE_HEIGHT * SCALE_FACTOR,
    }, scene);
    paddle2.position.x = (GAME_WIDTH / 2 - PADDLE_WIDTH * 2) * SCALE_FACTOR;
    paddle2.position.y = PADDLE_DEPTH * SCALE_FACTOR / 2;
    paddle2.position.z = 0;
    paddle2.material = paddleMaterial2;
    paddle2Ref.current = paddle2;

    // Create ball
    const ball = BABYLON.MeshBuilder.CreateSphere('ball', {
      diameter: BALL_SIZE * SCALE_FACTOR,
      segments: 16,
    }, scene);
    ball.position.x = 0;
    ball.position.y = 0.2;
    ball.position.z = 0;
    
    const ballMaterial = new BABYLON.PBRMaterial('ballMat', scene);
    ballMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
    ballMaterial.emissiveColor = new BABYLON.Color3(1, 0.9, 0.2);
    ballMaterial.emissiveIntensity = 0.6;
    ballMaterial.metallic = 0.8;
    ballMaterial.roughness = 0.2;
    ball.material = ballMaterial;
    ballRef.current = ball;

    // Add shadow for ball
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.addShadowCaster(ball);
    shadowGenerator.useExponentialShadowMap = true;
    table.receiveShadows = true;

    // Add glow effect
    const gl = new BABYLON.GlowLayer('glow', scene);
    gl.intensity = 0.4;

    // Ball trail particles
    const particleSystem = new BABYLON.ParticleSystem('particles', 500, scene);
    particleSystem.particleTexture = new BABYLON.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAUGVYSWZNTQAqAAAACAACARIAAwAAAAEAAQAAh2kABAAAAAEAAAAmAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAAIoAMABAAAAAEAAAAIAAAAAO7OFacAAABwaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGLz4KPC94OnhtcG1ldGE+ChD5uU0AAAB2SURBVBgZY2BgYPgPxP8h+D8U/4fhfzD8H4L/o+H/SPgfBP8H4/9w/B+K/0PwfzT8H4r/A9F/JPwfgv9D8X8w/g/F/6H4Pwz/h+L/UPwfhv9D8X8o/g/D/6H4PxT/h+H/UPwfgv8jw/+h+D8E/4fg/yAMBAC6glRVz2jVhwAAAABJRU5ErkJggg==',
      scene
    );
    particleSystem.emitter = ball;
    particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    particleSystem.color1 = new BABYLON.Color4(1, 0.9, 0.2, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    particleSystem.minSize = 0.01;
    particleSystem.maxSize = 0.04;
    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.3;
    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0, -0.5);
    particleSystem.direction2 = new BABYLON.Vector3(0.5, 0, 0.5);
    particleSystem.minEmitPower = 0.01;
    particleSystem.maxEmitPower = 0.05;
    particleSystem.updateSpeed = 0.01;
    particleSystem.start();

    // Create GUI for score display
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    const scoreText = new GUI.TextBlock();
    scoreText.text = '0 - 0';
    scoreText.color = 'white';
    scoreText.fontSize = 48;
    scoreText.fontWeight = 'bold';
    scoreText.top = '-42%';
    scoreText.shadowColor = 'black';
    scoreText.shadowOffsetX = 2;
    scoreText.shadowOffsetY = 2;
    scoreText.shadowBlur = 4;
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
    countdownText.shadowBlur = 5;
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
      
      // Dynamic ball glow based on speed
      if (ballMaterial && localGame.gameStarted) {
        const speed = Math.sqrt(
          localGame.ballVelocityX ** 2 + 
          localGame.ballVelocityY ** 2
        );
        const normalizedSpeed = speed / MAX_BALL_SPEED;
        ballMaterial.emissiveIntensity = 0.4 + normalizedSpeed * 0.4;
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
