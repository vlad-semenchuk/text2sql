export type VectorStoreModuleOptions = {
  chroma: {
    host: string;
    port: number;
    ssl?: boolean;
    collectionName: string;
  };
  openai: {
    apiKey: string;
    modelName: string;
  };
};
