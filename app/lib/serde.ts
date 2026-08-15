export interface Serde<Self, Serialized extends string | number> {
	serialize(s: Self): Serialized
	deserialize(s: Serialized): Self
}
