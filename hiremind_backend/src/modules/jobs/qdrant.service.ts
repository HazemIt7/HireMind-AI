import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

export interface VectorPayload {
  id: string;
  title: string;
  skills: string[];
  type: 'job' | 'candidate';
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private readonly qdrantUrl = 'http://localhost:6333';
  private readonly collectionName = 'hiremind_embeddings';
  private readonly vectorSize = 16; // 16-dimensional domain feature vector

  // Domain skills catalog for 16-dim vector embedding
  private readonly featureCatalog = [
    'flutter', 'dart', 'nestjs', 'typescript', 'python',
    'docker', 'kubernetes', 'wazuh', 'pentesting', 'ceh',
    'ccna', 'cisco', 'tcp/ip', 'plc', 'scada', 'qdrant'
  ];

  async onModuleInit() {
    await this.ensureCollectionExists();
    await this.seedDefaultCandidates();
  }

  async seedDefaultCandidates(): Promise<void> {
    const candidates = [
      {
        id: 'cand-slim-hadj',
        title: 'Slim Hadj',
        skills: ['wazuh', 'pentesting', 'docker', 'kubernetes', 'nestjs', 'aws', 'python'],
        type: 'candidate' as const
      },
      {
        id: 'cand-hazem-ayachi',
        title: 'Hazem Ayachi',
        skills: ['pentesting', 'wazuh', 'ceh', 'nestjs', 'flutter', 'dart'],
        type: 'candidate' as const
      },
      {
        id: 'cand-sarra-mansouri',
        title: 'Sarra Mansouri',
        skills: ['ccna', 'cisco', 'kubernetes', 'tcp/ip', 'docker'],
        type: 'candidate' as const
      }
    ];

    for (const cand of candidates) {
      const vector = this.generateEmbedding(cand.skills, cand.title);
      const ok = await this.upsertVector(cand.id, vector, cand);
      if (ok) {
        this.logger.log(`Indexed candidate '${cand.title}' into Qdrant Vector DB.`);
      }
    }
  }

  /**
   * Check if Qdrant collection exists; if not, create it with Cosine distance metric
   */
  async ensureCollectionExists(): Promise<void> {
    try {
      const checkRes = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`);
      if (!checkRes.ok) {
        this.logger.log(`Creating Qdrant collection '${this.collectionName}'...`);
        const createRes = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vectors: {
              size: this.vectorSize,
              distance: 'Cosine',
            },
          }),
        });
        if (createRes.ok) {
          this.logger.log(`Qdrant collection '${this.collectionName}' created successfully.`);
        }
      } else {
        this.logger.log(`Qdrant collection '${this.collectionName}' is ready.`);
      }
    } catch (err) {
      this.logger.warn(`Could not reach Qdrant server at ${this.qdrantUrl}: ${err.message}`);
    }
  }

  /**
   * Convert list of skill strings into a normalized 16-dimensional feature vector
   */
  generateEmbedding(skills: string[], textDescription?: string): number[] {
    const vector = new Array(this.vectorSize).fill(0.1); // baseline small weight
    const combinedText = `${skills.join(' ')} ${textDescription || ''}`.toLowerCase();

    this.featureCatalog.forEach((term, index) => {
      if (combinedText.includes(term)) {
        vector[index] = 1.0;
      }
    });

    // Normalize vector (L2 norm)
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? vector.map((val) => Number((val / norm).toFixed(4))) : vector;
  }

  /**
   * Upsert point (job or candidate) into Qdrant vector database
   */
  async upsertVector(id: string | number, vector: number[], payload: VectorPayload): Promise<boolean> {
    try {
      const numericId = typeof id === 'number' ? id : this.stringToNumericId(id);
      const res = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: [
            {
              id: numericId,
              vector: vector,
              payload: payload,
            },
          ],
        }),
      });
      return res.ok;
    } catch (err) {
      this.logger.error(`Failed to upsert vector to Qdrant: ${err.message}`);
      return false;
    }
  }

  /**
   * Perform Cosine Similarity Search in Qdrant for matching candidates to job requirements
   */
  async searchMatchingCandidates(jobVector: number[], topK = 5) {
    try {
      const res = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: jobVector,
          limit: topK,
          with_payload: true,
          filter: {
            must: [
              {
                key: 'type',
                match: { value: 'candidate' },
              },
            ],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.result || [];
      }
    } catch (err) {
      this.logger.error(`Qdrant search query failed: ${err.message}`);
    }
    return [];
  }

  /**
   * Convert string ID to uint64 numeric ID for Qdrant compatibility
   */
  private stringToNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
