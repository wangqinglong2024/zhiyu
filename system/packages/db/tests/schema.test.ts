import { describe, expect, it } from 'vitest';
import { migrationTables } from '../src/index';

describe('foundation schema table coverage', () => {
  it('covers UA and AD base tables', () => {
    expect(migrationTables).toContain('users');
    expect(migrationTables).toContain('user_preferences');
    expect(migrationTables).toContain('admin_users');
    expect(migrationTables).toContain('admin_audit_logs');
  });

  it('covers course PRD tables', () => {
    expect(migrationTables).toContain('content_tracks');
    expect(migrationTables).toContain('content_knowledge_points');
    expect(migrationTables).toContain('content_quizzes');
    expect(migrationTables).toContain('learning_progress');
    expect(migrationTables).toContain('learning_wrong_set');
    expect(migrationTables).toContain('user_stage_purchases');
  });
});