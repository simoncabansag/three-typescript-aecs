import * as THREE from "three"
import { entity } from "./system/entity.ts"
import { entity_manager } from "./system/entity-manager.ts"
import { CollisionSystem } from "./system/collision-system.ts"
import { System } from "./system/system.ts"
import { MeshSystem } from "./system/mesh-system.ts"
import { PlayerInputSystem } from "./system/input-system.ts"
import { MovementSystem } from "./system/movement-system.ts"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import {
    _components,
    AddComponent,
    UpdateComponent,
    Time,
} from "./system/components.ts"

class AECS {
    playerMesh: any
    threejs!: THREE.WebGLRenderer
    systems!: System[]
    lastUpdate!: number
    scene!: THREE.Scene
    entityManager!: InstanceType<typeof entity_manager.EntityManager>
    camera!: THREE.PerspectiveCamera
    previousRAF!: number

    constructor(serverAssets: any) {
        this.playerMesh = serverAssets?.Mesh
        this.Initialize()
    }

    Initialize() {
        this.threejs = new THREE.WebGLRenderer({
            antialias: true,
        })

        this.systems = []
        this.lastUpdate = 0
        this.threejs.setPixelRatio(window.devicePixelRatio)
        this.threejs.setSize(window.innerWidth, window.innerHeight)
        this.threejs.domElement.id = "threejs"
        document.getElementById("canvas")?.appendChild(this.threejs.domElement)

        this.scene = new THREE.Scene()
        this.entityManager = new entity_manager.EntityManager()
        const fov = 60
        const aspect = 1920 / 1080 // window.innerWidth / window.innerHeight
        const near = 1.0 // performance
        const far = 10000.0 // performance
        this.scene.background = new THREE.Color(0x006992)
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
        this.camera.position.set(0, 3, 5)
        const controls = new OrbitControls(this.camera, this.threejs.domElement)
        controls.update()
        this.LoadLight()
        this.LoadEntities()
        this.LoadPlayer()
        this.LoadSystems()
        this.previousRAF
        this.RAF()
    }

