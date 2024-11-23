import React, { FunctionComponent } from 'react'

import classes from './TabFavicon.module.scss'

export const TabFavicon: FunctionComponent<{ url?: string }> = ({ url }) => {
  return isFaviconIncluded(url) ? <img alt="" className={classes.fav} src={url} title={url} /> : <div className={classes.placeholder} />
}

export const isFaviconIncluded = (url?: string): url is string => {
  if (!url) return false
  if (url.startsWith('chrome://')) return false
  return true
}
