export interface T {
  [key: string]: any;
}

export interface GraphQLErrorFormatted {
  code?: string | null;
  message?: string;
}

export interface GraphQLErrorInput {
  extensions?: {
    code?: string | null;
    exception?: {
      response?: {
        message?: string;
      };
    };
    response?: {
      message?: string;
    };
  };
  message?: string;
}
