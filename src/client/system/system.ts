import { entity_manager } from "./entity-manager.ts"

export class System {
    ai: Map<any, any>
    entities: Set<import("./entity.ts").EntityId>

    constructor() {
        this.ai = entity_manager.Archetype.archetype_index
        this.entities = new Set()
    }

    // instead of O(n^2) - to improve find the largest archetype along the edge
    getEntities(mask: number) {
        const firstBit = Math.log2(mask & -mask) // in mask find the first position where a bit is on

        // loop through all bitmask types
        for (const [bitmask, archetype] of this.ai) {
            if ((bitmask & mask) === mask) {
                const componentsMap = archetype.components?.get(firstBit)
                if (componentsMap) {
                    for (const [k, _] of componentsMap) {
                        this.entities.add(k)
                    }
                }
            }
        }
    }

    Init() {}

    Update() {}
}
