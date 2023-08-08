/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */







declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
}

export interface NexusGenEnums {
  State: "DOING" | "DONE" | "PENDING"
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
}

export interface NexusGenObjects {
  Mutation: {};
  Process: { // root type
    created_at: string; // String!
    id: string; // String!
    images: string[]; // [String!]!
    log?: string | null; // String
    output?: string | null; // String
    state: NexusGenEnums['State']; // State!
  }
  Query: {};
}

export interface NexusGenInterfaces {
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums

export interface NexusGenFieldTypes {
  Mutation: { // field return type
    CancelProcess: NexusGenRootTypes['Process']; // Process!
    CreateProcess: NexusGenRootTypes['Process'] | null; // Process
    UploadImage: string; // String!
  }
  Process: { // field return type
    created_at: string; // String!
    id: string; // String!
    images: string[]; // [String!]!
    log: string | null; // String
    output: string | null; // String
    state: NexusGenEnums['State']; // State!
  }
  Query: { // field return type
    DownloadImage: string; // String!
    processes: NexusGenRootTypes['Process'][]; // [Process!]!
  }
}

export interface NexusGenFieldTypeNames {
  Mutation: { // field return type name
    CancelProcess: 'Process'
    CreateProcess: 'Process'
    UploadImage: 'String'
  }
  Process: { // field return type name
    created_at: 'String'
    id: 'String'
    images: 'String'
    log: 'String'
    output: 'String'
    state: 'State'
  }
  Query: { // field return type name
    DownloadImage: 'String'
    processes: 'Process'
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    CancelProcess: { // args
      id: string; // String!
    }
    CreateProcess: { // args
      bg_color: string; // String!
      border: number; // Int!
      images: string[]; // [String!]!
      is_horizontal: boolean; // Boolean!
    }
    UploadImage: { // args
      mimetype: string; // String!
      name: string; // String!
    }
  }
  Query: {
    DownloadImage: { // args
      name: string; // String!
    }
    processes: { // args
      state?: NexusGenEnums['State'] | null; // State
    }
  }
}

export interface NexusGenAbstractTypeMembers {
}

export interface NexusGenTypeInterfaces {
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = never;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
  }
}

export interface NexusGenTypes {
  context: any;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}