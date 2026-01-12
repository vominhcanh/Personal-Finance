
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
            map((data) => {
                let message = '';
                let responseData = data;

                if (data && typeof data === 'object' && !Array.isArray(data) && 'message' in data) {
                    message = data.message;
                    // Remove message from data to avoid duplication, only for plain objects or where safe
                    // Using destructuring to create cleaner data object
                    const { message: _, ...rest } = data;
                    responseData = rest;
                }

                return {
                    status: 'success',
                    message: message,
                    data: responseData,
                };
            }),
        );
    }
}
