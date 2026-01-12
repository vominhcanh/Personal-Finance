
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
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

            if (Array.isArray(exceptionResponse.message)) {
                message = 'Validation Error';
                errors = exceptionResponse.message;
            } else {
                message = exceptionResponse.message;
            }
        }

        // Ensure 404/422 always has a clear message if default is generic
        if (status === HttpStatus.NOT_FOUND && message === 'Not Found') {
            message = 'Resource not found';
        }
        if (status === HttpStatus.UNPROCESSABLE_ENTITY && message === 'Unprocessable Entity') {
            message = 'Operation failed';
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
