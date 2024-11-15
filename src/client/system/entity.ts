import { Archetype } from "./entity-manager.ts"

export type ArchetypeId = number
export type ComponentId = number
export type EntityId = number
export type Type = number
export type Column<T> = Array<T>
export type ArchetypeEdge = { add: Archetype; remove: Archetype }
export type Component = typeof entity.Component
export type Entity = typeof entity.Entity
export type archetype_index = Map<Type, Archetype>
export type EntityRecord = { archetype: Archetype; row: number }
export type entity_index = Map<EntityId, EntityRecord>
export type ArchetypeMap = Map<ArchetypeId, ComponentId>

let entityCounter = 0

export const entity = (() => {
    class Entity {
        EntityId: number
        constructor() {
            this.EntityId = entityCounter++
        }
    }

    class Component {
        toJSON() {}

        fromJSON() {}

        Clone() {}

        Reset() {}
    }

    return {
        Entity: Entity,
        Component: Component,
    }
})()
