import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Column, CreateCreateTableDto } from './dto/create-create-table.dto';
import { UpdateCreateTableDto } from './dto/update-create-table.dto';
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
export class CreateTableService {
  constructor(private prismaService: PrismaService) {}

  async create({ tableName, columns }: CreateCreateTableDto) {
    const newTable = this.generatePrismaTableSchema(tableName, columns);

    // 1. Update schema.prisma dynamically
    await this.updatePrismaSchema(newTable);

    // 2. Trigger Prisma migration
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

  // Helper to generate Prisma table schema string
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

  // Helper to append to schema.prisma
  private async updatePrismaSchema(newTable: string): Promise<void> {
    const schemaPath = 'prisma/schema.prisma';
    const schemaFile = await fs.readFile(schemaPath, 'utf-8');
    const updatedSchema = `${schemaFile}\n\n${newTable}`;
    await fs.writeFile(schemaPath, updatedSchema);
  }

  async findAll() {
    // @ts-ignore
    const allTables: Table[] = await this.prismaService.$queryRaw`SELECT name
                                                                  FROM sqlite_master
                                                                  WHERE type = "table";`;
    const allTablesNoSystem = allTables.filter(
      (table: Table) => !_systemTables.includes(table.name),
    );

    // get the structure of each tables:
    for (const table of allTablesNoSystem) {
      // @ts-ignore
      console.log('table', table);
      const query = `PRAGMA table_info(${table.name});`;
      const res = await this.prismaService.$queryRawUnsafe(query);

      table.columns = this.toObject(res) as ColumnInfo[];
    }

    return allTablesNoSystem;
  }

  toObject(data: any) {
    return JSON.parse(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value
    ));
  }

  findOne(id: number) {
    return `This action returns a #${id} createTable`;
  }

  update(id: number, updateCreateTableDto: UpdateCreateTableDto) {
    return `This action updates a #${id} createTable`;
  }

  remove(id: number) {
    return `This action removes a #${id} createTable`;
  }
}
