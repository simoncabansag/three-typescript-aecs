import * as THREE from "three"
import {
    entity,
    Component,
    EntityId,
    ComponentId,
    EntityRecord,
} from "./entity.ts"
import { entity_manager, Archetype } from "./entity-manager.ts"

export const Gravity = -9.8

export const Time = class Time {
    static #deltaTime = 0

    static get deltaTime(): number {
        return Time.#deltaTime
    }

    static set deltaTime(t: number) {
        Time.#deltaTime = t
    }
}

export function AddComponent(e: EntityId, componentId: ComponentId) {
    const record: EntityRecord = {
        archetype:
            entity_manager.Archetype.entity_index.get(e)?.archetype ??
            new entity_manager.Archetype(0b0),
        row: e,
    }

    let newType = 0b0 // empty bitset
    if (record.archetype.type > 0) {
        newType = newType | record.archetype.type
    }
    newType = newType | (1 << componentId)

    let newArchetype: Archetype | undefined =
        entity_manager.Archetype.archetype_index.get(newType)

    if (typeof newArchetype === "undefined") {
        newArchetype = new entity_manager.Archetype(newType)

        entity_manager.Archetype.archetype_index.set(newType, newArchetype)
    }

    entity_manager.Archetype.entity_index.set(e, {
        archetype: newArchetype,
        row: e,
    })

    newArchetype?.edges.set(
        componentId,
        new entity_manager.ArchetypeEdge(record.archetype, newArchetype)
    )

    let bitIndex = 0
    let num = newType
    while (num > 0) {
        // brian kernighans algorithm if type has a component
        if (num & 1) {
            if (!newArchetype.components.has(bitIndex)) {
                newArchetype.components.set(bitIndex, new Map())
            }
            newArchetype.components
                .get(bitIndex)
                ?.set(e, new (_components[bitIndex] ?? entity.Component)({}))
        } // data set to object literal at first
        num >>= 1 // shifts all bits to the right, effectively deleting leftmost bit
        bitIndex++
    }
}

export function GetComponent<T>(
    entityId: EntityId,
    componentId: ComponentId
): ComponentData<T> {
    const record = entity_manager.Archetype.entity_index.get(entityId)

    const c: ComponentData<T> = record?.archetype?.components
        ?.get(componentId)
        ?.get(record.row)
    if (typeof c === "undefined") {
        throw new Error("component does not exist on entity")
    }
    return c
}

export function UpdateComponent<T>(
    entityId: EntityId,
    componentId: any,
    data: T
) {
    const record = entity_manager.Archetype.entity_index.get(entityId) ?? null
    if (record == null) {
        throw new Error("entity does not exist")
    }

    record?.archetype?.components
        ?.get(componentId)
        ?.set(
            record.row,
            new (_components[componentId] ?? entity.Component)(data)
        )
}

export type ComponentData<T> = T & Component

export type PositionData = ComponentData<{ position: THREE.Vector3 }>

export type VelocityData = ComponentData<{
    velocity: THREE.Vector3
    acceleration: THREE.Vector3
    deceleration: THREE.Vector3
    rotationVelocity: THREE.Vector3
    terminalVelocity: number
}>

export type RotationData = ComponentData<{
    rotation: THREE.Quaternion
    rotationMultiplier: number
}>

export type PlayerInputData = ComponentData<{
    bindings: { any?: boolean }
    camera: THREE.Camera
    keys: {
        forward: boolean
        backward: boolean
        left: boolean
        right: boolean
        shift: boolean
    }
}>

export type PlayerData = ComponentData<{
    name: string
    speed: number
    height: number
    crouchHeight: number
    jumpHeight: number
    sprintSpeedMultiplier: number
    isGrounded: boolean
    isAttacking: boolean
}>

export type ColliderData = ComponentData<{
    getBoundingBox: THREE.Box3
    isPlayer: boolean
}>

export type MeshData = ComponentData<{
    mesh: THREE.Mesh
    scene: THREE.Scene
    init: Function
    isPlayer: boolean
    isLoaded: boolean
}>

class Position extends entity.Component {
    #position

    get position(): THREE.Vector3 {
        return this.#position
    }

    constructor(obj: PositionData) {
        super()
        this.#position = obj?.position
    }
}

