import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { PrismaService } from '../prisma.service';
import { systemTables } from '../constatns';

@Injectable()
export class RecordsService {
  constructor(private prismaService: PrismaService) {}

  private async validateTable(tableName: string) {
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
  }

  private async validateRecord(tableName: string, id: number) {
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
  }

  async create(tableName: string, createRecordDto: CreateRecordDto) {
    await this.validateTable(tableName);
    try {
      const columns = Object.keys(createRecordDto.columns).join(', ');
      const placeholders = Object.values(createRecordDto.columns)
        .map(() => '?')
        .join(', ');
      const values = Object.values(createRecordDto.columns);

      const insertCommand = `INSERT INTO ${tableName}
                                 (${columns})
                             VALUES (${placeholders});`;

      await this.prismaService.$executeRawUnsafe(insertCommand, ...values);

      return {
        message: `Record created in ${tableName}.`,
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    const allTables: Array<unknown> = await this.prismaService.$queryRawUnsafe(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table';`,
    );

    const allTablesNoSystem = allTables.filter(
      (table: any) => !systemTables.includes(table.name),
    );

    const tablesWithId = allTablesNoSystem.map((table: any) => {
      table.id = table.name;
      delete table.name;
      return table;
    });

    for (const table of tablesWithId) {
      table.records = await this.findOne(table.id);
    }
    return tablesWithId;
  }
  async findOne(tableName: string): Promise<Array<unknown>> {
    await this.validateTable(tableName);

    return this.prismaService.$queryRawUnsafe(
      `SELECT *
       FROM ${tableName};`,
    );
  }

  async findOneById(tableName: string, id: number): Promise<Array<unknown>> {
    await this.validateTable(tableName);
    const res = await this.prismaService.$queryRawUnsafe(
      `SELECT *
       FROM ${tableName}
       WHERE id = ?;`,
      id,
    );

    return res[0];
  }

  async update(
    tableName: string,
    id: number,
    updateRecordDto: UpdateRecordDto,
  ) {
    await this.validateTable(tableName);

    await this.validateRecord(tableName, id);

    try {
      const query = `UPDATE ${tableName}
                     SET ${Object.keys(updateRecordDto.columns)
                       .map((key) => `${key} = ?`)
                       .join(', ')}
                     WHERE id = ?;`;
      const values = [...Object.values(updateRecordDto.columns), id];

      await this.prismaService.$executeRawUnsafe(query, ...values);
      return { message: `Record with id ${id} updated in ${tableName}.` };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async remove(tableName: string, id: number) {
    await this.validateTable(tableName);

    await this.validateRecord(tableName, id);

    const deleteCommand = `DELETE
                           FROM ${tableName}
                           WHERE id = ?`;
    await this.prismaService.$executeRawUnsafe(deleteCommand, id);

    return { message: `Record with id ${id} deleted from ${tableName}.` };
  }
}
