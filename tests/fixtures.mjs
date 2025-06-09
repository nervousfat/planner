export const task = (fields = {}) => ({
  id: 'task-a', title: 'Read', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2025-06-01T09:00:00.000Z', ...fields
});
export const stateOf = (...tasks) => ({version: 1, tasks});
export function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
