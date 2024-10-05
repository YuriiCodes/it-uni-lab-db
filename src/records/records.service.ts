import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { PrismaService } from '../prisma.service';

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

  private async executeCreateQuery(query: string, values: any[]) {
    await this.prismaService.$executeRawUnsafe(query, ...values);
  }

  async create(createRecordDto: CreateRecordDto) {
    try {
      await this.validateTable(createRecordDto.tableName);

      const columns = Object.keys(createRecordDto.columns).join(', ');
      const placeholders = Object.values(createRecordDto.columns)
        .map(() => '?')
        .join(', ');
      const values = Object.values(createRecordDto.columns);

      const insertCommand = `INSERT INTO ${createRecordDto.tableName}
                                 (${columns})
                             VALUES (${placeholders});`;

      await this.executeCreateQuery(insertCommand, values);

      return {
        message: `Record created in ${createRecordDto.tableName}.`,
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(tableName: string) {
    await this.validateTable(tableName);

    const allRecords = await this.prismaService.$queryRawUnsafe(
      `SELECT *
       FROM ${tableName};`,
    );

    return allRecords;
  }

  async findOne(tableName: string) {
    await this.validateTable(tableName);

    return await this.prismaService.$queryRawUnsafe(
      `SELECT *
       FROM ${tableName};`,
    );
  }

  update(id: number, updateRecordDto: UpdateRecordDto) {
    return `This action updates a #${id} record`;
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
