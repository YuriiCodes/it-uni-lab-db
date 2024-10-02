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

  private toObject(data: any) {
    return JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  // Modify the schema and run migration to remove a table
  async remove(tableName: string) {
    // Check if the table exists in the Prisma schema
    const schemaPath = 'prisma/schema.prisma';
    const schemaFile = await fs.readFile(schemaPath, 'utf-8');

    const tableExists = await this.isTableExistInPrismaSchema(tableName);

    if (!tableExists) {
      throw new HttpException(`Table ${tableName} does not exist.`, HttpStatus.NOT_FOUND);
    }

    // Remove the table definition from schema.prisma
    const updatedSchema = this.removeTableFromSchema(schemaFile, tableName);
    await fs.writeFile(schemaPath, updatedSchema);

    // Trigger a Prisma migration
    const migrationCommand = `npx prisma migrate dev --name remove-${tableName}`;
    exec(migrationCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during migration: ${stderr}`);
        throw new HttpException(`Migration failed: ${stderr}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      console.log(stdout);
    });

    return { message: `Table ${tableName} has been deleted and migration applied.` };
  }

  // Helper to remove the table definition from schema.prisma
  private removeTableFromSchema(schemaFile: string, tableName: string): string {
    const modelRegex = new RegExp(`model ${tableName} {[^}]*}`, 'g');
    const updatedSchema = schemaFile.replace(modelRegex, '').trim();

    return updatedSchema;
  }
}
