import * as THREE from "three"
import { System } from "./system.ts"
import {
    PositionData,
    VelocityData,
    RotationData,
    PlayerData,
    PlayerInputData,
    ColliderData,
    MeshData,
    GetComponent,
    Gravity,
    Time,
} from "./components.ts"

export class MovementSystem extends System {
    static componentsMask = 127
    isGrounded!: boolean
    deceleration: THREE.Vector3
    acceleration: THREE.Vector3
    position!: PositionData
    velocity!: VelocityData
    rotation!: RotationData
    input!: PlayerInputData
    play!: PlayerData
    collider!: ColliderData
    mesh!: MeshData

    constructor() {
        super()
        this.deceleration = new THREE.Vector3(-0.0005, -1.0, -5.0)
        this.acceleration = new THREE.Vector3(1, 0.125, 50.0)
        this.getEntities(MovementSystem.componentsMask)

        for (const e of this.entities) {
            this.position = GetComponent(e, 0)
            this.velocity = GetComponent(e, 1)
            this.rotation = GetComponent(e, 2)
            this.input = GetComponent(e, 3)
            this.play = GetComponent(e, 4)
            this.collider = GetComponent(e, 5)
            this.mesh = GetComponent(e, 6)
        }
    }

    override Update() {
        for (const e of this.entities) {
            this.mesh = GetComponent(e, 6)
            this.input = GetComponent(e, 3)
            this.play = GetComponent(e, 4)
            if (!this.mesh.isLoaded && this.mesh.isPlayer) return

            this.Move()
            this.Gravity()
        }
    }

    Move() {
        const frameDeceleration = new THREE.Vector3(
            this.velocity.velocity.x * this?.deceleration?.x,
            this.velocity.velocity.y * this?.deceleration?.y,
            this.velocity.velocity.z * this?.deceleration?.z
        )

        frameDeceleration.multiplyScalar(Time.deltaTime)

        frameDeceleration.z =
            Math.sign(frameDeceleration.z) *
            Math.min(
                Math.abs(frameDeceleration.z),
                Math.abs(this.velocity.velocity.z)
            )

        frameDeceleration.y =
            Math.sign(frameDeceleration.y) *
            Math.min(
                Math.abs(frameDeceleration.y),
                Math.abs(this.velocity.velocity.y)
            )

        this.velocity.velocity.add(frameDeceleration)

        const controlObject: THREE.Object3D = this.mesh.mesh
        const acc: THREE.Vector3 = this.acceleration.clone()
        const quart = new THREE.Quaternion()
        const angle = new THREE.Vector3()

        const rotation: THREE.Quaternion = controlObject.quaternion.clone()

        if (this.input.keys.forward) {
            this.velocity.velocity.z += acc.z * Time.deltaTime
        }

        if (this.input.keys.backward) {
            this.velocity.velocity.z -= acc.z * Time.deltaTime
        }

        if (this.input?.keys.left) {
            angle.set(0, 1, 0)
            quart.setFromAxisAngle(
                angle,
                this.rotation.rotationMultiplier *
                    Math.PI *
                    Time.deltaTime *
                    this.acceleration.y
            )
            rotation.multiply(quart)
        }
        if (this.input.keys.right) {
            angle.set(0, 1, 0)
            quart.setFromAxisAngle(
                angle,
                this.rotation.rotationMultiplier *
                    -Math.PI *
                    Time.deltaTime *
                    this.acceleration.y
            )
            rotation.multiply(quart)
        }

        controlObject?.quaternion?.copy(rotation)
        const oldPosition = new THREE.Vector3()

        if (controlObject.position) {
            oldPosition.copy(controlObject.position)
        }

        const forward = new THREE.Vector3(0, 0, 1)
        if (typeof controlObject?.quaternion !== "undefined") {
            forward.applyQuaternion(controlObject.quaternion)
            forward.normalize()
            forward.multiplyScalar(this.velocity.velocity.z * Time.deltaTime)
        }

        const sideways = new THREE.Vector3(1, 0, 0)
        if (typeof controlObject?.quaternion !== "undefined") {
            sideways.applyQuaternion(controlObject.quaternion)
            sideways.normalize()
            sideways.multiplyScalar(this.velocity.velocity.x * Time.deltaTime)
        }

        const vert = new THREE.Vector3(0, 1, 0)
        if (typeof controlObject?.quaternion !== "undefined") {
            vert.normalize()
            vert.multiplyScalar(this.velocity.velocity.y * Time.deltaTime)
        }

        const pos = controlObject?.position?.clone()
        pos?.add(forward)
        pos?.add(sideways)
        pos?.add(vert)

        if (typeof pos !== "undefined") {
            controlObject?.position?.copy(pos)
            this.position.position?.copy(pos)
        }
    }

    Gravity() {
        if (this.play.isGrounded) {
            if (this.velocity.velocity.y < 0.0) {
                this.velocity.velocity.y = 0.0
                this.mesh.mesh.position.y = 0.0 // avoid clipping/sinking
            }
        }
        if (this.velocity.velocity.y < this.velocity.terminalVelocity) {
            this.velocity.velocity.y += Gravity * Time.deltaTime
        }
    }
}
