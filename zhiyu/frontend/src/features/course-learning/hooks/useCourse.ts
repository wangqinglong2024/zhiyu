import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../services/api'

// ===== Query Keys =====
export const courseKeys = {
  all: ['courses'] as const,
  levels: () => [...courseKeys.all, 'levels'] as const,
  units: (levelId: string) => [...courseKeys.all, 'units', levelId] as const,
  lessons: (unitId: string) => [...courseKeys.all, 'lessons', unitId] as const,
  lesson: (lessonId: string) => [...courseKeys.all, 'lesson', lessonId] as const,
  levelPreview: (levelId: string) => [...courseKeys.all, 'preview', levelId] as const,
  overview: () => [...courseKeys.all, 'overview'] as const,
  unlockStatus: (levelId: string) => [...courseKeys.all, 'unlock', levelId] as const,
  purchaseStatus: (levelId: string) => [...courseKeys.all, 'purchase', levelId] as const,
  purchases: () => [...courseKeys.all, 'purchases'] as const,
  srsDue: () => ['srs', 'due'] as const,
  srsStats: () => ['srs', 'stats'] as const,
  placementHistory: () => ['placement', 'history'] as const,
}

// ===== 课程查询 =====

export function useLevels() {
  return useQuery({
    queryKey: courseKeys.levels(),
    queryFn: api.fetchLevels,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUnits(levelId: string) {
  return useQuery({
    queryKey: courseKeys.units(levelId),
    queryFn: () => api.fetchUnits(levelId),
    enabled: !!levelId,
  })
}

export function useLessons(unitId: string) {
  return useQuery({
    queryKey: courseKeys.lessons(unitId),
    queryFn: () => api.fetchLessons(unitId),
    enabled: !!unitId,
  })
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: courseKeys.lesson(lessonId),
    queryFn: () => api.fetchLesson(lessonId),
    enabled: !!lessonId,
  })
}

export function useLevelPreview(levelId: string) {
  return useQuery({
    queryKey: courseKeys.levelPreview(levelId),
    queryFn: () => api.fetchLevelPreview(levelId),
    enabled: !!levelId,
  })
}

// ===== 进度 =====

export function useProgressOverview() {
  return useQuery({
    queryKey: courseKeys.overview(),
    queryFn: api.fetchProgressOverview,
  })
}

export function useUnlockStatus(levelId: string) {
  return useQuery({
    queryKey: courseKeys.unlockStatus(levelId),
    queryFn: () => api.fetchUnlockStatus(levelId),
    enabled: !!levelId,
  })
}

export function useSaveLessonProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: Record<string, unknown> }) =>
      api.saveLessonProgress(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      qc.invalidateQueries({ queryKey: courseKeys.lesson(lessonId) })
    },
  })
}

export function useUpdateLessonStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: string }) =>
      api.updateLessonStatus(lessonId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}

export function useInitializeProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (startLevel: number) => api.initializeProgress(startLevel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}

// ===== 购买 =====

export function usePurchaseStatus(levelId: string) {
  return useQuery({
    queryKey: courseKeys.purchaseStatus(levelId),
    queryFn: () => api.fetchPurchaseStatus(levelId),
    enabled: !!levelId,
  })
}

export function usePaddlePurchase() {
  return useMutation({
    mutationFn: ({ levelId, idempotencyKey }: { levelId: string; idempotencyKey: string }) =>
      api.initiatePaddlePurchase(levelId, idempotencyKey),
  })
}

export function useCoinExchange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ levelId, idempotencyKey }: { levelId: string; idempotencyKey: string }) =>
      api.coinExchange(levelId, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}

// ===== SRS =====

export function useSrsDue(limit = 20) {
  return useQuery({
    queryKey: courseKeys.srsDue(),
    queryFn: () => api.fetchDueItems(limit),
  })
}

export function useSrsStats() {
  return useQuery({
    queryKey: courseKeys.srsStats(),
    queryFn: api.fetchSrsStats,
    staleTime: 60 * 1000,
  })
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, result, timeMs }: { itemId: string; result: 'remembered' | 'forgotten'; timeMs: number }) =>
      api.submitReview(itemId, result, timeMs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.srsDue() })
      qc.invalidateQueries({ queryKey: courseKeys.srsStats() })
    },
  })
}

// ===== 入学测试 =====

export function usePlacementHistory() {
  return useQuery({
    queryKey: courseKeys.placementHistory(),
    queryFn: api.fetchPlacementHistory,
  })
}

export function useStartPlacementTest() {
  return useMutation({
    mutationFn: api.startPlacementTest,
  })
}

export function useSubmitPlacementAnswer() {
  return useMutation({
    mutationFn: ({ testId, questionId, answer }: { testId: string; questionId: string; answer: string }) =>
      api.submitPlacementAnswer(testId, questionId, answer),
  })
}

export function useCompletePlacementTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (testId: string) => api.completePlacementTest(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.placementHistory() })
      qc.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}
