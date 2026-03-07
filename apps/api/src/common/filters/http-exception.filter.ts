import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<{
      status: (statusCode: number) => { json: (body: unknown) => void }
    }>()
    const request = ctx.getRequest<{ method: string; url: string }>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error'

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
          ? exceptionResponse.message
          : 'Internal server error'

    response.status(status).json({
      statusCode: status,
      error:
        exception instanceof HttpException
          ? (HttpStatus[status] ?? 'HttpException')
          : 'InternalServerError',
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    })
  }
}
