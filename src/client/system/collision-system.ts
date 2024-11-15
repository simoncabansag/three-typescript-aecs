import * as THREE from "three"
import { System } from "./system.ts"
import {
    PlayerData,
    MeshData,
    ColliderData,
    GetComponent,
    UpdateComponent,
} from "./components.ts"

export class CollisionSystem extends System {
    static collisionMask: number = 96 // 6, 5
    static meshComponentId: number = 6
    static collisionComponentId: number = 5
    static playerComponentId: number = 4
    playerBB!: THREE.Box3
    notPlayerBB!: THREE.Box3
    mesh!: MeshData
    player!: PlayerData

    constructor() {
        super()
        this.getEntities(CollisionSystem.collisionMask)
    }

    override Update() {
        for (const e of this.entities) {
            this.mesh = GetComponent(e, 6)
            if (!this.mesh.isLoaded && this.mesh.isPlayer) return
            if (this.mesh.isPlayer) {
                UpdateComponent(e, CollisionSystem.collisionComponentId, {
                    getBoundingBox: new THREE.Box3().setFromObject(
                        this.mesh.mesh
                    ),
                    isPlayer: true,
                })
            } else {
                UpdateComponent(e, CollisionSystem.collisionComponentId, {
                    getBoundingBox: new THREE.Box3().setFromObject(
                        this.mesh.mesh
                    ),
                    isPlayer: false,
                })
            }

            if (this.mesh.isPlayer === true) {
                this.playerBB = GetComponent<ColliderData>(
                    e,
                    CollisionSystem.collisionComponentId
                ).getBoundingBox
                this.playerBB
                    .copy(this.mesh.mesh.geometry.boundingBox!)
                    .applyMatrix4(this.mesh.mesh.matrixWorld)
                this.player = GetComponent(e, CollisionSystem.playerComponentId)
            } else {
                this.notPlayerBB = GetComponent<ColliderData>(
                    e,
                    CollisionSystem.collisionComponentId
                ).getBoundingBox
            }

            if (typeof this.playerBB === "undefined") continue
            if (this.mesh.isPlayer) {
                if (this.playerBB.intersectsBox(this.notPlayerBB)) {
                    UpdateComponent(e, 4, {
                        crouchHeight: 1,
                        isGrounded: true,
                        height: 1.73,
                        isAttacking: false,
                        jumpHeight: 1.5,
                        name: "",
                        speed: 3,
                        sprintSpeedMultiplier: 2,
                    })
                    this.player = GetComponent(e, 4)
                } else {
                    UpdateComponent(e, 4, {
                        crouchHeight: 1,
                        isGrounded: false,
                        height: 1.73,
                        isAttacking: false,
                        jumpHeight: 1.5,
                        name: "",
                        speed: 3,
                        sprintSpeedMultiplier: 2,
                    })
                }
            }
        }
    }
}
