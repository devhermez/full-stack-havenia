import {
  RDSDataClient,
  ExecuteStatementCommand,
  BeginTransactionCommand,
  CommitTransactionCommand,
  RollbackTransactionCommand,
} from "@aws-sdk/client-rds-data";

const client = new RDSDataClient({ region: process.env.AWS_REGION });
const clusterArn = process.env.DB_CLUSTER_ARN!;
const secretArn  = process.env.DB_SECRET_ARN!;
const database   = process.env.DB_NAME!;

function toField(value: any) {
  if (value === null || value === undefined) return { isNull: true };
  if (typeof value === "number" && Number.isInteger(value)) return { longValue: value };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  return { stringValue: String(value) };
}

export async function query<T = any>(
  sql: string,
  params: Array<{ name: string; value: any }> = [],
  txId?: string
) {
  const resp = await client.send(
    new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn,
      database,
      sql,
      parameters: params.map(p => ({ name: p.name, value: toField(p.value) })),
      transactionId: txId,
      includeResultMetadata: true,
    })
  );

  if (!resp.records) {
    return { rows: [] as T[], numberOfRecordsUpdated: resp.numberOfRecordsUpdated ?? 0 };
  }

  const cols = resp.columnMetadata?.map(c => c.name!) ?? [];
  const rows = resp.records.map(rec => {
    const obj: any = {};
    rec.forEach((field, i) => {
      const k = cols[i] ?? `col${i}`;
      obj[k] = field.isNull
        ? null
        : field.stringValue ?? field.longValue ?? field.doubleValue ?? field.booleanValue ?? null;
    });
    return obj as T;
  });
  return { rows, numberOfRecordsUpdated: resp.numberOfRecordsUpdated ?? 0 };
}

export async function begin() {
  const r = await client.send(
    new BeginTransactionCommand({ resourceArn: clusterArn, secretArn, database })
  );
  return r.transactionId!;
}
export async function commit(txId: string) {
  await client.send(new CommitTransactionCommand({ resourceArn: clusterArn, secretArn, transactionId: txId }));
}
export async function rollback(txId: string) {
  await client.send(new RollbackTransactionCommand({ resourceArn: clusterArn, secretArn, transactionId: txId }));
}