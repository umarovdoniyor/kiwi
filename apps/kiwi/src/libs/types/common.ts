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

export interface JwtPayload {
  sub: string;
  memberEmail: string;
  memberType: string;
  memberStatus: string;
  iat?: number;
  exp?: number;
}
