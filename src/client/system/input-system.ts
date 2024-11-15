import * as THREE from "three"
import { System } from "./system.ts"
import { entity, EntityId } from "./entity.ts"
import { PlayerInputData, GetComponent, UpdateComponent } from "./components.ts"

export class PlayerInputSystem extends System {
    static playerInputComponentId: number = 3
    static playerInputMask: number =
        1 << PlayerInputSystem.playerInputComponentId
    keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        shift: false,
    }
    playerInput!: PlayerInputData
    raycaster!: THREE.Raycaster

    constructor() {
        super()
        this.keys
        this.Init()
    }

    override Init() {
        this.getEntities(PlayerInputSystem.playerInputComponentId)

        for (const e of this.entities) {
            this.playerInput =
                GetComponent(e, PlayerInputSystem.playerInputComponentId) ??
                entity.Component

            this.raycaster = new THREE.Raycaster()
            document.addEventListener("mouseup", (event) => {
                this.onMouseUp(e, event, this?.playerInput?.camera), false
            })

            document.addEventListener("keydown", (event) => {
                this.onKeyDown(e, event), false
            })
            document.addEventListener("keyup", (event) => {
                this.onKeyUp(e, event), false
            })
        }
    }

    onMouseUp(_entityId: EntityId, e: MouseEvent, cam: THREE.Camera) {
        if (cam == null) throw new Error("cam is null or undefined")
        const rect = document
            ?.getElementById("threejs")
            ?.getBoundingClientRect()
        if (rect == null) throw new Error("rect is null or undefined")
        const pos = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            ((e.clientY - rect.top) / rect.height) * -2 + 1
        )

        this.raycaster?.setFromCamera(pos, cam)

        const ray = new THREE.Ray()
        ray.origin.setFromMatrixPosition(cam.matrixWorld)
    }

    onKeyDown(entityId: EntityId, e: KeyboardEvent) {
        switch (e.key) {
            case "w":
                this.keys.forward = true
                break
            case "a":
                this.keys.left = true
                break
            case "s":
                this.keys.backward = true
                break
            case "d":
                this.keys.right = true
                break
            case "Shift":
                this.keys.shift = true
                break
        }

        UpdateComponent(entityId, PlayerInputSystem.playerInputComponentId, {
            keys: this.keys,
        })
    }

    onKeyUp(entityId: EntityId, e: KeyboardEvent) {
        switch (e.key) {
            case "w":
                this.keys.forward = false
                break
            case "a":
                this.keys.left = false
                break
            case "s":
                this.keys.backward = false
                break
            case "d":
                this.keys.right = false
                break
            case "Shift":
                this.keys.shift = false
                break
        }
        UpdateComponent(entityId, PlayerInputSystem.playerInputComponentId, {
            keys: this.keys,
        })
    }
}
