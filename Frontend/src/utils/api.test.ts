import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getFormatMinTeams,
  getTeamShortBadge,
  getTeamTheme,
  validateTournamentSetup,
} from '../types/cricket';
import { buildApiUrl, API_BASE } from './api';

test('buildApiUrl joins API_BASE and endpoint paths cleanly', () => {
  assert.equal(buildApiUrl('/api/teams', 'http://localhost:8080'), 'http://localhost:8080/api/teams');
  assert.equal(buildApiUrl('api/matches/1', 'http://localhost:8080/'), 'http://localhost:8080/api/matches/1');
  assert.equal(API_BASE, 'http://localhost:8080');
});

test('getFormatMinTeams enforces 4+ teams for LeagueKnockout and 2+ for others', () => {
  assert.equal(getFormatMinTeams('League'), 2);
  assert.equal(getFormatMinTeams('Knockout'), 2);
  assert.equal(getFormatMinTeams('Custom'), 2);
  assert.equal(getFormatMinTeams('LeagueKnockout'), 4);
});

test('validateTournamentSetup validates tournament name and team counts per format', () => {
  assert.equal(validateTournamentSetup('', 'League', [0, 1]).valid, false);
  assert.equal(validateTournamentSetup('Premier League', 'League', [0]).valid, false);
  assert.equal(validateTournamentSetup('Premier League', 'League', [0, 1]).valid, true);
  assert.equal(validateTournamentSetup('Championship', 'LeagueKnockout', [0, 1, 2]).valid, false);
  assert.equal(validateTournamentSetup('Championship', 'LeagueKnockout', [0, 1, 2, 3]).valid, true);
});

test('getTeamTheme and getTeamShortBadge map teams deterministically without official trademarks', () => {
  const miTheme = getTeamTheme('Mumbai Strikers');
  const cskTheme = getTeamTheme('CSK');
  assert.ok(miTheme.primary.startsWith('#'));
  assert.ok(cskTheme.primary.startsWith('#'));
  assert.notEqual(miTheme.primary, cskTheme.primary);
  assert.equal(getTeamShortBadge('Mumbai Strikers'), 'MS');
});
