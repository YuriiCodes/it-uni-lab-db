import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prismaService: PrismaService) {
  }
  create(createRecordDto: CreateRecordDto) {
    return 'This action adds a new record';
  }

  findAll() {
    return `This action returns all records`;
  }

  findOne(id: number) {
    return `This action returns a #${id} record`;
  }

  update(id: number, updateRecordDto: UpdateRecordDto) {
    return `This action updates a #${id} record`;
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
