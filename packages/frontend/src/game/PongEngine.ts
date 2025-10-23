import {
  ActionManager,
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  ExecuteCodeAction,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"

export interface PongGameConfig {
  canvas: HTMLCanvasElement
  player1Name: string
  player2Name: string
  onScoreUpdate?: (player1Score: number, player2Score: number) => void
  onGameEnd?: (winnerId: 1 | 2) => void
  maxScore?: number
}

export interface GameState {
  player1Score: number
  player2Score: number
  isPlaying: boolean
  isPaused: boolean
  winner: 1 | 2 | null
}

export class PongEngine {
  private engine: Engine
  private scene: Scene
  private camera: ArcRotateCamera

  // Game objects
  private paddle1: Mesh
  private paddle2: Mesh
  private ball: Mesh
  private field: Mesh

  // Game state
  private state: GameState = {
    player1Score: 0,
    player2Score: 0,
    isPlaying: false,
    isPaused: false,
    winner: null,
  }

  // Game config
  private config: PongGameConfig
  private maxScore: number

  // Physics
  private ballVelocity: Vector3 = new Vector3(0, 0, 0)
  private readonly BALL_SPEED = 0.3
  private readonly PADDLE_SPEED = 0.5
  private readonly FIELD_WIDTH = 20
  private readonly FIELD_LENGTH = 30
  private readonly PADDLE_HEIGHT = 4
  private readonly PADDLE_WIDTH = 0.5
  private readonly PADDLE_DEPTH = 1

  // Input state
  private keys: Record<string, boolean> = {}

  constructor(config: PongGameConfig) {
    this.config = config
    this.maxScore = config.maxScore || 11

    // Create engine and scene
    this.engine = new Engine(config.canvas, true)
    this.scene = new Scene(this.engine)
    this.scene.clearColor = new Color4(0.05, 0.05, 0.1, 1)

    // Setup camera
    this.camera = new ArcRotateCamera(
      "camera",
      0,
      Math.PI / 3,
      40,
      Vector3.Zero(),
      this.scene,
    )
    this.camera.attachControl(config.canvas, true)
    this.camera.lowerRadiusLimit = 30
    this.camera.upperRadiusLimit = 60

    // Disable keyboard controls to avoid conflict with paddle controls
    this.camera.inputs.remove(this.camera.inputs.attached.keyboard)

    // Setup lighting
    new HemisphericLight("light", new Vector3(0, 1, 0), this.scene)

    // Create game objects
    this.field = this.createField()
    this.paddle1 = this.createPaddle(1)
    this.paddle2 = this.createPaddle(2)
    this.ball = this.createBall()

    // Create walls
    this.createWalls()

    // Setup input
    this.setupInput()

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.state.isPlaying && !this.state.isPaused) {
        this.updateGame()
      }
      this.scene.render()
    })

    // Handle window resize
    window.addEventListener("resize", () => {
      this.engine.resize()
    })
  }

  private createField(): Mesh {
    const field = MeshBuilder.CreateGround(
      "field",
      { width: this.FIELD_WIDTH, height: this.FIELD_LENGTH },
      this.scene,
    )

    const material = new StandardMaterial("fieldMat", this.scene)
    material.diffuseColor = new Color3(0.1, 0.15, 0.2)
    material.specularColor = new Color3(0, 0, 0)
    field.material = material

    return field
  }

  private createPaddle(player: 1 | 2): Mesh {
    const paddle = MeshBuilder.CreateBox(
      `paddle${player}`,
      {
        height: this.PADDLE_HEIGHT,
        width: this.PADDLE_WIDTH,
        depth: this.PADDLE_DEPTH,
      },
      this.scene,
    )

    const material = new StandardMaterial(`paddleMat${player}`, this.scene)
    material.diffuseColor =
      player === 1 ? new Color3(0, 0.73, 0.73) : new Color3(0.93, 0.29, 0.29)
    material.emissiveColor =
      player === 1 ? new Color3(0, 0.2, 0.2) : new Color3(0.2, 0, 0)
    paddle.material = material

    // Position paddles at opposite ends
    const zPosition =
      player === 1 ? -this.FIELD_LENGTH / 2 + 2 : this.FIELD_LENGTH / 2 - 2
    paddle.position = new Vector3(0, this.PADDLE_HEIGHT / 2, zPosition)

    return paddle
  }

  private createBall(): Mesh {
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.8 }, this.scene)

    const material = new StandardMaterial("ballMat", this.scene)
    material.diffuseColor = new Color3(1, 1, 1)
    material.emissiveColor = new Color3(0.5, 0.5, 0.5)
    ball.material = material

    ball.position = new Vector3(0, 0.4, 0)

    return ball
  }

  private createWalls(): void {
    const wallMaterial = new StandardMaterial("wallMat", this.scene)
    wallMaterial.diffuseColor = new Color3(0.2, 0.25, 0.3)
    wallMaterial.alpha = 0.3

    // Left wall
    const leftWall = MeshBuilder.CreateBox(
      "leftWall",
      { height: 5, width: 1, depth: this.FIELD_LENGTH },
      this.scene,
    )
    leftWall.position = new Vector3(-this.FIELD_WIDTH / 2, 2.5, 0)
    leftWall.material = wallMaterial

    // Right wall
    const rightWall = MeshBuilder.CreateBox(
      "rightWall",
      { height: 5, width: 1, depth: this.FIELD_LENGTH },
      this.scene,
    )
    rightWall.position = new Vector3(this.FIELD_WIDTH / 2, 2.5, 0)
    rightWall.material = wallMaterial
  }

  private setupInput(): void {
    this.scene.actionManager = new ActionManager(this.scene)

    // Key down
    this.scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        this.keys[evt.sourceEvent.key.toLowerCase()] = true
      }),
    )

    // Key up
    this.scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        this.keys[evt.sourceEvent.key.toLowerCase()] = false
      }),
    )
  }

  private updateGame(): void {
    // Update paddles
    this.updatePaddles()

    // Update ball
    this.updateBall()

    // Check collisions
    this.checkCollisions()
  }

  private updatePaddles(): void {
    const deltaX = this.PADDLE_SPEED
    const maxX = this.FIELD_WIDTH / 2 - 1

    // Player 1 controls (A/D)
    if (this.keys["a"] && this.paddle1.position.x > -maxX) {
      this.paddle1.position.x -= deltaX
    }
    if (this.keys["d"] && this.paddle1.position.x < maxX) {
      this.paddle1.position.x += deltaX
    }

    // Player 2 controls (Arrow Left/Right)
    if (this.keys["arrowleft"] && this.paddle2.position.x > -maxX) {
      this.paddle2.position.x -= deltaX
    }
    if (this.keys["arrowright"] && this.paddle2.position.x < maxX) {
      this.paddle2.position.x += deltaX
    }
  }

  private updateBall(): void {
    this.ball.position.addInPlace(this.ballVelocity)

    // Wall collision (left/right)
    const ballX = this.ball.position.x
    const maxX = this.FIELD_WIDTH / 2 - 0.5

    if (ballX <= -maxX || ballX >= maxX) {
      this.ballVelocity.x *= -1
      this.ball.position.x = ballX <= -maxX ? -maxX : maxX
    }
  }

  private checkCollisions(): void {
    const ballPos = this.ball.position
    const ballZ = ballPos.z
    const ballX = ballPos.x

    // Check if ball passed paddle 1 (player 1 missed)
    if (ballZ < -this.FIELD_LENGTH / 2) {
      this.handleScore(2)
      return
    }

    // Check if ball passed paddle 2 (player 2 missed)
    if (ballZ > this.FIELD_LENGTH / 2) {
      this.handleScore(1)
      return
    }

    // Paddle 1 collision
    const paddle1Z = this.paddle1.position.z
    const paddle1X = this.paddle1.position.x
    if (
      Math.abs(ballZ - paddle1Z) < 1 &&
      Math.abs(ballX - paddle1X) < this.PADDLE_HEIGHT / 2
    ) {
      this.ballVelocity.z *= -1.05 // Increase speed slightly
      this.ball.position.z = paddle1Z + 1

      // Add horizontal spin based on where ball hits paddle
      const hitOffset = (ballX - paddle1X) / (this.PADDLE_HEIGHT / 2)
      this.ballVelocity.x = hitOffset * this.BALL_SPEED * 0.5
    }

    // Paddle 2 collision
    const paddle2Z = this.paddle2.position.z
    const paddle2X = this.paddle2.position.x
    if (
      Math.abs(ballZ - paddle2Z) < 1 &&
      Math.abs(ballX - paddle2X) < this.PADDLE_HEIGHT / 2
    ) {
      this.ballVelocity.z *= -1.05
      this.ball.position.z = paddle2Z - 1

      const hitOffset = (ballX - paddle2X) / (this.PADDLE_HEIGHT / 2)
      this.ballVelocity.x = hitOffset * this.BALL_SPEED * 0.5
    }
  }

  private handleScore(scorer: 1 | 2): void {
    if (scorer === 1) {
      this.state.player1Score++
    } else {
      this.state.player2Score++
    }

    // Notify score update
    if (this.config.onScoreUpdate) {
      this.config.onScoreUpdate(
        this.state.player1Score,
        this.state.player2Score,
      )
    }

    // Check for winner
    if (this.state.player1Score >= this.maxScore) {
      this.endGame(1)
    } else if (this.state.player2Score >= this.maxScore) {
      this.endGame(2)
    } else {
      this.resetBall()
    }
  }

  private resetBall(): void {
    this.ball.position = new Vector3(0, 0.4, 0)

    // Random direction
    const angle = (Math.random() - 0.5) * Math.PI * 0.4
    const direction = Math.random() > 0.5 ? 1 : -1

    this.ballVelocity = new Vector3(
      Math.sin(angle) * this.BALL_SPEED,
      0,
      Math.cos(angle) * this.BALL_SPEED * direction,
    )
  }

  private endGame(winner: 1 | 2): void {
    this.state.isPlaying = false
    this.state.winner = winner

    // Notify game end
    if (this.config.onGameEnd) {
      this.config.onGameEnd(winner)
    }
  }

  /**
   * Start the game
   */
  public start(): void {
    if (this.state.isPlaying) {
      return
    }

    this.state = {
      player1Score: 0,
      player2Score: 0,
      isPlaying: true,
      isPaused: false,
      winner: null,
    }

    this.resetBall()
  }

  /**
   * Pause the game
   */
  public pause(): void {
    this.state.isPaused = true
  }

  /**
   * Resume the game
   */
  public resume(): void {
    this.state.isPaused = false
  }

  /**
   * Get current game state
   */
  public getState(): GameState {
    return { ...this.state }
  }

  /**
   * Dispose engine and scene
   */
  public dispose(): void {
    this.scene.dispose()
    this.engine.dispose()
  }
}
