import React, { ReactNode } from 'react'

export function joinNodes(nodes: ReactNode[], joiner: ReactNode | ((index: number) => ReactNode)) {
  return nodes.filter(Boolean).reduce<ReactNode[]>((c, x, index) => {
    if (c.length === 0) {
      return [x]
    }
    c.push(typeof joiner === 'function' ? joiner(index) : joiner, x)
    return c
  }, [])
}

export function joinNodesWithIds(nodes: { key: string; node: ReactNode }[], joiner: ReactNode | ((index: number) => ReactNode)) {
  return joinNodes(
    nodes.filter(n => !!n.node).map(n => <React.Fragment key={n.key}>{n.node}</React.Fragment>),
    joiner
  )
}
