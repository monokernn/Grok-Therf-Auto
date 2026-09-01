'use strict';

const assert = require('assert');
const { getState } = require('../src/engine');

const state = getState(Date.now());
assert.equal(state.agents.length, 6);
assert.ok(state.agents.every((agent) => agent.motionPlan.length >= 3));
assert.ok(state.empire.cash >= 0);
assert.ok(state.empire.value >= state.empire.cash);
assert.ok(state.release.remainingMs >= 0);
assert.ok(state.businesses.length >= 8);
assert.ok(state.handoffs.every((item) => item.from && item.to));
assert.ok(state.pnl.history.length >= 20);
console.log('State engine checks passed.');

