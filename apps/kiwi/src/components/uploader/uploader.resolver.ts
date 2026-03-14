import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import GraphQLUpload from 'graphql-upload/public/GraphQLUpload.js';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UploaderService, UploadFile } from './uploader.service';

interface GraphQLRequestContext {
  req?: {
    protocol?: string;
    headers?: Record<string, string | string[] | undefined>;
  };
}

@Resolver()
export class UploaderResolver {
  constructor(private readonly uploaderService: UploaderService) {}

  private pickFirstHeader(
    value: string | string[] | undefined,
  ): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private getRequestBaseUrl(
    context: GraphQLRequestContext,
  ): string | undefined {
    const headers = context?.req?.headers ?? {};
    const forwardedProto = this.pickFirstHeader(headers['x-forwarded-proto']);
    const forwardedHost = this.pickFirstHeader(headers['x-forwarded-host']);
    const host = forwardedHost ?? this.pickFirstHeader(headers.host);
    const protocol = forwardedProto ?? context?.req?.protocol ?? 'http';

    if (!host) {
      return undefined;
    }

    return `${protocol}://${host}`;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => String)
  public async imageUploader(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Promise<UploadFile> | UploadFile,
    @Args('target') target: string,
    @Context() context: GraphQLRequestContext,
  ): Promise<string> {
    console.log('Mutation: imageUploader');
    return this.uploaderService.imageUploader(
      file,
      target,
      this.getRequestBaseUrl(context),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => [String])
  public async imagesUploader(
    @Args({ name: 'files', type: () => [GraphQLUpload] })
    files: Array<Promise<UploadFile> | UploadFile>,
    @Args('target') target: string,
    @Context() context: GraphQLRequestContext,
  ): Promise<string[]> {
    console.log('Mutation: imagesUploader');
    return this.uploaderService.imagesUploader(
      files,
      target,
      this.getRequestBaseUrl(context),
    );
  }
}
