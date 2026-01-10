
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    data: T;
    message: string;
    status: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => ({
                // Support existing pagination structure which already has 'data' and 'meta'
                // If data has 'data' property (like PageDto), use it directly but wrap in standard format if needed?
                // Actually user wants: { data: ..., message: '', status: 'success' }
                // If it's a pagination object, it has { data: [], meta: {} }.
                // Let's merge it: { data: { results: [], meta: {} }, message: '', status: 'success' }
                // OR simply spread if it's an object?
                // User's example: { data: ..., message: '', status: 'success' }
                // Let's assume 'data' is the main payload.

                status: 'success',
                message: '',
                data: data,
            })),
        );
    }
}
