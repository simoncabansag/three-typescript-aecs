import { System } from "./system.ts"
import { MeshData, GetComponent } from "./components.ts"

export class MeshSystem extends System {
    static meshComponentId: number = 6
    static meshMask: number = 1 << MeshSystem.meshComponentId

    constructor() {
        super()
        this.Init()
    }

    override Init() {
        this.getEntities(MeshSystem.meshMask)

        for (const e of this.entities) {
            const meshComponent: MeshData = GetComponent(
                e,
                MeshSystem.meshComponentId
            )

            if (meshComponent.init) meshComponent.init()
            if (meshComponent?.mesh) {
                meshComponent?.scene?.add(meshComponent.mesh)
            }
        }
    }
}
