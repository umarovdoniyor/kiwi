import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import GraphQLUpload from 'graphql-upload/public/GraphQLUpload.js';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UploaderService, UploadFile } from './uploader.service';

@Resolver()
export class UploaderResolver {
  constructor(private readonly uploaderService: UploaderService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => String)
  public async imageUploader(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Promise<UploadFile> | UploadFile,
    @Args('target') target: string,
  ): Promise<string> {
    console.log('Mutation: imageUploader');
    return this.uploaderService.imageUploader(file, target);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => [String])
  public async imagesUploader(
    @Args({ name: 'files', type: () => [GraphQLUpload] })
    files: Array<Promise<UploadFile> | UploadFile>,
    @Args('target') target: string,
  ): Promise<string[]> {
    console.log('Mutation: imagesUploader');
    return this.uploaderService.imagesUploader(files, target);
  }
}
