import { BadRequestException, Injectable } from '@nestjs/common';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Message } from '../../libs/enums/common.enum';

export interface UploadFile {
  filename: string;
  mimetype: string;
  createReadStream: () => NodeJS.ReadableStream;
}

@Injectable()
export class UploaderService {
  private readonly allowedTargets = new Set([
    'member',
    'product',
    'vendor',
    'category',
    'general',
  ]);

  private readonly mimeToExtension: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };

  private normalizeTarget(target: string): string {
    const normalized = (target || '').trim().toLowerCase();
    if (!this.allowedTargets.has(normalized)) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }
    return normalized;
  }

  private resolveExtension(filename: string, mimetype: string): string {
    const byMime = this.mimeToExtension[mimetype];
    if (!byMime) {
      throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
    }

    const filenameExt = extname(filename || '').toLowerCase();
    if (!filenameExt) {
      return byMime;
    }

    const validExts = new Set(Object.values(this.mimeToExtension));
    return validExts.has(filenameExt) ? filenameExt : byMime;
  }

  private async storeFile(file: UploadFile, target: string): Promise<string> {
    if (!file?.filename || !file?.createReadStream || !file?.mimetype) {
      throw new BadRequestException(Message.UPLOAD_FAILED);
    }

    const safeTarget = this.normalizeTarget(target);
    const extension = this.resolveExtension(file.filename, file.mimetype);
    const imageName = `${Date.now()}-${randomUUID()}${extension}`;

    const uploadDir = join(process.cwd(), 'uploads', safeTarget);
    const absolutePath = join(uploadDir, imageName);
    const publicPath = `/uploads/${safeTarget}/${imageName}`;

    await mkdir(uploadDir, { recursive: true });

    try {
      await pipeline(file.createReadStream(), createWriteStream(absolutePath));
      return publicPath;
    } catch {
      throw new BadRequestException(Message.UPLOAD_FAILED);
    }
  }

  public async imageUploader(
    fileInput: Promise<UploadFile> | UploadFile,
    target: string,
  ): Promise<string> {
    const file = await fileInput;
    return this.storeFile(file, target);
  }

  public async imagesUploader(
    fileInputs: Array<Promise<UploadFile> | UploadFile>,
    target: string,
  ): Promise<string[]> {
    if (!fileInputs?.length) {
      throw new BadRequestException(Message.UPLOAD_FAILED);
    }

    const uploads = fileInputs.map(async (fileInput) => {
      const file = await fileInput;
      return this.storeFile(file, target);
    });

    return Promise.all(uploads);
  }
}
