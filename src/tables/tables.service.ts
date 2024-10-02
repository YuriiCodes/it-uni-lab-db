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
  constructor(private prismaService: PrismaService) {
  }

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

  async remove(tableName: string) {
    const schemaPath = 'prisma/schema.prisma';
    const schemaFile = await fs.readFile(schemaPath, 'utf-8');

    const tableExists = await this.isTableExistInPrismaSchema(tableName);

    if (!tableExists) {
      throw new HttpException(
        `Table ${tableName} does not exist.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedSchema = this.removeTableFromSchema(schemaFile, tableName);
    await fs.writeFile(schemaPath, updatedSchema);

    const migrationCommand = `npx prisma migrate dev --name remove-${tableName}`;
    exec(migrationCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during migration: ${stderr}`);
        throw new HttpException(
          `Migration failed: ${stderr}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      console.log(stdout);
    });

    return {
      message: `Table ${tableName} has been deleted and migration applied.`,
    };
  }

  private removeTableFromSchema(schemaFile: string, tableName: string): string {
    const modelRegex = new RegExp(`model ${tableName} {[^}]*}`, 'g');
    return schemaFile.replace(modelRegex, '').trim();
  }

  async renameField({
                      tableName,
                      oldFieldName,
                      newFieldName,
                    }: {
    tableName: string;
    oldFieldName: string;
    newFieldName: string;
  }) {
    const schemaPath = 'prisma/schema.prisma';
    const schemaFile = await fs.readFile(schemaPath, 'utf-8');

    const tableExists = await this.isTableExistInPrismaSchema(tableName);

    if (!tableExists) {
      throw new HttpException(
        `Table ${tableName} does not exist.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const modelRegex = new RegExp(`model ${tableName} {([^}]*)}`, 'gs');
    const modelMatch = modelRegex.exec(schemaFile);

    if (!modelMatch || !modelMatch[1]) {
      throw new HttpException(
        `Table ${tableName} does not exist in schema.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const modelContent = modelMatch[1];

    const fieldExists = new RegExp(`\\b${oldFieldName}\\b`).test(modelContent);

    if (!fieldExists) {
      throw new HttpException(
        `Field ${oldFieldName} does not exist in the ${tableName} table.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedSchema = this.renameFieldInSchema(
      schemaFile,
      tableName,
      oldFieldName,
      newFieldName,
    );
    await fs.writeFile(schemaPath, updatedSchema);

    const migrationCommand = `npx prisma migrate dev --name rename-${oldFieldName}-to-${newFieldName}`;
    exec(migrationCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during migration: ${stderr}`);
        throw new HttpException(
          `Migration failed: ${stderr}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      console.log(stdout);
    });

    return {
      message: `Field ${oldFieldName} renamed to ${newFieldName} in table ${tableName}.`,
    };
  }

  private renameFieldInSchema(
    schemaFile: string,
    tableName: string,
    oldFieldName: string,
    newFieldName: string,
  ): string {
    const modelRegex = new RegExp(`model ${tableName} {([^}]*)}`, 'gs');
    const modelMatch = modelRegex.exec(schemaFile);

    if (modelMatch && modelMatch[1]) {
      const modelContent = modelMatch[1];

      const fieldRegex = new RegExp(`\\b${oldFieldName}\\b(\\s+\\S+)(\\s+@default\\(.*\\))?`, 'g');

      const updatedModelContent = modelContent.replace(fieldRegex, (match, fieldType, defaultAttr) => {
        const newFieldDefinition = `${newFieldName}${fieldType}`;
        return defaultAttr ? `${newFieldDefinition} ${defaultAttr}` : `${newFieldDefinition} @default("null")`;
      });


      return schemaFile.replace(modelContent, updatedModelContent);
    }

    return schemaFile;
  }
}