export const directions_parallel = (
  angle1: number,
  angle2: number,
  max_diff: number = 0,
) => {
  const diff = Math.abs(angle1 - angle2);
  max_diff += EPSILON;
  return diff < max_diff || Math.abs(diff - Math.PI) < max_diff;
};
