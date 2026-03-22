/**
 * Axios response-like interface for compatibility
 * Use this if you don't want to depend on axios
 */
export interface AxiosResponse<T = any> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: any;
  /** Request config */
  config: any;
}

/**
 * Axios error interface for compatibility
 */
export interface AxiosError<T = any> {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Response object */
  response?: {
    status: number;
    data: T;
    statusText: string;
    headers: any;
  };
  /** Axios error flag */
  isAxiosError: boolean;
  /** Error name */
  name: string;
}

/**
 * Serialized Axios error with convenient structure
 */
export interface SerializedAxiosError<T = unknown> {
  /** Error message */
  message: string;
  /** Error code (e.g., 'ECONNREFUSED') */
  code?: string;
  /** HTTP status code (e.g., 404, 500) */
  status?: number;
  /** Response data */
  data?: T;
  /** Whether this is an Axios error */
  isAxiosError: boolean;
}

/**
 * Extracts data type from AxiosResponse promise
 * @internal
 */
export type AxiosResponseData<TPromise extends Promise<any>> =
  TPromise extends Promise<AxiosResponse<infer T>> ? T : never;

/**
 * Extracts variables type from a function that returns AxiosResponse promise
 * @internal
 */
export type AxiosFnVariables<TFn extends (...args: any[]) => any> =
  TFn extends (...args: infer P) => any ? P[0] : void;

/**
 * Unwraps AxiosResponse to extract data from promise
 *
 * @param promise - Promise that resolves to AxiosResponse<T>
 * @returns Promise that resolves to T (the data)
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: (id: number) =>
 *     unwrapAxiosResponse(api.archiveDictionary(id)),
 * });
 * ```
 */
export function unwrapAxiosResponse<T>(
  promise: Promise<AxiosResponse<T>>
): Promise<T> {
  return promise.then((response) => response.data);
}

/**
 * Creates a wrapper around API function for automatic data extraction
 *
 * @param fn - API function that returns Promise<AxiosResponse<T>>
 * @returns Wrapped function that returns Promise<T>
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: axiosMapper(dictionaryApi.archiveDictionary),
 * });
 * ```
 */
export function axiosMapper<
  TFn extends (...args: any[]) => Promise<AxiosResponse<any>>,
>(
  fn: TFn
): (...args: Parameters<TFn>) => Promise<AxiosResponseData<ReturnType<TFn>>> {
  return (...args: Parameters<TFn>) =>
    fn(...args).then((response) => response.data);
}

/**
 * Transforms AxiosError into a convenient format
 *
 * @param handler - Error handler that receives SerializedAxiosError
 * @returns Wrapped error handler
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: (id) => api.archive(id),
 *   onError: axiosErrorHandler((error) => {
 *     console.error('Archive failed:', error.message);
 *     if (error.isAxiosError && error.status === 404) {
 *       // Handle 404
 *     }
 *   }),
 * });
 * ```
 */
export function axiosErrorHandler<T = unknown>(
  handler: (error: SerializedAxiosError<T>) => void
): (error: unknown) => void {
  return (error: unknown) => {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<T>;
      const serialized: SerializedAxiosError<T> = {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data as T,
        isAxiosError: true,
      };
      handler(serialized);
    } else {
      const message = isErrorWithMessage(error) ? getErrorMessage(error) : String(error);
      handler({
        message,
        isAxiosError: false,
      });
    }
  };
}

/**
 * Type guard to check if error is AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'isAxiosError' in error &&
    (error as any).isAxiosError === true
  );
}

/**
 * Type guard to check if error has message property
 */
function isErrorWithMessage(error: unknown): error is { message: unknown } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error
  );
}

/**
 * Get error message safely
 */
function getErrorMessage(error: { message: unknown }): string {
  const msg = error.message;
  if (typeof msg === 'string') {
    return msg;
  }
  if (msg instanceof Error) {
    return msg.message;
  }
  return String(msg);
}
