import Dexie from 'dexie';

const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS;

class EvaluationDatabase extends Dexie {
  evaluations: Dexie.Table<Evaluation, number>; // number is the type of the primary key

  constructor() {
    super(dbName);
    this.version(1).stores({
      evaluations: '++id, projectId, jobDescriptionId, profileId, evaluation, evaluationRating'
    });
  }
}

interface Evaluation {
  id?: number;
  projectId: string;
  jobDescriptionId: string;
  profileId: string;
  evaluation: any;
  evaluationRating: number;
}

const db = new EvaluationDatabase();

export async function saveDataToIndexedDB(evaluation: Evaluation): Promise<void> {
  const data: any = await getEvaluationFromIndexedDB(evaluation);
  if (data.length)
    await deleteDataFromIndexedDB(data[0].id)
  await db.evaluations.put(evaluation);
  console.log("Data saved to IndexedDB");
}

export async function deleteDataFromIndexedDB(id: number): Promise<void> {
  await db.evaluations.delete(id);
  console.log("Data deleted from IndexedDB: ", id);
}

export async function deleteAllFromIndexedDB({ projectId }): Promise<void> {
  await db.evaluations.where('projectId').equals(projectId).delete();
  console.log("All data for project deleted from IndexedDB: ", projectId);
}

export async function deleteAllDatabases(): Promise<void> {
  await db.evaluations.clear();
  console.log("All Data deleted from IndexedDB");
}

export async function getEvaluationFromIndexedDB({ projectId, jobDescriptionId, profileId }): Promise<Evaluation[]> {
  const evaluations = await db.evaluations.where({ projectId, jobDescriptionId, profileId }).toArray();
  return evaluations;
}

export async function getEvaluationsFromIndexedDB({ projectId, jobDescriptionId }): Promise<Evaluation[]> {
  const evaluations = await db.evaluations.where({ projectId, jobDescriptionId }).toArray();
  return evaluations;
}