import { Controller } from '#application/contracts/Controller';

export class HealthController extends Controller<'public', HealthController.Response> {
  protected override async handle(): Promise<Controller.Response<HealthController.Response>> {
    return { statusCode: 200, body: { status: 'ok' } };
  }
}

export namespace HealthController {
  export type Response = { status: 'ok' };
}
