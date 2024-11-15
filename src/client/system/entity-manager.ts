import {
    entity,
    ArchetypeEdge,
    entity_index,
    ComponentId,
    archetype_index,
    EntityId,
    Type,
} from "./entity.ts"
import { ComponentData } from "./components.js"

let archetypeCounter: number = 0
export const entity_manager = (() => {
    class EntityManager {
        _entitiesMap!: Map<string, InstanceType<typeof entity.Entity>>
        constructor() {
            this._entitiesMap = new Map()
        }

        Add(e: InstanceType<typeof entity.Entity>, name: string) {
            this._entitiesMap.set(name, e)
        }
    }

    class Archetype {
        static archetype_index: archetype_index = new Map()
        static entity_index: entity_index = new Map()
        id: number
        type: any
        edges: Map<any, any>
        components: Map<ComponentId, Map<EntityId, ComponentData<any>>>

        constructor(type: Type) {
            this.id = archetypeCounter++
            this.type = type

            this.edges = new Map()
            this.components = new Map([])
        }
    }

    class ArchetypeEdge {
        add: Archetype
        remove: Archetype

        constructor(remove: Archetype, add: Archetype) {
            this.add = add
            this.remove = remove
        }
    }

    return {
        EntityManager: EntityManager,
        Archetype: Archetype,
        ArchetypeEdge: ArchetypeEdge,
    }
})()

export type ae = Map<ComponentId, ArchetypeEdge>
export type Archetype = InstanceType<typeof entity_manager.Archetype>
