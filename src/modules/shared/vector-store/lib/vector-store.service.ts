import { Injectable } from '@nestjs/common';
import type { Collection, Where, WhereDocument, Metadata } from 'chromadb';

@Injectable()
export class VectorStoreService {
  constructor(private readonly collection: Collection) {}

  async addDocuments(params: {
    ids: string[];
    documents: string[];
    metadatas?: Metadata[];
    embeddings?: number[][];
  }): Promise<void> {
    await this.collection.add({
      ids: params.ids,
      documents: params.documents,
      metadatas: params.metadatas,
      embeddings: params.embeddings,
    });
  }

  async queryDocuments(params: {
    queryTexts?: string[];
    queryEmbeddings?: number[][];
    nResults?: number;
    where?: Where;
    whereDocument?: WhereDocument;
  }) {
    return this.collection.query({
      queryTexts: params.queryTexts,
      queryEmbeddings: params.queryEmbeddings,
      nResults: params.nResults ?? 10,
      where: params.where,
      whereDocument: params.whereDocument,
    });
  }

  async deleteDocuments(params: { ids?: string[]; where?: Where; whereDocument?: WhereDocument }): Promise<void> {
    await this.collection.delete({
      ids: params.ids,
      where: params.where,
      whereDocument: params.whereDocument,
    });
  }

  async updateDocuments(params: {
    ids: string[];
    documents?: string[];
    metadatas?: Metadata[];
    embeddings?: number[][];
  }): Promise<void> {
    await this.collection.update({
      ids: params.ids,
      documents: params.documents,
      metadatas: params.metadatas,
      embeddings: params.embeddings,
    });
  }

  async getDocuments(params?: {
    ids?: string[];
    where?: Where;
    whereDocument?: WhereDocument;
    limit?: number;
    offset?: number;
  }) {
    return this.collection.get({
      ids: params?.ids,
      where: params?.where,
      whereDocument: params?.whereDocument,
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  async countDocuments(): Promise<number> {
    return this.collection.count();
  }

  getCollection(): Collection {
    return this.collection;
  }
}
