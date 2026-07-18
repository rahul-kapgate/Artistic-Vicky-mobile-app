import type { Router } from "expo-router";

export function openMockTest(
  router: Router,
  courseId: string | number,
  source?: "free-mock",
) {
  router.push({
    pathname: "/(app)/course/test/[type]/[id]",
    params: {
      type: "mock",
      id: String(courseId),
      ...(source ? { source } : {}),
    },
  });
}

export function openPyqTest(router: Router, paperId: string | number) {
  router.push({
    pathname: "/(app)/course/test/[type]/[id]",
    params: {
      type: "pyq",
      id: String(paperId),
    },
  });
}
