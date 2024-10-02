import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Column, CreateTableDto } from './dto/create-table.dto';
import { exec } from 'child_process';
import { PrismaService } from '../prisma.service';

const _systemTables = ['_prisma_migrations', 'sqlite_sequence'];

type ColumnInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string;
  pk: number;
};

type Table = {
  name: string;
  columns?: ColumnInfo[];
};

@Injectable()
export class TablesService {
  constructor(private prismaService: PrismaService) {}

  async create({ tableName, columns }: CreateTableDto) {
    const newTable = this.generatePrismaTableSchema(tableName, columns);

    const tableExists = await this.isTableExistInPrismaSchema(tableName);

    if (tableExists) {
      throw new HttpException(
        `Table ${tableName} already exists in the schema.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.updatePrismaSchema(newTable);

    const migrationCommand = `npx prisma migrate dev --name add-${tableName}`;
    exec(migrationCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during migration: ${stderr}`);
        return;
      }
      console.log(stdout);
    });

    return { message: `Table ${tableName} created and migration applied.` };
  }

  private generatePrismaTableSchema(
    tableName: string,
    columns: Column[],
  ): string {
    const columnsDefinition = columns
      .map((column) => `${column.name} ${column.type}`)
      .join('\n  ');

    return `model ${tableName} {
      id     Int      @id @default(autoincrement())
      ${columnsDefinition}
    }`;
  }

  private async isTableExistInPrismaSchema(
    tableName: string,
  ): Promise<boolean> {
    const schemaPath = 'prisma/schema.prisma';
    const schemaFile = await fs.readFile(schemaPath, 'utf-8');
    return schemaFile.includes(`model ${tableName} {`);
  }

  private async updatePrismaSchema(newTable: string): Promise<void> {
    const schemaPath = 'prisma/schema.prisma';
    const schemaFile = await fs.readFile(schemaPath, 'utf-8');
    const updatedSchema = `${schemaFile}\n\n${newTable}`;
    await fs.writeFile(schemaPath, updatedSchema);
  }

  async findAll() {
    const allTables: Table[] = await this.prismaService.$queryRaw`SELECT name
                                                                  FROM sqlite_master
                                                                  WHERE type = "table";`;
    const allTablesNoSystem = allTables.filter(
      (table: Table) => !_systemTables.includes(table.name),
    );

    for (const table of allTablesNoSystem) {
      const query = `PRAGMA table_info(${table.name});`;
      const res = await this.prismaService.$queryRawUnsafe(query);

      table.columns = this.toObject(res) as ColumnInfo[];
    }

    return allTablesNoSystem;
  }

  // Convert bigint values to strings (unchanged)
  private toObject(data: any) {
    return JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  async remove(tableName: string, id: number) {
    const tableExists: Array<unknown> =
      await this.prismaService.$queryRawUnsafe(
        `SELECT name
       FROM sqlite_master
       WHERE type = 'table'
         AND name = '${tableName}';`,
      );

    if (!tableExists?.length) {
      throw new HttpException(
        `Table ${tableName} does not exist.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const isRecordExists: Array<unknown> =
      await this.prismaService.$queryRawUnsafe(
        `SELECT id
       FROM ${tableName}
       WHERE id = ?;`,
        id,
      );

    if (!isRecordExists?.length) {
      throw new HttpException(
        `Record with id ${id} does not exist in ${tableName}.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const deleteCommand = `DELETE
                           FROM ${tableName}
                           WHERE id = ?`;
    await this.prismaService.$executeRawUnsafe(deleteCommand, id);

    return { message: `Record with id ${id} deleted from ${tableName}.` };
  }
}
