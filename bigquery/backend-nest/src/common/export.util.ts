import * as csv from 'fast-csv';
import * as exceljs from 'exceljs';

export function pickFields(doc: any, fields: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const field of fields) {
    out[field] = doc?.[field] ?? '';
  }
  return out;
}

export async function streamCsv(
  destination: NodeJS.WritableStream,
  fields: string[],
  cursor: AsyncIterable<any>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const csvStream = csv.format({ headers: fields, delimiter: ';' });
    csvStream.pipe(destination);
    destination.on('finish', resolve);
    destination.on('error', reject);
    csvStream.on('error', reject);

    (async () => {
      try {
        for await (const doc of cursor) {
          csvStream.write(pickFields(doc, fields));
        }
        csvStream.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

export async function streamXlsx(
  fields: string[],
  cursor: AsyncIterable<any>,
  destination: { filename: string } | { stream: NodeJS.WritableStream },
): Promise<void> {
  const workbook = new exceljs.stream.xlsx.WorkbookWriter(destination as never);
  const worksheet = workbook.addWorksheet('Leads');
  worksheet.addRow(fields).commit();

  for await (const doc of cursor) {
    const row = pickFields(doc, fields);
    worksheet.addRow(fields.map((f) => row[f])).commit();
  }

  await workbook.commit();
}
