import { DEFAULT_COOKIE_STORE_ID } from '@app/constants'
import React, { CSSProperties, FunctionComponent, useEffect, useMemo } from 'react'
import { useBrowser } from '../DataProvider'
import { useTask } from '@app/packages/task/useTask'

import classes from './ContainerLabel.module.scss'
import { rgbToHsl } from '@app/utils/rgbToHsl'

export const ContainerLabel: FunctionComponent<{ id?: string }> = ({ id }) => {
  const br = useBrowser()

  const cntResource = useTask(() => async () => {
    if (!id) return null
    if (id === DEFAULT_COOKIE_STORE_ID) return null

    const ctx = await br.contextualIdentities.get(id)
    return ctx
  })

  const cntData = useMemo(() => {
    if (cntResource.error) {
      return {
        name: 'Unknown',
        colorCode: '#dddddd',
      }
    }
    if (cntResource.value) {
      return {
        name: cntResource.value.name,
        colorCode: cntResource.value.colorCode,
      }
    }

    return null
  }, [cntResource.value, cntResource.error])

  const textColor = useMemo(() => {
    if (!cntData?.colorCode) return undefined
    const rgb = ([cntData.colorCode.substring(1, 3), cntData.colorCode.substring(3, 5), cntData.colorCode.substring(5, 7)] as const).map(v =>
      parseInt(v, 16)
    ) as [number, number, number]
    const hsl = rgbToHsl(...rgb)
    return hsl[2] > 0.5 ? '#000' : '#fff'
  }, [cntData?.colorCode])

  useEffect(() => {
    cntResource.task.call()
  }, [cntResource.task, id])

  if (!id) return null
  if (id === DEFAULT_COOKIE_STORE_ID) return null
  if (!cntData) return null

  return (
    <div className={classes.cnt} style={{ '--bg-color': cntData.colorCode, '--text-color': textColor } as CSSProperties}>
      {cntData.name}
    </div>
  )
}
