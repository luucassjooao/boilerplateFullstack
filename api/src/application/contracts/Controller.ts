import type { ZodType } from 'zod';

export abstract class Controller<TType extends Controller.Type = 'public', TBody = undefined> {
  protected readonly schema?: ZodType;

  protected abstract handle(request: Controller.Request<TType>): Promise<Controller.Response<TBody>>;

  async execute(request: Controller.Request<TType>): Promise<Controller.Response<TBody>> {
    const body = this.schema
      ? (this.schema.parse(request.body) as Controller.Request<TType>['body'])
      : request.body;

    return this.handle({ ...request, body });
  }
}

export namespace Controller {
  export type Type = 'public' | 'private';

  export type Request<
    TType extends Type = Type,
    TBody = Record<string, unknown>,
    TParams = Record<string, string | undefined>,
    TQueryParams = Record<string, string | undefined>,
  > = {
    body: TBody;
    params: TParams;
    queryParams: TQueryParams;
    headers: Record<string, string | undefined>;
    cookies: Record<string, string | undefined>;
    /** Only cookies whose signature is valid, already unsigned. */
    signedCookies: Record<string, string | undefined>;
    userId: TType extends 'private' ? string : null;
  };

  export type CookieOptions = {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    path?: string;
    /** Seconds. */
    maxAge?: number;
    signed?: boolean;
  };

  export type Cookie =
    | { name: string; value: string; options: CookieOptions }
    | { name: string; clear: true; options: CookieOptions };

  export type Response<TBody = undefined> = {
    statusCode: number;
    body?: TBody;
    headers?: Record<string, string>;
    cookies?: Cookie[];
    redirectTo?: string;
  };
}
