
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse: any = exception.getResponse();

        let message = exception.message;
        let errors = null;

        if (typeof exceptionResponse === 'object') {
            // Class-validator often returns { statusCode, message: [], error }
            // where message is array of validation errors
            if (Array.isArray(exceptionResponse.message)) {
                message = 'Validation Error';
                errors = exceptionResponse.message;
            } else {
                message = exceptionResponse.message;
            }
        }

        response
            .status(status)
            .json({
                status: 'error',
                message: message,
                data: null,
                errors: errors, // Detail fields: "a", "b", "c" as requested
                path: request.url,
                timestamp: new Date().toISOString(),
            });
    }
}
