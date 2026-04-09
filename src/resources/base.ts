import { HttpClient } from '../core/http';

export class BaseResource {
  constructor(protected readonly http: HttpClient) {}
}