class Rotation extends entity.Component {
    #rotation
    #rotationMultiplier

    get rotation(): THREE.Quaternion {
        return this.#rotation
    }
    get rotationMultiplier(): number {
        return this.#rotationMultiplier
    }

    constructor(obj: RotationData) {
        super()
        this.#rotation = obj?.rotation
        this.#rotationMultiplier = obj?.rotationMultiplier
    }
}

class Velocity extends entity.Component {
    #velocity
    #acceleration
    #deceleration
    #rotationVelocity
    #terminalVelocity

    get velocity(): THREE.Vector3 {
        return this.#velocity
    }
    get acceleration(): THREE.Vector3 {
        return this.#acceleration
    }
    get deceleration(): THREE.Vector3 {
        return this.#deceleration
    }
    get rotationVelocity(): THREE.Vector3 {
        return this.#rotationVelocity
    }
    get terminalVelocity(): number {
        return this.#terminalVelocity
    }

    constructor(obj: VelocityData) {
        super()
        this.#velocity = obj?.velocity
        this.#acceleration = obj?.acceleration
        this.#deceleration = obj?.deceleration
        this.#rotationVelocity = obj?.rotationVelocity
        this.#terminalVelocity = obj?.terminalVelocity
    }
}

class PlayerInput extends entity.Component {
    #bindings
    #camera
    #keys

    get bindings(): { any?: boolean } {
        return this.#bindings
    }
    get camera(): THREE.Camera {
        return this.#camera
    }
    get keys(): {
        forward: boolean
        backward: boolean
        left: boolean
        right: boolean
        shift: boolean
    } {
        return this.#keys
    }

    constructor(obj: PlayerInputData) {
        super()
        this.#bindings = obj?.bindings
        this.#camera = obj?.camera
        this.#keys = obj?.keys
    }
}

class Player extends entity.Component {
    #name
    #speed
    #height
    #crouchHeight
    #jumpHeight
    #sprintSpeedMultiplier
    #isGrounded
    #isAttacking

    get name(): string {
        return this.#name
    }
    get speed(): number {
        return this.#speed
    }
    get height(): number {
        return this.#height
    }
    get crouchHeight(): number {
        return this.#crouchHeight
    }
    get jumpHeight(): number {
        return this.#jumpHeight
    }
    get sprintSpeedMultiplier(): number {
        return this.#sprintSpeedMultiplier
    }
    get isGrounded(): boolean {
        return this.#isGrounded
    }
    get isAttacking(): boolean {
        return this.#isAttacking
    }

    constructor(obj: PlayerData) {
        super()
        this.#name = obj?.name
        this.#speed = obj?.speed
        this.#height = obj?.height
        this.#crouchHeight = obj?.crouchHeight
        this.#jumpHeight = obj?.jumpHeight
        this.#sprintSpeedMultiplier = obj?.sprintSpeedMultiplier
        this.#isGrounded = obj?.isGrounded
        this.#isAttacking = obj?.isAttacking
    }
}

class Collider extends entity.Component {
    #isPlayer
    #getBoundingBox

    get isPlayer(): boolean {
        return this.#isPlayer
    }
    get getBoundingBox(): {} {
        return this.#getBoundingBox
    }

    constructor(obj: ColliderData) {
        super()
        this.#isPlayer = obj?.isPlayer
        this.#getBoundingBox = obj?.getBoundingBox
    }
}

class Mesh extends entity.Component {
    #mesh
    #init
    #scene
    #isPlayer
    #isLoaded

    get mesh(): THREE.Mesh {
        return this.#mesh
    }
    get init(): Function {
        return this.#init
    }
    get scene(): THREE.Scene {
        return this.#scene
    }
    get isPlayer(): boolean {
        return this.#isPlayer
    }
    get isLoaded(): boolean {
        return this.#isLoaded
    }

    constructor(obj: MeshData) {
        super()
        this.#mesh = obj?.mesh
        this.#init = obj?.init
        this.#scene = obj?.scene
        this.#isPlayer = obj?.isPlayer
        this.#isLoaded = obj?.isLoaded
    }
}

export const _components: any = [
    Position, // 0
    Velocity, // 1
    Rotation, // 2
    PlayerInput, // 3
    Player, // 4
    Collider, // 5
    Mesh, // 6
]
