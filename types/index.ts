export type MonacoExtraContent = {
  propertys: string[]
  methods: (MonacoMethod | string)[]
  types: string[]
  operators: string[]
  objects: MonacoObject[]
}

export type MonacoContent = {
  types: string[]
  propertys: string[]
  methods: (MonacoMethod | string)[]
  operators: string[]
  objects: MonacoObject[]
}
export type MonacoObject = {
  label: string
  properties: { name: string; type: string; description: string }[]
  methods: { name: string; parameters: string; description: string }[]
}
export type MonacoMethod = {
  label: string
  documentation?: string
  parameters?: { name: string; type?: string; description?: string }[]
}
