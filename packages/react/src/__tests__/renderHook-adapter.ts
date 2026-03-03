/**
 * Adapter for renderHook to support React 17/18/19
 *
 * - React 17: uses @testing-library/react-hooks
 * - React 18/19: uses @testing-library/react (has renderHook built-in)
 *
 * This adapter detects React version at runtime and uses the appropriate library.
 */

import React from 'react';

const REACT_MAJOR_VERSION = parseInt(React.version.split('.')[0], 10);

let renderHookImpl: typeof import('@testing-library/react').renderHook;
let actImpl: typeof import('@testing-library/react').act;
let cleanupImpl: typeof import('@testing-library/react').cleanup;
let fireEventImpl: typeof import('@testing-library/react').fireEvent;
let renderImpl: typeof import('@testing-library/react').render;
let screenImpl: typeof import('@testing-library/react').screen;
let waitForImpl: typeof import('@testing-library/react').waitFor;

if (REACT_MAJOR_VERSION < 18) {
  // React 17: use @testing-library/react-hooks
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rtlHooks = require('@testing-library/react-hooks');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rtl = require('@testing-library/react');
  
  renderHookImpl = rtlHooks.renderHook;
  waitForImpl = rtlHooks.waitFor || rtl.waitFor;
  actImpl = rtlHooks.act || rtl.act;
  cleanupImpl = rtlHooks.cleanup || rtl.cleanup;
  fireEventImpl = rtl.fireEvent;
  renderImpl = rtl.render;
  screenImpl = rtl.screen;
} else {
  // React 18/19: use @testing-library/react directly
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rtl = require('@testing-library/react');
  
  renderHookImpl = rtl.renderHook;
  waitForImpl = rtl.waitFor;
  actImpl = rtl.act;
  cleanupImpl = rtl.cleanup;
  fireEventImpl = rtl.fireEvent;
  renderImpl = rtl.render;
  screenImpl = rtl.screen;
}

export {
  renderHookImpl as renderHook,
  waitForImpl as waitFor,
  actImpl as act,
  cleanupImpl as cleanup,
  fireEventImpl as fireEvent,
  renderImpl as render,
  screenImpl as screen,
};
