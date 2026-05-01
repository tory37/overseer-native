import React from 'react'
import { createRoot } from 'react-dom/client'
import { DevHarness } from './DevHarness'
import GitPanel from './git/index'

const tools = [
  { name: 'Git', Component: GitPanel },
]

createRoot(document.getElementById('root')!).render(<DevHarness tools={tools} />)
