export type VmoMonacoContext = {
  types: string[]
  properties: string[]
  methods: (VmoMonacoContextMethod | string)[]

  operators: string[]
  objects: VmoMonacoContextObject[]
}
export type VmoMonacoContextObject = {
  label: string
  properties: { name: string; type: string; description: string }[]
  methods: { name: string; parameters: string; description: string }[]
}
export type VmoMonacoContextMethod = {
  label: string
  documentation?: string
  parameters?: { name: string; type?: string; description?: string }[]
}
