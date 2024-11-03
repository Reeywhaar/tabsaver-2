import React, { FunctionComponent } from 'react'
import { IconName, mappings } from './icons'

import classes from './Icon.module.scss'
import classNames from 'classnames'

export const Icon: FunctionComponent<{ name: IconName } & React.HTMLAttributes<HTMLSpanElement>> = ({ name, className, ...props }) => {
  return (
    <span className={classNames(className, classes.icon)} {...props}>
      {String.fromCharCode(mappings[name])}
    </span>
  )
}
