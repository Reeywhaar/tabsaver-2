import React, { FunctionComponent } from 'react'
import { IconName, mappings } from './icons'

import classes from './Icon.module.scss'

export const Icon: FunctionComponent<{ name: IconName } & React.HTMLAttributes<HTMLSpanElement>> = ({ name }) => {
  return <span className={classes.icon}>{String.fromCharCode(mappings[name])}</span>
}
