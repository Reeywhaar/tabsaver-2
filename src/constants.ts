export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const ENABLE_DIAGNOSTICS = !!process.env.ENABLE_DIAGNOSTICS
export const DEFAULT_COOKIE_STORE_ID = 'firefox-default'
export const ASSOCIATED_SESSION_KEY = 'tabsaver:associated_window_id'
export const DRAGGABLE_TAB_MIME = 'tabsaver/tab'
export const DRAGGABLE_SAVED_TAB_MIME = 'tabsaver/saved_tab'