    LoadEntities() {
        const cube = new entity.Entity()
        AddComponent(cube.EntityId, 6)
        AddComponent(cube.EntityId, 5)
        UpdateComponent(cube.EntityId, 6, {
            mesh: new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.8, 0.8),
                new THREE.MeshPhongMaterial({ color: 0xf70000 })
            ),
            init: function () {
                this.mesh.receiveShadow = true
                this.mesh.name = "exampleCube"
                this.mesh.position.set(2, 0.4, 0)
            },
            scene: this.scene,
            isPlayer: false,
        })
        UpdateComponent(cube.EntityId, 5, {
            isPlayer: false,
            getBoundingBox: undefined,
        })

        const plane = new entity.Entity()
        AddComponent(plane.EntityId, 6)
        AddComponent(plane.EntityId, 5)
        UpdateComponent(plane.EntityId, 6, {
            mesh: new THREE.Mesh(
                new THREE.PlaneGeometry(5, 5),
                new THREE.MeshStandardMaterial({
                    color: 0x1e601c, // green
                    // wireframe: true,
                })
            ),
            init: function () {
                this.mesh.rotateX(-Math.PI / 2) // makes the plane flat on x
                this.mesh.receiveShadow = true
                this.mesh.name = "World"

                this.mesh.position.set(0, 0, 0)
            },
            scene: this.scene,
            isPlayer: false,
        })
        UpdateComponent(plane.EntityId, 5, {
            isPlayer: false,
            getBoundingBox: undefined,
        })

        const inputManager = new entity.Entity()
        AddComponent(inputManager.EntityId, 3)
        this.entityManager?.Add(plane, "Plane")
        this.entityManager?.Add(cube, "Cube")
        this.entityManager?.Add(inputManager, "InputManager")

        console.log(this.entityManager?._entitiesMap)
    }

    LoadLight() {
        let light = new THREE.DirectionalLight(0xfcffb5, 4.5)

        light.position.set(0, 20, 10)
        light.castShadow = true
        light.shadow.bias = -0.001
        light.shadow.mapSize.width = 10 // 4096
        light.shadow.mapSize.height = 10 // 4096
        light.shadow.camera.near = 0.1
        light.shadow.camera.far = 1000.0
        light.shadow.camera.left = 100
        light.shadow.camera.right = -100
        light.shadow.camera.top = 100
        light.shadow.camera.bottom = -100
        this.scene?.add(light)
    }

    LoadPlayer() {
        const player = new entity.Entity()
        AddComponent(player.EntityId, 0)
        AddComponent(player.EntityId, 1)
        AddComponent(player.EntityId, 2)
        AddComponent(player.EntityId, 3)
        AddComponent(player.EntityId, 4)
        AddComponent(player.EntityId, 5)
        AddComponent(player.EntityId, 6)

        UpdateComponent(player.EntityId, 6, {
            isPlayer: true,
            scene: this.scene,
            isLoaded: true,
            mesh: this.playerMesh,
            init: function () {
                this.mesh.position.set(0, 0, 0) // set spawn
                this.mesh.scale.setScalar(0.3) // set scale
            },
        }) // mesh
        UpdateComponent(player.EntityId, 5, {
            isPlayer: true,
            getBoundingBox: undefined,
        }) // collider
        UpdateComponent(player.EntityId, 1, {
            velocity: new THREE.Vector3(0, 0, 0),
            acceleration: new THREE.Vector3(0, 0, 0),
            deceleration: new THREE.Vector3(0, 0, 0),
            rotationVelocity: new THREE.Vector3(0, 0, 0),
            terminalVelocity: 53,
        }) // velocity
        UpdateComponent(player.EntityId, 3, {
            bindings: { forward: true },
            camera: this.camera,
            keys: {
                forward: false,
                backward: false,
                left: false,
                right: false,
                shift: false,
            },
        }) // playerinput
        UpdateComponent(player.EntityId, 4, {
            name: "",
            speed: 3,
            height: 1.73,
            crouchHeight: 1,
            jumpHeight: 1.5,
            sprintSpeedMultiplier: 2,
            isGrounded: false,
            isAttacking: false,
        }) // player
        UpdateComponent(player.EntityId, 2, {
            rotation: new THREE.Quaternion(0, 0, 0),
            rotationMultiplier: 10,
        }) // rotation

        this.entityManager?.Add(player, "player")
    }

    LoadSystems() {
        this.systems?.push(new MeshSystem())
        this.systems?.push(new CollisionSystem())
        this.systems?.push(new PlayerInputSystem())
        this.systems?.push(new MovementSystem())
    }

    OnWindowResize() {
        this.camera?.updateProjectionMatrix()
        this.threejs?.setSize(window.innerWidth, window.innerHeight)
    }

    RAF() {
        requestAnimationFrame((t) => {
            if (this.scene == null || this.camera == null) return
            if (this.previousRAF === null) {
                this.previousRAF = t
            }

            this.threejs?.render(this.scene, this.camera)
            const pRAF = this.previousRAF ?? 0
            this.Step(t - pRAF)
            this.previousRAF = t
            this.RAF()
        })
    }

    Step(timeElapsed: number) {
        const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001)
        if (Math.abs(timeElapsedS - (this.lastUpdate ?? 0)) >= 0.0021) {
            Time.deltaTime = timeElapsedS
            this.lastUpdate = timeElapsedS
        }
        this.systems?.forEach((s) => {
            s.Update()
        })
    }
}

async function LoadPlayerModel() {
    return await new Promise((resolve, reject) => {
        new THREE.ObjectLoader().load(
            "/perry.json",
            (p) => {
                resolve(p)
            },
            () => {},
            (e) => {
                console.error(e)
                reject(e)
            }
        )
    })
}

const serverAssets: { [key: string]: any } = {}
await LoadPlayerModel().then((mesh: any) => {
    serverAssets[mesh.constructor.name] = mesh
    new AECS(serverAssets)
})
