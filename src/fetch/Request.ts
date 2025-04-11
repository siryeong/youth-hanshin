// src/fetch/useRequest.ts
import { useCallback } from 'react';
import { useLoading } from './LoadingContext';
import { toast } from 'sonner';

// 기본 에러 메시지 설정
const DEFAULT_ERROR_MESSAGE = '요청 처리 중 오류가 발생했습니다.';

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  return response.json();
}

export function useRequest() {
  const { setLoadingWithMessage } = useLoading();

  // 단일 API 요청 처리 함수
  const request = useCallback(
    async <T>(
      fetchFn: () => Promise<T>,
      options?: {
        loadingMessage?: string;
        errorMessage?: string;
        showErrorToast?: boolean;
        onError?: (error: Error) => void;
      },
    ): Promise<{ data: T | null; error: Error | null }> => {
      const {
        loadingMessage = '데이터를 불러오고 있습니다...',
        errorMessage = DEFAULT_ERROR_MESSAGE,
        showErrorToast = true,
        onError,
      } = options || {};

      try {
        setLoadingWithMessage(true, loadingMessage);
        const data = await fetchFn();
        return { data, error: null };
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        // 에러 로깅
        console.error('API 요청 오류:', errorObj);

        // 에러 토스트 표시 (옵션에 따라)
        if (showErrorToast) {
          toast.error(errorMessage);
        }

        // 커스텀 에러 핸들러 호출 (제공된 경우)
        if (onError) {
          onError(errorObj);
        }

        return { data: null, error: errorObj };
      } finally {
        setLoadingWithMessage(false);
      }
    },
    [setLoadingWithMessage],
  );

  // 여러 API 요청을 병렬로 처리하는 함수 (튜플 타입 활용)
  const requestAll = useCallback(
    <T extends unknown[]>(
      fetchFns: { [K in keyof T]: () => Promise<T[K]> },
      options?: {
        loadingMessage?: string;
        errorMessage?: string;
        showErrorToast?: boolean;
        onError?: (error: Error) => void;
      },
    ): Promise<{ data: T | null; error: Error | null }> => {
      const {
        loadingMessage = '데이터를 불러오고 있습니다...',
        errorMessage = '요청 처리 중 오류가 발생했습니다.',
        showErrorToast = true,
        onError,
      } = options || {};

      return new Promise(async (resolve) => {
        try {
          setLoadingWithMessage(true, loadingMessage);
          const data = await Promise.all(fetchFns.map((fn) => fn()));
          resolve({ data: data as T, error: null });
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));

          console.error('API 요청 오류:', errorObj);

          if (showErrorToast) {
            toast.error(errorMessage);
          }

          if (onError) {
            onError(errorObj);
          }

          resolve({ data: null, error: errorObj });
        } finally {
          setLoadingWithMessage(false);
        }
      });
    },
    [setLoadingWithMessage],
  );

  return { request, requestAll };
}
